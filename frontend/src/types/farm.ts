export type AppScreen =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'calendar'
  | 'history'
  | 'rotation-lab'
  | 'market-finance'
  | 'predictions';

export type SoilType = 'Loamy' | 'Clay' | 'Sandy' | 'Silt' | 'Peaty';

export type SlopeOption =
  | 'Flat'
  | 'Gentle Slope'
  | 'Steep Slope'
  | 'Auto-detect via SRTM Elevation';

export type IrrigationType = 'Rain-fed' | 'Drip' | 'Sprinkler' | 'Canal / Well';

export type ClimateZone =
  | 'Mediterranean'
  | 'Temperate'
  | 'Semi-Arid'
  | 'Continental'
  | 'Subtropical'
  | 'Tropical';

export interface Coordinates {
  lat: number;
  lng: number;
}

export type RiskLevel = 'green' | 'yellow' | 'red' | 'none';

export interface MonthlyRiskCalendarRow {
  month: string; // Jan..Dec
  frostDaysPerYr: number; // T2M_MIN < 0 C (yellow >= 0.2, red >= 1.0)
  frostLevel: RiskLevel;
  heavyRainDaysPerYr: number; // PRECTOTCORR >= 20 mm (yellow >= 0.3, red >= 1.0)
  heavyRainLevel: RiskLevel;
  soilWetness: number; // 0..1 GWETROOT or SMAP sm_rootzone (yellow <= 0.45, red <= 0.30)
  drySoilLevel: RiskLevel;
  ndvi: number | null;
  bareFieldLevel: RiskLevel;
}

export interface NasaPowerDailyPoint {
  date: string; // YYYY-MM-DD
  label: string; // e.g., "Dec 18"
  tempC: number | null;
  minTempC: number | null;
  rainMm: number | null;
  solarMj: number | null;
  humidityPct: number | null;
  rootWetnessPct: number | null;
  topWetnessPct: number | null;
}

export interface NasaPowerMonthlyPoint {
  month: string; // Jan..Dec
  tempC: number;
  minTempC: number;
  rainMmMonth: number;
  rootWetnessPct: number;
  topWetnessPct: number;
  solarMj: number;
  humidityPct: number;
}

export interface Phase2SatelliteLayer {
  id: 'smap' | 'modis_landsat' | 'srtm';
  name: string;
  shortName: string;
  assetId: string;
  resolution: string;
  status: 'Ready' | 'Active Estimate' | 'Unavailable';
  metricLabel: string;
  metricValue: string;
  plainSummary: string;
  limitation: string;
}

export interface NasaPowerDataset {
  source: 'nasa-power-live' | 'nasa-power-fallback';
  fetchedAt: string;
  dailyDataThrough: string;
  recentDaysAvailable: number;
  yearsAnalyzed: string; // e.g., "2021–2025 (5 complete years)"
  elevationM: number;
  avgTempC: number;
  minTempC: number;
  annualRainMm: number;
  driestYear: number;
  driestYearMm: number;
  frostDaysPerYear: number;
  heavyRainDaysPerYear: number;
  autumnRainOnset: string; // e.g., "Sep 24" (first day >= Sep 1 with 3-day rain >= 20mm)
  recentRain14dMm: number | null;
  rootMoisturePct: number;
  topMoisturePct: number;
  humidityPct: number;
  solarMj: number;
  ndviEstimate: number | null;
  monthlySmapRootWetnessPct: (number | null)[];
  srtmSlopeDeg: number | null;
  satelliteCheckedAt: string;
  waterStressScore: number; // 0 (none) to 100 (severe)
  moistureStatus: 'Dry' | 'Fair' | 'Good' | 'Wet';
  moisturePlainText: string;
  weatherPlainText: string;
  daily: NasaPowerDailyPoint[];
  monthly: NasaPowerMonthlyPoint[];
  riskCalendarMonthly: MonthlyRiskCalendarRow[];
  phase2Adapters: Phase2SatelliteLayer[];
}

