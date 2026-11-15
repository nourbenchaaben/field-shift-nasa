import {
  Coordinates,
  MonthlyRiskCalendarRow,
  NasaPowerDailyPoint,
  NasaPowerDataset,
  NasaPowerMonthlyPoint,
  Phase2SatelliteLayer,
  RiskLevel,
  SlopeOption,
  SoilType,
} from '../types/farm';

const MONTHS_ORDER = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const NASA_PROXY_URL = (
  (import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ??
  'http://localhost:8000/api/analyze'
).replace(/\/api\/analyze\/?$/, '/api/nasa/power');
const SATELLITE_PROXY_URL = NASA_PROXY_URL.replace(/\/api\/nasa\/power\/?$/, '/api/nasa/satellites');

interface EarthEnginePayload {
  source?: string;
  ndvi_clim?: Record<string, number>;
  smap_clim?: Record<string, number>;
  smap_monthly?: Record<string, number>;
  slope_deg?: number;
  elevation_m?: number;
}

function isValidVal(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > -900;
}

function formatIsoDate(yyyymmdd: string): { iso: string; label: string } {
  const y = yyyymmdd.slice(0, 4);
  const mIdx = Math.max(0, Math.min(11, parseInt(yyyymmdd.slice(4, 6), 10) - 1));
  const day = yyyymmdd.slice(6, 8);
  return {
    iso: `${y}-${yyyymmdd.slice(4, 6)}-${day}`,
    label: `${MONTH_SHORT[mIdx]} ${day}`,
  };
}

async function fetchEarthEngineData(lat: number, lon: number): Promise<EarthEnginePayload | null> {
  const url = new URL(SATELLITE_PROXY_URL);
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));
  url.searchParams.set('years', '5');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return null;
    const result = (await response.json()) as EarthEnginePayload;
    return result.source === 'Google Earth Engine' ? result : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function geeMonthlyValues(
  values: Record<string, number> | undefined,
  factor = 1
): (number | null)[] {
  return Array.from({ length: 12 }, (_, index) => {
    const value = values?.[String(index + 1)];
    return isValidVal(value) ? Number((value * factor).toFixed(1)) : null;
  });
}

/**
 * Exact backend risk calendar classification thresholds:
 * - Frost: yellow >= 0.2, red >= 1.0 days/yr (T2M_MIN < 0 deg C)
 * - Heavy rain: yellow >= 0.3, red >= 1.0 days/yr (PRECTOTCORR >= 20 mm)
 * - Dry soil: yellow <= 0.45, red <= 0.30 (GWETROOT or SMAP sm_rootzone)
 * - Bare field (NDVI): yellow <= 0.35, red <= 0.25 (MODIS MOD13Q1 x0.0001)
 */
export function classifyFrostRisk(daysPerYr: number): RiskLevel {
  if (daysPerYr >= 1.0) return 'red';
  if (daysPerYr >= 0.2) return 'yellow';
  return 'green';
}

export function classifyHeavyRainRisk(daysPerYr: number): RiskLevel {
  if (daysPerYr >= 1.0) return 'red';
  if (daysPerYr >= 0.3) return 'yellow';
  return 'green';
}

export function classifyDrySoilRisk(wetness01: number): RiskLevel {
  if (wetness01 <= 0.3) return 'red';
  if (wetness01 <= 0.45) return 'yellow';
  return 'green';
}

export function classifyBareFieldRisk(ndvi: number): RiskLevel {
  if (ndvi <= 0.25) return 'red';
  if (ndvi <= 0.35) return 'yellow';
  return 'green';
}

/**
 * Estimates terrain slope (degrees) from manual choice or deterministic SRTM elevation proxy.
 */
export function resolveSlopeDegrees(slopeOption: SlopeOption, _coords: Coordinates): number {
  if (slopeOption === 'Flat') return 1;
  if (slopeOption === 'Gentle Slope') return 5;
  if (slopeOption === 'Steep Slope') return 11;
  // Provisional scoring value only. Real SRTM slope must come from the backend
  // Earth Engine adapter; coordinate-based pseudo-elevation is not NASA data.
  return 5;
}

