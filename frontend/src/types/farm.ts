export type AppScreen =
  | 'landing'
  | 'auth'
  | 'dashboard'
  | 'history'
  | 'rotation-lab'
  | 'predictions';

export type ZoneId = 'S1' | 'S2' | 'S3' | 'S4';

export type SoilType =
  | 'Loamy'
  | 'Clay-Loam'
  | 'Sandy Loam'
  | 'Clay'
  | 'Silt Loam'
  | 'Calcareous';

export type IrrigationType =
  | 'Precision Drip'
  | 'Center-Pivot Sprinkler'
  | 'Furrow / Surface'
  | 'Rain-Fed + Supplemental';

export type WaterAccessLevel = 'Abundant' | 'Moderate' | 'Seasonal / Limited' | 'Arid / Scarce';

export type StrategyPriority =
  | 'balanced'
  | 'drought-resilient'
  | 'soil-regeneration'
  | 'high-yield';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface NasaBaseline {
  smapSoilMoisturePct: number;
  modisSurfaceTempC: number;
  ndviBaseline: number;
  annualPrecipMm: number;
  solarRadiationKwh: number;
  lastSyncedIso: string;
  satellitePassId: string;
}

export interface FarmerProfile {
  name: string;
  email: string;
  farmName: string;
  regionLabel: string;
  coordinates: Coordinates;
  boundary: [number, number][]; // Array of [lat, lng] forming farm boundary
  areaHectares: number;
  soilType: SoilType;
  irrigationType: IrrigationType;
  waterAccess: WaterAccessLevel;
  equipment: string[];
  previousCrops: string[];
  nasaBaseline: NasaBaseline;
}

export interface CropInfo {
  id: string;
  name: string;
  family: 'Cereal' | 'Legume' | 'Oilseed' | 'Forage / Cover' | 'Horticulture';
  color: string;
  lightBg: string;
  textColor: string;
  droughtTolerance: 'Low' | 'Moderate' | 'High' | 'Very High';
  nitrogenImpactKgHa: number; // positive = fixes N, negative = consumes N
  waterNeedMm: number;
  baseYieldTha: number;
  revenuePerTonUsd: number;
  rootDepthCm: number;
  pestBreakRole: string;
  shortNote: string;
}

export interface ZoneCropAssignment {
  zoneId: ZoneId;
  cropId: string;
  growthStage: string;
  ndvi: number;
  soilMoisturePct: number;
  nitrogenKgHa: number;
  healthScore: number;
  expectedYieldTha: number;
  rationale: string;
}

export interface SeasonRotationStep {
  seasonIndex: number; // 0..3
  seasonLabel: string; // e.g., "Season 1 · Autumn/Winter 2026"
  shortLabel: string; // "S1 · 2026-27"
  focusObjective: string;
  zones: Record<ZoneId, ZoneCropAssignment>;
}

export interface RotationParameters {
  priority: StrategyPriority;
  waterConservationPct: number; // 0..45
  cycleLengthYears: 2 | 3 | 4;
  organicFocus: boolean;
}

export interface RotationStrategy {
  id: string;
  name: string;
  approvedAt: string;
  parameters: RotationParameters;
  seasons: SeasonRotationStep[];
  restorationPillars: {
    title: string;
    metric: string;
    detail: string;
    category: 'nitrogen' | 'pest' | 'water' | 'carbon';
  }[];
  summaryMetrics: {
    projectedYieldGainPct: number;
    waterSavingsPct: number;
    nitrogenGainKgHa: number;
    sustainabilityScore: number;
    soilOrganicMatterGainPct: number;
  };
}

export interface ZoneDiff {
  zoneId: ZoneId;
  fromCropId: string;
  toCropId: string;
  reason: string;
}

export interface ProposedStrategyUpdate {
  id: string;
  source: 'ai' | 'parameters';
  title: string;
  summary: string;
  zoneDiffs: ZoneDiff[];
  metricDeltas: {
    yieldDeltaPct: number;
    waterSavingsDeltaPct: number;
    nitrogenDeltaKgHa: number;
    sustainabilityDelta: number;
  };
  proposedStrategy: RotationStrategy;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  proposalId?: string;
  proposalSnapshot?: ProposedStrategyUpdate;
  proposalStatus?: 'pending' | 'approved' | 'discarded';
}

export interface HistoricalZoneRecord {
  zoneId: ZoneId;
  cropId: string;
  yieldTha: number;
  ndviAvg: number;
  soilNitrogenEnd: number;
  notes: string;
}

export interface HistoricalSeasonRecord {
  id: string;
  year: number;
  seasonLabel: string;
  nasaTelemetry: {
    rainfallMm: number;
    avgSurfaceTempC: number;
    meanNdvi: number;
    droughtAnomaly: string;
    smapAvgMoisturePct: number;
  };
  zones: Record<ZoneId, HistoricalZoneRecord>;
  farmerDecisions: string[];
  avgYieldTha: number;
  soilOrganicMatterPct: number;
  somDeltaPct: number;
  nitrogenBalanceKgHa: number;
}

export interface StrategyApprovalLog {
  id: string;
  timestamp: string;
  title: string;
  source: 'ai' | 'parameters' | 'initial';
  summary: string;
}