export interface FarmerFinanceInputs {
  /** Strictly optional: ticked only in Registration or Profile Settings */
  enabled: boolean;
  /** Preferred display & planning currency code (defaults to farmer's country currency; changeable across all 42+ countries) */
  currencyCode?: string;
  /** REQUIRED when enabled: Total season cash / budget capacity available for the farm in chosen currency */
  seasonBudgetCapacityLocal?: number;
  /** REQUIRED when enabled: Non-fertilizer season spend per hectare in chosen currency (seed, plowing, water, harvest) */
  operatingCostPerHaLocal?: number;
  /** REQUIRED when enabled: Typical fertilizer spend per hectare per season in chosen currency */
  fertilizerCostPerHaLocal?: number;
  /** OPTIONAL: Last season's actual net farm profit (whole farm) to track real YoY profit growth */
  lastSeasonNetProfitLocal?: number;
  /** OPTIONAL: Target annual net farm profit goal (whole farm) to track goal progress */
  targetAnnualProfitLocal?: number;
  /** OPTIONAL: Typical irrigation, pumping & fuel spend per hectare per season */
  irrigationEnergyCostPerHaLocal?: number;
  /** Optional farmer buyer price overrides in chosen currency per tonne */
  customBuyerPricesLocal?: Record<string, number>;
  /** Include regional subsidies / eco-schemes in projection */
  includeSubsidies: boolean;
  updatedAt?: string;
}

export interface FarmerProfile {
  name: string;
  email: string;
  farmName: string;
  photoDataUrl?: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  stateName?: string;
  localityName?: string;
  climateZone: ClimateZone;
  regionLabel: string;
  coordinates: Coordinates;
  boundary: [number, number][];
  areaHectares: number;
  soilType: SoilType;
  slopeOption: SlopeOption;
  slopeDeg: number;
  irrigationType: IrrigationType;
  equipment: string[];
  previousCrops: string[];
  nasaPower: NasaPowerDataset;
  financeInputs?: FarmerFinanceInputs;
}

export interface CropInfo {
  id: string;
  name: string;
  family: 'Cereal' | 'Legume' | 'Oilseed' | 'Cover Crop' | 'Vegetable';
  color: string;
  lightBg: string;
  textColor: string;
  droughtTolerance: 'Low' | 'Moderate' | 'High' | 'Very High';
  nitrogenEffect: number; // positive = fixes N, negative = uses N
  waterNeedMm: number;
  baseYieldTha: number;
  idealTempMin: number;
  idealTempMax: number;
  climates: ClimateZone[];
  soilBenefit: string;
  plainNote: string;
}

export interface UnifiedSeasonStep {
  stepNumber: number; // 1..4
  seasonName: string; // e.g., "Season 1 · Autumn / Winter"
  shortSeason: string; // "Season 1"
  timingLabel: string; // "Oct – May"
  cropId: string;
  cropName: string;
  cropColor: string;
  cropFamily: string;
  stageLabel: string;
  soilRichnessScore: number; // 0..100 increasing over steps
  chemicalReductionPct: number; // % synthetic chemical drop by this step
  moistureRetentionPct: number;
  whatToDo: string;
  soilImprovementNote: string;
  pestBreakNote: string;
}

export interface ScoredRotationStrategy {
  id: string;
  rank: 1 | 2 | 3;
  tierLabel: string; // "Top 1 Strategy", "Top 2 Strategy", "Top 3 Strategy"
  focusTag: string;
  title: string;
  subtitle: string;
  image: string;
  matchScore: number; // 0..100
  highlights: string[];
  steps: UnifiedSeasonStep[];
  aiSuggestions: string[];
  benefits: {
    title: string;
    detail: string;
    metric: string;
  }[];
  expectedOutput: {
    yieldImprovementPct: number;
    chemicalReductionPct: number;
    waterSavingsPct: number;
    soilFertilityGainPct: number;
    sustainabilityScore: number;
    bareDaysPerYear: number;
    plainSummary: string;
  };
}

export interface FarmBeforeAnalysis {
  headline: string;
  soilStatusLabel: string;
  moistureStatusLabel: string;
  slopeStatusLabel: string;
  chemicalRiskLabel: string;
  strengths: string[];
  needsAttention: string[];
}

export interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  year: number;
  month: number; // 1..12
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
  phase: 'past' | 'current' | 'future';
  category: 'planting' | 'harvest' | 'soil' | 'water' | 'rotation' | 'alert';
  title: string;
  description: string;
  cropName?: string;
  completed?: boolean;
  isCustom?: boolean;
}

