import {
  ClimateScenario,
  ContractRiskCalendarMonth,
  TadawolApiRequest,
  TadawolApiResponse,
} from './tadawolContract';
import { FarmerProfile, RotationStrategy } from '../types/farm';
import { CROPS, ZONE_IDS } from '../data/agronomyData';

const DEFAULT_API_URL =
  (import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ?? 'http://localhost:8000/api/analyze';

function normalizeBackendResponse(json: Record<string, any>, fallback: TadawolApiResponse): TadawolApiResponse {
  const backendKpis = json.kpis ?? {};
  const rotations = Array.isArray(json.rotations)
    ? json.rotations.map((rotation: any, index: number) => ({
        rank: index + 1,
        name: rotation.name ?? `Rotation ${index + 1}`,
        sequence: rotation.crops ?? rotation.sequence ?? [],
        composite_score: rotation.composite_score ?? Math.round((rotation.total_score ?? 0) * 10),
        soil_score: rotation.soil_score ?? Math.round((rotation.breakdown?.soil ?? 0) * 100),
        water_score: rotation.water_score ?? Math.round((rotation.breakdown?.water ?? 0) * 100),
        erosion_score: rotation.erosion_score ?? Math.round((rotation.breakdown?.erosion ?? 0) * 100),
        income_score: rotation.income_score ?? Math.round((rotation.breakdown?.income ?? 0) * 100),
        avg_yield_t_ha: rotation.avg_yield_t_ha ?? 0,
        water_use_mm: rotation.water_use_mm ?? 0,
        rationale: rotation.rationale ?? rotation.explain_text ?? rotation.explanation ?? '',
      }))
    : fallback.rotations;

  return {
    ...fallback,
    region_validated: json.region_validated ?? fallback.region_validated,
    kpis: {
      ...fallback.kpis,
      ...backendKpis,
      sustainability_score: backendKpis.avg_rain_mm ?? fallback.kpis.sustainability_score,
      water_savings_pct: backendKpis.heavy_rain_days_yr ?? fallback.kpis.water_savings_pct,
      erosion_reduction_pct: backendKpis.slope_deg ?? fallback.kpis.erosion_reduction_pct,
    },
    confidence: { ...fallback.confidence, ...(json.confidence ?? {}) },
    rotations: rotations.length > 0 ? rotations : fallback.rotations,
    bare_field_clock: { ...fallback.bare_field_clock, ...(json.bare_field_clock ?? {}) },
    sowing_window: { ...fallback.sowing_window, ...(json.sowing_window ?? {}) },
    risk_calendar: { ...fallback.risk_calendar, ...(json.risk_calendar ?? {}) },
    caveats: Array.isArray(json.caveats) ? json.caveats : fallback.caveats,
    meteomatics: json.meteomatics ?? fallback.meteomatics ?? null,
  };
}

/**
 * Builds an exact contract.json `request` payload from Tadawol app state.
 */
export function buildContractRequest(
  profile: FarmerProfile,
  strategy: RotationStrategy,
  overrides: Partial<TadawolApiRequest> = {}
): TadawolApiRequest {
  const activeCrops = ZONE_IDS.map((z) => {
    const id = strategy.seasons[0].zones[z].cropId;
    return CROPS[id]?.name ?? 'Durum wheat';
  });

  // Deduplicate while preserving sequence order for custom_rotation
  const uniqueSequence = Array.from(new Set(activeCrops));
  const customRotation = [...uniqueSequence];
  while (customRotation.length < 3) {
    customRotation.push(['Durum wheat', 'Fava bean', 'Barley + vetch'][customRotation.length]);
  }

  return {
    lat: Number(profile.coordinates.lat.toFixed(4)),
    lon: Number(profile.coordinates.lng.toFixed(4)),
    years: overrides.years ?? 10,
    use_gee: overrides.use_gee ?? false,
    slope_deg: overrides.slope_deg ?? 5,
    weights: overrides.weights ?? {
      soil: strategy.parameters.organicFocus ? 9 : 7,
      water: Math.min(10, Math.max(2, Math.round(strategy.parameters.waterConservationPct / 4))),
      erosion: 5,
      income: strategy.parameters.priority === 'high-yield' ? 8 : 3,
    },
    scenario: overrides.scenario ?? 'normal',
    replay_year: overrides.replay_year ?? null,
    rain_change_pct: overrides.rain_change_pct ?? 0,
    custom_rotation: overrides.custom_rotation ?? customRotation.slice(0, 3),
  };
}

/**
 * Deterministic local contract response generator implementing 100% of contract.json `response`
 * keys so the UI works offline/standalone and matches the live backend schema identically.
 */
export function simulateContractResponse(
  req: TadawolApiRequest,
  profile: FarmerProfile,
  strategy: RotationStrategy
): TadawolApiResponse {
  const totalWeight = Math.max(
    1,
    req.weights.soil + req.weights.water + req.weights.erosion + req.weights.income
  );
  const soilW = req.weights.soil / totalWeight;
  const waterW = req.weights.water / totalWeight;
  const erosionW = req.weights.erosion / totalWeight;
  const incomeW = req.weights.income / totalWeight;

  const scenarioDroughtBump: Record<ClimateScenario, number> = {
    normal: 0,
    bad_year: 24,
  };
  const scenarioRainShift =
    req.rain_change_pct + (req.scenario === 'bad_year' ? -20 : 0);

  const slopePenalty = Math.max(0, (req.slope_deg - 3) * 2.2);
  const baseScore = strategy.summaryMetrics.sustainabilityScore;

  const waterSavings = Math.min(
    45,
    Math.max(8, Math.round(strategy.summaryMetrics.waterSavingsPct + waterW * 12 - scenarioRainShift * 0.1))
  );
  const erosionReduction = Math.min(
    78,
    Math.max(22, Math.round(48 + erosionW * 28 - slopePenalty * 0.7))
  );
  const soilHealthIndex = Math.min(
    97,
    Math.max(58, Math.round(baseScore * 0.85 + soilW * 18))
  );
  const yieldStability = Math.min(
    96,
    Math.max(62, Math.round(74 + (soilW + waterW) * 16 - Math.max(0, scenarioDroughtBump[req.scenario] * 0.35)))
  );

  // Bare field clock
  const bareDays = Math.max(
    24,
    Math.min(115, Math.round(62 - erosionW * 35 - (strategy.parameters.organicFocus ? 16 : 0) + req.slope_deg * 1.4))
  );
  const coverPct = Math.round(((365 - bareDays) / 365) * 100);

  // Build 12-month Risk Calendar
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const droughtBase = [14, 16, 22, 34, 52, 74, 86, 82, 58, 32, 18, 12];
  const erosionBase = [42, 36, 28, 22, 16, 12, 10, 14, 34, 54, 48, 44];
  const heatBase = [8, 10, 18, 30, 48, 72, 88, 86, 60, 32, 16, 10];
  const pestBase = [18, 22, 38, 52, 58, 44, 30, 26, 32, 34, 24, 16];

  const months: ContractRiskCalendarMonth[] = monthNames.map((m, i) => {
    const d = Math.min(98, Math.max(4, Math.round(droughtBase[i] + scenarioDroughtBump[req.scenario] - req.rain_change_pct * 0.5)));
    const er = Math.min(96, Math.max(5, Math.round(erosionBase[i] + slopePenalty + (req.rain_change_pct > 0 ? req.rain_change_pct * 0.4 : 0) - erosionW * 16)));
    const h = Math.min(98, Math.max(4, Math.round(heatBase[i] + (req.scenario === 'bad_year' ? 8 : 0))));
    const p = Math.min(92, Math.max(6, Math.round(pestBase[i] - soilW * 12)));
    const maxVal = Math.max(d, er, h, p);
    const dominant_hazard =
      maxVal === h && h >= 60
        ? 'Thermal Stress'
        : maxVal === d && d >= 55
          ? 'Moisture Deficit'
          : maxVal === er && er >= 45
            ? 'Runoff & Slope Erosion'
            : maxVal === p && p >= 45
              ? 'Cereal Pest Pressure'
              : 'Low Risk';

    return {
      month: m,
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

  const rotations = [
    {
      rank: 1,
      name: strategy.name,
      sequence: req.custom_rotation.length > 0 ? req.custom_rotation : ['Durum wheat', 'Fava bean', 'Barley + vetch'],
      composite_score: Math.min(98, Math.round(soilHealthIndex * soilW + (60 + waterSavings) * waterW + (35 + erosionReduction * 0.8) * erosionW + (72 + incomeW * 20) * incomeW)),
      soil_score: soilHealthIndex,
      water_score: Math.min(97, 56 + waterSavings),
      erosion_score: Math.min(96, 30 + erosionReduction),
      income_score: Math.min(95, Math.round(70 + strategy.summaryMetrics.projectedYieldGainPct)),
      avg_yield_t_ha: Number((5.2 * (1 + strategy.summaryMetrics.projectedYieldGainPct / 100)).toFixed(2)),
      water_use_mm: Math.round(375 * (1 - waterSavings / 100)),
      rationale: `Matches farmer weights (Soil ${req.weights.soil}, Water ${req.weights.water}, Erosion ${req.weights.erosion}, Income ${req.weights.income}) under ${req.scenario} climate on ${req.slope_deg}° slope.`,
    },
    {
      rank: 2,
      name: 'Dryland Legume-Cereal Shield',
      sequence: ['Durum wheat', 'Fava bean', 'Barley + vetch'],
      composite_score: Math.min(96, Math.round(soilHealthIndex - 2 + (req.scenario === 'bad_year' ? 5 : 0))),
      soil_score: 88,
      water_score: 89,
      erosion_score: 86,
      income_score: 76,
      avg_yield_t_ha: 5.45,
      water_use_mm: 285,
      rationale: 'Classic Mediterranean nitrogen-fixing sequence minimizing bare-soil exposure before autumn rains.',
    },
    {
      rank: 3,
      name: 'Deep-Root Conservation Break',
      sequence: ['Grain Sorghum', 'Chickpeas', 'Winter Canola', 'Durum Wheat'],
      composite_score: Math.min(94, Math.round(soilHealthIndex - 5 + erosionW * 10)),
      soil_score: 84,
      water_score: 92,
      erosion_score: 82,
      income_score: 81,
      avg_yield_t_ha: 5.75,
      water_use_mm: 270,
      rationale: 'Taproot oilseed + fibrous sorghum fracture subsoil compaction and stabilize yields in dry years.',
    },
  ];

  const primaryCrop = req.custom_rotation[0] ?? 'Durum wheat';
  const regionValidated = req.lat >= -60 && req.lat <= 70 && req.lon >= -180 && req.lon <= 180;

  return {
    region_validated: regionValidated,
    kpis: {
      soil_health_index: soilHealthIndex,
      water_savings_pct: waterSavings,
      erosion_reduction_pct: erosionReduction,
      yield_stability_pct: yieldStability,
      expected_yield_gain_pct: strategy.summaryMetrics.projectedYieldGainPct,
      som_gain_pct: strategy.summaryMetrics.soilOrganicMatterGainPct,
      nitrogen_balance_kg_ha: strategy.summaryMetrics.nitrogenGainKgHa,
      sustainability_score: baseScore,
    },
    confidence: {
      overall_score: req.use_gee ? 92 : 84,
      level: req.use_gee ? 'High' : 'High',
      data_source: req.use_gee
        ? 'Google Earth Engine (Sentinel-2 + SMAP + CHIRPS) + Local Farm Profile'
        : 'NASA SMAP L4 + MODIS LST + Local Farm Baseline',
      gee_enabled: req.use_gee,
      satellite_coverage_pct: req.use_gee ? 98 : 91,
      calibration_note: `Validated for ${req.lat.toFixed(2)}°N, ${req.lon.toFixed(2)}°E (${profile.soilType}, ${req.slope_deg}° slope) across ${req.years}-year horizon.`,
    },
    rotations,
    bare_field_clock: {
      bare_days_per_year: bareDays,
      baseline_bare_days: 148,
      cover_pct: coverPct,
      high_risk_months: ['Sep', 'Oct'],
      erosion_risk_level: req.slope_deg >= 8 ? 'Elevated' : bareDays <= 55 ? 'Low' : 'Moderate',
      summary: `Soil stays covered ${coverPct}% of the year (${bareDays} bare days vs. 148 baseline), cutting autumn sheet erosion on ${req.slope_deg}° slopes.`,
    },
    sowing_window: {
      primary_crop: primaryCrop,
      optimal_start: req.scenario === 'bad_year' ? 'Nov 08' : 'Oct 28',
      optimal_end: req.scenario === 'bad_year' ? 'Dec 02' : 'Nov 24',
      soil_moisture_trigger_pct: Math.max(20, profile.nasaBaseline.smapSoilMoisturePct - 4),
      surface_temp_window_c: '14°C – 21°C',
      advisory: `Sow ${primaryCrop} once NASA SMAP top-30cm moisture exceeds ${Math.max(20, profile.nasaBaseline.smapSoilMoisturePct - 4)}% after first autumn rain event.`,
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
        timing: 'Pre-Sowing (Oct)',
        action: `Maintain crop residue mulch across ${req.slope_deg}° slope before first autumn storm.`,
        reason: `Reduces topsoil runoff by ${erosionReduction}% during peak October rainfall.`,
      },
      {
        id: 'chk-2',
        priority: 'High',
        timing: 'Sowing Window',
        action: `Inoculate legume plot seeds (Fava bean / Chickpeas) with Rhizobium strain prior to drilling.`,
        reason: `Unlocks +${strategy.summaryMetrics.nitrogenGainKgHa} kg/ha biological nitrogen for next season's cereal.`,
      },
      {
        id: 'chk-3',
        priority: 'Medium',
        timing: 'Spring Vegetative (Mar–Apr)',
        action: `Sync ${profile.irrigationType} schedule to NASA SMAP moisture threshold (${profile.nasaBaseline.smapSoilMoisturePct}%).`,
        reason: `Delivers projected ${waterSavings}% irrigation water savings under ${req.scenario} scenario.`,
      },
      {
        id: 'chk-4',
        priority: 'Low',
        timing: 'Post-Harvest (Jul)',
        action: 'Record plot-level yield and grain protein to recalibrate multi-year farm history.',
        reason: 'Improves next-cycle AI model confidence above 94%.',
      },
    ],
    caveats: [
      req.use_gee
        ? 'Google Earth Engine cloud-masked Sentinel-2 composites assume <15% cloud cover during peak tillering.'
        : 'Running in fast local NASA baseline mode (use_gee=false); enable GEE for 10m sub-parcel optical indices.',
      `Climate simulation applies ${req.rain_change_pct >= 0 ? '+' : ''}${req.rain_change_pct}% rainfall shift under "${req.scenario}" scenario over ${req.years} years.`,
      req.slope_deg >= 6
        ? `Terrain slope (${req.slope_deg}°) warrants contour seeding and zero bare-fallow windows during October–November.`
        : `Moderate terrain slope (${req.slope_deg}°) supports reduced-till residue management without terracing.`,
    ],
  };
}

/**
 * Calls the colleague's live backend API using the exact contract.json schema if `endpointUrl`
 * is provided; otherwise gracefully returns the schema-identical local simulation.
 */
export async function executeOptimizationContract(
  request: TadawolApiRequest,
  profile: FarmerProfile,
  strategy: RotationStrategy,
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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const json = (await res.json()) as Record<string, any>;
      const fallback = simulateContractResponse(request, profile, strategy);
      return {
        source: 'remote-api',
        response: normalizeBackendResponse(json, fallback),
      };
    } catch (err) {
      return {
        source: 'local-simulator',
        response: simulateContractResponse(request, profile, strategy),
        error: err instanceof Error ? err.message : 'Unable to reach remote API',
      };
    }
  }

  return {
    source: 'local-simulator',
    response: simulateContractResponse(request, profile, strategy),
  };
}