export function classifyMoisture(rootPct: number): {
  status: 'Dry' | 'Fair' | 'Good' | 'Wet';
  plainText: string;
} {
  if (rootPct <= 30) {
    return {
      status: 'Dry',
      plainText: 'Soil Moisture: Dry (≤30%) — Water-saving crops or mulching recommended',
    };
  }
  if (rootPct <= 45) {
    return {
      status: 'Fair',
      plainText: 'Soil Moisture: Fair (31–45%) — Watch dry-soil spells; good for hardy legumes',
    };
  }
  if (rootPct < 74) {
    return {
      status: 'Good',
      plainText: 'Soil Moisture: Good — Ideal root wetness for active growth',
    };
  }
  return {
    status: 'Wet',
    plainText: 'Soil Moisture: Very Wet — Ensure good drainage before sowing',
  };
}

function classifyWeather(avgTempC: number, recentRainMm: number): string {
  const rainPart =
    recentRainMm >= 25
      ? 'Recent Rain'
      : recentRainMm >= 6
        ? 'Light Showers'
        : 'Dry Skies';
  if (avgTempC >= 28) return `Warm & ${rainPart}`;
  if (avgTempC >= 18) return `Mild & ${rainPart}`;
  if (avgTempC >= 10) return `Cool & ${rainPart}`;
  return `Chilly & ${rainPart}`;
}

export function buildPhase2Adapters(
  _rootMoisturePct: number,
  _slopeDeg: number,
  _elevationM: number,
  _ndviEstimate: number | null,
  _bareMonthsCount: number,
  gee?: EarthEnginePayload | null
): Phase2SatelliteLayer[] {
  const ndvi = geeMonthlyValues(gee?.ndvi_clim);
  const smap = geeMonthlyValues(gee?.smap_clim, 100);
  const validNdvi = ndvi.filter((value): value is number => value !== null);
  const validSmap = smap.filter((value): value is number => value !== null);
  const meanNdvi = validNdvi.length
    ? validNdvi.reduce((sum, value) => sum + value, 0) / validNdvi.length
    : null;
  const meanSmap = validSmap.length
    ? validSmap.reduce((sum, value) => sum + value, 0) / validSmap.length
    : null;
  const hasSrtm = isValidVal(gee?.slope_deg) && isValidVal(gee?.elevation_m);
  return [
    {
      id: 'smap',
      name: 'SMAP L4 Root-Zone Soil Moisture (v008)',
      shortName: 'SMAP L4 (0–100 cm)',
      assetId: 'NASA/SMAP/SPL4SMGP/008',
      resolution: '9 km native (11 km EE) / 3-hourly · Since 2015-03-31',
      status: meanSmap === null ? 'Unavailable' : 'Ready',
      metricLabel: 'SMAP Root Moisture (sm_rootzone)',
      metricValue: meanSmap === null ? 'Unavailable' : `${meanSmap.toFixed(1)}% mean root-zone wetness`,
      plainSummary: meanSmap === null
        ? 'Earth Engine SMAP observations are unavailable; check backend Earth Engine authentication.'
        : `SMAP L4 reports a 5-year monthly mean root-zone wetness of ${meanSmap.toFixed(1)}%.`,
      limitation: 'Modelled L4 product, coarse 9–11 km grid; model-only during 2019 & 2022 outages.',
    },
    {
      id: 'modis_landsat',
      name: 'MODIS NDVI Vegetation Index (MOD13Q1 v061)',
      shortName: 'MODIS MOD13Q1 NDVI',
      assetId: 'MODIS/061/MOD13Q1',
      resolution: '250 m / 16-day composite · Since 2000-02-18',
      status: meanNdvi === null ? 'Unavailable' : 'Ready',
      metricLabel: 'Bare-Field Months (NDVI ≤ 0.35)',
      metricValue: meanNdvi === null ? 'Unavailable' : `Mean NDVI ${meanNdvi.toFixed(2)}`,
      plainSummary: meanNdvi === null
        ? 'MODIS NDVI is unavailable; check backend Earth Engine authentication.'
        : `MODIS 16-day composites show a 5-year monthly mean NDVI of ${meanNdvi.toFixed(2)}.`,
      limitation: '250 m pixels can mix neighboring fields; NDVI shows greenness, not crop type.',
    },
    {
      id: 'srtm',
      name: 'SRTM Elevation & Terrain Slope (GL1 v003)',
      shortName: 'SRTM 30m Slope',
      assetId: 'USGS/SRTMGL1_003',
      resolution: '30 m / static (Feb 2000 mission)',
      status: hasSrtm ? 'Ready' : 'Unavailable',
      metricLabel: 'Terrain Slope (ee.Terrain.slope)',
      metricValue: hasSrtm
        ? `${gee!.slope_deg!.toFixed(1)}° slope · ${gee!.elevation_m!.toFixed(0)} m elevation`
        : 'Unavailable',
      plainSummary: hasSrtm
        ? 'Slope and elevation are sampled from the SRTM 30 m digital elevation model.'
        : 'SRTM is unavailable; check backend Earth Engine authentication.',
      limitation: 'Feb 2000 surface snapshot (includes trees/buildings); 1 km avg can hide local slope.',
    },
  ];
}