export interface HistoricalSeasonRecord {
  id: string;
  year: number;
  seasonLabel: string;
  cropId: string;
  cropName: string;
  cropColor: string;
  yieldTha: number;
  soilOrganicMatterPct: number;
  somDeltaPct: number;
  chemicalInputIndex: number; // 100 baseline -> lower is better
  nasaSummary: {
    rainfallMm: number;
    avgTempC: number;
    moistureLabel: string;
    rootMoisturePct: number;
    ndviAvg: number | null;
  };
  soilNotes: string;
  farmerActions: string[];
}

export interface CustomStageSpec {
  cropId: string;
  cropName: string;
  cropFamily: string;
  cropColor: string;
  durationMonths: number;
  whatToDo: string;
  soilImprovementNote: string;
  pestBreakNote: string;
  eventTag?: string;
}

export interface PlanStageOverride {
  cropId?: string;
  cropName?: string;
  cropFamily?: string;
  cropColor?: string;
  durationMonths?: number;
  whatToDo?: string;
  soilImprovementNote?: string;
  pestBreakNote?: string;
  eventTag?: string;
}

export interface PlanCustomization {
  monthShift: number;
  stageOverrides: Record<number, PlanStageOverride>;
  customStages?: CustomStageSpec[];
  customStrategyTitle?: string;
  customStrategyFocus?: string;
  recentNotes: string[];
}

export interface PendingPlanProposal {
  id: string;
  summary: string;
  changeType: 'strategy-switch' | 'custom-plan' | 'stage-edit';
  requiresDoubleConfirm: boolean;
  details: string[];
  previewStages?: { cropName: string; cropFamily: string; durationMonths?: number }[];
  nextSelectedStrategyId?: string;
  nextCustomization?: PlanCustomization | null;
  nextScenario?: 'normal' | 'drought' | 'wet';
  calendarAlert?: {
    title: string;
    description: string;
    category: CalendarEvent['category'];
  };
  status: 'pending' | 'applied' | 'cancelled';
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  planChangeSummary?: string;
  pendingProposal?: PendingPlanProposal;
}

export interface StrategyStageSnapshot {
  cropName: string;
  cropFamily: string;
  cropColor: string;
  durationMonths?: number;
}

export interface StrategyChangeRecord {
  id: string;
  recordedAt: string;
  source: 'rotation-lab' | 'ai-advisor' | 'reset';
  actionType: 'initial-selection' | 'strategy-switch' | 'custom-plan' | 'stage-edit' | 'reset';
  summary: string;
  fromStrategyTitle?: string;
  strategyId: string;
  strategyTitle: string;
  tierLabel: string;
  focusTag: string;
  stages: StrategyStageSnapshot[];
  metrics: {
    yieldImprovementPct: number;
    chemicalReductionPct: number;
    waterSavingsPct: number;
  };
}

export type FarmEditTab = 'location-size' | 'soil-water' | 'crops-gear';

export interface FarmRecord {
  id: string;
  farmName: string;
  countryCode: string;
  countryName: string;
  countryFlag: string;
  stateName?: string;
  localityName?: string;
  climateZone: ClimateZone;
  regionLabel: string;
  coordinates: Coordinates;
  boundary: [number, number][];
  areaHectares: number;
  soilType: SoilType;
  slopeOption: SlopeOption;
  slopeDeg: number;
  irrigationType: IrrigationType;
  equipment: string[];
  previousCrops: string[];
  nasaPower: NasaPowerDataset;
  selectedStrategyId: string | null;
  customCalendarEvents: CalendarEvent[];
  completedEventIds: string[];
  planCustomization?: PlanCustomization;
  strategyHistory?: StrategyChangeRecord[];
  financeInputs?: FarmerFinanceInputs;
}

export interface StoredAccount {
  email: string;
  password: string;
  name: string;
  photoDataUrl?: string;
  farms: FarmRecord[];
  activeFarmId: string;
  // Legacy fields retained as optional for automatic v3 localStorage migration
  profile?: FarmerProfile;
  selectedStrategyId?: string | null;
  customCalendarEvents?: CalendarEvent[];
  completedEventIds?: string[];
  updatedAt: string;
}
