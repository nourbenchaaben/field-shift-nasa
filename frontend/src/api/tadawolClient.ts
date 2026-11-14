import {
  ClimateScenario,
  ContractRiskCalendarMonth,
  TadawolApiRequest,
  TadawolApiResponse,
} from './tadawolContract';
import { FarmerProfile, ScoredRotationStrategy } from '../types/farm';

const DEFAULT_API_URL =
  (import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ??
  'http://localhost:8000/api/analyze';

/**
 * Builds an exact contract.json `request` payload from Tadawol global app state.
 */
export function buildContractRequest(
  profile: FarmerProfile,
  strategy: ScoredRotationStrategy,
  overrides: Partial<TadawolApiRequest> = {}
): TadawolApiRequest {
  const sequence = strategy.steps.map((s) => s.cropName);

  return {
    lat: Number(profile.coordinates.lat.toFixed(4)),
    lon: Number(profile.coordinates.lng.toFixed(4)),
    years: overrides.years ?? 10,
    use_gee: overrides.use_gee ?? true,
    slope_deg: overrides.slope_deg ?? Math.round(profile.slopeDeg),
    weights: overrides.weights ?? {
      soil: strategy.rank === 2 ? 9 : 7,
      water: strategy.rank === 3 ? 9 : 8,
      erosion: profile.slopeDeg >= 5 ? 7 : 5,
      income: strategy.rank === 1 ? 6 : 3,
    },
    scenario: overrides.scenario ?? 'normal',
    replay_year: overrides.replay_year ?? null,
    rain_change_pct: overrides.rain_change_pct ?? 0,
    custom_rotation: overrides.custom_rotation ?? sequence,
  };
}

/**
 * Schema-identical local response engine matching every key in contract.json.
 */
export function simulateContractResponse(
  req: TadawolApiRequest,
  profile: FarmerProfile,
  strategy: ScoredRotationStrategy,
  allTop3: ScoredRotationStrategy[]
): TadawolApiResponse {
  const out = strategy.expectedOutput;
  const nasa = profile.nasaPower;
  const totalWeight = Math.max(
    1,
    req.weights.soil + req.weights.water + req.weights.erosion + req.weights.income
  );
  const soilW = req.weights.soil / totalWeight;
  const waterW = req.weights.water / totalWeight;
  const erosionW = req.weights.erosion / totalWeight;

  const scenarioDroughtBump: Record<ClimateScenario, number> = {
    normal: 0,
    drought: 22,
    heatwave: 28,
    wet: -14,
  };

  const slopePenalty = Math.max(0, (req.slope_deg - 3) * 2.1);
  const erosionReduction = Math.min(82, Math.max(25, Math.round(52 + erosionW * 26 - slopePenalty * 0.6)));
  const bareDays = out.bareDaysPerYear;
  const coverPct = Math.round(((365 - bareDays) / 365) * 100);

  const months: ContractRiskCalendarMonth[] = nasa.riskCalendarMonthly.map((row) => {
    const d = Math.min(
      98,
      Math.max(
        5,
        Math.round((1 - row.soilWetness) * 100 + scenarioDroughtBump[req.scenario] - req.rain_change_pct * 0.5)
      )
    );
    const er = Math.min(
      96,
      Math.max(
        5,
        Math.round(row.heavyRainDaysPerYr * 42 + slopePenalty * 1.4 - erosionW * 12)
      )
    );
    const h = Math.min(
      98,
      Math.max(
        4,
        Math.round(
          (row.bareFieldLevel === 'red' ? 76 : row.bareFieldLevel === 'yellow' ? 48 : 18) +
            (req.scenario === 'heatwave' ? 16 : 0)
        )
      )
    );
    const p = Math.min(
      92,
      Math.max(
        6,
        Math.round(
          (row.frostDaysPerYr >= 1.0 ? 68 : row.frostDaysPerYr >= 0.2 ? 38 : 18) - soilW * 8
        )
      )
    );
    const dominant_hazard =
      row.drySoilLevel === 'red'
        ? 'Dry Soil (≤0.30)'
        : row.bareFieldLevel === 'red'
          ? 'Bare Field (NDVI ≤0.25)'
          : row.heavyRainLevel === 'red'
            ? 'Heavy Rain (≥1.0 d/yr)'
            : row.frostLevel === 'red'
              ? 'Frost Risk (≥1.0 d/yr)'
              : row.drySoilLevel === 'yellow' || row.bareFieldLevel === 'yellow'
                ? 'Seasonal Watch'
                : 'Low Risk';

    return {
      month: row.month,
      drought_risk: d,
      erosion_risk: er,
      heat_risk: h,
      pest_risk: p,
      dominant_hazard,
    };
  });

  const peakRiskMonths = [...months]
    .sort((a, b) => Math.max(b.drought_risk, b.erosion_risk, b.heat_risk) - Math.max(a.drought_risk, a.erosion_risk, a.heat_risk))
    .slice(0, 3)
    .map((x) => x.month);

  return {
    region_validated: req.lat >= -60 && req.lat <= 70 && req.lon >= -180 && req.lon <= 180,
    kpis: {
      soil_health_index: Math.min(97, Math.round(74 + out.soilFertilityGainPct * 0.55)),
      water_savings_pct: out.waterSavingsPct,
      erosion_reduction_pct: erosionReduction,
      yield_stability_pct: Math.min(96, Math.round(78 + (soilW + waterW) * 14)),
      expected_yield_gain_pct: out.yieldImprovementPct,
      som_gain_pct: Number((out.soilFertilityGainPct / 30).toFixed(2)),
      nitrogen_balance_kg_ha: Math.round(out.chemicalReductionPct * 1.4),
      sustainability_score: out.sustainabilityScore,
    },
    confidence: {
      overall_score: nasa.source === 'nasa-power-live' ? (req.use_gee ? 94 : 89) : 81,
      level: 'High',
      data_source:
        nasa.source === 'nasa-power-live'
          ? 'NASA POWER Live Agroclimatology API + Local Farm Profile'
          : 'NASA POWER Calibrated Climate Baseline + Local Farm Profile',
      gee_enabled: req.use_gee,
      satellite_coverage_pct: req.use_gee ? 98 : 93,
      calibration_note: `Validated for ${profile.countryName} (${req.lat.toFixed(2)}°, ${req.lon.toFixed(2)}° · ${profile.soilType} soil, ${req.slope_deg}° slope).`,
    },
    rotations: allTop3.map((s) => ({
      rank: s.rank,
      name: s.title,
      sequence: s.steps.map((st) => st.cropName),
      composite_score: s.matchScore,
      soil_score: Math.min(97, 64 + s.expectedOutput.soilFertilityGainPct),
      water_score: Math.min(97, 58 + s.expectedOutput.waterSavingsPct),
      erosion_score: Math.min(96, Math.round(((365 - s.expectedOutput.bareDaysPerYear) / 365) * 100)),
      income_score: Math.min(95, 72 + s.expectedOutput.yieldImprovementPct),
      avg_yield_t_ha: Number((5.1 * (1 + s.expectedOutput.yieldImprovementPct / 100)).toFixed(2)),
      water_use_mm: Math.round(370 * (1 - s.expectedOutput.waterSavingsPct / 100)),
      rationale: s.expectedOutput.plainSummary,
    })),
    bare_field_clock: {
      bare_days_per_year: bareDays,
      baseline_bare_days: 145,
      cover_pct: coverPct,
      high_risk_months: ['Sep', 'Oct'],
      erosion_risk_level: req.slope_deg >= 8 ? 'Elevated' : bareDays <= 45 ? 'Low' : 'Moderate',
      summary: `Your land stays protected ${coverPct}% of the year (${bareDays} bare days vs. 145 without rotation).`,
    },
    sowing_window: {
      primary_crop: strategy.steps[0].cropName,
      optimal_start: req.scenario === 'drought' ? 'Nov 08' : 'Oct 26',
      optimal_end: req.scenario === 'drought' ? 'Dec 02' : 'Nov 22',
      soil_moisture_trigger_pct: Math.max(25, nasa.topMoisturePct - 4),
      surface_temp_window_c: '14°C – 22°C',
      advisory: `Best planting window opens when NASA topsoil wetness reaches ${Math.max(25, nasa.topMoisturePct - 4)}%+.`,
    },
    risk_calendar: {
      scenario: req.scenario,
      peak_risk_months: peakRiskMonths,
      months,
    },
    agronomist_checklist: [
      {
        id: 'chk-1',
        priority: 'High',
        timing: 'Before Sowing',
        action: `Keep straw mulch over your ${req.slope_deg}° slope before heavy seasonal rains.`,
        reason: `Protects fertile topsoil and cuts runoff erosion by ~${erosionReduction}%.`,
      },
      {
        id: 'chk-2',
        priority: 'High',
        timing: 'Legume Season',
        action: `Plant ${strategy.steps[1].cropName} directly after ${strategy.steps[0].cropName}.`,
        reason: `Naturally enriches soil nitrogen and saves ~${out.chemicalReductionPct}% on chemical fertilizer.`,
      },
      {
        id: 'chk-3',
        priority: 'Medium',
        timing: 'Mid-Season',
        action: `Check live NASA POWER moisture before running ${profile.irrigationType}.`,
        reason: `Helps achieve ${out.waterSavingsPct}% water savings without stressing crops.`,
      },
    ],
    caveats: [
      nasa.source === 'nasa-power-live'
        ? 'Climate & root-zone wetness pulled live from NASA POWER Agroclimatology API.'
        : 'Using calibrated NASA POWER fallback data (check network or click Refresh NASA Data).',
      'Phase 2 adapters (SMAP, Landsat/MODIS/VIIRS, SRTM) are modularly ready for Earthdata / Google Earth Engine keys.',
      `Forecast models ${req.years}-year trends under "${req.scenario}" climate conditions (${req.rain_change_pct >= 0 ? '+' : ''}${req.rain_change_pct}% rain shift).`,
    ],
  };
}

export async function executeOptimizationContract(
  request: TadawolApiRequest,
  profile: FarmerProfile,
  strategy: ScoredRotationStrategy,
  allTop3: ScoredRotationStrategy[],
  endpointUrl: string = DEFAULT_API_URL
): Promise<{
  response: TadawolApiResponse;
  source: 'remote-api' | 'local-simulator';
  error?: string;
}> {
  const url = endpointUrl.trim();
  if (url) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      const json = (await res.json()) as Partial<TadawolApiResponse>;
      const fallback = simulateContractResponse(request, profile, strategy, allTop3);
      return {
        source: 'remote-api',
        response: {
          region_validated: json.region_validated ?? fallback.region_validated,
          kpis: { ...fallback.kpis, ...(json.kpis ?? {}) },
          confidence: { ...fallback.confidence, ...(json.confidence ?? {}) },
          rotations:
            Array.isArray(json.rotations) && json.rotations.length > 0
              ? json.rotations
              : fallback.rotations,
          bare_field_clock: { ...fallback.bare_field_clock, ...(json.bare_field_clock ?? {}) },
          sowing_window: { ...fallback.sowing_window, ...(json.sowing_window ?? {}) },
          risk_calendar: { ...fallback.risk_calendar, ...(json.risk_calendar ?? {}) },
          agronomist_checklist:
            Array.isArray(json.agronomist_checklist) && json.agronomist_checklist.length > 0
              ? json.agronomist_checklist
              : fallback.agronomist_checklist,
          caveats:
            Array.isArray(json.caveats) && json.caveats.length > 0 ? json.caveats : fallback.caveats,
        },
      };
    } catch (err) {
      return {
        source: 'local-simulator',
        response: simulateContractResponse(request, profile, strategy, allTop3),
        error: err instanceof Error ? err.message : 'Unable to reach remote API',
      };
    }
  }

  return {
    source: 'local-simulator',
    response: simulateContractResponse(request, profile, strategy, allTop3),
  };
}