function buildRiskCalendarFromStats(
  monthly: NasaPowerMonthlyPoint[],
  frostDaysPerMonth: number[],
  heavyRainDaysPerMonth: number[],
  _lat: number,
  ndviMonthly?: (number | null)[],
  smapMonthlyPct?: (number | null)[]
): MonthlyRiskCalendarRow[] {
  return monthly.map((m, idx) => {
    const frostD = Number((frostDaysPerMonth[idx] ?? 0).toFixed(2));
    const heavyD = Number((heavyRainDaysPerMonth[idx] ?? 0).toFixed(2));
    const wetPct = smapMonthlyPct?.[idx] ?? m.rootWetnessPct;
    const wet01 = Number((wetPct / 100).toFixed(2));
    return {
      month: m.month,
      frostDaysPerYr: frostD,
      frostLevel: classifyFrostRisk(frostD),
      heavyRainDaysPerYr: heavyD,
      heavyRainLevel: classifyHeavyRainRisk(heavyD),
      soilWetness: wet01,
      drySoilLevel: classifyDrySoilRisk(wet01),
      ndvi: ndviMonthly?.[idx] ?? null,
      bareFieldLevel: ndviMonthly?.[idx] == null ? 'none' : classifyBareFieldRisk(ndviMonthly[idx]!),
    };
  });
}

/**
 * Calibrated fallback when offline or if NASA POWER times out.
 */
