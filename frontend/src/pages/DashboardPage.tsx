import React, { useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import { FarmLocalClockBadge } from '../components/FarmLocalClockBadge';
import { RotationRoadmapGraph } from '../components/RotationRoadmapGraph';
import { ConfirmStrategyChangeModal } from '../components/ConfirmStrategyChangeModal';
import { YearOverviewCalendar } from '../components/YearOverviewCalendar';
import { useFarmLocalDate } from '../utils/farmLocalClock';
import { computeScenarioAdjustedForecast } from '../data/decisionEngine';
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowRight,
  CloudRain,
  Droplets,
  Leaf,
  Mountain,
  Pencil,
  Plus,
  Sparkles,
  Sun,
} from 'lucide-react';

interface PulseDotProps {
  cx?: number;
  cy?: number;
  index?: number;
}

function makeTodayPulseDot(
  currentMonthIdx: number,
  color: string,
  seriesId: string,
  todayShort: string
) {
  return (props: PulseDotProps) => {
    const { cx, cy, index } = props;
    if (typeof cx !== 'number' || typeof cy !== 'number' || typeof index !== 'number') {
      return <g key={`empty-${seriesId}-${index ?? 'x'}`} />;
    }

    if (index !== currentMonthIdx) {
      return (
        <circle
          key={`pt-${seriesId}-${index}`}
          cx={cx}
          cy={cy}
          r={3.2}
          fill="#FFFFFF"
          stroke={color}
          strokeWidth={2}
        />
      );
    }

    const labelText = `TODAY · ${todayShort.toUpperCase()}`;
    const pillWidth = Math.max(88, labelText.length * 6.2 + 16);
    // Keep floating TODAY pill safely inside left/right chart edges (far-left index 0 or far-right Nov/Dec)
    const pillX =
      index === 0
        ? cx + 4
        : index >= 10
          ? cx - pillWidth + 10
          : index <= 1
            ? cx - 6
            : cx - pillWidth / 2;
    const pillY = cy < 38 ? cy + 16 : cy - 34;

    return (
      <g key={`today-beacon-${seriesId}-${index}`} style={{ pointerEvents: 'none' }}>
        {/* Expanding radar ring 1 */}
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill={color}
          fillOpacity={0.38}
          stroke={color}
          strokeWidth={1.8}
          className="chart-today-ring-1"
        />
        {/* Expanding radar ring 2 (staggered double wave) */}
        <circle
          cx={cx}
          cy={cy}
          r={10}
          fill="none"
          stroke={color}
          strokeWidth={2.2}
          className="chart-today-ring-2"
        />
        {/* Breathing luminous core */}
        <g className="chart-today-core">
          <circle cx={cx} cy={cy} r={7} fill="#FFFFFF" stroke={color} strokeWidth={3.2} />
          <circle cx={cx} cy={cy} r={3} fill={color} />
        </g>
        {/* Floating TODAY pill pinned cleanly near Today's point */}
        <g className="chart-today-badge">
          <rect
            x={pillX}
            y={pillY}
            width={pillWidth}
            height={20}
            rx={10}
            fill="#111111"
            stroke="#EBB40E"
            strokeWidth={1.6}
          />
          <text
            x={pillX + pillWidth / 2}
            y={pillY + 13.4}
            textAnchor="middle"
            fill="#EBB40E"
            fontSize={9.5}
            fontWeight={800}
            letterSpacing="0.03em"
          >
            {labelText}
          </text>
        </g>
      </g>
    );
  };
}

interface FarmerTooltipPayloadItem {
  payload?: {
    month: string;
    rainMm: number;
    effectiveRainMm: number;
    extraUsableRainMm: number;
    tempC: number;
    moisturePct: number;
    planMoisturePct: number;
    moistureGainBand: number;
    ndvi: number;
    planNdvi: number;
    ndviGainBand: number;
    heavyRainDays: number;
    erosionRiskIdx: number;
    planErosionIdx: number;
    erosionSavedBand: number;
  };
}

interface FarmerTooltipProps {
  active?: boolean;
  label?: string;
  payload?: FarmerTooltipPayloadItem[];
  metric: 'moisture' | 'weather' | 'erosion' | 'ndvi';
  isPlanView: boolean;
}

