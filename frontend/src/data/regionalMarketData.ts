import { FarmerProfile, ScoredRotationStrategy, UnifiedSeasonStep } from '../types/farm';
import { GLOBAL_CROPS } from './decisionEngine';
import { COUNTRY_SUBSIDY_PROGRAMS } from './countrySubsidies';

export type MarketDemandLevel = 'High' | 'Steady' | 'Growing' | 'Niche';
export type PriceRiskLevel = 'Low' | 'Moderate' | 'Volatile';

export interface RegionalCropPriceQuote {
  cropId: string;
  cropName: string;
  family: string;
  /** Farmgate or regional wholesale reference price in USD per metric tonne (2025-2026) */
  priceUsdPerTonne: number;
  /** Year-over-year price trend (%) */
  trendYoYPct: number;
  demand: MarketDemandLevel;
  risk: PriceRiskLevel;
  buyerChannel: string;
  note: string;
  /** Distinguishes directly published 2025-2026 agency/World Bank quotes from derived regional estimates */
  dataBasis: 'Verified 2026' | 'Regional Est.';
  sourceShort: string;
}

export interface RegionalSubsidyProgram {
  title: string;
  agency: string;
  benefitSummary: string;
  /** Estimated rotation / eco-scheme cash bonus per hectare in USD (0 if price-floor or credit only) */
  estimatedUsdPerHa: number;
  category: 'Price Floor' | 'Rotation Bonus' | 'Input Subsidy' | 'Irrigation Grant';
  /** Official government ministry or national agricultural agency URL */
  officialUrl?: string;
}

export interface RegionalInputBenchmarks {
  ureaUsdPerTonne: number;
  dapUsdPerTonne: number;
  dieselUsdPerLiter: number;
  seedBaseUsdPerHa: number;
  machineryLaborUsdPerHa: number;
  irrigationEnergyUsdPerHa: number;
  fertilizerSubsidyNote: string;
}

export interface RegionalMarketProfile {
  regionId: string;
  regionLabel: string;
  currencyCode: string;
  currencySymbol: string;
  /** Local currency units per 1 USD (2026 reference) */
  fxPerUsd: number;
  /** Standard local weight unit label farmers recognize (e.g. 'quintal (100 kg)' or 'tonne') */
  localUnitHint: string;
  dataUpdatedLabel: string;
  marketHeadline: string;
  marketTakeaway: string;
  inputs: RegionalInputBenchmarks;
  cropPrices: Record<string, RegionalCropPriceQuote>;
  subsidies: RegionalSubsidyProgram[];
  sources: { name: string; period: string; detail: string }[];
}

export interface SeasonFinancialRow {
  stepNumber: number;
  seasonName: string;
  cropId: string;
  cropName: string;
  cropFamily: string;
  cropColor: string;
  expectedYieldTha: number;
  priceUsdPerTonne: number;
  grossRevenueUsdPerHa: number;
  seedCostUsdPerHa: number;
  fertilizerCostUsdPerHa: number;
  fertilizerSavedUsdPerHa: number;
  waterCostUsdPerHa: number;
  laborMachineryUsdPerHa: number;
  totalCostUsdPerHa: number;
  subsidyUsdPerHa: number;
  netProfitUsdPerHa: number;
  breakEvenYieldTha: number;
  demand: MarketDemandLevel;
  risk: PriceRiskLevel;
}

export interface StrategyFinancialSummary {
  strategyId: string;
  strategyTitle: string;
  annualRevenueUsdPerHa: number;
  annualCostUsdPerHa: number;
  annualFarmCostUsd: number;
  annualSubsidyUsdPerHa: number;
  annualNetProfitUsdPerHa: number;
  annualFarmNetProfitUsd: number;
  baselineAnnualNetProfitUsdPerHa: number;
  extraAnnualProfitUsdPerHa: number;
  extraAnnualFarmProfitUsd: number;
  fiveYearExtraFarmProfitUsd: number;
  annualFertilizerSavedUsdPerHa: number;
  annualFarmFertilizerSavedUsd: number;
  /** Optional capacity / tracking metrics derived from farmer's entered farm finance profile */
  budgetCapacityUsd?: number;
  budgetUsagePct?: number;
  withinBudget?: boolean;
  budgetGapUsd?: number;
  lastSeasonProfitUsd?: number;
  vsLastSeasonProfitUsd?: number;
  targetProfitUsd?: number;
  targetGoalPct?: number;
  profitMarginPct: number;
  roiPct: number;
  avgBreakEvenRatioPct: number;
  marketFitScore: number;
  cashFlowRisk: 'Low' | 'Moderate' | 'High';
  plainVerdict: string;
  seasonRows: SeasonFinancialRow[];
}

interface CountryCurrencySpec {
  currencyCode: string;
  currencySymbol: string;
  fxPerUsd: number;
  localUnitHint: string;
  regionKey: string;
}

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  fxPerUsd: number;
  countriesHint: string;
}

/**
 * Complete currency catalog covering all 42+ covered countries (+ major global trade currencies).
 * Defaults automatically to the farmer's country currency, changeable anytime.
 */