export function buildFallbackNasaPower(
  coords: Coordinates,
  soilType: SoilType,
  slopeDeg: number
): NasaPowerDataset {
  const absLat = Math.abs(coords.lat);
  const isArid = absLat >= 18 && absLat <= 34 && coords.lng > -18 && coords.lng < 65;
  const isTropical = absLat < 16;

  const avgTempC = Number(
    Math.max(5, Math.min(31, 29.5 - absLat * 0.34 + (isArid ? 2 : 0))).toFixed(1)
  );
  const annualRainMm = Math.round(
    isTropical ? 1480 : isArid ? 340 : absLat > 44 ? 760 : 535
  );
  const soilBonus =
    soilType === 'Clay' ? 8 : soilType === 'Peaty' ? 12 : soilType === 'Sandy' ? -9 : 2;
  const rootMoisturePct = Math.max(
    18,
    Math.min(88, Math.round((isTropical ? 68 : isArid ? 34 : 50) + soilBonus))
  );
  const topMoisturePct = Math.max(15, Math.min(86, rootMoisturePct - 4));
  const humidityPct = isTropical ? 79 : isArid ? 48 : 66;
  const solarMj = Number((isArid ? 20.4 : isTropical ? 18.8 : 15.9).toFixed(1));
  const elevationM = 0;

  const rainWeights =
    coords.lat < 0
      ? [0.12, 0.11, 0.1, 0.08, 0.06, 0.04, 0.04, 0.05, 0.07, 0.1, 0.11, 0.12]
      : [0.13, 0.11, 0.1, 0.08, 0.05, 0.03, 0.01, 0.02, 0.07, 0.12, 0.14, 0.14];

  const monthly: NasaPowerMonthlyPoint[] = MONTH_SHORT.map((m, idx) => {
    const phase = coords.lat < 0 ? idx + 6 : idx;
    const seasonalSwing = Math.cos(((phase - 6) / 12) * Math.PI * 2);
    const tMonth = Number((avgTempC + seasonalSwing * (isTropical ? 2.5 : 8.5)).toFixed(1));
    const tMinMonth = Number((tMonth - (isArid ? 9.5 : 6.2)).toFixed(1));
    const rainMonth = Math.round(annualRainMm * rainWeights[idx]);
    const wetMonth = Math.max(
      16,
      Math.min(92, Math.round(rootMoisturePct - seasonalSwing * (isTropical ? 8 : 16)))
    );
    return {
      month: m,
      tempC: tMonth,
      minTempC: tMinMonth,
      rainMmMonth: rainMonth,
      rootWetnessPct: wetMonth,
      topWetnessPct: Math.max(15, wetMonth - 4),
      solarMj: Number(Math.max(5.5, solarMj + seasonalSwing * 5.2).toFixed(1)),
      humidityPct: Math.max(25, Math.min(92, Math.round(humidityPct - seasonalSwing * 9))),
    };
  });

  const frostPerMonth: number[] = monthly.map((m) =>
    m.minTempC < -2 ? 4.2 : m.minTempC < 0.8 ? 0.6 : m.minTempC < 2.2 ? 0.2 : 0
  );
  const heavyPerMonth: number[] = monthly.map((m) =>
    m.rainMmMonth >= 110 ? 1.4 : m.rainMmMonth >= 60 ? 0.5 : m.rainMmMonth >= 35 ? 0.2 : 0
  );

  const riskCalendarMonthly = buildRiskCalendarFromStats(
    monthly,
    frostPerMonth,
    heavyPerMonth,
    coords.lat
  );
  const bareMonthsCount = 0;
  const ndviEstimate = null;
  const frostDaysPerYear = Number(frostPerMonth.reduce((a, b) => a + b, 0).toFixed(1));
  const heavyRainDaysPerYear = Number(heavyPerMonth.reduce((a, b) => a + b, 0).toFixed(1));
  const minTempC = Math.min(...monthly.map((m) => m.minTempC));
  const driestYearMm = Math.round(annualRainMm * 0.68);
  const autumnRainOnset = coords.lat < 0 ? 'Mar 19' : isArid ? 'Oct 14' : 'Sep 24';

  const recentRain14dMm = null;
  const daily: NasaPowerDailyPoint[] = [];

  const moisture = classifyMoisture(rootMoisturePct);
  const waterStressScore = Math.max(8, Math.min(92, Math.round(100 - rootMoisturePct * 1.15)));

  return {
    source: 'nasa-power-fallback',
    fetchedAt: new Date().toISOString(),
    satelliteCheckedAt: new Date().toISOString(),
    yearsAnalyzed: 'Calibrated 5-year baseline (offline)',
    dailyDataThrough: '',
    recentDaysAvailable: 0,
    elevationM,
    avgTempC,
    minTempC,
    annualRainMm,
    driestYear: 2022,
    driestYearMm,
    frostDaysPerYear,
    heavyRainDaysPerYear,
    autumnRainOnset,
    recentRain14dMm,
    rootMoisturePct,
    topMoisturePct,
    humidityPct,
    solarMj,
    ndviEstimate,
    monthlySmapRootWetnessPct: Array(12).fill(null),
    srtmSlopeDeg: null,
    waterStressScore,
    moistureStatus: moisture.status,
    moisturePlainText: moisture.plainText,
    weatherPlainText: 'Recent observations unavailable while NASA POWER is offline.',
    daily,
    monthly,
    riskCalendarMonthly,
    phase2Adapters: buildPhase2Adapters(
      rootMoisturePct,
      slopeDeg,
      elevationM,
      ndviEstimate,
      bareMonthsCount
    ),
  };
}

/**
 * Loads normalized display fields from the backend's NASA POWER proxy:
 * 1) Climatology (T2M, T2M_MIN, PRECTOTCORR, ALLSKY_SFC_SW_DWN, RH2M, GWETROOT, GWETTOP)
 * 2) Complete historical years plus near-real-time daily observations:
 *    - Annual rain & Driest year
 *    - Heavy-rain days/yr (PRECTOTCORR >= 20 mm) per month
 *    - Frost days/yr (T2M_MIN < 0 C) per month
 *    - Autumn rain onset (first day >= Sep 1 with 3-day rain >= 20 mm)
 *    - Exact 12-month Risk Calendar thresholds
 */