const FarmerChartTooltip: React.FC<FarmerTooltipProps> = ({
  active,
  label,
  payload,
  metric,
  isPlanView,
}) => {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="rounded-xl bg-[#FFFEFB] border border-[#C9C6BC] shadow-lg px-3.5 py-2.5 text-xs text-[#111111] space-y-1.5 min-w-[195px]">
      <div className="font-extrabold text-sm text-[#111111] border-b border-[#EAE7DF] pb-1">
        {label}
      </div>

      {metric === 'moisture' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#4A4A4A] font-semibold">
              {isPlanView ? 'Without Rotation:' : 'Current Farm:'}
            </span>
            <span className="font-extrabold">{row.moisturePct}%</span>
          </div>
          {isPlanView && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#007432] font-bold">With Crop Rotation:</span>
                <span className="font-extrabold text-[#007432]">{row.planMoisturePct}%</span>
              </div>
              <div className="pt-1 border-t border-[#EAE7DF] flex items-center justify-between gap-3">
                <span className="font-bold text-[#007E7A]">Difference:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#DCF7F5] text-[#005C59] font-extrabold">
                  +{row.moistureGainBand}% wetter
                </span>
              </div>
            </>
          )}
        </>
      )}

      {metric === 'weather' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#4A4A4A] font-semibold">Expected Rain:</span>
            <span className="font-extrabold">{row.rainMm} mm</span>
          </div>
          {isPlanView && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#007432] font-bold">Usable With Rotation:</span>
                <span className="font-extrabold text-[#007432]">{row.effectiveRainMm} mm</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#8F6900]">Extra Water Kept:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FDF3C4] text-[#6E5100] font-extrabold">
                  +{row.extraUsableRainMm} mm
                </span>
              </div>
            </>
          )}
          <div className="pt-1 border-t border-[#EAE7DF] flex items-center justify-between gap-4">
            <span className="text-[#8F6900] font-semibold">Avg Temp:</span>
            <span className="font-extrabold">{row.tempC}°C</span>
          </div>
        </>
      )}

      {metric === 'erosion' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#A83812] font-semibold">
              {isPlanView ? 'Without Rotation:' : 'Current Risk:'}
            </span>
            <span className="font-extrabold text-[#A83812]">{row.erosionRiskIdx}/100</span>
          </div>
          {isPlanView && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#007432] font-bold">With Crop Rotation:</span>
                <span className="font-extrabold text-[#007432]">{row.planErosionIdx}/100</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="font-bold text-[#0369A1]">Risk Reduced:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E0F2FE] text-[#075985] font-extrabold">
                  -{row.erosionSavedBand} pts safer
                </span>
              </div>
            </>
          )}
          <div className="pt-1 border-t border-[#EAE7DF] flex items-center justify-between gap-4">
            <span className="text-[#4A4A4A] font-semibold">Heavy Storm Days:</span>
            <span className="font-extrabold">{row.heavyRainDays} d</span>
          </div>
        </>
      )}

      {metric === 'ndvi' && (
        <>
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#4A4A4A] font-semibold">
              {isPlanView ? 'Without Rotation:' : 'Current Cover:'}
            </span>
            <span className="font-extrabold">{row.ndvi.toFixed(2)}</span>
          </div>
          {isPlanView && (
            <>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#3F6300] font-bold">With Crop Rotation:</span>
                <span className="font-extrabold text-[#3F6300]">{row.planNdvi.toFixed(2)}</span>
              </div>
              <div className="pt-1 border-t border-[#EAE7DF] flex items-center justify-between gap-3">
                <span className="font-bold text-[#8F6900]">Cover Boost:</span>
                <span className="px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#78350F] font-extrabold">
                  +{row.ndviGainBand.toFixed(2)} greener
                </span>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const {
    profile,
    top3Strategies,
    selectedStrategyId,
    activeStrategy,
    planCustomization,
    strategyHistory,
    calendarEvents,
    toggleCalendarComplete,
    addCalendarEvent,
    resetPlanCustomization,
    openAiAdvisorForCustomPlan,
    selectRotationStrategy,
    beforeAnalysis,
    contractSettings,
    openAddFarmModal,
    openEditFarmModal,
    navigate,
  } = useFarm();

  const [overlayMode, setOverlayMode] = useState<'moisture' | 'climate' | 'slope' | 'health'>('moisture');
  const [confirmStrategyChangeOpen, setConfirmStrategyChangeOpen] = useState(false);
  const [planGraphs, setPlanGraphs] = useState<{
    moisture: boolean;
    weather: boolean;
    erosion: boolean;
    ndvi: boolean;
  }>({
    moisture: false,
    weather: false,
    erosion: false,
    ndvi: false,
  });

  const toggleGraphPlan = (key: 'moisture' | 'weather' | 'erosion' | 'ndvi') => {
    setPlanGraphs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const farmDate = useFarmLocalDate(profile.countryCode, profile.coordinates.lng);
  const currentMonthIdx = farmDate.monthIndex;
  const scenario = contractSettings.scenario;

  // Shared 5-Year Future Predictions engine (1:1 aligned with FuturePredictionsPage)
  const { points: forecastPoints } = useMemo(
    () => computeScenarioAdjustedForecast(activeStrategy, profile, scenario),
    [activeStrategy, profile, scenario]
  );

  const todayForecast = forecastPoints[0];
  const horizonForecast = forecastPoints[2] ?? forecastPoints[forecastPoints.length - 1];

  const currentStep = activeStrategy.steps[0];
  const nasa = profile.nasaPower;
  const smap = nasa.phase2Adapters.find((l) => l.id === 'smap');
  const modis = nasa.phase2Adapters.find((l) => l.id === 'modis_landsat');
  const srtm = nasa.phase2Adapters.find((l) => l.id === 'srtm');

  const activeLayerMeta = useMemo(() => {
    if (overlayMode === 'moisture') {
      return {
        conditionLabel: `Soil Moisture: ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)`,
        topBadge: `Soil Moisture: ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)`,
        bottomMetric: `${profile.areaHectares} ha · ${profile.soilType} Soil · ${profile.irrigationType}`,
        sourceNote: `Modelled drainage/slope estimate anchored to ${nasa.source} (${nasa.rootMoisturePct}% mean)`,
      };
    }
    if (overlayMode === 'climate') {
      return {
        conditionLabel: `Local Climate: ${nasa.avgTempC}°C · ${nasa.annualRainMm} mm/yr`,
        topBadge: `Climate: ${nasa.avgTempC}°C · ${nasa.annualRainMm} mm/yr`,
        bottomMetric: `${nasa.weatherPlainText} · ${nasa.humidityPct}% humidity`,
        sourceNote: `Modelled topoclimate estimate anchored to ${nasa.source} (${nasa.avgTempC}°C mean)`,
      };
    }
    if (overlayMode === 'slope') {
      return {
        conditionLabel: `Field Slope: ${beforeAnalysis.slopeStatusLabel} (${profile.slopeDeg}°) `,
        topBadge: `Slope: ${profile.slopeDeg}° · ${nasa.elevationM}m Elev.`,
        bottomMetric: `${beforeAnalysis.slopeStatusLabel} · ${profile.soilType} Soil`,
        sourceNote: `Modelled relief estimate anchored to SRTM 30m (${profile.slopeDeg}° slope, ${nasa.elevationM}m elev.)`,
      };
    }
    return {
      conditionLabel: `Crop Health: ${modis?.metricValue ?? (nasa.ndviEstimate === null ? 'MODIS NDVI unavailable' : `NDVI ${nasa.ndviEstimate.toFixed(2)}`)}`,
      topBadge: `Crop Health: ${modis?.metricValue ?? (nasa.ndviEstimate === null ? 'MODIS NDVI unavailable' : `NDVI ${nasa.ndviEstimate.toFixed(2)}`)}`,
      bottomMetric: `${beforeAnalysis.soilStatusLabel} · ${activeStrategy.expectedOutput.chemicalReductionPct}% less fertilizer`,
      sourceNote: nasa.ndviEstimate === null
        ? 'Vegetation index requires authenticated MODIS observations.'
        : `MODIS NDVI mean ${nasa.ndviEstimate.toFixed(2)}`,
    };
  }, [
    overlayMode,
    nasa,
    profile,
    beforeAnalysis.slopeStatusLabel,
    beforeAnalysis.soilStatusLabel,
    modis?.metricValue,
    activeStrategy.expectedOutput.chemicalReductionPct,
  ]);

  // 1) Current year data (Jan -> Dec, with Today pulsating at currentMonthIdx)
  // 2) Future rolling 12-month data starting at Today on the far left (Now -> next 11 future months)
  //    driven directly by Future Predictions (computeScenarioAdjustedForecast)
  const { currentChartData, futureChartData } = useMemo(() => {
    const slopeFactor = Math.max(0.35, Math.min(2.2, 0.35 + profile.slopeDeg * 0.16));
    const soilErodibility =
      profile.soilType === 'Silt'
        ? 1.18
        : profile.soilType === 'Sandy'
          ? 1.08
          : profile.soilType === 'Clay'
            ? 0.92
            : 1.0;

    const currentRows = nasa.monthly.map((m, idx) => {
      const riskRow = nasa.riskCalendarMonthly[idx];
      const ndvi = Number((riskRow?.ndvi ?? nasa.ndviEstimate ?? 0.5).toFixed(2));
      const heavyRainDays = Number((riskRow?.heavyRainDaysPerYr ?? 0).toFixed(1));
      const bareExposure = Math.max(0.15, Math.min(0.92, 1 - ndvi));
      const erosionRiskIdx = Math.round(
        Math.max(
          4,
          Math.min(
            100,
            (m.rainMmMonth * 0.35 + heavyRainDays * 24) * slopeFactor * soilErodibility * bareExposure
          )
        )
      );

      return {
        month: m.month,
        rainMm: m.rainMmMonth,
        effectiveRainMm: m.rainMmMonth,
        extraUsableRainMm: 0,
        tempC: m.tempC,
        moisturePct: m.rootWetnessPct,
        planMoisturePct: m.rootWetnessPct,
        moistureGainBand: 0,
        solar: m.solarMj,
        ndvi,
        planNdvi: ndvi,
        ndviGainBand: 0,
        heavyRainDays,
        erosionRiskIdx,
        planErosionIdx: erosionRiskIdx,
        erosionSavedBand: 0,
      };
    });

    const rainScenarioMult = scenario === 'drought' ? 0.78 : scenario === 'wet' ? 1.2 : 1.0;
    const tempScenarioDelta = scenario === 'drought' ? 1.1 : scenario === 'wet' ? -0.6 : 0;

    const waterBaseEndRatio =
      horizonForecast.waterEfficiencyBaseline / Math.max(0.1, todayForecast.waterEfficiencyBaseline);
    const waterPlanEndRatio =
      horizonForecast.waterEfficiencyStrategy / Math.max(0.1, todayForecast.waterEfficiencyBaseline);
    const somBaseEndRatio =
      horizonForecast.soilFertilityBaseline / Math.max(0.1, todayForecast.soilFertilityBaseline);
    const somPlanEndRatio =
      horizonForecast.soilFertilityStrategy / Math.max(0.1, todayForecast.soilFertilityBaseline);
    const yieldBaseEndRatio =
      horizonForecast.harvestYieldBaseline / Math.max(0.1, todayForecast.harvestYieldBaseline);
    const yieldPlanEndRatio =
      horizonForecast.harvestYieldStrategy / Math.max(0.1, todayForecast.harvestYieldBaseline);

    const maxBareProtection = Math.max(
      0.32,
      Math.min(0.62, (120 - activeStrategy.expectedOutput.bareDaysPerYear) / 165)
    );

    // Roll 12 months forward starting RIGHT AT TODAY (offset = 0 on the far left) -> next 11 future months
    const futureRows = Array.from({ length: 12 }, (_, offset) => {
      const mIdx = (currentMonthIdx + offset) % 12;
      const yearOffset = Math.floor((currentMonthIdx + offset) / 12);
      const calYearShort = String((farmDate.year + yearOffset) % 100).padStart(2, '0');
      const base = currentRows[mIdx];

      // 0 right now (at Today on the left), ramping smoothly into future months
      const progress = offset === 0 ? 0 : Math.pow(offset / 11, 0.85);
      const label = offset === 0 ? `Now (${base.month})` : `${base.month} '${calYearShort}`;

      const rainMult = 1 + (rainScenarioMult - 1) * progress;
      const rainMm = Math.max(0, Math.round(base.rainMm * rainMult));
      const tempC = Number((base.tempC + tempScenarioDelta * progress).toFixed(1));
      const heavyRainDays = Number((base.heavyRainDays * rainMult).toFixed(1));

      // Moisture: starts identical at Today (left), diverges into future months
      const curWaterRatio = 1 + (waterBaseEndRatio - 1) * progress;
      const planWaterRatio = 1 + (waterPlanEndRatio - 1) * progress;
      const moisturePct = Math.round(
        Math.max(10, Math.min(88, base.moisturePct * curWaterRatio))
      );
      const drynessWeight = moisturePct < 45 ? 1.18 : 0.94;
      const moistureDelta =
        offset === 0
          ? 0
          : Math.max(2, Math.round((planWaterRatio - curWaterRatio) * 52 * drynessWeight));
      const planMoisturePct = Math.min(92, moisturePct + moistureDelta);

      // Extra usable water from rotation plan (0 at Today, grows across upcoming months)
      const usableRatio = 1 + Math.max(0.12, planWaterRatio / Math.max(0.1, curWaterRatio) - 1) * 1.45 * progress;
      const effectiveRainMm = offset === 0 ? rainMm : Math.round(rainMm * usableRatio);

      // Crop greenness & ground cover aligned with Future Predictions soil fertility & harvest curves
      const curCoverRatio = 1 + (0.55 * (somBaseEndRatio - 1) + 0.45 * (yieldBaseEndRatio - 1)) * progress;
      const planCoverRatio = 1 + (0.55 * (somPlanEndRatio - 1) + 0.45 * (yieldPlanEndRatio - 1)) * progress;
      const ndvi = Number(Math.max(0.14, Math.min(0.84, base.ndvi * curCoverRatio)).toFixed(2));
      const bareLift = ndvi < 0.4 ? 1.25 : 0.9;
      const planNdvi =
        offset === 0
          ? ndvi
          : Number(
              Math.max(
                ndvi + 0.02,
                Math.min(0.88, base.ndvi * planCoverRatio + 0.06 * progress * bareLift)
              ).toFixed(2)
            );

      // Washout risk: starts identical at Today (left), drops progressively with living cover roots
      const bareExposure = Math.max(0.15, Math.min(0.92, 1 - ndvi));
      const degradationPenalty = 1 + Math.max(0, 1 - curCoverRatio) * 0.7;
      const erosionRiskIdx =
        offset === 0
          ? base.erosionRiskIdx
          : Math.round(
              Math.max(
                4,
                Math.min(
                  100,
                  (rainMm * 0.35 + heavyRainDays * 24) *
                    slopeFactor *
                    soilErodibility *
                    bareExposure *
                    degradationPenalty
                )
              )
            );
      const planErosionIdx =
        offset === 0
          ? erosionRiskIdx
          : Math.round(Math.max(3, erosionRiskIdx * (1 - maxBareProtection * progress)));

      return {
        month: label,
        rainMm,
        effectiveRainMm,
        extraUsableRainMm: Math.max(0, effectiveRainMm - rainMm),
        tempC,
        moisturePct,
        planMoisturePct,
        moistureGainBand: Math.max(0, planMoisturePct - moisturePct),
        solar: base.solar,
        ndvi,
        planNdvi,
        ndviGainBand: Number(Math.max(0, planNdvi - ndvi).toFixed(3)),
        heavyRainDays,
        erosionRiskIdx,
        planErosionIdx,
        erosionSavedBand: Math.max(0, erosionRiskIdx - planErosionIdx),
      };
    });

    return { currentChartData: currentRows, futureChartData: futureRows };
  }, [
    nasa.monthly,
    nasa.riskCalendarMonthly,
    nasa.ndviEstimate,
    profile.slopeDeg,
    profile.soilType,
    activeStrategy.expectedOutput.bareDaysPerYear,
    currentMonthIdx,
    farmDate.year,
    scenario,
    todayForecast,
    horizonForecast,
  ]);

  const nowPoint = currentChartData[currentMonthIdx] ?? currentChartData[0];
  const lastFuturePoint = futureChartData[futureChartData.length - 1] ?? nowPoint;

  const centerTuple: [number, number] = [profile.coordinates.lat, profile.coordinates.lng];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Status Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
            Real-Time Field Overview
          </span>
          <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#111111]">
            {profile.farmName}: Current Season Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <FarmLocalClockBadge
            countryCode={profile.countryCode}
            countryFlag={profile.countryFlag}
            lng={profile.coordinates.lng}
          />
          <button
            type="button"
            onClick={() => openEditFarmModal('location-size')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#CFCBC2] hover:border-[#111111] text-xs font-bold text-[#111111] transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#007432]" />
            Edit Farm
          </button>

          <button
            type="button"
            onClick={openAddFarmModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-xs font-extrabold text-[#111111] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Farm
          </button>
        </div>
      </div>

      {/* Plain-Language Farmer Condition KPI Strip (click any card to view on the map) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => setOverlayMode('moisture')}
          className={`surface-card p-5 border-t-[3px] border-t-[#00873A] flex items-start justify-between gap-3 text-left transition cursor-pointer ${
            overlayMode === 'moisture' ? 'ring-2 ring-[#00873A]/35 shadow-md' : 'hover:border-[#111111]/40'
          }`}
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#3A3A3A]">
              Soil Moisture
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1.5">
              {nasa.moistureStatus}{' '}
              <span className="text-base font-extrabold text-[#007432]">
                ({nasa.rootMoisturePct}%)
              </span>
            </div>
            <p className="text-xs text-[#2E2E2E] mt-1.5 leading-relaxed">
              {smap?.plainSummary ?? nasa.moisturePlainText}
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-[#E3F5EB] text-[#007432] flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOverlayMode('climate')}
          className={`surface-card p-5 border-t-[3px] border-t-[#EBB40E] flex items-start justify-between gap-3 text-left transition cursor-pointer ${
            overlayMode === 'climate' ? 'ring-2 ring-[#EBB40E]/60 shadow-md' : 'hover:border-[#111111]/40'
          }`}
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#3A3A3A]">
              Local Climate (NASA)
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1.5">
              {nasa.avgTempC}°C{' '}
              <span className="text-base font-extrabold text-[#0F7B8A]">
                {nasa.annualRainMm} mm/yr
              </span>
            </div>
            <p className="text-xs text-[#2E2E2E] mt-1.5 leading-relaxed">
              {nasa.weatherPlainText} · {nasa.humidityPct}% humidity
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-[#FDF6DC] text-[#8F6900] flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOverlayMode('slope')}
          className={`surface-card p-5 border-t-[3px] border-t-[#2E2E2E] flex items-start justify-between gap-3 text-left transition cursor-pointer ${
            overlayMode === 'slope' ? 'ring-2 ring-[#2E2E2E]/40 shadow-md' : 'hover:border-[#111111]/40'
          }`}
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#3A3A3A]">
              Field Slope &amp; Erosion
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1.5">
              {beforeAnalysis.slopeStatusLabel}
            </div>
            <p className="text-xs text-[#2E2E2E] mt-1.5 leading-relaxed">
              {srtm?.metricValue ?? `${profile.slopeDeg}° slope`} · {nasa.elevationM}m elev. (
              {profile.soilType})
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-[#EFECE4] text-[#111111] flex items-center justify-center shrink-0">
            <Mountain className="w-5 h-5" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOverlayMode('health')}
          className={`surface-card p-5 border-t-[3px] border-t-[#4E7A00] flex items-start justify-between gap-3 text-left transition cursor-pointer ${
            overlayMode === 'health' ? 'ring-2 ring-[#4E7A00]/45 shadow-md' : 'hover:border-[#111111]/40'
          }`}
        >
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#3A3A3A]">
              Crop Health &amp; Cover
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1.5">
              {modis?.metricValue ?? (nasa.ndviEstimate === null ? 'MODIS NDVI unavailable' : `NDVI ${nasa.ndviEstimate}`)}
            </div>
            <p className="text-xs text-[#2E2E2E] mt-1.5 leading-relaxed">
              {beforeAnalysis.soilStatusLabel} · {activeStrategy.expectedOutput.chemicalReductionPct}
              % less fertilizer
            </p>
          </div>
          <span className="w-11 h-11 rounded-xl bg-[#EBF7D6] text-[#3F6300] flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </span>
        </button>
      </div>

      {/* TOP SECTION: Unified Current Field Map + Optional Guided Rotation Prompt (Only Before Choosing) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div
          className={`${selectedStrategyId ? 'xl:col-span-12' : 'xl:col-span-8'} surface-card p-5 sm:p-6 space-y-4`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-extrabold text-[#111111]">
                  Current Field Map ({profile.areaHectares} ha)
                </h3>
                <button
                  type="button"
                  onClick={() => openEditFarmModal('location-size')}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#CFCBC2] text-xs font-bold text-[#111111] transition cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-[#007432]" />
                  Resize / Relocate
                </button>
              </div>
              <p className="text-xs sm:text-sm text-[#3A3A3A]">
                Active crop: <strong className="text-[#111111]">{currentStep.cropName}</strong> ·{' '}
                <strong className="text-[#007432]">{activeLayerMeta.conditionLabel}</strong>
              </p>
            </div>

            <div className="inline-flex flex-wrap items-center bg-[#EFECE4] p-1 rounded-full border border-[#D9D5CB]">
              {(
                [
                  { id: 'moisture', label: 'Soil Moisture' },
                  { id: 'climate', label: 'Local Climate' },
                  { id: 'slope', label: 'Slope & Erosion' },
                  { id: 'health', label: 'Crop Health' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOverlayMode(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    overlayMode === tab.id
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#2E2E2E] hover:text-[#111111]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <FarmLeafletMap
            mode="dashboard"
            center={centerTuple}
            boundary={profile.boundary}
            heightClass="h-[370px] sm:h-[410px]"
            overlayMode={overlayMode}
            fieldOverlay={{
              cropName: currentStep.cropName,
              cropColor: currentStep.cropColor,
              topBadge: activeLayerMeta.topBadge,
              bottomMetric: activeLayerMeta.bottomMetric,
              moisturePct: nasa.rootMoisturePct,
              ndvi: nasa.ndviEstimate ?? undefined,
              tempC: nasa.avgTempC,
              slopeDeg: profile.slopeDeg,
              physics: {
                slopeDeg: profile.slopeDeg,
                soilType: profile.soilType,
                irrigationType: profile.irrigationType,
              },
              sourceNote: activeLayerMeta.sourceNote,
            }}
          />
        </div>

        {/* Right Side: Appears ONLY when NO rotation strategy has been chosen yet */}
        {!selectedStrategyId && (
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="surface-card p-5 sm:p-6 flex-1 flex flex-col justify-between gap-5 bg-[#007432] text-white border-[#007432] relative overflow-hidden">
              <div className="absolute inset-0 bg-survey-pattern-light opacity-20 pointer-events-none" />
              <div className="relative z-10 space-y-3.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#EBB40E] text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Crop Rotation Guide
                </div>
                <h3 className="text-xl sm:text-[1.35rem] font-extrabold text-white leading-snug">
                  Want a tailored crop rotation plan to enrich your soil, save water, and boost
                  harvests?
                </h3>
                <p className="text-sm text-white/95 leading-relaxed">
                  Compare 3 strategies matched to your {profile.soilType.toLowerCase()} soil,{' '}
                  {profile.slopeDeg}° slope, and 5-year NASA weather history, or build your own
                  custom sequence with our AI Advisor.
                </p>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="bg-black/20 rounded-xl p-2.5 border border-white/15 text-center">
                    <div className="text-[11px] font-extrabold text-[#92D500]">Richer Soil</div>
                    <div className="text-[10px] text-white/80 mt-0.5">Natural N</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 border border-white/15 text-center">
                    <div className="text-[11px] font-extrabold text-[#EBB40E]">Less Water</div>
                    <div className="text-[10px] text-white/80 mt-0.5">Moisture fit</div>
                  </div>
                  <div className="bg-black/20 rounded-xl p-2.5 border border-white/15 text-center">
                    <div className="text-[11px] font-extrabold text-white">Fewer Pests</div>
                    <div className="text-[10px] text-white/80 mt-0.5">Cycle break</div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('rotation-lab')}
                  className="w-full btn-pill btn-pill-primary text-xs sm:text-sm"
                >
                  Open AI Rotation Lab
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MIDDLE CENTERPIECE: Active-Path Rotation Roadmap (only appears once a plan is chosen) */}
      {selectedStrategyId && (
        <RotationRoadmapGraph
          mode="active-only"
          profile={profile}
          top3Strategies={top3Strategies}
          activeStrategy={activeStrategy}
          farmDate={farmDate}
          planCustomization={planCustomization}
          onSelectStrategy={(id) => selectRotationStrategy(id)}
          onChangeStrategyInLab={() => setConfirmStrategyChangeOpen(true)}
          onOpenAiAdvisor={openAiAdvisorForCustomPlan}
          onResetCustomPlan={resetPlanCustomization}
          onNavigate={(page) => navigate(page)}
        />
      )}

      {/* Double Confirmation Modal before changing active strategy */}
      <ConfirmStrategyChangeModal
        isOpen={confirmStrategyChangeOpen}
        activeStrategy={activeStrategy}
        planCustomization={planCustomization}
        onCancel={() => setConfirmStrategyChangeOpen(false)}
        onOpenAiAdvisorInstead={openAiAdvisorForCustomPlan}
        onConfirmChange={() => {
          setConfirmStrategyChangeOpen(false);
          selectRotationStrategy(null);
          navigate('rotation-lab');
        }}
      />

      {/* BOTTOM SECTION: All 4 Lively Animated Farmer Graphs (Each With Its Own "With Crop Rotation" Button) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 1: Soil Moisture */}
        {(() => {
          const isPlan = planGraphs.moisture;
          const activeData = isPlan ? futureChartData : currentChartData;
          const todayIdx = isPlan ? 0 : currentMonthIdx;
          const todayMonthLabel = activeData[todayIdx]?.month;

          return (
            <div className="surface-card p-5 sm:p-6 space-y-3.5 border-t-[3px] border-t-[#00873A] hover:shadow-md transition-all duration-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#007432]">
                    <Droplets className="w-4 h-4" />
                    Soil Moisture
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    How Wet Your Soil Stays Each Month
                  </h3>
                  <p className="text-xs sm:text-sm text-[#3A3A3A]">
                    {isPlan
                      ? `From Today forward with ${activeStrategy.title} (highlighted teal = extra water kept).`
                      : `Your current root-zone moisture across the year compared to the Too Dry warning line (30%).`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGraphPlan('moisture')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                    isPlan
                      ? 'bg-[#007432] text-white border-[#007432] shadow-xs'
                      : 'bg-[#E3F5EB] text-[#005222] border-[#B8E5CC] hover:bg-[#007432] hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  With Crop Rotation
                </button>
              </div>

              {isPlan && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-[#2E2E2E]">
                  <div className="flex flex-wrap items-center gap-3.5">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#6B7280]" />
                      Without Rotation
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#007432]">
                      <span className="w-3.5 h-1 rounded-full bg-[#007432]" />
                      With Crop Rotation
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[#006B68]">
                      <span className="w-3.5 h-3 rounded-xs bg-[#14B8A6]/65 border border-[#0D9488]" />
                      Difference (+{lastFuturePoint.moistureGainBand}% by {lastFuturePoint.month})
                    </span>
                  </div>
                </div>
              )}

              <div className="h-[260px] w-full [&_svg]:overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    key={`moist-${isPlan ? 'plan' : 'now'}-${scenario}-${activeStrategy.id}`}
                    data={activeData}
                    margin={{ top: 24, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="moistureCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1E824C" stopOpacity={0.42} />
                        <stop offset="95%" stopColor="#1E824C" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="moistureBaseMutedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="moistureGainDiffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14B8A6" stopOpacity={0.78} />
                        <stop offset="100%" stopColor="#2DD4BF" stopOpacity={0.42} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#2E2E2E', fontWeight: 700 }} />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                      unit="%"
                    />
                    <Tooltip content={<FarmerChartTooltip metric="moisture" isPlanView={isPlan} />} />
                    <ReferenceLine
                      x={todayMonthLabel}
                      stroke="#00873A"
                      strokeOpacity={0.45}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={30}
                      stroke="#D93829"
                      strokeDasharray="4 4"
                      label={{ value: 'Too Dry (30%)', position: 'insideBottomRight', fill: '#A82418', fontSize: 10, fontWeight: 700 }}
                    />

                    {isPlan ? (
                      <>
                        <Area
                          type="monotone"
                          dataKey="moisturePct"
                          stackId="moistDiff"
                          stroke="#64748B"
                          strokeWidth={2.2}
                          strokeDasharray="5 4"
                          className="chart-flow-dash"
                          fill="url(#moistureBaseMutedGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#64748B', stroke: '#FFFFFF', strokeWidth: 2 }}
                          isAnimationActive
                          animationBegin={0}
                          animationDuration={950}
                        />
                        <Area
                          type="monotone"
                          dataKey="moistureGainBand"
                          stackId="moistDiff"
                          stroke="none"
                          fill="url(#moistureGainDiffGrad)"
                          dot={false}
                          activeDot={false}
                          isAnimationActive
                          animationBegin={180}
                          animationDuration={1100}
                          animationEasing="ease-out"
                        />
                        <Line
                          type="monotone"
                          dataKey="planMoisturePct"
                          stroke="#007432"
                          strokeWidth={3.4}
                          dot={makeTodayPulseDot(todayIdx, '#00873A', 'moist-plan', farmDate.shortDate)}
                          activeDot={{ r: 7, fill: '#00873A', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                          isAnimationActive
                          animationBegin={180}
                          animationDuration={1150}
                          animationEasing="ease-out"
                        />
                      </>
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="moisturePct"
                        stroke="#1E824C"
                        strokeWidth={3.2}
                        fill="url(#moistureCurrentGrad)"
                        dot={makeTodayPulseDot(todayIdx, '#00873A', 'moist-now', farmDate.shortDate)}
                        activeDot={{ r: 7, fill: '#00873A', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                        isAnimationActive
                        animationBegin={60}
                        animationDuration={1100}
                        animationEasing="ease-out"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Graph 2: Local Weather (Rain & Heat) */}
        {(() => {
          const isPlan = planGraphs.weather;
          const activeData = isPlan ? futureChartData : currentChartData;
          const todayIdx = isPlan ? 0 : currentMonthIdx;
          const todayMonthLabel = activeData[todayIdx]?.month;

          return (
            <div className="surface-card p-5 sm:p-6 space-y-3.5 border-t-[3px] border-t-[#EBB40E] hover:shadow-md transition-all duration-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#8F6900]">
                    <CloudRain className="w-4 h-4" />
                    Local Weather (NASA)
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    {isPlan ? 'Upcoming Rain + Extra Water Kept' : 'Monthly Rain & Temperature'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#3A3A3A]">
                    {isPlan
                      ? `From Today forward, gold caps show extra usable water kept by ${currentStep.cropName} & cover.`
                      : `Local rain (${nasa.annualRainMm} mm/yr) and monthly heat for ${profile.countryName}.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGraphPlan('weather')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                    isPlan
                      ? 'bg-[#007432] text-white border-[#007432] shadow-xs'
                      : 'bg-[#FDF6DC] text-[#6E5100] border-[#EBD58B] hover:bg-[#007432] hover:text-white hover:border-[#007432]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  With Crop Rotation
                </button>
              </div>

              {isPlan && (
                <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-[#2E2E2E]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-3 rounded-xs bg-[#2FA866]" />
                    Expected Rain
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#8F6900]">
                    <span className="w-3.5 h-3 rounded-xs bg-[#EBB40E] border border-[#C49200]" />
                    Extra Water Kept (Difference)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-1 rounded-full bg-[#D97706]" />
                    Temp (°C)
                  </span>
                </div>
              )}

              <div className="h-[260px] w-full [&_svg]:overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    key={`climate-${isPlan ? 'plan' : 'now'}-${scenario}-${activeStrategy.id}`}
                    data={activeData}
                    margin={{ top: 24, right: 16, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#2E2E2E', fontWeight: 700 }} />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                      unit="mm"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                      unit="°C"
                    />
                    <Tooltip content={<FarmerChartTooltip metric="weather" isPlanView={isPlan} />} />
                    <ReferenceLine
                      yAxisId="left"
                      x={todayMonthLabel}
                      stroke="#D99B00"
                      strokeOpacity={0.45}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <Bar
                      yAxisId="left"
                      dataKey="rainMm"
                      stackId={isPlan ? 'rainDiff' : undefined}
                      radius={isPlan ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={120}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {activeData.map((entry, idx) => (
                        <Cell
                          key={`rain-cell-${entry.month}`}
                          fill={idx === todayIdx ? '#007432' : '#2FA866'}
                          fillOpacity={idx === todayIdx ? 1 : 0.76}
                          className={idx === todayIdx ? 'chart-today-bar' : undefined}
                        />
                      ))}
                    </Bar>
                    {isPlan && (
                      <Bar
                        yAxisId="left"
                        dataKey="extraUsableRainMm"
                        stackId="rainDiff"
                        radius={[6, 6, 0, 0]}
                        isAnimationActive
                        animationBegin={260}
                        animationDuration={1100}
                        animationEasing="ease-out"
                      >
                        {activeData.map((entry, idx) => (
                          <Cell
                            key={`rain-gain-${entry.month}`}
                            fill={idx === todayIdx ? '#F59E0B' : '#EBB40E'}
                            fillOpacity={idx === todayIdx ? 1 : 0.92}
                            stroke="#B45309"
                            strokeWidth={idx === todayIdx ? 1.5 : 0.7}
                          />
                        ))}
                      </Bar>
                    )}
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="tempC"
                      stroke="#D97706"
                      strokeWidth={3.2}
                      dot={makeTodayPulseDot(todayIdx, '#D97706', 'temp', farmDate.shortDate)}
                      activeDot={{ r: 7, fill: '#EBB40E', stroke: '#111111', strokeWidth: 2 }}
                      isAnimationActive
                      animationBegin={220}
                      animationDuration={1200}
                      animationEasing="ease-out"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Graph 3: Slope & Rain Washout Risk */}
        {(() => {
          const isPlan = planGraphs.erosion;
          const activeData = isPlan ? futureChartData : currentChartData;
          const todayIdx = isPlan ? 0 : currentMonthIdx;
          const todayMonthLabel = activeData[todayIdx]?.month;

          return (
            <div className="surface-card p-5 sm:p-6 space-y-3.5 border-t-[3px] border-t-[#2E2E2E] hover:shadow-md transition-all duration-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2E2E2E]">
                    <Mountain className="w-4 h-4" />
                    Slope &amp; Rain Washout Risk
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    {isPlan ? 'Future Topsoil Protection vs No Rotation' : 'Current Rain Washout Risk on Your Field'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#3A3A3A]">
                    {isPlan
                      ? `From Today forward, the blue zone shows storm soil loss prevented on your ${profile.slopeDeg}° slope.`
                      : `Shows when heavy storms can wash away bare topsoil on your ${profile.slopeDeg}° ${profile.soilType.toLowerCase()} slope.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGraphPlan('erosion')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                    isPlan
                      ? 'bg-[#007432] text-white border-[#007432] shadow-xs'
                      : 'bg-[#FCEBE6] text-[#8C2B11] border-[#E7A18E] hover:bg-[#007432] hover:text-white hover:border-[#007432]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  With Crop Rotation
                </button>
              </div>

              {isPlan && (
                <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-[#2E2E2E]">
                  <span className="inline-flex items-center gap-1.5 text-[#A83812]">
                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#C94A1A]" />
                    Without Rotation
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#007432]">
                    <span className="w-3.5 h-1 rounded-full bg-[#007432]" />
                    With Crop Rotation
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#0369A1]">
                    <span className="w-3.5 h-3 rounded-xs bg-[#38BDF8]/65 border border-[#0284C7]" />
                    Risk Prevented (Difference)
                  </span>
                </div>
              )}

              <div className="h-[260px] w-full [&_svg]:overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    key={`slope-${isPlan ? 'plan' : 'now'}-${scenario}-${activeStrategy.id}`}
                    data={activeData}
                    margin={{ top: 24, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="erosionPlanSafeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00873A" stopOpacity={0.22} />
                        <stop offset="95%" stopColor="#00873A" stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="erosionPreventedDiffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity={0.72} />
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity={0.34} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#2E2E2E', fontWeight: 700 }} />
                    <YAxis
                      yAxisId="left"
                      domain={[0, 100]}
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                      unit="d"
                    />
                    <Tooltip content={<FarmerChartTooltip metric="erosion" isPlanView={isPlan} />} />
                    <ReferenceLine
                      yAxisId="left"
                      x={todayMonthLabel}
                      stroke={isPlan ? '#007432' : '#C94A1A'}
                      strokeOpacity={0.45}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <Bar
                      yAxisId="right"
                      dataKey="heavyRainDays"
                      radius={[6, 6, 0, 0]}
                      isAnimationActive
                      animationBegin={180}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      {activeData.map((entry, idx) => (
                        <Cell
                          key={`storm-cell-${entry.month}`}
                          fill={idx === todayIdx ? '#334155' : '#94A3B8'}
                          fillOpacity={idx === todayIdx ? 0.55 : 0.28}
                          className={idx === todayIdx ? 'chart-today-bar' : undefined}
                        />
                      ))}
                    </Bar>

                    {isPlan ? (
                      <>
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="planErosionIdx"
                          stackId="erosionDiff"
                          stroke="none"
                          fill="url(#erosionPlanSafeGrad)"
                          dot={false}
                          activeDot={false}
                          isAnimationActive
                          animationBegin={120}
                          animationDuration={950}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="erosionSavedBand"
                          stackId="erosionDiff"
                          stroke="none"
                          fill="url(#erosionPreventedDiffGrad)"
                          dot={false}
                          activeDot={false}
                          isAnimationActive
                          animationBegin={240}
                          animationDuration={1100}
                          animationEasing="ease-out"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="erosionRiskIdx"
                          stroke="#C94A1A"
                          strokeWidth={2.3}
                          strokeDasharray="5 4"
                          className="chart-flow-dash"
                          dot={false}
                          activeDot={{ r: 5, fill: '#C94A1A', stroke: '#FFFFFF', strokeWidth: 2 }}
                          isAnimationActive
                          animationBegin={200}
                          animationDuration={1050}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="planErosionIdx"
                          stroke="#007432"
                          strokeWidth={3.4}
                          dot={makeTodayPulseDot(todayIdx, '#007432', 'slope-plan', farmDate.shortDate)}
                          activeDot={{ r: 7, fill: '#007432', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                          isAnimationActive
                          animationBegin={260}
                          animationDuration={1200}
                          animationEasing="ease-out"
                        />
                      </>
                    ) : (
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="erosionRiskIdx"
                        stroke="#C94A1A"
                        strokeWidth={3.2}
                        dot={makeTodayPulseDot(todayIdx, '#C94A1A', 'slope-now', farmDate.shortDate)}
                        activeDot={{ r: 7, fill: '#C94A1A', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                        isAnimationActive
                        animationBegin={240}
                        animationDuration={1200}
                        animationEasing="ease-out"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}

        {/* Graph 4: Crop Health & Ground Cover */}
        {(() => {
          const isPlan = planGraphs.ndvi;
          const activeData = isPlan ? futureChartData : currentChartData;
          const todayIdx = isPlan ? 0 : currentMonthIdx;
          const todayMonthLabel = activeData[todayIdx]?.month;

          return (
            <div className="surface-card p-5 sm:p-6 space-y-3.5 border-t-[3px] border-t-[#4E7A00] hover:shadow-md transition-all duration-300">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#3F6300]">
                    <Leaf className="w-4 h-4" />
                    Crop Health &amp; Ground Cover
                  </div>
                  <h3 className="text-lg font-extrabold text-[#111111]">
                    {isPlan ? 'Upcoming Green Cover Gain vs No Rotation' : 'How Green & Covered Your Field Is Today'}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#3A3A3A]">
                    {isPlan
                      ? `From Today forward, gold-lime shading shows extra living cover gained with ${activeStrategy.title}.`
                      : `Tracks monthly field greenness. Dips below the Bare Field Warning line expose topsoil to heat and wind.`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleGraphPlan('ndvi')}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition-all cursor-pointer shrink-0 ${
                    isPlan
                      ? 'bg-[#007432] text-white border-[#007432] shadow-xs'
                      : 'bg-[#EBF7D6] text-[#3F6300] border-[#C6E396] hover:bg-[#007432] hover:text-white hover:border-[#007432]'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  With Crop Rotation
                </button>
              </div>

              {isPlan && (
                <div className="flex flex-wrap items-center gap-3.5 text-xs font-bold text-[#2E2E2E]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#78716C]" />
                    Without Rotation
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#3F6300]">
                    <span className="w-3.5 h-1 rounded-full bg-[#3F6300]" />
                    With Crop Rotation
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[#92400E]">
                    <span className="w-3.5 h-3 rounded-xs bg-[#EBB40E]/75 border border-[#CA8A04]" />
                    Extra Green Cover (+{lastFuturePoint.ndviGainBand.toFixed(2)} by {lastFuturePoint.month})
                  </span>
                </div>
              )}

              <div className="h-[260px] w-full [&_svg]:overflow-visible">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    key={`ndvi-${isPlan ? 'plan' : 'now'}-${scenario}-${activeStrategy.id}`}
                    data={activeData}
                    margin={{ top: 24, right: 16, left: -12, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="ndviCurrentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6A8F1B" stopOpacity={0.44} />
                        <stop offset="95%" stopColor="#9ED500" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="ndviBaseMutedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#A8A29E" stopOpacity={0.26} />
                        <stop offset="95%" stopColor="#A8A29E" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="ndviGainDiffGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#EBB40E" stopOpacity={0.82} />
                        <stop offset="100%" stopColor="#A3E635" stopOpacity={0.48} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#2E2E2E', fontWeight: 700 }} />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                    />
                    <Tooltip content={<FarmerChartTooltip metric="ndvi" isPlanView={isPlan} />} />
                    <ReferenceLine
                      x={todayMonthLabel}
                      stroke="#4E7A00"
                      strokeOpacity={0.45}
                      strokeWidth={2}
                      strokeDasharray="3 3"
                    />
                    <ReferenceLine
                      y={0.35}
                      stroke="#C49200"
                      strokeDasharray="4 4"
                      label={{ value: 'Bare Field Warning', position: 'insideTopRight', fill: '#8F6900', fontSize: 10, fontWeight: 700 }}
                    />

                    {isPlan ? (
                      <>
                        <Area
                          type="monotone"
                          dataKey="ndvi"
                          stackId="ndviDiff"
                          stroke="#78716C"
                          strokeWidth={2.2}
                          strokeDasharray="5 4"
                          className="chart-flow-dash"
                          fill="url(#ndviBaseMutedGrad)"
                          dot={false}
                          activeDot={{ r: 5, fill: '#78716C', stroke: '#FFFFFF', strokeWidth: 2 }}
                          isAnimationActive
                          animationBegin={180}
                          animationDuration={1000}
                        />
                        <Area
                          type="monotone"
                          dataKey="ndviGainBand"
                          stackId="ndviDiff"
                          stroke="none"
                          fill="url(#ndviGainDiffGrad)"
                          dot={false}
                          activeDot={false}
                          isAnimationActive
                          animationBegin={300}
                          animationDuration={1150}
                          animationEasing="ease-out"
                        />
                        <Line
                          type="monotone"
                          dataKey="planNdvi"
                          stroke="#3F6300"
                          strokeWidth={3.4}
                          dot={makeTodayPulseDot(todayIdx, '#4E7A00', 'ndvi-plan', farmDate.shortDate)}
                          activeDot={{ r: 7, fill: '#4E7A00', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                          isAnimationActive
                          animationBegin={320}
                          animationDuration={1250}
                          animationEasing="ease-out"
                        />
                      </>
                    ) : (
                      <Area
                        type="monotone"
                        dataKey="ndvi"
                        stroke="#3F6300"
                        strokeWidth={3.2}
                        fill="url(#ndviCurrentGrad)"
                        dot={makeTodayPulseDot(todayIdx, '#4E7A00', 'ndvi-now', farmDate.shortDate)}
                        activeDot={{ r: 7, fill: '#4E7A00', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                        isAnimationActive
                        animationBegin={300}
                        animationDuration={1250}
                        animationEasing="ease-out"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })()}
      </div>

      {/* FULL 12-MONTH ANNUAL FARM CALENDAR (PAST, PRESENT & FUTURE - EXCLUSIVE TO DASHBOARD) */}
      <YearOverviewCalendar
        profile={profile}
        activeStrategy={activeStrategy}
        selectedStrategyId={selectedStrategyId}
        planCustomization={planCustomization}
        calendarEvents={calendarEvents}
        strategyHistory={strategyHistory}
        farmDate={farmDate}
        onToggleComplete={toggleCalendarComplete}
        onAddEvent={addCalendarEvent}
      />
    </div>
  );
};
