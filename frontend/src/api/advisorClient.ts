import { FarmerProfile, ScoredRotationStrategy } from '../types/farm';

const API_URL =
  (import.meta.env.VITE_TADAWOL_API_URL as string | undefined) ??
  'http://localhost:8000/api/analyze';

const ADVISOR_URL = API_URL.replace(/\/api\/analyze\/?$/, '/api/advisor/chat');

export interface AdvisorHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdvisorResult {
  answer: string;
  provider: string;
  fallback: boolean;
  fallback_reason: string | null;
}

export async function askAdvisor(
  message: string,
  profile: FarmerProfile,
  activeStrategy: ScoredRotationStrategy,
  history: AdvisorHistoryItem[]
): Promise<AdvisorResult> {
  const response = await fetch(ADVISOR_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message.trim(),
      farm_context: {
        farm_name: profile.farmName,
        country: profile.countryName,
        coordinates: profile.coordinates,
        soil_type: profile.soilType,
        slope_deg: profile.slopeDeg,
        irrigation: profile.irrigationType,
        previous_crops: profile.previousCrops,
        active_rotation: activeStrategy.steps.map((step) => step.cropName).join(' → '),
        nasa: {
          source: profile.nasaPower.source,
          annual_rain_mm: profile.nasaPower.annualRainMm,
          root_moisture_pct: profile.nasaPower.rootMoisturePct,
          recent_rain_14d_mm: profile.nasaPower.recentRain14dMm,
          moisture_status: profile.nasaPower.moistureStatus,
          heavy_rain_days_per_year: profile.nasaPower.heavyRainDaysPerYear,
        },
      },
      conversation: history.slice(-8),
    }),
  });
  if (!response.ok) {
    throw new Error(`Advisor API returned HTTP ${response.status}`);
  }
  return (await response.json()) as AdvisorResult;
}
