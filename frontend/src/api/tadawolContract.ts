/**
 * Shared Tadawol API Contract (matches contract.json 1:1)
 * Keep request & response field names identical between frontend and backend services.
 */

export type ClimateScenario = 'normal' | 'bad_year';

export interface OptimizationWeights {
  soil: number; // 0..10
  water: number; // 0..10
  erosion: number; // 0..10
  income: number; // 0..10
}

export interface TadawolApiRequest {
  lat: number;
  lon: number;
  years: number;
  use_gee: boolean;
  use_meteomatics?: boolean;
  slope_deg: number | null;
  weights: OptimizationWeights;
  scenario: ClimateScenario;
  replay_year: number | null;
  rain_change_pct: number;
  custom_rotation: string[];
}

export interface ContractKpis {
  soil_health_index: number;
  water_savings_pct: number;
  erosion_reduction_pct: number;
  yield_stability_pct: number;
  expected_yield_gain_pct: number;
  som_gain_pct: number;
  nitrogen_balance_kg_ha: number;
  sustainability_score: number;
}

export interface ContractConfidence {
  overall_score: number;
  level: 'High' | 'Moderate' | 'Low';
  data_source: string;
  gee_enabled: boolean;
  satellite_coverage_pct: number;
  calibration_note: string;
}

export interface ContractRotationOption {
  rank: number;
  name: string;
  sequence: string[];
  composite_score: number;
  soil_score: number;
  water_score: number;
  erosion_score: number;
  income_score: number;
  avg_yield_t_ha: number;
  water_use_mm: number;
  rationale: string;
}

export interface ContractBareFieldClock {
  bare_days_per_year: number;
  baseline_bare_days: number;
  cover_pct: number;
  high_risk_months: string[];
  erosion_risk_level: 'Low' | 'Moderate' | 'Elevated';
  summary: string;
}

export interface ContractSowingWindow {
  primary_crop: string;
  optimal_start: string;
  optimal_end: string;
  soil_moisture_trigger_pct: number;
  surface_temp_window_c: string;
  advisory: string;
}

export interface ContractRiskCalendarMonth {
  month: string;
  drought_risk: number; // 0..100
  erosion_risk: number; // 0..100
  heat_risk: number; // 0..100
  pest_risk: number; // 0..100
  dominant_hazard: string;
}

export interface ContractRiskCalendar {
  scenario: ClimateScenario;
  peak_risk_months: string[];
  months: ContractRiskCalendarMonth[];
}

export interface ContractChecklistItem {
  id: string;
  priority: 'High' | 'Medium' | 'Low';
  timing: string;
  action: string;
  reason: string;
}

export interface TadawolApiResponse {
  region_validated: boolean;
  kpis: ContractKpis;
  confidence: ContractConfidence;
  rotations: ContractRotationOption[];
  bare_field_clock: ContractBareFieldClock;
  sowing_window: ContractSowingWindow;
  risk_calendar: ContractRiskCalendar;
  agronomist_checklist: ContractChecklistItem[];
  caveats: string[];
  meteomatics?: {
    available: boolean;
    source: 'Meteomatics';
    rain_source?: 'NASA POWER';
    error?: string;
    comparison_year?: number;
    water_balance?: {
      months: string[];
      rain_mm: Array<number | null>;
      reference_et_mm: Array<number | null>;
      balance_mm: Array<number | null>;
      drier_than_rain_months: string[];
    };
    most_similar_year?: number | null;
    growing_degree_days?: {
      year: number;
      current: number | null;
      daily: Array<{ date: string; gdd: number }>;
    };
  } | null;
}

export interface TadawolContractEnvelope {
  request: TadawolApiRequest;
  response: TadawolApiResponse;
}

export const DEFAULT_CONTRACT_REQUEST: TadawolApiRequest = {
  lat: 36.73,
  lon: 9.18,
  years: 10,
  use_gee: false,
  use_meteomatics: false,
  slope_deg: null,
  weights: { soil: 7, water: 8, erosion: 5, income: 0 },
  scenario: 'normal',
  replay_year: null,
  rain_change_pct: 0,
  custom_rotation: ['Durum wheat', 'Fava bean', 'Barley + vetch'],
};