export async function fetchLiveNasaPower(
  coords: Coordinates,
  soilType: SoilType,
  slopeDeg: number
): Promise<NasaPowerDataset> {
  const lat = Number(coords.lat.toFixed(4));
  const lon = Number(coords.lng.toFixed(4));

  const proxyUrl = new URL(NASA_PROXY_URL);
  proxyUrl.searchParams.set('lat', String(lat));
  proxyUrl.searchParams.set('lon', String(lon));
  proxyUrl.searchParams.set('years', '5');
  const satellitePromise = fetchEarthEngineData(lat, lon);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 150_000);
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`NASA backend HTTP ${response.status}`);

    const payload = (await response.json()) as {
      climatology: {
      geometry?: { coordinates?: number[] };
      properties?: { parameter?: Record<string, Record<string, number>> };
      };
      daily: { properties?: { parameter?: Record<string, Record<string, number>> } };
      period: { complete_years: number[]; daily_end: string };
    };
    const climJson = payload.climatology;
    const dailyJson = payload.daily;

    const gee = await satellitePromise;
    const elevationM = isValidVal(gee?.elevation_m)
      ? Math.round(gee.elevation_m)
      : Math.max(0, Math.round(climJson.geometry?.coordinates?.[2] ?? 0));
    const cp = climJson.properties?.parameter ?? {};

    const monthly: NasaPowerMonthlyPoint[] = MONTHS_ORDER.map((mKey, idx) => {
      const values = [cp.T2M?.[mKey], cp.T2M_MIN?.[mKey], cp.PRECTOTCORR?.[mKey], cp.GWETROOT?.[mKey], cp.GWETTOP?.[mKey], cp.ALLSKY_SFC_SW_DWN?.[mKey], cp.RH2M?.[mKey]];
      if (!values.every(isValidVal)) throw new Error(`NASA climatology is missing ${mKey} values`);
      const [t, tMin, rainDay, wet, topWet, sol, rh] = values as number[];
      return {
        month: MONTH_SHORT[idx],
        tempC: Number(t.toFixed(1)),
        minTempC: Number(tMin.toFixed(1)),
        rainMmMonth: Math.round(rainDay * DAYS_IN_MONTH[idx]),
        rootWetnessPct: Number((Math.max(0, Math.min(1, wet)) * 100).toFixed(1)),
        topWetnessPct: Number((Math.max(0, Math.min(1, topWet)) * 100).toFixed(1)),
        solarMj: Number(sol.toFixed(1)),
        humidityPct: Math.round(rh),
      };
    });

    let annualRainMm = 0;
    let driestYear = payload.period.complete_years[0] ?? 0;
    let driestYearMm = 0;
    const frostMonthTotals = new Array<number>(12).fill(0);
    const heavyMonthTotals = new Array<number>(12).fill(0);
    const completeYears = new Set(payload.period.complete_years.map(String));
    const yearsCount = completeYears.size;
    let autumnRainOnset = 'Not available';
    const daily: NasaPowerDailyPoint[] = [];

    {
      const dp = dailyJson.properties?.parameter ?? {};
      const rainMap = dp.PRECTOTCORR ?? {};
      const tempMap = dp.T2M ?? {};
      const tminMap = dp.T2M_MIN ?? {};
      const wetMap = dp.GWETROOT ?? {};
      const topWetMap = dp.GWETTOP ?? {};
      const solarMap = dp.ALLSKY_SFC_SW_DWN ?? {};
      const humidityMap = dp.RH2M ?? {};

      const allDates = Object.keys(rainMap).sort();
      const yearlyTotals: Record<string, number> = {};
      const validRainDays: Record<string, number> = {};
      const validMinTempDays: Record<string, number> = {};
      const autumnOnsetDayOfYear: number[] = [];
      const foundOnsetYears = new Set<string>();

      for (let i = 0; i < allDates.length; i++) {
        const dKey = allDates[i];
        const yr = dKey.slice(0, 4);
        const mIdx = Math.max(0, Math.min(11, parseInt(dKey.slice(4, 6), 10) - 1));
        const rVal = rainMap[dKey];
        const tminVal = tminMap[dKey];

        if (isValidVal(rVal) && completeYears.has(yr)) {
          yearlyTotals[yr] = (yearlyTotals[yr] ?? 0) + rVal;
          validRainDays[yr] = (validRainDays[yr] ?? 0) + 1;
          if (rVal >= 20.0) {
            heavyMonthTotals[mIdx] += 1;
          }
          // Exact backend definition: First day >= Sep 1 with 3-day rain >= 20 mm
          if (!foundOnsetYears.has(yr) && dKey.slice(4) >= '0901' && i >= 2) {
            const r0 = rainMap[allDates[i - 2]];
            const r1 = rainMap[allDates[i - 1]];
            if (isValidVal(r0) && isValidVal(r1) && r0 + r1 + rVal >= 20.0) {
              foundOnsetYears.add(yr);
              const dt = new Date(Date.UTC(Number(yr), mIdx, Number(dKey.slice(6, 8))));
              const sep1 = new Date(Date.UTC(Number(yr), 8, 1));
              const offsetDays = Math.round((dt.getTime() - sep1.getTime()) / 86400000);
              autumnOnsetDayOfYear.push(offsetDays);
            }
          }
        }

        if (isValidVal(tminVal) && tminVal < 0.0 && completeYears.has(yr)) {
          frostMonthTotals[mIdx] += 1;
        }
        if (isValidVal(tminVal) && completeYears.has(yr)) {
          validMinTempDays[yr] = (validMinTempDays[yr] ?? 0) + 1;
        }
      }

      const yearEntries = Object.entries(yearlyTotals).filter(([year]) => completeYears.has(year));
      if (!yearsCount || yearEntries.length !== yearsCount) throw new Error('NASA POWER history is missing a complete year');
      for (const year of completeYears) {
        const expectedDays = (Date.UTC(Number(year) + 1, 0, 1) - Date.UTC(Number(year), 0, 1)) / 86400000;
        if (validRainDays[year] !== expectedDays || validMinTempDays[year] !== expectedDays) {
          throw new Error(`NASA POWER has incomplete daily coverage for ${year}`);
        }
      }
      annualRainMm = Math.round(yearEntries.reduce((sum, [, total]) => sum + total, 0) / yearsCount);
      const minEntry = yearEntries.reduce((best, cur) => (cur[1] < best[1] ? cur : best));
      driestYear = parseInt(minEntry[0], 10);
      driestYearMm = Math.round(minEntry[1]);

      if (autumnOnsetDayOfYear.length > 0) {
        autumnOnsetDayOfYear.sort((a, b) => a - b);
        const medianOffset = autumnOnsetDayOfYear[Math.floor(autumnOnsetDayOfYear.length / 2)];
        const refDate = new Date(Date.UTC(2023, 8, 1 + medianOffset));
        autumnRainOnset = `${MONTH_SHORT[refDate.getUTCMonth()]} ${String(refDate.getUTCDate()).padStart(2, '0')}`;
      } else {
        autumnRainOnset = 'No qualifying 3-day rain event';
      }

      // Keep only actual observations in the recent rolling 14-day window.
      const dailyEnd = new Date(`${payload.period.daily_end}T00:00:00Z`);
      const recentStart = new Date(dailyEnd.getTime() - 13 * 86400000);
      const validRecent = allDates.filter((d) => {
        const day = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`);
        return day >= recentStart && day <= dailyEnd &&
          [rainMap[d], tempMap[d], tminMap[d], wetMap[d], topWetMap[d], humidityMap[d]].some(isValidVal);
      });
      for (const dKey of validRecent) {
        const { iso, label } = formatIsoDate(dKey);
        daily.push({
          date: iso,
          label,
          tempC: isValidVal(tempMap[dKey]) ? Number(tempMap[dKey].toFixed(1)) : null,
          minTempC: isValidVal(tminMap[dKey]) ? Number(tminMap[dKey].toFixed(1)) : null,
          rainMm: isValidVal(rainMap[dKey]) ? Number(rainMap[dKey].toFixed(1)) : null,
          solarMj: isValidVal(solarMap[dKey]) ? Number(solarMap[dKey].toFixed(1)) : null,
          humidityPct: isValidVal(humidityMap[dKey]) ? Number(humidityMap[dKey].toFixed(1)) : null,
          rootWetnessPct: isValidVal(wetMap[dKey]) ? Number((Math.max(0, Math.min(1, wetMap[dKey])) * 100).toFixed(1)) : null,
          topWetnessPct: isValidVal(topWetMap[dKey]) ? Number((Math.max(0, Math.min(1, topWetMap[dKey])) * 100).toFixed(1)) : null,
        });
      }
    }

    const frostDaysPerMonth = frostMonthTotals.map((c) => c / yearsCount);
    const heavyRainDaysPerMonth = heavyMonthTotals.map((c) => c / yearsCount);

    const ndviMonthly = geeMonthlyValues(gee?.ndvi_clim);
    const monthlySmapRootWetnessPct = geeMonthlyValues(gee?.smap_clim, 100);
    const validNdvi = ndviMonthly.filter((value): value is number => value !== null);
    const ndviEstimate = validNdvi.length
      ? Number((validNdvi.reduce((sum, value) => sum + value, 0) / validNdvi.length).toFixed(2))
      : null;
    const riskCalendarMonthly = buildRiskCalendarFromStats(
      monthly,
      frostDaysPerMonth,
      heavyRainDaysPerMonth,
      lat,
      ndviMonthly,
      monthlySmapRootWetnessPct
    );
    const bareMonthsCount = riskCalendarMonthly.filter((row) => row.bareFieldLevel !== 'none' && row.bareFieldLevel !== 'green').length;

    const avgTempC = Number(
      (isValidVal(cp.T2M?.ANN) ? cp.T2M.ANN : monthly.reduce((s, m) => s + m.tempC, 0) / 12).toFixed(
        1
      )
    );
    const minTempC = Number(
      Math.min(...monthly.map((m) => m.minTempC)).toFixed(1)
    );
    const avgHumidity = Math.round(
      isValidVal(cp.RH2M?.ANN) ? cp.RH2M.ANN : monthly.reduce((s, m) => s + m.humidityPct, 0) / 12
    );
    const avgSolar = Number(
      (
        isValidVal(cp.ALLSKY_SFC_SW_DWN?.ANN)
          ? cp.ALLSKY_SFC_SW_DWN.ANN
          : monthly.reduce((s, m) => s + m.solarMj, 0) / 12
      ).toFixed(1)
    );

    const recentRootWetness = daily.flatMap((day) => day.rootWetnessPct === null ? [] : [day.rootWetnessPct]);
    const rootMoisturePct = recentRootWetness.length
      ? Math.round(recentRootWetness.reduce((sum, value) => sum + value, 0) / recentRootWetness.length)
      : Math.round((isValidVal(cp.GWETROOT?.ANN) ? cp.GWETROOT.ANN : 0.48) * 100);
    const topMoisturePct = Math.round(
      100 * (isValidVal(cp.GWETTOP?.ANN)
        ? cp.GWETTOP.ANN
        : MONTHS_ORDER.reduce((sum, month) => sum + cp.GWETTOP[month], 0) / 12)
    );
    const recentRain14dMm = daily.length === 14 && daily.every((day) => day.rainMm !== null)
      ? Number(daily.reduce((sum, d) => sum + (d.rainMm ?? 0), 0).toFixed(1))
      : null;

    const frostDaysPerYear = Number(
      frostDaysPerMonth.reduce((sum, v) => sum + v, 0).toFixed(1)
    );
    const heavyRainDaysPerYear = Number(
      heavyRainDaysPerMonth.reduce((sum, v) => sum + v, 0).toFixed(1)
    );

    const moisture = classifyMoisture(rootMoisturePct);
    const waterStressScore = Math.max(6, Math.min(94, Math.round(100 - rootMoisturePct * 1.15)));

    return {
      source: 'nasa-power-live',
      fetchedAt: new Date().toISOString(),
      satelliteCheckedAt: new Date().toISOString(),
      yearsAnalyzed: `${payload.period.complete_years[0]}–${payload.period.complete_years[yearsCount - 1]} (${yearsCount} complete years)`,
      dailyDataThrough: daily.length ? daily[daily.length - 1].date : '',
      recentDaysAvailable: daily.length,
      elevationM,
      avgTempC,
      minTempC,
      annualRainMm,
      driestYear,
      driestYearMm,
      frostDaysPerYear,
      heavyRainDaysPerYear,
      autumnRainOnset,
      recentRain14dMm,
      rootMoisturePct,
      topMoisturePct,
      humidityPct: avgHumidity,
      solarMj: avgSolar,
      ndviEstimate,
      monthlySmapRootWetnessPct,
      srtmSlopeDeg: isValidVal(gee?.slope_deg) ? Number(gee.slope_deg.toFixed(1)) : null,
      waterStressScore,
      moistureStatus: moisture.status,
      moisturePlainText: moisture.plainText,
      weatherPlainText: recentRain14dMm === null
        ? 'Recent 14-day NASA observations are incomplete.'
        : classifyWeather(avgTempC, recentRain14dMm),
      daily,
      monthly,
      riskCalendarMonthly,
      phase2Adapters: buildPhase2Adapters(
        rootMoisturePct,
        isValidVal(gee?.slope_deg) ? gee.slope_deg : slopeDeg,
        elevationM,
        ndviEstimate,
        bareMonthsCount,
        gee
      ),
    };
  } catch {
    return buildFallbackNasaPower(coords, soilType, slopeDeg);
  }
}