export const ALL_FARM_CURRENCIES: CurrencyOption[] = [
  { code: 'TND', symbol: 'TND', name: 'Tunisian Dinar', flag: '🇹🇳', fxPerUsd: 3.08, countriesHint: 'Tunisia' },
  { code: 'MAD', symbol: 'MAD', name: 'Moroccan Dirham', flag: '🇲🇦', fxPerUsd: 9.85, countriesHint: 'Morocco' },
  { code: 'DZD', symbol: 'DZD', name: 'Algerian Dinar', flag: '🇩🇿', fxPerUsd: 134.5, countriesHint: 'Algeria' },
  { code: 'EGP', symbol: 'EGP', name: 'Egyptian Pound', flag: '🇪🇬', fxPerUsd: 49.2, countriesHint: 'Egypt' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺', fxPerUsd: 0.92, countriesHint: 'France, Spain, Italy, Germany, Netherlands, Portugal, Greece' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸', fxPerUsd: 1.0, countriesHint: 'United States, Lebanon, Global Trade' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧', fxPerUsd: 0.78, countriesHint: 'United Kingdom' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦', fxPerUsd: 1.38, countriesHint: 'Canada' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺', fxPerUsd: 1.52, countriesHint: 'Australia' },
  { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', flag: '🇳🇿', fxPerUsd: 1.66, countriesHint: 'New Zealand' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭', fxPerUsd: 0.88, countriesHint: 'Switzerland' },
  { code: 'PLN', symbol: 'zł', name: 'Polish Zloty', flag: '🇵🇱', fxPerUsd: 3.98, countriesHint: 'Poland' },
  { code: 'RON', symbol: 'lei', name: 'Romanian Leu', flag: '🇷🇴', fxPerUsd: 4.58, countriesHint: 'Romania' },
  { code: 'UAH', symbol: '₴', name: 'Ukrainian Hryvnia', flag: '🇺🇦', fxPerUsd: 41.5, countriesHint: 'Ukraine' },
  { code: 'TRY', symbol: '₺', name: 'Turkish Lira', flag: '🇹🇷', fxPerUsd: 36.4, countriesHint: 'Turkey' },
  { code: 'JOD', symbol: 'JOD', name: 'Jordanian Dinar', flag: '🇯🇴', fxPerUsd: 0.71, countriesHint: 'Jordan' },
  { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', flag: '🇸🇦', fxPerUsd: 3.75, countriesHint: 'Saudi Arabia' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪', fxPerUsd: 3.67, countriesHint: 'United Arab Emirates' },
  { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', flag: '🇶🇦', fxPerUsd: 3.64, countriesHint: 'Qatar' },
  { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', flag: '🇰🇼', fxPerUsd: 0.31, countriesHint: 'Kuwait' },
  { code: 'MXN', symbol: 'MX$', name: 'Mexican Peso', flag: '🇲🇽', fxPerUsd: 19.6, countriesHint: 'Mexico' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷', fxPerUsd: 5.65, countriesHint: 'Brazil' },
  { code: 'ARS', symbol: 'ARS', name: 'Argentine Peso', flag: '🇦🇷', fxPerUsd: 1080, countriesHint: 'Argentina' },
  { code: 'COP', symbol: 'COP', name: 'Colombian Peso', flag: '🇨🇴', fxPerUsd: 4180, countriesHint: 'Colombia' },
  { code: 'PEN', symbol: 'S/', name: 'Peruvian Sol', flag: '🇵🇪', fxPerUsd: 3.74, countriesHint: 'Peru' },
  { code: 'CLP', symbol: 'CLP', name: 'Chilean Peso', flag: '🇨🇱', fxPerUsd: 945, countriesHint: 'Chile' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳', fxPerUsd: 84.5, countriesHint: 'India' },
  { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee', flag: '🇵🇰', fxPerUsd: 278.5, countriesHint: 'Pakistan' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳', fxPerUsd: 7.22, countriesHint: 'China' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵', fxPerUsd: 152, countriesHint: 'Japan' },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', flag: '🇻🇳', fxPerUsd: 25300, countriesHint: 'Vietnam' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', flag: '🇮🇩', fxPerUsd: 15800, countriesHint: 'Indonesia' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', flag: '🇹🇭', fxPerUsd: 34.6, countriesHint: 'Thailand' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪', fxPerUsd: 129.5, countriesHint: 'Kenya' },
  { code: 'ETB', symbol: 'ETB', name: 'Ethiopian Birr', flag: '🇪🇹', fxPerUsd: 124.0, countriesHint: 'Ethiopia' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬', fxPerUsd: 1580, countriesHint: 'Nigeria' },
  { code: 'GHS', symbol: 'GH₵', name: 'Ghanaian Cedi', flag: '🇬🇭', fxPerUsd: 14.8, countriesHint: 'Ghana' },
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇸🇳', fxPerUsd: 605, countriesHint: 'Senegal, West Africa' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦', fxPerUsd: 18.1, countriesHint: 'South Africa' },
];

const COUNTRY_CURRENCY_MAP: Record<string, CountryCurrencySpec> = {
  TN: { currencyCode: 'TND', currencySymbol: 'TND', fxPerUsd: 3.08, localUnitHint: 'quintal (100 kg) & tonne', regionKey: 'TN' },
  MA: { currencyCode: 'MAD', currencySymbol: 'MAD', fxPerUsd: 9.85, localUnitHint: 'quintal (100 kg) & tonne', regionKey: 'MA' },
  DZ: { currencyCode: 'DZD', currencySymbol: 'DZD', fxPerUsd: 134.5, localUnitHint: 'quintal (100 kg) & tonne', regionKey: 'DZ' },
  EG: { currencyCode: 'EGP', currencySymbol: 'EGP', fxPerUsd: 49.2, localUnitHint: 'ardeb (150 kg) & tonne', regionKey: 'EG' },
  JO: { currencyCode: 'JOD', currencySymbol: 'JOD', fxPerUsd: 0.71, localUnitHint: 'tonne', regionKey: 'MENA_LEVANT' },
  SA: { currencyCode: 'SAR', currencySymbol: 'SAR', fxPerUsd: 3.75, localUnitHint: 'tonne', regionKey: 'MENA_LEVANT' },
  LB: { currencyCode: 'USD', currencySymbol: '$', fxPerUsd: 1.0, localUnitHint: 'tonne', regionKey: 'MENA_LEVANT' },
  TR: { currencyCode: 'TRY', currencySymbol: '₺', fxPerUsd: 36.4, localUnitHint: 'tonne', regionKey: 'TR' },

  FR: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_WEST' },
  DE: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_WEST' },
  NL: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_WEST' },
  ES: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_MED' },
  IT: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_MED' },
  PT: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_MED' },
  GR: { currencyCode: 'EUR', currencySymbol: '€', fxPerUsd: 0.92, localUnitHint: 'tonne', regionKey: 'EU_MED' },
  PL: { currencyCode: 'PLN', currencySymbol: 'zł', fxPerUsd: 3.98, localUnitHint: 'tonne', regionKey: 'EU_EAST' },
  RO: { currencyCode: 'RON', currencySymbol: 'lei', fxPerUsd: 4.58, localUnitHint: 'tonne', regionKey: 'EU_EAST' },
  UA: { currencyCode: 'UAH', currencySymbol: '₴', fxPerUsd: 41.5, localUnitHint: 'tonne', regionKey: 'EU_EAST' },
  GB: { currencyCode: 'GBP', currencySymbol: '£', fxPerUsd: 0.78, localUnitHint: 'tonne', regionKey: 'EU_WEST' },

  US: { currencyCode: 'USD', currencySymbol: '$', fxPerUsd: 1.0, localUnitHint: 'bushel / cwt & tonne', regionKey: 'US_NA' },
  CA: { currencyCode: 'CAD', currencySymbol: 'C$', fxPerUsd: 1.38, localUnitHint: 'tonne', regionKey: 'US_NA' },
  MX: { currencyCode: 'MXN', currencySymbol: 'MX$', fxPerUsd: 19.6, localUnitHint: 'tonne', regionKey: 'LATAM' },
  BR: { currencyCode: 'BRL', currencySymbol: 'R$', fxPerUsd: 5.65, localUnitHint: '60 kg sack & tonne', regionKey: 'LATAM' },
  AR: { currencyCode: 'USD', currencySymbol: '$', fxPerUsd: 1.0, localUnitHint: 'tonne (USD parity)', regionKey: 'LATAM' },
  CO: { currencyCode: 'COP', currencySymbol: 'COP ', fxPerUsd: 4180, localUnitHint: 'tonne', regionKey: 'LATAM' },
  PE: { currencyCode: 'PEN', currencySymbol: 'S/', fxPerUsd: 3.74, localUnitHint: 'tonne', regionKey: 'LATAM' },
  CL: { currencyCode: 'CLP', currencySymbol: 'CLP ', fxPerUsd: 945, localUnitHint: 'quintal & tonne', regionKey: 'LATAM' },

  IN: { currencyCode: 'INR', currencySymbol: '₹', fxPerUsd: 84.5, localUnitHint: 'quintal (100 kg) & tonne', regionKey: 'SOUTH_ASIA' },
  PK: { currencyCode: 'PKR', currencySymbol: 'Rs', fxPerUsd: 278.5, localUnitHint: '40 kg maund & tonne', regionKey: 'SOUTH_ASIA' },
  CN: { currencyCode: 'CNY', currencySymbol: '¥', fxPerUsd: 7.22, localUnitHint: 'tonne', regionKey: 'EAST_ASIA' },
  JP: { currencyCode: 'JPY', currencySymbol: '¥', fxPerUsd: 152, localUnitHint: '60 kg bag & tonne', regionKey: 'EAST_ASIA' },
  VN: { currencyCode: 'VND', currencySymbol: '₫', fxPerUsd: 25300, localUnitHint: 'tonne', regionKey: 'EAST_ASIA' },
  ID: { currencyCode: 'IDR', currencySymbol: 'Rp', fxPerUsd: 15800, localUnitHint: 'tonne', regionKey: 'EAST_ASIA' },
  TH: { currencyCode: 'THB', currencySymbol: '฿', fxPerUsd: 34.6, localUnitHint: 'tonne', regionKey: 'EAST_ASIA' },
  AU: { currencyCode: 'AUD', currencySymbol: 'A$', fxPerUsd: 1.52, localUnitHint: 'tonne', regionKey: 'OCEANIA' },
  NZ: { currencyCode: 'NZD', currencySymbol: 'NZ$', fxPerUsd: 1.66, localUnitHint: 'tonne', regionKey: 'OCEANIA' },

  KE: { currencyCode: 'KES', currencySymbol: 'KSh', fxPerUsd: 129.5, localUnitHint: '90 kg bag & tonne', regionKey: 'EAST_AFRICA' },
  ET: { currencyCode: 'ETB', currencySymbol: 'ETB ', fxPerUsd: 124.0, localUnitHint: 'quintal (100 kg) & tonne', regionKey: 'EAST_AFRICA' },
  NG: { currencyCode: 'NGN', currencySymbol: '₦', fxPerUsd: 1580, localUnitHint: '100 kg bag & tonne', regionKey: 'WEST_AFRICA' },
  GH: { currencyCode: 'GHS', currencySymbol: 'GH₵', fxPerUsd: 14.8, localUnitHint: '100 kg bag & tonne', regionKey: 'WEST_AFRICA' },
  SN: { currencyCode: 'XOF', currencySymbol: 'CFA ', fxPerUsd: 605, localUnitHint: 'tonne', regionKey: 'WEST_AFRICA' },
  ZA: { currencyCode: 'ZAR', currencySymbol: 'R', fxPerUsd: 18.1, localUnitHint: 'tonne (SAFEX)', regionKey: 'SOUTH_AFRICA' },
};

/**
 * Helper to construct a complete 12-crop price table from regional anchor quotes
 * (World Bank Nov 2026 Pink Sheet + USDA FAS/NASS 2026 + EC/TESEO Nov 2026 + Regional Agencies)
 */
function buildCropQuoteMap(overrides: Partial<Record<string, Partial<RegionalCropPriceQuote>>>): Record<string, RegionalCropPriceQuote> {
  const globalDefaults: Record<string, Omit<RegionalCropPriceQuote, 'cropId' | 'cropName' | 'family'>> = {
    wheat: {
      priceUsdPerTonne: 286,
      trendYoYPct: -4.2,
      demand: 'High',
      risk: 'Low',
      buyerChannel: 'Regional grain mills & state silos',
      note: 'World Bank US HRW wheat benchmark ($286/t, 2026).',
      dataBasis: 'Verified 2026',
      sourceShort: 'World Bank 2026',
    },
    fava_beans: {
      priceUsdPerTonne: 640,
      trendYoYPct: +5.4,
      demand: 'Steady',
      risk: 'Moderate',
      buyerChannel: 'Local pulse wholesalers',
      note: 'Regional pulse estimate; fixes nitrogen for next cereal.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    chickpeas: {
      priceUsdPerTonne: 720,
      trendYoYPct: +4.5,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Pulse traders & domestic packers',
      note: 'Anchored to USDA/regional pulse trade (~$705-$735/t).',
      dataBasis: 'Regional Est.',
      sourceShort: 'USDA / Regional Est.',
    },
    sorghum: {
      priceUsdPerTonne: 225,
      trendYoYPct: +1.5,
      demand: 'Growing',
      risk: 'Moderate',
      buyerChannel: 'Livestock feed mills',
      note: 'Regional feed-grain benchmark.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    sunflower: {
      priceUsdPerTonne: 572,
      trendYoYPct: +4.1,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Oilseed crushers',
      note: 'Anchored to TESEO EU sunflower (€526/t, Nov 2026).',
      dataBasis: 'Verified 2026',
      sourceShort: 'TESEO Nov 2026',
    },
    clover_cover: {
      priceUsdPerTonne: 120,
      trendYoYPct: +3.0,
      demand: 'Steady',
      risk: 'Low',
      buyerChannel: 'Baled forage / green manure',
      note: 'Forage estimate plus next-season N savings.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    maize: {
      priceUsdPerTonne: 227,
      trendYoYPct: +2.8,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Feed mills & grain elevators',
      note: 'World Bank maize benchmark ($226.5/t, Nov 2026).',
      dataBasis: 'Verified 2026',
      sourceShort: 'World Bank Nov 2026',
    },
    soybeans: {
      priceUsdPerTonne: 515,
      trendYoYPct: +7.2,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Oilseed crushers & feed mills',
      note: 'World Bank soybean benchmark ($515/t, Nov 2026).',
      dataBasis: 'Verified 2026',
      sourceShort: 'World Bank Nov 2026',
    },
    cowpeas: {
      priceUsdPerTonne: 720,
      trendYoYPct: +4.9,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Urban grain markets',
      note: 'Regional dry-pulse estimate.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    barley_vetch: {
      priceUsdPerTonne: 245,
      trendYoYPct: +2.2,
      demand: 'High',
      risk: 'Low',
      buyerChannel: 'Livestock & barley cooperatives',
      note: 'Regional feed barley & forage mix.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    vegetables: {
      priceUsdPerTonne: 135,
      trendYoYPct: +6.5,
      demand: 'High',
      risk: 'Volatile',
      buyerChannel: 'Wholesale & processing canneries',
      note: 'Farmgate processing/wholesale produce estimate.',
      dataBasis: 'Regional Est.',
      sourceShort: 'Regional Est.',
    },
    canola: {
      priceUsdPerTonne: 536,
      trendYoYPct: +3.6,
      demand: 'High',
      risk: 'Moderate',
      buyerChannel: 'Oilseed & biodiesel crushers',
      note: 'Anchored to EU rapeseed (€492-500/t, Nov 2026).',
      dataBasis: 'Verified 2026',
      sourceShort: 'TESEO Nov 2026',
    },
  };

  const result: Record<string, RegionalCropPriceQuote> = {};
  for (const [cropId, crop] of Object.entries(GLOBAL_CROPS)) {
    const base = globalDefaults[cropId];
    const ov = overrides[cropId] ?? {};
    result[cropId] = {
      cropId,
      cropName: crop.name,
      family: crop.family,
      priceUsdPerTonne: ov.priceUsdPerTonne ?? base?.priceUsdPerTonne ?? 300,
      trendYoYPct: ov.trendYoYPct ?? base?.trendYoYPct ?? 2.0,
      demand: ov.demand ?? base?.demand ?? 'Steady',
      risk: ov.risk ?? base?.risk ?? 'Moderate',
      buyerChannel: ov.buyerChannel ?? base?.buyerChannel ?? 'Local agricultural cooperatives',
      note: ov.note ?? base?.note ?? crop.plainNote,
      dataBasis: ov.dataBasis ?? base?.dataBasis ?? 'Regional Est.',
      sourceShort: ov.sourceShort ?? base?.sourceShort ?? 'Regional Est.',
    };
  }
  return result;
}

const WORLD_BANK_SOURCE = {
  name: 'World Bank Commodity Markets Pink Sheet',
  period: 'Oct-Nov 2026',
  detail: 'Global benchmarks: DAP $803/t, Urea $408/t (Q2 peak $694/t), Soybeans $515/t, Maize $226.5/t.',
};

function buildRegionalProfile(countryCode: string, countryName: string): RegionalMarketProfile {
  const spec = COUNTRY_CURRENCY_MAP[countryCode] ?? {
    currencyCode: 'USD',
    currencySymbol: '$',
    fxPerUsd: 1.0,
    localUnitHint: 'tonne',
    regionKey: 'GLOBAL',
  };

  switch (spec.regionKey) {
    case 'TN':
      return {
        regionId: 'TN',
        regionLabel: 'Tunisia National & Medjerda / Cap Bon Markets',
        ...spec,
        dataUpdatedLabel: 'Updated Q4 2026 (USDA FAS / ODC / World Bank)',
        marketHeadline: 'Guaranteed Durum Wheat Price Floor + High Pulse & Forage Margins',
        marketTakeaway:
          'Tunisia guarantees domestic durum wheat at 1,300-1,400 TND/t (~$438-455/t) and barley at 800-900 TND/t via Office des Cereales. With global DAP above $800/t, rotating wheat with fava beans, chickpeas, or barley-vetch cuts synthetic fertilizer bills while locking in strong local demand.',
        inputs: {
          ureaUsdPerTonne: 435,
          dapUsdPerTonne: 760,
          dieselUsdPerLiter: 0.72,
          seedBaseUsdPerHa: 125,
          machineryLaborUsdPerHa: 235,
          irrigationEnergyUsdPerHa: 155,
          fertilizerSubsidyNote:
            'State-backed cereal input allocations exist through cooperatives, but private-market DAP and ammonitrate remain costly in dry years.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: 442,
            trendYoYPct: +3.8,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'Office des Cereales (ODC)',
            note: '1,300-1,400 TND/t durum floor (MY 25/26-26/27).',
            dataBasis: 'Verified 2026',
            sourceShort: 'ODC / USDA FAS 2026',
          },
          fava_beans: {
            priceUsdPerTonne: 810,
            trendYoYPct: +7.4,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Wholesale souks & cooperatives',
            note: 'Local pulse benchmark (~2,500 TND/t).',
            dataBasis: 'Regional Est.',
            sourceShort: 'Regional Est.',
          },
          chickpeas: {
            priceUsdPerTonne: 1080,
            trendYoYPct: +8.2,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Pulse packers & domestic retail',
            note: 'Dryland cash pulse (~3,300 TND/t).',
            dataBasis: 'Regional Est.',
            sourceShort: 'Regional Est.',
          },
          barley_vetch: {
            priceUsdPerTonne: 285,
            trendYoYPct: +4.5,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'ODC barley & livestock buyers',
            note: 'ODC barley floor 800-900 TND/t.',
            dataBasis: 'Verified 2026',
            sourceShort: 'ODC / USDA FAS 2026',
          },
          sunflower: {
            priceUsdPerTonne: 580,
            trendYoYPct: +5.1,
            demand: 'Growing',
            risk: 'Moderate',
            buyerChannel: 'Local edible-oil processors & roasting markets',
            note: 'Strong break-crop opportunity with lower water demand than summer vegetables.',
          },
          vegetables: {
            priceUsdPerTonne: 122,
            trendYoYPct: +7.4,
            demand: 'High',
            risk: 'Volatile',
            buyerChannel: 'Cap Bon tomato canneries & Bir El Kasaa wholesale market',
            note: 'Open-field processing tomato/pepper farmgate (~375 TND/t); strong cash crop when paired with drip irrigation grants.',
          },
          clover_cover: {
            priceUsdPerTonne: 115,
            trendYoYPct: +4.5,
            demand: 'Steady',
            risk: 'Low',
            buyerChannel: 'Baled bersim/forage sales & on-farm green manure',
            note: 'Modest baled forage income (~350 TND/t) plus major nitrogen and topsoil protection for the next grain crop.',
          },
        }),
        subsidies: [
          {
            title: 'Office des Cereales Guaranteed Farmgate Price',
            agency: 'ODC / Ministry of Agriculture',
            benefitSummary: 'Fixed collection price for domestic durum (1,300-1,400 TND/t), soft wheat (1,000 TND/t), and barley (800-900 TND/t).',
            estimatedUsdPerHa: 0,
            category: 'Price Floor',
          },
          {
            title: 'Water-Saving Drip Irrigation Grant (API / FOSDAP)',
            agency: 'APIA / CRDA',
            benefitSummary: '50%-60% investment grant on drip-irrigation equipment for small and medium farms.',
            estimatedUsdPerHa: 45,
            category: 'Irrigation Grant',
          },
          {
            title: 'Certified Cereal & Legume Seed Support',
            agency: 'Ministry of Agriculture / COSEM',
            benefitSummary: 'Subsidized certified durum, barley, and legume seed allocations to lift yields and cut disease.',
            estimatedUsdPerHa: 35,
            category: 'Input Subsidy',
          },
        ],
        sources: [
          {
            name: 'USDA FAS Tunisia Grain & Feed Annual (TS2026-0004)',
            period: 'Apr 2026',
            detail: 'Verified MY 2025/26-26/27 Tunisia durum (1,300-1,400 TND/t), soft wheat (1,000 TND/t), barley (800-900 TND/t).',
          },
          {
            name: 'Tunisia ODC Tenders & Ministry of Agriculture',
            period: '2025-2026',
            detail: 'Import parity benchmarks ($319.7/t durum C&F, $256.8/t soft wheat C&F) and domestic collection data.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    case 'MA':
      return {
        regionId: 'MA',
        regionLabel: 'Morocco (ONICL & Generation Green Markets)',
        ...spec,
        dataUpdatedLabel: 'Updated Q4 2026 (ONICL / World Bank)',
        marketHeadline: 'ONICL Soft Wheat Floor + High-Value Legume & Drip Grants',
        marketTakeaway:
          'ONICL sets soft wheat reference pricing at 258.8-270 MAD/quintal (~$263-274/t) while chickpeas and fava beans command strong premiums in Casablanca and Meknes markets.',
        inputs: {
          ureaUsdPerTonne: 445,
          dapUsdPerTonne: 720,
          dieselUsdPerLiter: 1.18,
          seedBaseUsdPerHa: 120,
          machineryLaborUsdPerHa: 245,
          irrigationEnergyUsdPerHa: 170,
          fertilizerSubsidyNote: 'OCP domestic fertilizer supply stabilizes phosphate access compared to global spot spikes.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: 274,
            trendYoYPct: +2.1,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'ONICL licensed mills',
            note: '258.8-270 MAD/q soft wheat floor.',
            dataBasis: 'Verified 2026',
            sourceShort: 'ONICL 2026',
          },
          chickpeas: {
            priceUsdPerTonne: 1020,
            trendYoYPct: +7.1,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Regional legume cooperatives & domestic food wholesalers',
            note: 'Low-water cash crop ideal for Meknes-Fes and Chaouia rotations.',
          },
          fava_beans: {
            priceUsdPerTonne: 780,
            trendYoYPct: +6.0,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Domestic souks & pulse cooperatives',
            note: 'Core rotation legume that restores nitrogen after cereals.',
          },
          barley_vetch: {
            priceUsdPerTonne: 268,
            trendYoYPct: +3.4,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'Livestock feed markets & rural cooperatives',
            note: 'Strong forage demand during low-rainfall springs.',
          },
        }),
        subsidies: [
          {
            title: 'ONICL Domestic Wheat Marketing Window & Reference Price',
            agency: 'ONICL / Ministry of Agriculture',
            benefitSummary: 'Seasonal import pause during local harvest plus 258.8-270 MAD/q soft wheat benchmark.',
            estimatedUsdPerHa: 0,
            category: 'Price Floor',
          },
          {
            title: 'Generation Green Drip Irrigation & Direct-Seed Grant',
            agency: 'FDA (Agricultural Development Fund)',
            benefitSummary: 'Substantial capital grants for localized drip irrigation, no-till drills, and certified seeds.',
            estimatedUsdPerHa: 65,
            category: 'Irrigation Grant',
          },
        ],
        sources: [
          {
            name: 'Morocco ONICL MY 2025/26-26/27 Grain Decisions',
            period: 'Jul-Sep 2026',
            detail: 'Soft wheat mill price 258.8 MAD/q, import subsidy benchmark 20.80 MAD/q.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    case 'EG':
      return {
        regionId: 'EG',
        regionLabel: 'Egypt (Nile Delta & Upper Egypt Procurement)',
        ...spec,
        dataUpdatedLabel: 'Updated Nov 2026 (Ministry of Agriculture / World Bank)',
        marketHeadline: 'Raised 2026 Wheat Procurement (2,500 EGP/Ardeb) + Subsidized Fertilizer',
        marketTakeaway:
          'Egypt raised its 2026 domestic wheat procurement price to EGP 2,500/ardeb (~EGP 16,700/t, ~$339/t) and maintains subsidized cooperative fertilizer around EGP 4,500/t, keeping grain-legume rotations strongly cash positive.',
        inputs: {
          ureaUsdPerTonne: 185,
          dapUsdPerTonne: 590,
          dieselUsdPerLiter: 0.32,
          seedBaseUsdPerHa: 115,
          machineryLaborUsdPerHa: 210,
          irrigationEnergyUsdPerHa: 110,
          fertilizerSubsidyNote:
            'Agricultural cooperatives supply subsidized nitrogen fertilizer (~EGP 4,500/t, ~$92/t) for registered quota areas; open market prices are higher.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: 339,
            trendYoYPct: +11.2,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'State Supply Authority silos',
            note: 'EGP 2,500/ardeb (~16,700 EGP/t) Nov 2026.',
            dataBasis: 'Verified 2026',
            sourceShort: 'Egypt MinAg Nov 2026',
          },
          fava_beans: {
            priceUsdPerTonne: 860,
            trendYoYPct: +6.5,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Domestic fava bean (foul) processors & wholesale markets',
            note: 'Egypt is a structural fava bean importer, creating reliable local buyer demand.',
          },
          maize: {
            priceUsdPerTonne: 255,
            trendYoYPct: +3.8,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Poultry feed mills & Delta grain traders',
            note: 'Strong year-round feed demand; benefits from winter legume nitrogen carryover.',
          },
          vegetables: {
            priceUsdPerTonne: 118,
            trendYoYPct: +6.5,
            demand: 'High',
            risk: 'Volatile',
            buyerChannel: 'Obour Wholesale Market, Delta canneries & packhouses',
            note: 'Farmgate open-field produce benchmark; strong return in irrigated Delta rotations when paired with pest-breaking cover crops.',
          },
        }),
        subsidies: [
          {
            title: '2026 State Wheat Procurement Guarantee',
            agency: 'Ministry of Agriculture & Supply',
            benefitSummary: 'Guaranteed EGP 2,500/ardeb (~EGP 16,700/t) purchase price across 11M tonne domestic harvest.',
            estimatedUsdPerHa: 0,
            category: 'Price Floor',
          },
          {
            title: 'Cooperative Subsidized Fertilizer Program',
            agency: 'Agricultural Cooperative Societies',
            benefitSummary: 'EGP 35B+ national subsidy holding quota urea near EGP 4,500/t vs $450+ global rates.',
            estimatedUsdPerHa: 85,
            category: 'Input Subsidy',
          },
        ],
        sources: [
          {
            name: 'Egypt Ministry of Agriculture Senate Briefing',
            period: 'Nov 10-13, 2026',
            detail: '2026 wheat procurement EGP 2,500/ardeb (~16,700 EGP/t), 11M t output, subsidized fertilizer EGP 4,500/t.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    case 'EU_MED':
    case 'EU_WEST':
    case 'EU_EAST': {
      const isMed = spec.regionKey === 'EU_MED';
      const isEast = spec.regionKey === 'EU_EAST';
      return {
        regionId: spec.regionKey,
        regionLabel: isMed
          ? `${countryName} (EU-27 Mediterranean Agri-Food Market)`
          : isEast
            ? `${countryName} (Central & Eastern Europe Grain & Oilseed Market)`
            : `${countryName} (EU-27 / Western Europe Cereal & Oilseed Market)`,
        ...spec,
        dataUpdatedLabel: 'Updated Nov 2026 (EU Market Group / TESEO / World Bank)',
        marketHeadline: 'Oilseeds & Legumes Outperform Wheat + CAP Eco-Scheme Rotation Bonuses',
        marketTakeaway:
          'With EU soft wheat trading near €184-209/t while rapeseed (€492-570/t) and sunflower (€526/t) hold 2.5x price ratios, diversifying rotations unlocks higher crop margins plus CAP Eco-Scheme payments (€55-110/ha).',
        inputs: {
          ureaUsdPerTonne: isEast ? 430 : 465,
          dapUsdPerTonne: isEast ? 790 : 830,
          dieselUsdPerLiter: isEast ? 1.48 : 1.72,
          seedBaseUsdPerHa: isEast ? 145 : 185,
          machineryLaborUsdPerHa: isEast ? 290 : 430,
          irrigationEnergyUsdPerHa: isMed ? 195 : 120,
          fertilizerSubsidyNote:
            'No direct synthetic fertilizer subsidy; high EU nitrogen/DAP costs make legume N-fixation and CAP eco-schemes key profit drivers.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: isMed ? 292 : isEast ? 205 : 218,
            trendYoYPct: -14.6,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: isMed ? 'Durum mills' : 'Grain elevators',
            note: isMed ? 'EU durum €263-275/t.' : 'EU milling wheat €184-209/t.',
            dataBasis: 'Verified 2026',
            sourceShort: 'EC Cereals 2026',
          },
          canola: {
            priceUsdPerTonne: 548,
            trendYoYPct: +2.2,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'EU oilseed crushers',
            note: 'EU rapeseed €492-570/t (Nov 2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'TESEO Nov 2026',
          },
          sunflower: {
            priceUsdPerTonne: 572,
            trendYoYPct: +2.4,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'EU oilseed crushers',
            note: 'EU sunflower €525.66/t (Nov 2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'TESEO Nov 2026',
          },
          maize: {
            priceUsdPerTonne: 228,
            trendYoYPct: +1.2,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'EU feed & starch mills',
            note: 'FR maize €188-215/t (2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'EC Cereals 2026',
          },
          fava_beans: {
            priceUsdPerTonne: 420,
            trendYoYPct: +4.0,
            demand: 'Growing',
            risk: 'Moderate',
            buyerChannel: 'EU plant-protein & non-GMO livestock feed cooperatives',
            note: 'Qualifies for CAP Protein Crop Coupled Support & Eco-Scheme diversification bonuses.',
          },
          chickpeas: {
            priceUsdPerTonne: 920,
            trendYoYPct: +5.2,
            demand: 'Growing',
            risk: 'Moderate',
            buyerChannel: 'Mediterranean food packers & organic/regenerative buyers',
            note: 'Strong margin break crop in Southern Europe with low water footprint.',
          },
          clover_cover: {
            priceUsdPerTonne: 145,
            trendYoYPct: +3.5,
            demand: 'Steady',
            risk: 'Low',
            buyerChannel: 'CAP Eco-Scheme compliance + livestock hay/silage',
            note: 'Unlocks EU CAP winter soil-cover & nitrogen-fixing eco-scheme payments.',
          },
        }),
        subsidies: [
          {
            title: 'EU CAP Eco-Scheme: Crop Rotation & Diversification',
            agency: 'European Commission / National Paying Agency',
            benefitSummary: 'Annual direct bonus (€55-110/ha) for multi-family rotations including legumes & winter cover crops.',
            estimatedUsdPerHa: 85,
            category: 'Rotation Bonus',
          },
          {
            title: 'Coupled Protein & Legume Support',
            agency: 'EU CAP Strategic Plan',
            benefitSummary: 'Extra coupled payment per hectare for fava beans, chickpeas, peas, and forage legumes.',
            estimatedUsdPerHa: 55,
            category: 'Rotation Bonus',
          },
        ],
        sources: [
          {
            name: 'European Commission Cereals Market Group',
            period: '2026',
            detail: 'FR milling wheat €189-209/t, DE €184-199/t, PL €182-189/t, IT durum €263-275/t, FR maize €188-215/t.',
          },
          {
            name: 'TESEO / CLAL EU-27 Oilseeds Quotations',
            period: 'Nov 2026',
            detail: 'Spain rapeseed €493.56/t, Spain sunflower €525.66/t, EU rapeseed futures ~€500/t.',
          },
          WORLD_BANK_SOURCE,
        ],
      };
    }

    case 'US_NA':
      return {
        regionId: 'US_NA',
        regionLabel: `${countryName} (USDA NASS / North American Grain Belt)`,
        ...spec,
        dataUpdatedLabel: 'Updated 2026 (USDA NASS / WASDE / World Bank)',
        marketHeadline: 'Tight Corn/Wheat Margins Make Soybeans, Chickpeas & N-Savings Critical',
        marketTakeaway:
          'With 2026 US farmgate corn at ~$4.11-4.15/bu ($162/t) and wheat ~$5.01-5.12/bu ($188/t) while DAP sits near $803/t, soybean-legume rotations and USDA EQIP/CSP conservation payments protect net farm income.',
        inputs: {
          ureaUsdPerTonne: 455,
          dapUsdPerTonne: 803,
          dieselUsdPerLiter: 0.96,
          seedBaseUsdPerHa: 195,
          machineryLaborUsdPerHa: 365,
          irrigationEnergyUsdPerHa: 150,
          fertilizerSubsidyNote:
            'USDA Prices Paid Index rose 8% YoY in early 2026; cutting anhydrous/urea via legume credits directly improves per-acre net margin.',
        },
        cropPrices: buildCropQuoteMap({
          maize: {
            priceUsdPerTonne: 164,
            trendYoYPct: -9.8,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Ethanol & feed elevators',
            note: '$4.11-$4.15/bu (2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA NASS 2026',
          },
          soybeans: {
            priceUsdPerTonne: 389,
            trendYoYPct: +3.9,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Crush & export elevators',
            note: '$10.20-$10.60/bu (2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA NASS 2026',
          },
          wheat: {
            priceUsdPerTonne: 188,
            trendYoYPct: -8.4,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Grain elevators & flour mills',
            note: '$4.90-$5.12/bu (2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA NASS 2026',
          },
          sorghum: {
            priceUsdPerTonne: 142,
            trendYoYPct: -11.0,
            demand: 'Steady',
            risk: 'Moderate',
            buyerChannel: 'Feedlots & terminals',
            note: '$6.23/cwt (Feb 2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA NASS 2026',
          },
          chickpeas: {
            priceUsdPerTonne: 705,
            trendYoYPct: -4.2,
            demand: 'Growing',
            risk: 'Moderate',
            buyerChannel: 'Pulse processors',
            note: '$31-$33.30/cwt (2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA NASS 2026',
          },
          canola: {
            priceUsdPerTonne: 485,
            trendYoYPct: +2.8,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Northern Plains & Canadian Prairie crush plants',
            note: 'Firm biofuel & edible oil crush demand across North America.',
          },
        }),
        subsidies: [
          {
            title: 'USDA EQIP & CSP Cover Crop / Rotation Incentives',
            agency: 'USDA NRCS',
            benefitSummary: 'Cost-share payments (~$65-125/ha equiv.) for planting cover crops and multi-crop conservation rotations.',
            estimatedUsdPerHa: 85,
            category: 'Rotation Bonus',
          },
          {
            title: 'ARC / PLC & Federal Crop Insurance Safety Net',
            agency: 'USDA FSA / RMA',
            benefitSummary: 'Revenue and price-loss risk protection that rewards diversified multi-crop rotations.',
            estimatedUsdPerHa: 35,
            category: 'Price Floor',
          },
        ],
        sources: [
          {
            name: 'USDA NASS Agricultural Prices & WASDE',
            period: 'Feb-May 2026',
            detail: 'Corn $4.11-4.15/bu, Soybeans $10.20-10.60/bu, Wheat $4.90-5.12/bu, Sorghum $6.23/cwt, Chickpeas $31-33.30/cwt.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    case 'SOUTH_ASIA':
      return {
        regionId: 'SOUTH_ASIA',
        regionLabel: `${countryName} (MSP Procurement & Mandi Markets)`,
        ...spec,
        dataUpdatedLabel: 'Updated Oct 2026 (India CACP MSP 2026-27 / World Bank)',
        marketHeadline: '2026-27 MSP Hikes Lift Wheat, Mustard & Pulses Floors',
        marketTakeaway:
          'India raised Rabi 2026-27 MSP to ₹2,585/q for wheat (+6.6%) and ₹6,200/q for mustard/rapeseed (+4.2%), alongside ₹5,650/q for chickpeas and ₹5,328/q for soybeans, rewarding grain-pulse-oilseed rotation.',
        inputs: {
          ureaUsdPerTonne: 135,
          dapUsdPerTonne: 380,
          dieselUsdPerLiter: 1.05,
          seedBaseUsdPerHa: 85,
          machineryLaborUsdPerHa: 185,
          irrigationEnergyUsdPerHa: 75,
          fertilizerSubsidyNote:
            'Central nutrient-based fertilizer subsidies keep domestic retail urea and DAP well below global spot rates.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: 306,
            trendYoYPct: +6.6,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'FCI / State Mandis (MSP)',
            note: '₹2,585/q MSP (2026-27).',
            dataBasis: 'Verified 2026',
            sourceShort: 'India MSP 2026-27',
          },
          chickpeas: {
            priceUsdPerTonne: 669,
            trendYoYPct: +3.9,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'NAFED & mandis',
            note: '₹5,650/q MSP (Gram).',
            dataBasis: 'Verified 2026',
            sourceShort: 'India MSP 2026-27',
          },
          canola: {
            priceUsdPerTonne: 734,
            trendYoYPct: +4.2,
            demand: 'High',
            risk: 'Low',
            buyerChannel: 'NAFED & mustard mills',
            note: '₹6,200/q MSP (2026-27).',
            dataBasis: 'Verified 2026',
            sourceShort: 'India MSP 2026-27',
          },
          soybeans: {
            priceUsdPerTonne: 630,
            trendYoYPct: +8.9,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'NAFED & crushers',
            note: '₹5,328/q MSP.',
            dataBasis: 'Verified 2026',
            sourceShort: 'India MSP 2025-26',
          },
          maize: {
            priceUsdPerTonne: 284,
            trendYoYPct: +7.9,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Ethanol & feed mandis',
            note: '₹2,400/q MSP.',
            dataBasis: 'Verified 2026',
            sourceShort: 'India MSP 2025-26',
          },
        }),
        subsidies: [
          {
            title: 'Government Minimum Support Price (MSP 2026-27)',
            agency: 'CACP / FCI / NAFED',
            benefitSummary: 'Assured floor across 22 crops: Wheat ₹2,585/q, Gram ₹5,650/q, Mustard ₹6,200/q, Soybean ₹5,328/q.',
            estimatedUsdPerHa: 0,
            category: 'Price Floor',
          },
          {
            title: 'PM-KISAN & Nutrient-Based Fertilizer Subsidy',
            agency: 'Ministry of Agriculture & Farmers Welfare',
            benefitSummary: 'Direct farmer income transfer plus heavily subsidized retail urea and DAP bags.',
            estimatedUsdPerHa: 75,
            category: 'Input Subsidy',
          },
        ],
        sources: [
          {
            name: 'India CACP Rabi 2026-27 & Kharif 2025-26 MSP Notifications',
            period: 'Oct 2025 - Oct 2026',
            detail: 'Wheat ₹2,585/q, Mustard ₹6,200/q, Gram ₹5,650/q, Soybean ₹5,328/q, Maize ₹2,400/q.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    case 'EAST_AFRICA':
    case 'WEST_AFRICA':
    case 'SOUTH_AFRICA': {
      const isEast = spec.regionKey === 'EAST_AFRICA';
      const isSouth = spec.regionKey === 'SOUTH_AFRICA';
      return {
        regionId: spec.regionKey,
        regionLabel: isEast
          ? `${countryName} (East Africa Regional Grain & Pulse Market)`
          : isSouth
            ? `${countryName} (Southern Africa SAFEX Grain Market)`
            : `${countryName} (West Africa Regional Agricultural Market)`,
        ...spec,
        dataUpdatedLabel: 'Updated Mar-Nov 2026 (AGRA / USDA FAS / World Bank)',
        marketHeadline: 'Firm Local Grain & Legume Prices Reward Self-Sufficient N-Fixing Rotations',
        marketTakeaway:
          isEast
            ? 'Kenya Grade 1 wheat is supported at KSh 52,778/t (~$408/t) and NCPB maize floor at KSh 4,000/90kg (~$343/t), while soybeans & beans trade at sharp local premiums.'
            : 'Regional grain and cowpea/soybean demand stays elevated in 2026 while imported DAP ($803/t global) makes legume nitrogen fixation a major cash advantage.',
        inputs: {
          ureaUsdPerTonne: isEast ? 410 : 455,
          dapUsdPerTonne: isEast ? 710 : 785,
          dieselUsdPerLiter: 1.32,
          seedBaseUsdPerHa: 90,
          machineryLaborUsdPerHa: 165,
          irrigationEnergyUsdPerHa: 120,
          fertilizerSubsidyNote: isEast
            ? 'National subsidized fertilizer e-vouchers lower bag costs for registered farmers before planting.'
            : 'Imported fertilizer carries high inland transport costs; legume rotations reduce out-of-pocket cash outlay.',
        },
        cropPrices: buildCropQuoteMap({
          wheat: {
            priceUsdPerTonne: isEast ? 409 : isSouth ? 325 : 395,
            trendYoYPct: +3.0,
            demand: 'High',
            risk: 'Low',
            buyerChannel: isEast ? 'AFA / NCPB & millers' : 'Flour mills & SAFEX',
            note: isEast ? 'Kenya KSh 52,778/t (2026).' : 'Regional grain benchmark.',
            dataBasis: isEast ? 'Verified 2026' : 'Regional Est.',
            sourceShort: isEast ? 'USDA FAS / AGRA 2026' : 'Regional Est.',
          },
          maize: {
            priceUsdPerTonne: isEast ? 355 : isSouth ? 248 : 340,
            trendYoYPct: +14.0,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: isEast ? 'NCPB floor & millers' : 'Regional markets',
            note: isEast ? 'NCPB KSh 4,000/90kg floor.' : 'Regional maize benchmark.',
            dataBasis: isEast ? 'Verified 2026' : 'Regional Est.',
            sourceShort: isEast ? 'USDA FAS / AGRA 2026' : 'Regional Est.',
          },
          soybeans: {
            priceUsdPerTonne: isEast ? 650 : isSouth ? 415 : 590,
            trendYoYPct: +12.5,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Feed & oil processors',
            note: isEast ? '$612-$721/t (early 2026).' : '~$400-$415/t SAFEX.',
            dataBasis: isEast || isSouth ? 'Verified 2026' : 'Regional Est.',
            sourceShort: isEast || isSouth ? 'Farmgain / AGRA 2026' : 'Regional Est.',
          },
          cowpeas: {
            priceUsdPerTonne: 760,
            trendYoYPct: +8.2,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Urban produce aggregators & cross-border bean markets',
            note: 'Fast-selling protein staple with very low water & fertilizer cost.',
          },
          sorghum: {
            priceUsdPerTonne: 310,
            trendYoYPct: +4.5,
            demand: 'Growing',
            risk: 'Low',
            buyerChannel: 'Local breweries, millers & drought-tolerant food chains',
            note: 'Contract brewing and dryland food demand provide reliable cash returns.',
          },
        }),
        subsidies: [
          {
            title: isEast ? 'National Fertilizer Subsidy & NCPB Floor Price' : 'Regional Input Voucher & Grain Aggregation Support',
            agency: isEast ? 'Ministry of Agriculture / NCPB / AFA' : 'National Agricultural Ministry',
            benefitSummary: isEast
              ? 'Subsidized fertilizer bags plus NCPB maize floor (KSh 4,000/90kg) & mandatory local wheat mill uptake.'
              : 'Seasonal subsidized seed/fertilizer vouchers and cooperative aggregation support.',
            estimatedUsdPerHa: 55,
            category: 'Input Subsidy',
          },
        ],
        sources: [
          {
            name: 'USDA FAS Kenya Grain Annual (KE2026-0006) & AGRA Food Security Monitor',
            period: 'Mar 2026',
            detail: 'Kenya wheat KSh 52,778/t, NCPB maize KSh 4,000-4,500/90kg, soybeans $612-721/t, Ethiopia wheat $520/t.',
          },
          WORLD_BANK_SOURCE,
        ],
      };
    }

    case 'LATAM':
      return {
        regionId: 'LATAM',
        regionLabel: `${countryName} (South & Latin America Export Grain Market)`,
        ...spec,
        dataUpdatedLabel: 'Updated May-Nov 2026 (USDA FAS / World Bank)',
        marketHeadline: 'Export Soybeans & Double-Crop Maize Lead Regional Cash Flow',
        marketTakeaway:
          'With Brazil export maize near $229/t (Argentina $212/t) and global soybeans near $515/t, soybean-maize-cover crop rotations maximize double-crop cash flow while cutting imported DAP exposure.',
        inputs: {
          ureaUsdPerTonne: 435,
          dapUsdPerTonne: 810,
          dieselUsdPerLiter: 1.12,
          seedBaseUsdPerHa: 155,
          machineryLaborUsdPerHa: 240,
          irrigationEnergyUsdPerHa: 120,
          fertilizerSubsidyNote: 'High share of imported fertilizers means legume N-fixation and no-till cover crops directly safeguard margins.',
        },
        cropPrices: buildCropQuoteMap({
          maize: {
            priceUsdPerTonne: 222,
            trendYoYPct: +4.0,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Export traders & ethanol',
            note: 'Brazil $229/t, Arg $212/t (May 2026).',
            dataBasis: 'Verified 2026',
            sourceShort: 'USDA FAS May 2026',
          },
          soybeans: {
            priceUsdPerTonne: 465,
            trendYoYPct: +6.5,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Export crushers & silos',
            note: 'Tracks World Bank $515/t FOB.',
            dataBasis: 'Verified 2026',
            sourceShort: 'World Bank Nov 2026',
          },
          wheat: {
            priceUsdPerTonne: 240,
            trendYoYPct: -3.5,
            demand: 'High',
            risk: 'Moderate',
            buyerChannel: 'Regional Mercosur flour mills',
            note: 'Strong winter rotation crop ahead of summer soybeans.',
          },
        }),
        subsidies: [
          {
            title: 'Low-Carbon Agriculture & Conservation Credit (ABC+ / Regional)',
            agency: 'National Agricultural Development Banks',
            benefitSummary: 'Preferential lower-interest farm loans for no-till, crop rotation, and biological nitrogen fixation.',
            estimatedUsdPerHa: 45,
            category: 'Rotation Bonus',
          },
        ],
        sources: [
          {
            name: 'USDA FAS World Markets & Trade (Grain)',
            period: 'May 2026',
            detail: 'Brazil export maize $229/t, Argentina maize $212/t, strong South American export demand.',
          },
          WORLD_BANK_SOURCE,
        ],
      };

    default:
      return {
        regionId: spec.regionKey,
        regionLabel: `${countryName} Regional Agricultural Market`,
        ...spec,
        dataUpdatedLabel: 'Updated Nov 2026 (World Bank Pink Sheet / FAO Reference)',
        marketHeadline: 'High 2026 Phosphate Costs Reward Legume & Oilseed Diversification',
        marketTakeaway:
          'Global DAP reached $803/t in Nov 2026 while soybeans ($515/t) and oilseeds outpace cereals. Rotating legumes and break crops cuts synthetic fertilizer bills while keeping stable market buyers.',
        inputs: {
          ureaUsdPerTonne: 430,
          dapUsdPerTonne: 803,
          dieselUsdPerLiter: 1.15,
          seedBaseUsdPerHa: 135,
          machineryLaborUsdPerHa: 245,
          irrigationEnergyUsdPerHa: 140,
          fertilizerSubsidyNote:
            'Global fertilizer markets remain elevated (DAP $803/t in Nov 2026); biological N from legumes saves direct cash.',
        },
        cropPrices: buildCropQuoteMap({}),
        subsidies: [
          {
            title: 'Climate-Smart Soil & Water Conservation Support',
            agency: 'Regional Ministry of Agriculture / Extension',
            benefitSummary: 'Local technical grants, certified seed support, and preferential credit for multi-crop rotations.',
            estimatedUsdPerHa: 40,
            category: 'Rotation Bonus',
          },
        ],
        sources: [WORLD_BANK_SOURCE],
      };
  }
}

export function getDefaultCurrencyForCountry(countryCode: string): CurrencyOption {
  const mappedCode = COUNTRY_CURRENCY_MAP[countryCode]?.currencyCode ?? 'USD';
  return (
    ALL_FARM_CURRENCIES.find((c) => c.code === mappedCode) ??
    ALL_FARM_CURRENCIES.find((c) => c.code === 'USD')!
  );
}

export function getCurrencyByCode(code?: string, fallbackCountryCode = 'US'): CurrencyOption {
  if (code) {
    const found = ALL_FARM_CURRENCIES.find((c) => c.code === code.toUpperCase());
    if (found) return found;
  }
  return getDefaultCurrencyForCountry(fallbackCountryCode);
}

export function getRegionalMarketProfile(profile: FarmerProfile): RegionalMarketProfile {
  const base = buildRegionalProfile(profile.countryCode, profile.countryName);
  const countrySpecificSubsidies = COUNTRY_SUBSIDY_PROGRAMS[profile.countryCode];
  if (countrySpecificSubsidies && countrySpecificSubsidies.length > 0) {
    return {
      ...base,
      subsidies: countrySpecificSubsidies,
    };
  }
  return base;
}

/**
 * Formats an amount given in USD into any chosen currency code (from all 42+ countries),
 * or 'local' (farmer's preferred/country currency) or 'usd'.
 */
export function formatFarmMoney(
  amountUsd: number,
  market: RegionalMarketProfile,
  displayCurrency: 'local' | 'usd' | string = 'local',
  decimals = 0
): string {
  const targetCurrency: CurrencyOption =
    displayCurrency === 'usd'
      ? getCurrencyByCode('USD')
      : displayCurrency === 'local'
        ? getCurrencyByCode(market.currencyCode)
        : getCurrencyByCode(displayCurrency, market.currencyCode);

  const val = amountUsd * targetCurrency.fxPerUsd;
  const absFormatted = Math.abs(val).toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = val < 0 ? '-' : '';
  if (targetCurrency.code === 'USD') {
    return `${sign}$${absFormatted}`;
  }
  const sym = targetCurrency.symbol;
  if (
    sym === '€' ||
    sym === '£' ||
    sym === '₹' ||
    sym === '¥' ||
    sym === '₺' ||
    sym === 'R' ||
    sym === 'C$' ||
    sym === 'A$' ||
    sym === 'NZ$' ||
    sym === 'R$' ||
    sym === 'MX$' ||
    sym === '₦' ||
    sym === '₴' ||
    sym === '฿'
  ) {
    return `${sign}${sym}${absFormatted}`;
  }
  return `${sign}${absFormatted} ${targetCurrency.code}`;
}

function resolveCropIdFromStep(step: UnifiedSeasonStep): string {
  if (step.cropId && GLOBAL_CROPS[step.cropId]) return step.cropId;
  const n = step.cropName.toLowerCase();
  if (/chickpea/.test(n)) return 'chickpeas';
  if (/fava|bean|pea/.test(n)) return 'fava_beans';
  if (/soy/.test(n)) return 'soybeans';
  if (/cowpea/.test(n)) return 'cowpeas';
  if (/sunflower/.test(n)) return 'sunflower';
  if (/canola|rapeseed|mustard/.test(n)) return 'canola';
  if (/sorghum|millet/.test(n)) return 'sorghum';
  if (/corn|maize/.test(n)) return 'maize';
  if (/barley/.test(n)) return 'barley_vetch';
  if (/clover|vetch|cover/.test(n)) return 'clover_cover';
  if (/tomato|pepper|veg|melon|potato/.test(n)) return 'vegetables';
  return 'wheat';
}

function resolveBaselineCropId(profile: FarmerProfile): string {
  const prev = (profile.previousCrops[0] ?? 'Wheat').toLowerCase();
  if (/maize|corn/.test(prev)) return 'maize';
  if (/barley/.test(prev)) return 'barley_vetch';
  if (/soy/.test(prev)) return 'soybeans';
  if (/sunflower/.test(prev)) return 'sunflower';
  if (/sorghum|millet/.test(prev)) return 'sorghum';
  if (/chickpea|bean/.test(prev)) return 'chickpeas';
  if (/tomato|veg/.test(prev)) return 'vegetables';
  return 'wheat';
}

export interface FinancialCalcOptions {
  /** Custom farmer overrides in USD/tonne keyed by cropId */
  customPricesUsd?: Record<string, number>;
  /** Input cost stress adjustment in % (-25 to +35) */
  inputCostDeltaPct?: number;
  /** Whether to include regional rotation/eco-scheme subsidies */
  includeSubsidies?: boolean;
  /** Farmer's own non-fertilizer operating cost per ha in USD (seed + water + labor) */
  farmerOperatingUsdPerHa?: number;
  /** Farmer's own typical fertilizer spend per ha in USD */
  farmerFertilizerUsdPerHa?: number;
}

/**
 * Returns regional reference planning costs per hectare in the chosen currency (or country currency).
 * Used ONLY as an optional helper hint if the farmer asks to pre-fill starting numbers.
 */
export function getTypicalPlanningCostsLocal(
  profile: Pick<FarmerProfile, 'countryCode' | 'countryName' | 'irrigationType'> & {
    areaHectares?: number;
  },
  currencyCode?: string
): {
  seasonBudgetCapacityLocal: number;
  operatingCostPerHaLocal: number;
  fertilizerCostPerHaLocal: number;
  irrigationEnergyCostPerHaLocal: number;
  currency: CurrencyOption;
} {
  const market = buildRegionalProfile(profile.countryCode, profile.countryName);
  const currency = getCurrencyByCode(currencyCode, profile.countryCode);
  const irrMult =
    profile.irrigationType === 'Rain-fed'
      ? 0.2
      : profile.irrigationType === 'Drip'
        ? 0.85
        : 1.0;
  const irrUsd = market.inputs.irrigationEnergyUsdPerHa * irrMult;
  const operatingUsd =
    market.inputs.seedBaseUsdPerHa +
    market.inputs.machineryLaborUsdPerHa * 1.08 +
    irrUsd;
  const fertilizerUsd =
    market.inputs.ureaUsdPerTonne * 0.34 + market.inputs.dapUsdPerTonne * 0.18;

  const roundStep = currency.fxPerUsd >= 50 ? 100 : currency.fxPerUsd >= 5 ? 50 : 10;
  const operatingCostPerHaLocal = Math.max(
    roundStep,
    Math.round((operatingUsd * currency.fxPerUsd) / roundStep) * roundStep
  );
  const fertilizerCostPerHaLocal = Math.max(
    roundStep,
    Math.round((fertilizerUsd * currency.fxPerUsd) / roundStep) * roundStep
  );
  const irrigationEnergyCostPerHaLocal = Math.max(
    roundStep / 2,
    Math.round((irrUsd * currency.fxPerUsd) / roundStep) * roundStep
  );
  const area = Math.max(1, profile.areaHectares ?? 20);
  const budgetStep = roundStep * 10;
  const seasonBudgetCapacityLocal = Math.max(
    budgetStep,
    Math.round(((operatingCostPerHaLocal + fertilizerCostPerHaLocal) * area * 1.15) / budgetStep) *
      budgetStep
  );

  return {
    seasonBudgetCapacityLocal,
    operatingCostPerHaLocal,
    fertilizerCostPerHaLocal,
    irrigationEnergyCostPerHaLocal,
    currency,
  };
}

/**
 * Realistic global commercial farmgate yields (t/ha) before regional/climate/irrigation adjustment
 */
const COMMERCIAL_YIELD_ANCHOR_THA: Record<string, number> = {
  wheat: 4.3,
  fava_beans: 2.1,
  chickpeas: 1.45,
  sorghum: 4.2,
  sunflower: 2.25,
  clover_cover: 3.4,
  maize: 7.4,
  soybeans: 2.85,
  cowpeas: 1.45,
  barley_vetch: 3.6,
  vegetables: 31.0,
  canola: 2.8,
};

/**
 * Regional agronomic productivity multiplier based on typical national farmgate averages
 */
const REGION_YIELD_FACTOR: Record<string, number> = {
  TN: 0.78,
  MA: 0.74,
  DZ: 0.72,
  EG: 1.24,
  MENA_LEVANT: 0.82,
  TR: 0.92,
  EU_WEST: 1.38,
  EU_MED: 1.04,
  EU_EAST: 1.08,
  US_NA: 1.32,
  LATAM: 1.06,
  SOUTH_ASIA: 0.94,
  EAST_ASIA: 1.12,
  OCEANIA: 0.96,
  EAST_AFRICA: 0.76,
  WEST_AFRICA: 0.72,
  SOUTH_AFRICA: 0.95,
  GLOBAL: 0.92,
};

/**
 * Computes full farmer-grade profitability, cost breakdown, fertilizer savings, break-even yield,
 * and market fit score for any rotation strategy vs. repeating the same baseline crop.
 */
export function computeStrategyFinancials(
  profile: FarmerProfile,
  strategy: ScoredRotationStrategy,
  options: FinancialCalcOptions = {}
): StrategyFinancialSummary {
  const market = getRegionalMarketProfile(profile);
  const savedFin = profile.financeInputs?.enabled ? profile.financeInputs : undefined;
  const savedCurrency = getCurrencyByCode(savedFin?.currencyCode, profile.countryCode);

  // Merge saved local buyer price overrides with explicit option overrides
  const mergedCustomPricesUsd: Record<string, number> = {};
  if (savedFin?.customBuyerPricesLocal) {
    for (const [k, localVal] of Object.entries(savedFin.customBuyerPricesLocal)) {
      if (Number.isFinite(localVal) && localVal > 0) {
        mergedCustomPricesUsd[k] = localVal / savedCurrency.fxPerUsd;
      }
    }
  }
  if (options.customPricesUsd) {
    Object.assign(mergedCustomPricesUsd, options.customPricesUsd);
  }
  const customPrices = mergedCustomPricesUsd;
  const costMult = 1 + (options.inputCostDeltaPct ?? 0) / 100;
  const includeSubsidies =
    options.includeSubsidies ?? savedFin?.includeSubsidies ?? true;

  const regionYieldMult = REGION_YIELD_FACTOR[market.regionId] ?? 0.92;
  // Climate & soil yield calibration factor
  const moistNorm = Math.max(0.78, Math.min(1.12, 0.76 + (profile.nasaPower.rootMoisturePct / 100) * 0.48));
  const soilYieldMult =
    profile.soilType === 'Loamy' || profile.soilType === 'Silt'
      ? 1.04
      : profile.soilType === 'Peaty'
        ? 1.02
        : profile.soilType === 'Clay'
          ? 0.97
          : 0.91;
  const irrYieldMult =
    profile.irrigationType === 'Drip'
      ? 1.08
      : profile.irrigationType === 'Sprinkler'
        ? 1.05
        : profile.irrigationType === 'Canal / Well'
          ? 1.02
          : 0.92;
  const irrCostMult =
    profile.irrigationType === 'Rain-fed'
      ? 0.15
      : profile.irrigationType === 'Drip'
        ? 0.85
        : profile.irrigationType === 'Sprinkler'
          ? 1.08
          : 0.95;

  const totalRotationSubsidyUsdPerHa = includeSubsidies
    ? market.subsidies.reduce((acc, s) => acc + s.estimatedUsdPerHa, 0)
    : 0;

  // Resolve farmer's entered baseline costs (converted to USD/ha using their selected currency)
  const defaultOperatingUsd =
    market.inputs.seedBaseUsdPerHa +
    market.inputs.machineryLaborUsdPerHa * 1.15 +
    market.inputs.irrigationEnergyUsdPerHa * irrCostMult;
  const farmerOperatingUsd =
    options.farmerOperatingUsdPerHa ??
    (savedFin && savedFin.operatingCostPerHaLocal && savedFin.operatingCostPerHaLocal > 0
      ? savedFin.operatingCostPerHaLocal / savedCurrency.fxPerUsd
      : undefined);
  const operatingScale =
    farmerOperatingUsd !== undefined && defaultOperatingUsd > 0
      ? Math.max(0.25, Math.min(4.0, farmerOperatingUsd / defaultOperatingUsd))
      : 1;

  const defaultFertUsd =
    market.inputs.ureaUsdPerTonne * 0.34 + market.inputs.dapUsdPerTonne * 0.18;
  const farmerFertUsd =
    options.farmerFertilizerUsdPerHa ??
    (savedFin && savedFin.fertilizerCostPerHaLocal !== undefined && savedFin.fertilizerCostPerHaLocal >= 0
      ? savedFin.fertilizerCostPerHaLocal / savedCurrency.fxPerUsd
      : undefined);

  // 1. Compute Baseline (repeating the same single crop every year -> 11% yield drag & 100% synthetic fertilizer)
  const baseCropId = resolveBaselineCropId(profile);
  const baseCropInfo = GLOBAL_CROPS[baseCropId] ?? GLOBAL_CROPS.wheat;
  const baseAnchorYield = COMMERCIAL_YIELD_ANCHOR_THA[baseCropId] ?? baseCropInfo.baseYieldTha;
  const baseQuote = market.cropPrices[baseCropId] ?? market.cropPrices.wheat;
  const basePriceUsd = customPrices[baseCropId] ?? baseQuote.priceUsdPerTonne;
  const baseYieldTha = Number(
    (baseAnchorYield * regionYieldMult * 0.89 * moistNorm * soilYieldMult * irrYieldMult).toFixed(2)
  );
  const baseRevHa = baseYieldTha * basePriceUsd;
  const baseFertHa = (farmerFertUsd ?? defaultFertUsd) * costMult;
  const baseSeedHa =
    market.inputs.seedBaseUsdPerHa *
    operatingScale *
    (baseCropInfo.family === 'Vegetable' ? 5.8 : 1.0) *
    costMult;
  const farmerIrrEnergyUsd =
    savedFin?.irrigationEnergyCostPerHaLocal !== undefined &&
    savedFin.irrigationEnergyCostPerHaLocal >= 0
      ? savedFin.irrigationEnergyCostPerHaLocal / savedCurrency.fxPerUsd
      : undefined;
  const effectiveIrrBaseUsd =
    farmerIrrEnergyUsd !== undefined
      ? farmerIrrEnergyUsd
      : market.inputs.irrigationEnergyUsdPerHa * operatingScale * irrCostMult;

  const baseWaterHa =
    effectiveIrrBaseUsd * (baseCropInfo.waterNeedMm / 360) * costMult;
  const baseLaborHa =
    market.inputs.machineryLaborUsdPerHa *
    operatingScale *
    (baseCropInfo.family === 'Vegetable' ? 6.4 : 1.15) *
    costMult;
  const baseTotalCostHa = baseFertHa + baseSeedHa + baseWaterHa + baseLaborHa;
  const baselineAnnualNetProfitUsdPerHa = Math.round(baseRevHa - baseTotalCostHa);

  // 2. Compute Each Season Step of the Rotation Strategy
  const seasonRows: SeasonFinancialRow[] = strategy.steps.map((step, idx) => {
    const cropId = resolveCropIdFromStep(step);
    const cropInfo = GLOBAL_CROPS[cropId] ?? GLOBAL_CROPS.wheat;
    const cropAnchorYield = COMMERCIAL_YIELD_ANCHOR_THA[cropId] ?? cropInfo.baseYieldTha;
    const quote = market.cropPrices[cropId] ?? market.cropPrices.wheat;
    const priceUsd = customPrices[cropId] ?? quote.priceUsdPerTonne;

    // Rotation vigor lift builds across seasons as soil richness & pest break accumulate
    const rotationYieldLift = 1.01 + Math.min(0.11, idx * 0.028 + Math.max(0, step.soilRichnessScore - 68) * 0.0015);
    const expectedYieldTha = Number(
      (cropAnchorYield * regionYieldMult * rotationYieldLift * moistNorm * soilYieldMult * irrYieldMult).toFixed(2)
    );
    const grossRevenueUsdPerHa = Math.round(expectedYieldTha * priceUsd);

    // Fertilizer cost drops dramatically for legumes/cover crops and by chemicalReductionPct for cereals!
    const familyFertWeight =
      cropInfo.family === 'Legume'
        ? 0.38
        : cropInfo.family === 'Cover Crop'
          ? 0.25
          : cropInfo.family === 'Oilseed'
            ? 0.85
            : cropInfo.family === 'Vegetable'
              ? 1.75
              : 1.0;
    const fullFertForCrop = baseFertHa * familyFertWeight;
    const reductionFrac = Math.max(0.08, Math.min(0.72, step.chemicalReductionPct / 100));
    const fertilizerCostUsdPerHa = Math.round(fullFertForCrop * (1 - reductionFrac));
    const fertilizerSavedUsdPerHa = Math.max(0, Math.round(baseFertHa - fertilizerCostUsdPerHa));

    const seedMult =
      cropInfo.family === 'Vegetable'
        ? 5.8
        : cropInfo.family === 'Cover Crop'
          ? 0.72
          : cropInfo.family === 'Legume'
            ? 1.15
            : 1.0;
    const seedCostUsdPerHa = Math.round(
      market.inputs.seedBaseUsdPerHa * operatingScale * seedMult * costMult
    );

    const waterSavingMult = Math.max(0.68, 1 - step.moistureRetentionPct / 120);
    const waterCostUsdPerHa = Math.round(
      effectiveIrrBaseUsd *
        (cropInfo.waterNeedMm / 360) *
        waterSavingMult *
        costMult
    );

    const laborMult =
      cropInfo.family === 'Vegetable'
        ? 6.4
        : cropInfo.family === 'Cover Crop'
          ? 0.58
          : cropInfo.family === 'Legume'
            ? 1.05
            : 1.08;
    const laborMachineryUsdPerHa = Math.round(
      market.inputs.machineryLaborUsdPerHa * operatingScale * laborMult * costMult
    );

    const totalCostUsdPerHa =
      seedCostUsdPerHa + fertilizerCostUsdPerHa + waterCostUsdPerHa + laborMachineryUsdPerHa;

    const subsidyUsdPerHa = Math.round(
      cropInfo.family === 'Legume' || cropInfo.family === 'Cover Crop'
        ? totalRotationSubsidyUsdPerHa * 1.15
        : totalRotationSubsidyUsdPerHa * 0.75
    );

    const netProfitUsdPerHa = grossRevenueUsdPerHa + subsidyUsdPerHa - totalCostUsdPerHa;
    const breakEvenYieldTha = Number(
      Math.max(0.2, (totalCostUsdPerHa - subsidyUsdPerHa) / Math.max(40, priceUsd)).toFixed(2)
    );

    return {
      stepNumber: step.stepNumber,
      seasonName: step.shortSeason,
      cropId,
      cropName: step.cropName,
      cropFamily: step.cropFamily,
      cropColor: step.cropColor,
      expectedYieldTha,
      priceUsdPerTonne: Math.round(priceUsd),
      grossRevenueUsdPerHa,
      seedCostUsdPerHa,
      fertilizerCostUsdPerHa,
      fertilizerSavedUsdPerHa,
      waterCostUsdPerHa,
      laborMachineryUsdPerHa,
      totalCostUsdPerHa,
      subsidyUsdPerHa,
      netProfitUsdPerHa,
      breakEvenYieldTha,
      demand: quote.demand,
      risk: quote.risk,
    };
  });

  const n = Math.max(1, seasonRows.length);
  const annualRevenueUsdPerHa = Math.round(
    seasonRows.reduce((s, r) => s + r.grossRevenueUsdPerHa, 0) / n
  );
  const annualCostUsdPerHa = Math.round(
    seasonRows.reduce((s, r) => s + r.totalCostUsdPerHa, 0) / n
  );
  const annualSubsidyUsdPerHa = Math.round(
    seasonRows.reduce((s, r) => s + r.subsidyUsdPerHa, 0) / n
  );
  const annualNetProfitUsdPerHa = Math.round(
    seasonRows.reduce((s, r) => s + r.netProfitUsdPerHa, 0) / n
  );
  const annualFertilizerSavedUsdPerHa = Math.round(
    seasonRows.reduce((s, r) => s + r.fertilizerSavedUsdPerHa, 0) / n
  );

  const area = Math.max(0.5, profile.areaHectares);
  const annualFarmNetProfitUsd = Math.round(annualNetProfitUsdPerHa * area);
  const extraAnnualProfitUsdPerHa = annualNetProfitUsdPerHa - baselineAnnualNetProfitUsdPerHa;
  const extraAnnualFarmProfitUsd = Math.round(extraAnnualProfitUsdPerHa * area);
  const fiveYearExtraFarmProfitUsd = Math.round(extraAnnualFarmProfitUsd * 5 * 1.08);
  const annualFarmFertilizerSavedUsd = Math.round(annualFertilizerSavedUsdPerHa * area);

  const annualFarmCostUsd = annualCostUsdPerHa * Math.max(0.5, profile.areaHectares);

  // Farm cash capacity, last-season profit & target profit tracking (all converted cleanly via savedCurrency)
  const budgetCapacityUsd =
    savedFin?.seasonBudgetCapacityLocal && savedFin.seasonBudgetCapacityLocal > 0
      ? savedFin.seasonBudgetCapacityLocal / savedCurrency.fxPerUsd
      : undefined;
  const budgetUsagePct =
    budgetCapacityUsd && budgetCapacityUsd > 0
      ? Math.round((annualFarmCostUsd / budgetCapacityUsd) * 100)
      : undefined;
  const withinBudget =
    budgetCapacityUsd !== undefined ? annualFarmCostUsd <= budgetCapacityUsd : undefined;
  const budgetGapUsd =
    budgetCapacityUsd !== undefined ? budgetCapacityUsd - annualFarmCostUsd : undefined;

  const lastSeasonProfitUsd =
    savedFin?.lastSeasonNetProfitLocal !== undefined &&
    Number.isFinite(savedFin.lastSeasonNetProfitLocal)
      ? savedFin.lastSeasonNetProfitLocal / savedCurrency.fxPerUsd
      : undefined;
  const vsLastSeasonProfitUsd =
    lastSeasonProfitUsd !== undefined ? annualFarmNetProfitUsd - lastSeasonProfitUsd : undefined;

  const targetProfitUsd =
    savedFin?.targetAnnualProfitLocal && savedFin.targetAnnualProfitLocal > 0
      ? savedFin.targetAnnualProfitLocal / savedCurrency.fxPerUsd
      : undefined;
  const targetGoalPct =
    targetProfitUsd && targetProfitUsd > 0
      ? Math.max(0, Math.round((annualFarmNetProfitUsd / targetProfitUsd) * 100))
      : undefined;

  const profitMarginPct =
    annualRevenueUsdPerHa + annualSubsidyUsdPerHa > 0
      ? Math.round((annualNetProfitUsdPerHa / (annualRevenueUsdPerHa + annualSubsidyUsdPerHa)) * 100)
      : 0;
  const roiPct = annualCostUsdPerHa > 0 ? Math.round((annualNetProfitUsdPerHa / annualCostUsdPerHa) * 100) : 0;

  const avgBreakEvenRatioPct = Math.round(
    (seasonRows.reduce((s, r) => s + r.breakEvenYieldTha / Math.max(0.2, r.expectedYieldTha), 0) / n) *
      100
  );

  const volatileCount = seasonRows.filter((r) => r.risk === 'Volatile').length;
  const highDemandCount = seasonRows.filter((r) => r.demand === 'High').length;
  const cashFlowRisk: 'Low' | 'Moderate' | 'High' =
    volatileCount >= 2 || avgBreakEvenRatioPct >= 82 || withinBudget === false
      ? 'High'
      : volatileCount === 1 || avgBreakEvenRatioPct >= 66
        ? 'Moderate'
        : 'Low';

  const budgetFitBonus =
    withinBudget === true ? 6 : withinBudget === false ? -10 : 0;
  const goalBonus =
    targetGoalPct !== undefined && targetGoalPct >= 100 ? 4 : 0;

  const marketFitScore = Math.max(
    50,
    Math.min(
      99,
      Math.round(
        64 +
          (extraAnnualProfitUsdPerHa > 0 ? Math.min(18, extraAnnualProfitUsdPerHa / 22) : -6) +
          (highDemandCount / n) * 12 +
          (cashFlowRisk === 'Low' ? 7 : cashFlowRisk === 'Moderate' ? 3 : -4) +
          budgetFitBonus +
          goalBonus
      )
    )
  );

  const plainVerdict =
    withinBudget === false && budgetGapUsd !== undefined
      ? `Strong yield margin, but seasonal costs exceed your budget capacity by ${formatFarmMoney(Math.abs(budgetGapUsd), market, savedCurrency.code)}. Consider lower-input rotations or subsidies.`
      : extraAnnualProfitUsdPerHa > 0
        ? `Adds est. ${formatFarmMoney(extraAnnualProfitUsdPerHa, market, savedCurrency.code)}/ha more profit than repeating ${baseCropInfo.name}, helped by ${formatFarmMoney(annualFertilizerSavedUsdPerHa, market, savedCurrency.code)}/ha in fertilizer savings.`
        : `Protects soil and breaks pest cycles with ${formatFarmMoney(annualFertilizerSavedUsdPerHa, market, savedCurrency.code)}/ha lower fertilizer spend; check local buyer contracts to maximize net return.`;

  return {
    strategyId: strategy.id,
    strategyTitle: strategy.title,
    annualRevenueUsdPerHa,
    annualCostUsdPerHa,
    annualFarmCostUsd,
    annualSubsidyUsdPerHa,
    annualNetProfitUsdPerHa,
    annualFarmNetProfitUsd,
    baselineAnnualNetProfitUsdPerHa,
    extraAnnualProfitUsdPerHa,
    extraAnnualFarmProfitUsd,
    fiveYearExtraFarmProfitUsd,
    annualFertilizerSavedUsdPerHa,
    annualFarmFertilizerSavedUsd,
    budgetCapacityUsd,
    budgetUsagePct,
    withinBudget,
    budgetGapUsd,
    lastSeasonProfitUsd,
    vsLastSeasonProfitUsd,
    targetProfitUsd,
    targetGoalPct,
    profitMarginPct,
    roiPct,
    avgBreakEvenRatioPct,
    marketFitScore,
    cashFlowRisk,
    plainVerdict,
    seasonRows,
  };
}

/**
 * When the farmer chooses to include finances in planning (`profile.financeInputs?.enabled`),
 * blends farm profitability, fertilizer savings & market fit (25% weight) with agronomy (75%)
 * so Rotation Lab's Match Score and Option 1-3 ranking genuinely reflect financial viability.
 */
export function applyFinanceParameterToStrategies(
  profile: FarmerProfile,
  strategies: ScoredRotationStrategy[]
): ScoredRotationStrategy[] {
  if (!profile.financeInputs?.enabled) {
    return strategies;
  }

  const scored = strategies.map((st) => {
    const fin = computeStrategyFinancials(profile, st);
    // Relative profitability bonus (-4 to +6 points) + market fit blend
    const blendedMatch = Math.max(
      62,
      Math.min(99, Math.round(st.matchScore * 0.72 + fin.marketFitScore * 0.28))
    );
    return {
      strategy: st,
      fin,
      blendedMatch,
    };
  });

  // Sort by blended agronomy + finance match score, breaking ties by net profit
  scored.sort((a, b) => {
    if (b.blendedMatch !== a.blendedMatch) return b.blendedMatch - a.blendedMatch;
    return b.fin.annualNetProfitUsdPerHa - a.fin.annualNetProfitUsdPerHa;
  });

  return scored.map((item, idx) => {
    const rank = (idx + 1) as 1 | 2 | 3;
    return {
      ...item.strategy,
      rank,
      tierLabel: `Top ${rank} Strategy`,
      matchScore: item.blendedMatch,
    };
  });
}

