import { ClimateZone, SoilType } from '../types/farm';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  lat: number;
  lng: number;
  climateZone: ClimateZone;
  defaultSoil: SoilType;
  regionHint: string;
}

export const GLOBAL_COUNTRIES: CountryOption[] = [
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳', lat: 36.8142, lng: 9.8635, climateZone: 'Mediterranean', defaultSoil: 'Loamy', regionHint: 'Medjerda Valley' },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦', lat: 33.8935, lng: -5.5473, climateZone: 'Mediterranean', defaultSoil: 'Clay', regionHint: 'Meknes-Fes Plains' },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿', lat: 36.1911, lng: 5.4137, climateZone: 'Semi-Arid', defaultSoil: 'Loamy', regionHint: 'Setif High Plains' },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', lat: 30.8025, lng: 31.0004, climateZone: 'Semi-Arid', defaultSoil: 'Silt', regionHint: 'Nile Delta' },
  { code: 'FR', name: 'France', flag: '🇫🇷', lat: 47.3422, lng: -0.6412, climateZone: 'Temperate', defaultSoil: 'Silt', regionHint: 'Loire Atlantic Basin' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', lat: 37.5418, lng: -5.4231, climateZone: 'Mediterranean', defaultSoil: 'Clay', regionHint: 'Guadalquivir Valley' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', lat: 44.6471, lng: 10.9252, climateZone: 'Mediterranean', defaultSoil: 'Loamy', regionHint: 'Po Valley Plains' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', lat: 52.1308, lng: 11.6276, climateZone: 'Temperate', defaultSoil: 'Loamy', regionHint: 'Magdeburg Börde' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lat: 52.2053, lng: 0.1218, climateZone: 'Temperate', defaultSoil: 'Clay', regionHint: 'East Anglia' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', lat: 52.5185, lng: 5.4714, climateZone: 'Temperate', defaultSoil: 'Peaty', regionHint: 'Flevoland Polders' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', lat: 38.5714, lng: -7.9135, climateZone: 'Mediterranean', defaultSoil: 'Sandy', regionHint: 'Alentejo Plains' },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', lat: 39.639, lng: 22.4191, climateZone: 'Mediterranean', defaultSoil: 'Loamy', regionHint: 'Thessaly Plain' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', lat: 37.8746, lng: 32.4932, climateZone: 'Semi-Arid', defaultSoil: 'Clay', regionHint: 'Konya Basin' },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', lat: 52.4064, lng: 16.9252, climateZone: 'Continental', defaultSoil: 'Sandy', regionHint: 'Greater Poland' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦', lat: 49.4444, lng: 32.0598, climateZone: 'Continental', defaultSoil: 'Loamy', regionHint: 'Cherkasy Black Earth' },
  { code: 'US', name: 'United States', flag: '🇺🇸', lat: 42.0308, lng: -93.6319, climateZone: 'Continental', defaultSoil: 'Loamy', regionHint: 'Iowa Corn Belt' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lat: 50.4452, lng: -104.6189, climateZone: 'Continental', defaultSoil: 'Loamy', regionHint: 'Saskatchewan Prairies' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', lat: 20.6736, lng: -101.354, climateZone: 'Subtropical', defaultSoil: 'Clay', regionHint: 'Bajío Highlands' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', lat: -12.5425, lng: -55.7211, climateZone: 'Tropical', defaultSoil: 'Clay', regionHint: 'Mato Grosso' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', lat: -33.6757, lng: -60.5736, climateZone: 'Temperate', defaultSoil: 'Loamy', regionHint: 'Humid Pampas' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', lat: 4.8133, lng: -75.6961, climateZone: 'Tropical', defaultSoil: 'Loamy', regionHint: 'Andean Valleys' },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', lat: -13.3106, lng: -72.1167, climateZone: 'Subtropical', defaultSoil: 'Loamy', regionHint: 'Sacred Valley' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', lat: -35.4264, lng: -71.6554, climateZone: 'Mediterranean', defaultSoil: 'Loamy', regionHint: 'Maule Central Valley' },
  { code: 'IN', name: 'India', flag: '🇮🇳', lat: 30.901, lng: 75.8573, climateZone: 'Subtropical', defaultSoil: 'Silt', regionHint: 'Punjab Alluvial Plains' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', lat: 31.4504, lng: 73.135, climateZone: 'Semi-Arid', defaultSoil: 'Silt', regionHint: 'Indus Basin' },
  { code: 'CN', name: 'China', flag: '🇨🇳', lat: 34.7466, lng: 113.6253, climateZone: 'Continental', defaultSoil: 'Silt', regionHint: 'North China Plain' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', lat: 43.0618, lng: 141.3545, climateZone: 'Temperate', defaultSoil: 'Loamy', regionHint: 'Hokkaido Plains' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', lat: 10.0452, lng: 105.7469, climateZone: 'Tropical', defaultSoil: 'Silt', regionHint: 'Mekong Delta' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', lat: -7.2575, lng: 112.7521, climateZone: 'Tropical', defaultSoil: 'Loamy', regionHint: 'East Java' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', lat: 14.3532, lng: 100.5689, climateZone: 'Tropical', defaultSoil: 'Clay', regionHint: 'Chao Phraya Basin' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', lat: -35.1082, lng: 147.3598, climateZone: 'Semi-Arid', defaultSoil: 'Sandy', regionHint: 'Riverina Wheat Belt' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', lat: -43.532, lng: 172.6362, climateZone: 'Temperate', defaultSoil: 'Loamy', regionHint: 'Canterbury Plains' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', lat: -0.3031, lng: 36.08, climateZone: 'Subtropical', defaultSoil: 'Loamy', regionHint: 'Rift Valley Highlands' },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', lat: 8.54, lng: 39.27, climateZone: 'Subtropical', defaultSoil: 'Clay', regionHint: 'Oromia Highlands' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', lat: 10.5105, lng: 7.4165, climateZone: 'Tropical', defaultSoil: 'Sandy', regionHint: 'Kaduna Savanna' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', lat: 7.9465, lng: -1.0232, climateZone: 'Tropical', defaultSoil: 'Loamy', regionHint: 'Bono Food Belt' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', lat: -28.4793, lng: 26.2041, climateZone: 'Semi-Arid', defaultSoil: 'Sandy', regionHint: 'Free State Grain Belt' },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳', lat: 14.1652, lng: -16.0758, climateZone: 'Semi-Arid', defaultSoil: 'Sandy', regionHint: 'Peanut Basin' },
  { code: 'JO', name: 'Jordan', flag: '🇯🇴', lat: 32.5568, lng: 35.8469, climateZone: 'Semi-Arid', defaultSoil: 'Clay', regionHint: 'Jordan Valley' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', lat: 26.326, lng: 43.975, climateZone: 'Semi-Arid', defaultSoil: 'Sandy', regionHint: 'Al-Qassim Oasis' },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧', lat: 33.8463, lng: 35.902, climateZone: 'Mediterranean', defaultSoil: 'Loamy', regionHint: 'Bekaa Valley' },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', lat: 44.4268, lng: 26.1025, climateZone: 'Continental', defaultSoil: 'Loamy', regionHint: 'Wallachian Plain' },
];

export function findCountryByCode(code: string): CountryOption {
  return GLOBAL_COUNTRIES.find((c) => c.code === code) ?? GLOBAL_COUNTRIES[0];
}
