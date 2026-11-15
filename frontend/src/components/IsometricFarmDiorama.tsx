import React, { useEffect, useRef, useState } from 'react';
import {
  CloudRain,
  Droplets,
  Flame,
  Leaf,
  Pause,
  Play,
  RotateCw,
  Snowflake,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from 'lucide-react';
import { FarmerProfile, NasaPowerDataset, UnifiedSeasonStep } from '../types/farm';
import { FarmLocalClock } from '../utils/farmLocalClock';
import { useTheme } from '../context/ThemeContext';

export type DioramaWeatherMode = 'normal' | 'rain' | 'drought' | 'heatwave' | 'frost';
export type DioramaSeasonOfYear = 'Winter' | 'Spring' | 'Summer' | 'Autumn';

export interface FarmDioramaFrame {
  id: string;
  label: string;
  dateLabel: string;
  era: 'past' | 'today' | 'future';
  seasonOfYear?: DioramaSeasonOfYear;
  cropName: string;
  cropFamily: string;
  cropColor: string;
  /** 0.22 (fresh sprouts) to 1.0 (full mature bloom / harvest ready) */
  growthStage: number;
  growthLabel: string;
  weatherMode: DioramaWeatherMode;
  rainfallMm: number;
  /** Unit shown in the weather badge (e.g. 'mm' for seasonal rain or 'mm/yr' for annual) */
  rainfallUnitLabel?: string;
  /** 0.3..1.0 rain intensity scaling rainfall streaks, clouds & puddles when weatherMode === 'rain' */
  rainIntensity?: number;
  tempC: number;
  moisturePct: number;
  soilRichnessScore: number;
  /** Optional Soil Organic Matter (%) synced with page graphs/cards */
  soilOrganicMatterPct?: number;
  /** 0..140 (% irrigation supply; 100 = normal) */
  irrigationSupplyPct?: number;
  /** -20..+50 (% compost / residue mulch) */
  organicInputBoostPct?: number;
  /** Storm / frost / wind / pest stress intensity */
  extremeRiskLevel?: 'low' | 'moderate' | 'severe';
  yieldTha?: number;
  summaryNote?: string;
}

interface IsometricFarmDioramaProps {
  frames: FarmDioramaFrame[];
  activeFrameIndex: number;
  onSelectFrame?: (idx: number) => void;
  /** Optional secondary Season selector bar (Winter / Spring / Summer / Autumn inside the chosen year) */
  seasonTabs?: {
    seasons: DioramaSeasonOfYear[];
    activeSeason: DioramaSeasonOfYear;
    onSelectSeason: (s: DioramaSeasonOfYear) => void;
    yearLabel: string;
    seasonDetails?: Partial<
      Record<
        DioramaSeasonOfYear,
        { weatherMode: DioramaWeatherMode; rainMm?: number }
      >
    >;
  };
  slopeDeg?: number;
  soilType?: string;
  irrigationType?: FarmerProfile['irrigationType'];
  areaHectares?: number;
  isAutoPlaying?: boolean;
  onToggleAutoPlay?: () => void;
  compact?: boolean;
  titleBadge?: string;
}

type CropVisualType = 'wheat' | 'legume' | 'sunflower' | 'corn' | 'produce' | 'cover';

export function inferCropFamily(cropName: string): string {
  const n = cropName.toLowerCase();
  if (/clover|vetch|rye|cover|alfalfa|mustard/.test(n)) return 'Cover Crop';
  if (/bean|pea|chickpea|lentil|soy|legume|lupin|fava/.test(n)) return 'Legume';
  if (/sunflower|canola|rapeseed|sesame|flax/.test(n)) return 'Oilseed';
  if (/tomato|pepper|pumpkin|melon|squash|potato|vegetable|onion|olive/.test(n)) return 'Vegetable';
  return 'Cereal';
}

function classifyCropVisual(cropName: string, cropFamily: string): CropVisualType {
  const n = cropName.toLowerCase();
  if (/sunflower/.test(n)) return 'sunflower';
  if (/corn|maize|sorghum|millet/.test(n)) return 'corn';
  if (/tomato|pepper|pumpkin|melon|squash|potato|vegetable|onion|olive/.test(n)) return 'produce';
  if (/clover|vetch|rye|cover|alfalfa|mustard/.test(n)) return 'cover';
  if (/bean|pea|chickpea|lentil|soy|legume|lupin|fava/.test(n)) return 'legume';
  if (cropFamily === 'Oilseed') return 'sunflower';
  if (cropFamily === 'Vegetable') return 'produce';
  if (cropFamily === 'Cover Crop') return 'cover';
  if (cropFamily === 'Legume') return 'legume';
  return 'wheat';
}

export function resolveWeatherMode(
  scenario?: string,
  rainChangePct = 0,
  tempDeltaC = 0
): DioramaWeatherMode {
  if (tempDeltaC <= -1.0) return 'frost';
  if (scenario === 'heatwave' || tempDeltaC >= 2.2) return 'heatwave';
  if (scenario === 'wet' || rainChangePct >= 15) return 'rain';
  if (scenario === 'drought' || rainChangePct <= -15) return 'drought';
  return 'normal';
}

export function resolveWeatherFromAnnualNasa(
  rainfallMm: number,
  meanRainMm: number,
  avgTempC: number
): DioramaWeatherMode {
  if (avgTempC <= 6) return 'frost';
  const ratio = meanRainMm > 0 ? rainfallMm / meanRainMm : 1;
  if (ratio <= 0.78) return 'drought';
  if (ratio >= 1.18) return 'rain';
  if (avgTempC >= 24.5 && ratio < 0.95) return 'heatwave';
  return 'normal';
}

export function getSeasonOfYearFromMonth(month0: number): DioramaSeasonOfYear {
  if (month0 === 11 || month0 <= 1) return 'Winter';
  if (month0 >= 2 && month0 <= 4) return 'Spring';
  if (month0 >= 5 && month0 <= 7) return 'Summer';
  return 'Autumn';
}

export interface SeasonalNasaClimate {
  seasonOfYear: DioramaSeasonOfYear;
  monthsLabel: string;
  seasonRainMm: number;
  heavyRainDays: number;
  frostDays: number;
  tempC: number;
  moisturePct: number;
  weatherMode: DioramaWeatherMode;
  hasRain: boolean;
  rainIntensity: number;
  growthStage: number;
  growthLabel: string;
}

const SEASON_META: Record<
  DioramaSeasonOfYear,
  {
    monthIndices: number[];
    monthsLabel: string;
    fallbackRainShare: number;
    fallbackTempOffset: number;
    fallbackMoistOffset: number;
    growthStage: number;
    growthLabel: string;
  }
> = {
  Winter: {
    monthIndices: [11, 0, 1],
    monthsLabel: 'Dec-Feb',
    fallbackRainShare: 0.36,
    fallbackTempOffset: -6.5,
    fallbackMoistOffset: 10,
    growthStage: 0.56,
    growthLabel: 'Winter Tillering',
  },
  Spring: {
    monthIndices: [2, 3, 4],
    monthsLabel: 'Mar-May',
    fallbackRainShare: 0.24,
    fallbackTempOffset: -0.5,
    fallbackMoistOffset: 6,
    growthStage: 0.84,
    growthLabel: 'Spring Bloom & Canopy',
  },
  Summer: {
    monthIndices: [5, 6, 7],
    monthsLabel: 'Jun-Aug',
    fallbackRainShare: 0.08,
    fallbackTempOffset: 7.5,
    fallbackMoistOffset: -14,
    growthStage: 0.98,
    growthLabel: 'Summer Harvest Maturity',
  },
  Autumn: {
    monthIndices: [8, 9, 10],
    monthsLabel: 'Sep-Nov',
    fallbackRainShare: 0.32,
    fallbackTempOffset: 0.5,
    fallbackMoistOffset: 0,
    growthStage: 0.38,
    growthLabel: 'Autumn Sowing & Sprouts',
  },
};

/**
 * Computes real 3-month seasonal NASA climate (rainfall, temperature, soil moisture, frost/heavy-rain days)
 * for any specific historical or projected year by scaling NASA POWER monthly climatology to that year's archive.
 */
export function computeSeasonalNasaClimate(
  nasa: NasaPowerDataset,
  yearAnnualRainMm: number,
  yearAvgTempC: number,
  yearRootMoisturePct: number,
  seasonOfYear: DioramaSeasonOfYear
): SeasonalNasaClimate {
  const meta = SEASON_META[seasonOfYear];
  const monthly = nasa.monthly ?? [];
  const riskRows = nasa.riskCalendarMonthly ?? [];

  const annualFromMonthly = monthly.reduce((acc, m) => acc + Math.max(0, m.rainMmMonth), 0);
  const baseAnnualRain = annualFromMonthly > 20 ? annualFromMonthly : nasa.annualRainMm || 480;
  const yearRainScale = Math.max(0.35, Math.min(2.1, yearAnnualRainMm / Math.max(80, baseAnnualRain)));

  let seasonRainMm = Math.round(yearAnnualRainMm * meta.fallbackRainShare);
  let tempC = Number((yearAvgTempC + meta.fallbackTempOffset).toFixed(1));
  let moisturePct = Math.max(15, Math.min(95, Math.round(yearRootMoisturePct + meta.fallbackMoistOffset)));

  if (monthly.length === 12) {
    const picked = meta.monthIndices.map((idx) => monthly[idx]).filter(Boolean);
    if (picked.length === 3) {
      const baseSeasonRain = picked.reduce((acc, m) => acc + Math.max(0, m.rainMmMonth), 0);
      seasonRainMm = Math.max(0, Math.round(baseSeasonRain * yearRainScale));

      const baseAvgT = picked.reduce((acc, m) => acc + m.tempC, 0) / 3;
      const yearTempAnomaly = yearAvgTempC - nasa.avgTempC;
      tempC = Number((baseAvgT + yearTempAnomaly).toFixed(1));

      const baseMoist = picked.reduce((acc, m) => acc + m.rootWetnessPct, 0) / 3;
      const yearMoistAnomaly = yearRootMoisturePct - nasa.rootMoisturePct;
      moisturePct = Math.max(
        15,
        Math.min(95, Math.round(baseMoist + yearMoistAnomaly * 0.65 + (yearRainScale - 1) * 14))
      );
    }
  }

  let heavyRainDays = 0;
  let frostDays = 0;
  if (riskRows.length === 12) {
    for (const idx of meta.monthIndices) {
      const row = riskRows[idx];
      if (!row) continue;
      heavyRainDays += (row.heavyRainDaysPerYr || 0) * yearRainScale;
      frostDays += row.frostDaysPerYr || 0;
    }
  }
  heavyRainDays = Number(heavyRainDays.toFixed(1));
  frostDays = Number(frostDays.toFixed(1));

  let weatherMode: DioramaWeatherMode = 'normal';
  if (tempC <= 4.0 || frostDays >= 4.0) {
    weatherMode = 'frost';
  } else if (seasonRainMm >= 75 || heavyRainDays >= 0.7) {
    weatherMode = 'rain';
  } else if (tempC >= 28.5 && seasonRainMm < 45) {
    weatherMode = 'heatwave';
  } else if (seasonRainMm <= 38 || moisturePct <= 33) {
    weatherMode = 'drought';
  }

  const hasRain = weatherMode === 'rain';
  const rainIntensity = hasRain ? Number(Math.max(0.42, Math.min(1, seasonRainMm / 190)).toFixed(2)) : 0;

  return {
    seasonOfYear,
    monthsLabel: meta.monthsLabel,
    seasonRainMm,
    heavyRainDays,
    frostDays,
    tempC,
    moisturePct,
    weatherMode,
    hasRain,
    rainIntensity,
    growthStage: meta.growthStage,
    growthLabel: meta.growthLabel,
  };
}

/**
 * Computes date-accurate crop phenology (0.28..1.0) from the farm's real local calendar month
 * so Today (e.g. Nov 15) shows realistic autumn early sprouting instead of out-of-season ripe grain.
 */
export function computeDateAccurateGrowth(
  farmDate: FarmLocalClock,
  seasonIndex: number,
  step: UnifiedSeasonStep
): {
  growthStage: number;
  growthLabel: string;
  dateLabel: string;
  seasonOfYear: DioramaSeasonOfYear;
} {
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (seasonIndex === 0) {
    const m = farmDate.monthIndex;
    const dayFrac = farmDate.dayOfMonth / 30;
    let stage = 0.42;
    let label = 'Early Sprouting';
    if (m === 9) {
      stage = 0.28 + dayFrac * 0.1;
      label = 'Freshly Sown Sprouts';
    } else if (m === 10) {
      stage = 0.36 + dayFrac * 0.14;
      label = 'Early Sprouting';
    } else if (m === 11 || m === 0) {
      stage = 0.52 + dayFrac * 0.1;
      label = 'Winter Tillering';
    } else if (m === 1 || m === 2) {
      stage = 0.68 + dayFrac * 0.1;
      label = 'Active Canopy Growth';
    } else if (m === 3 || m === 4) {
      stage = 0.86 + dayFrac * 0.08;
      label = 'Flowering & Heading';
    } else if (m === 5 || m === 6) {
      stage = 0.98;
      label = 'Harvest Maturity';
    } else {
      stage = 0.55;
      label = 'Warm-Season Growth';
    }
    return {
      growthStage: Number(Math.min(1, stage).toFixed(2)),
      growthLabel: label,
      dateLabel: `Today · ${farmDate.shortDate}`,
      seasonOfYear: getSeasonOfYearFromMonth(m),
    };
  }

  const futureAbsMonth = farmDate.year * 12 + farmDate.monthIndex + seasonIndex * 6;
  const fYr = Math.floor(futureAbsMonth / 12);
  const fMo = ((futureAbsMonth % 12) + 12) % 12;
  const stageLabels = [
    { g: 0.78, label: 'Mid-Season Canopy' },
    { g: 0.9, label: 'Peak Flowering' },
    { g: 0.96, label: 'Full Cover & Maturity' },
  ];
  const pick = stageLabels[(seasonIndex - 1) % stageLabels.length];
  return {
    growthStage: pick.g,
    growthLabel: step.cropFamily === 'Cover Crop' ? 'Dense Living Cover' : pick.label,
    dateLabel: `${MONTHS[fMo]} ${fYr} · Season ${step.stepNumber}`,
    seasonOfYear: getSeasonOfYearFromMonth(fMo),
  };
}

interface Projected {
  x: number;
  y: number;
}

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  len: number;
}

interface SplashRing {
  x: number;
  z: number;
  age: number;
  maxAge: number;
}

interface LeafParticle {
  x: number;
  y: number;
  z: number;
  vx: number;
  rot: number;
  vrot: number;
  color: string;
  size: number;
}

interface SnowFlake {
  x: number;
  y: number;
  r: number;
  speed: number;
  phase: number;
}

interface DustMote {
  x: number;
  y: number;
  r: number;
  vx: number;
  phase: number;
}

function getSoilPalette(
  soilType: string,
  isWet: boolean,
  isDry: boolean,
  organicBoost: number
): { top: string; sideL: string; sideR: string; speckle: string } {
  const s = soilType.toLowerCase();
  const darken = organicBoost >= 15;
  if (s.includes('sandy')) {
    return isDry
      ? { top: '#B58E5A', sideL: '#967242', sideR: '#7D5E34', speckle: '#D6B682' }
      : isWet
        ? { top: '#785A35', sideL: '#614728', sideR: '#4E391F', speckle: '#9E7D52' }
        : { top: darken ? '#84653E' : '#9C7B4E', sideL: '#7C5F38', sideR: '#664D2C', speckle: '#C4A270' };
  }
  if (s.includes('clay')) {
    return isDry
      ? { top: '#9E5D3D', sideL: '#7D452B', sideR: '#663620', speckle: '#BA7A58' }
      : isWet
        ? { top: '#5B3422', sideL: '#472719', sideR: '#381E12', speckle: '#784932' }
        : { top: darken ? '#6B3D28' : '#804A31', sideL: '#663924', sideR: '#522C1B', speckle: '#A36647' };
  }
  if (s.includes('peaty')) {
    return isDry
      ? { top: '#594235', sideL: '#453227', sideR: '#36261D', speckle: '#785E4E' }
      : { top: '#36251C', sideL: '#291B14', sideR: '#1F140E', speckle: '#543C2F' };
  }
  if (s.includes('silt')) {
    return isDry
      ? { top: '#947B56', sideL: '#786141', sideR: '#634F33', speckle: '#B39B74' }
      : isWet
        ? { top: '#594731', sideL: '#473825', sideR: '#382B1C', speckle: '#756044' }
        : { top: darken ? '#645036' : '#786245', sideL: '#5E4B33', sideR: '#4D3D28', speckle: '#968060' };
  }
  // Loamy default
  return isDry
    ? { top: '#805E43', sideL: '#664932', sideR: '#523925', speckle: '#A37E5D' }
    : isWet
      ? { top: '#433022', sideL: '#332318', sideR: '#261A11', speckle: '#5E4634' }
      : { top: darken ? '#4D3727' : '#5E4431', sideL: '#483324', sideR: '#39281B', speckle: '#7A5C44' };
}

type RGB = [number, number, number];

function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbCss(c: RGB, alpha = 1): string {
  const r = Math.round(Math.max(0, Math.min(255, c[0])));
  const g = Math.round(Math.max(0, Math.min(255, c[1])));
  const b = Math.round(Math.max(0, Math.min(255, c[2])));
  return alpha >= 0.995 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
}

function lerpVal(cur: number, target: number, k: number): number {
  return cur + (target - cur) * k;
}

function lerpRgb(cur: RGB, target: RGB, k: number): RGB {
  return [
    cur[0] + (target[0] - cur[0]) * k,
    cur[1] + (target[1] - cur[1]) * k,
    cur[2] + (target[2] - cur[2]) * k,
  ];
}

function scaleRgb(c: RGB, mult: number): RGB {
  return [c[0] * mult, c[1] * mult, c[2] * mult];
}

interface SmoothWeatherTarget {
  skyTop: RGB;
  skyMid: RGB;
  skyBot: RGB;
  sunXFrac: number;
  sunYFrac: number;
  sunIntensity: number;
  sunDiskAlpha: number;
  starAlpha: number;
  cloudLight: RGB;
  cloudDark: RGB;
  cloudAlphas: [number, number, number, number];
  cloudSpeed: number;
  rainAlpha: number;
  rainStrength: number;
  snowAlpha: number;
  heatAlpha: number;
  droughtAlpha: number;
  frostAlpha: number;
  moisturePct: number;
  irrigationSupply: number;
  organicBoost: number;
  soilRichness: number;
  growthStage: number;
  windAmp: number;
  wateringAlpha: number;
  droughtStress: number;
  grassRgb: RGB;
  borderTopRgb: RGB;
  soilTopRgb: RGB;
  soilSideLRgb: RGB;
  soilSideRRgb: RGB;
  fenceTopRgb: RGB;
}

function buildWeatherTargets(
  frame: FarmDioramaFrame,
  soilType: string,
  irrigationType: FarmerProfile['irrigationType'],
  isDark: boolean
): SmoothWeatherTarget {
  const weatherMode = frame.weatherMode;
  const seasonOfYear = frame.seasonOfYear ?? 'Spring';
  const moisturePct = frame.moisturePct;
  const soilRichness = frame.soilRichnessScore;
  const irrigationSupply = frame.irrigationSupplyPct ?? 100;
  const organicBoost = frame.organicInputBoostPct ?? 0;
  const stressLevel = frame.extremeRiskLevel ?? 'low';
  const growthStage = Math.max(0.24, Math.min(1, frame.growthStage));

  const isDry = weatherMode === 'drought' || weatherMode === 'heatwave' || moisturePct < 38;
  const isWet = weatherMode === 'rain' || moisturePct >= 66;
  const isWatering =
    irrigationType !== 'Rain-fed' &&
    weatherMode !== 'rain' &&
    weatherMode !== 'frost' &&
    irrigationSupply >= 30;
  const droughtStress =
    isDry && irrigationSupply < 75
      ? Math.min(1, (75 - irrigationSupply) / 55 + 0.25)
      : isDry
        ? 0.28
        : 0;

  let skyTopHex = '#EEE5AB';
  let skyMidHex = '#E7DCA5';
  let skyBotHex = '#DDD19D';

  if (isDark) {
    if (weatherMode === 'rain') {
      skyTopHex = '#101B27';
      skyMidHex = '#172838';
      skyBotHex = '#1C2E39';
    } else if (weatherMode === 'heatwave') {
      skyTopHex = '#331E12';
      skyMidHex = '#4B2B17';
      skyBotHex = '#3A281A';
    } else if (weatherMode === 'drought') {
      skyTopHex = '#292218';
      skyMidHex = '#382E1E';
      skyBotHex = '#2C271E';
    } else if (weatherMode === 'frost') {
      skyTopHex = '#112233';
      skyMidHex = '#1A344B';
      skyBotHex = '#203847';
    } else if (seasonOfYear === 'Winter') {
      skyTopHex = '#121E2A';
      skyMidHex = '#1A2B38';
      skyBotHex = '#1E2C30';
    } else if (seasonOfYear === 'Autumn') {
      skyTopHex = '#241E19';
      skyMidHex = '#31271F';
      skyBotHex = '#27241D';
    } else {
      skyTopHex = '#122026';
      skyMidHex = '#1A2D33';
      skyBotHex = '#1F312C';
    }
  } else if (weatherMode === 'rain') {
    skyTopHex = '#9DB7C8';
    skyMidHex = '#BDD0DA';
    skyBotHex = '#CED8C8';
  } else if (weatherMode === 'heatwave') {
    skyTopHex = '#F7C95C';
    skyMidHex = '#F0B654';
    skyBotHex = '#E0AF70';
  } else if (weatherMode === 'drought') {
    skyTopHex = '#F4DB8A';
    skyMidHex = '#E9CE8E';
    skyBotHex = '#DEC285';
  } else if (weatherMode === 'frost') {
    skyTopHex = '#BDD9EC';
    skyMidHex = '#D8E9F4';
    skyBotHex = '#D8E3E8';
  } else if (seasonOfYear === 'Winter') {
    skyTopHex = '#D4E4EC';
    skyMidHex = '#E2E9DC';
    skyBotHex = '#DCDCC4';
  } else if (seasonOfYear === 'Autumn') {
    skyTopHex = '#EEDAA2';
    skyMidHex = '#E7D19A';
    skyBotHex = '#DCC796';
  }

  const activeClouds =
    weatherMode === 'rain' ? 4 : weatherMode === 'heatwave' ? 1 : weatherMode === 'drought' ? 2 : 3;
  const cloudAlphas: [number, number, number, number] = [
    activeClouds >= 1 ? 1 : 0,
    activeClouds >= 2 ? 1 : 0,
    activeClouds >= 3 ? 1 : 0,
    activeClouds >= 4 ? 1 : 0,
  ];

  const cloudLightHex = isDark
    ? weatherMode === 'rain'
      ? '#334654'
      : weatherMode === 'frost'
        ? '#4D6B80'
        : weatherMode === 'heatwave'
          ? '#6B4F37'
          : '#3E5552'
    : weatherMode === 'rain'
      ? '#6D8896'
      : weatherMode === 'frost'
        ? '#DCEBF3'
        : weatherMode === 'heatwave'
          ? '#F0E6CC'
          : '#B7CAC0';

  const cloudDarkHex = isDark
    ? weatherMode === 'rain'
      ? '#1E2D38'
      : weatherMode === 'frost'
        ? '#314757'
        : '#273837'
    : weatherMode === 'rain'
      ? '#475F6D'
      : weatherMode === 'frost'
        ? '#A9C2CF'
        : '#8EA69C';

  const soilPal = getSoilPalette(soilType, isWet, isDry, organicBoost);
  const borderTopHex =
    weatherMode === 'frost'
      ? '#9FA49A'
      : isDry
        ? '#B08F5E'
        : isWet
          ? '#755D3C'
          : '#91764F';
  const grassHex =
    weatherMode === 'frost'
      ? '#82A088'
      : isDry
        ? '#8A913D'
        : seasonOfYear === 'Autumn'
          ? '#648F33'
          : '#478C30';

  return {
    skyTop: hexToRgb(skyTopHex),
    skyMid: hexToRgb(skyMidHex),
    skyBot: hexToRgb(skyBotHex),
    sunXFrac: seasonOfYear === 'Summer' ? 0.22 : seasonOfYear === 'Winter' ? 0.11 : 0.15,
    sunYFrac: seasonOfYear === 'Summer' ? 0.14 : seasonOfYear === 'Winter' ? 0.24 : 0.18,
    sunIntensity:
      weatherMode === 'heatwave'
        ? 1.35
        : weatherMode === 'drought'
          ? 1.18
          : weatherMode === 'rain'
            ? 0.22
            : weatherMode === 'frost'
              ? 0.55
              : 0.95,
    sunDiskAlpha: weatherMode === 'rain' ? 0 : 1,
    starAlpha: isDark ? (weatherMode === 'rain' ? 0.08 : weatherMode === 'heatwave' ? 0.45 : 0.72) : 0,
    cloudLight: hexToRgb(cloudLightHex),
    cloudDark: hexToRgb(cloudDarkHex),
    cloudAlphas,
    cloudSpeed: weatherMode === 'rain' ? 0.55 : stressLevel === 'severe' ? 0.65 : 0.28,
    rainAlpha: weatherMode === 'rain' ? 1 : 0,
    rainStrength: weatherMode === 'rain' ? (frame.rainIntensity ?? 0.8) : 0.35,
    snowAlpha: weatherMode === 'frost' ? 1 : 0,
    heatAlpha: weatherMode === 'heatwave' ? 1 : 0,
    droughtAlpha: isDry ? 1 : 0,
    frostAlpha: weatherMode === 'frost' ? 1 : 0,
    moisturePct,
    irrigationSupply,
    organicBoost,
    soilRichness,
    growthStage,
    windAmp:
      (stressLevel === 'severe' ? 0.2 : weatherMode === 'rain' ? 0.15 : 0.085) *
      (weatherMode === 'heatwave' ? 0.65 : 1),
    wateringAlpha: isWatering ? 1 : 0,
    droughtStress,
    grassRgb: hexToRgb(grassHex),
    borderTopRgb: hexToRgb(borderTopHex),
    soilTopRgb: hexToRgb(soilPal.top),
    soilSideLRgb: hexToRgb(soilPal.sideL),
    soilSideRRgb: hexToRgb(soilPal.sideR),
    fenceTopRgb: hexToRgb(weatherMode === 'frost' ? '#CFE0E8' : '#966E4E'),
  };
}

export const IsometricFarmDiorama: React.FC<IsometricFarmDioramaProps> = ({
  frames,
  activeFrameIndex,
  onSelectFrame,
  seasonTabs,
  slopeDeg = 3,
  soilType = 'Loamy',
  irrigationType = 'Drip',
  areaHectares = 24,
  isAutoPlaying = false,
  onToggleAutoPlay,
  compact = false,
  titleBadge,
}) => {
  const { isDark } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yawOffset, setYawOffset] = useState(0);
  const dragRef = useRef<{ active: boolean; startX: number; baseYaw: number }>({
    active: false,
    startX: 0,
    baseYaw: 0,
  });

  const safeFrames: FarmDioramaFrame[] =
    frames.length > 0
      ? frames
      : [
          {
            id: 'default',
            label: 'Today',
            dateLabel: 'Live Field',
            era: 'today',
            seasonOfYear: 'Autumn',
            cropName: 'Durum Wheat',
            cropFamily: 'Cereal',
            cropColor: '#EBB40E',
            growthStage: 0.72,
            growthLabel: 'Active Growth',
            weatherMode: 'normal',
            rainfallMm: 510,
            tempC: 19,
            moisturePct: 58,
            soilRichnessScore: 76,
            irrigationSupplyPct: 100,
            organicInputBoostPct: 0,
            extremeRiskLevel: 'low',
          },
        ];

  const activeFrame = safeFrames[Math.min(activeFrameIndex, safeFrames.length - 1)] ?? safeFrames[0];

  // Keep latest props in a mutable ref so ONE persistent 60 FPS loop smoothly interpolates every weather/season/theme change!
  const livePropsRef = useRef({
    activeFrame,
    slopeDeg,
    soilType,
    irrigationType,
    yawOffset,
    isDark,
  });
  livePropsRef.current = {
    activeFrame,
    slopeDeg,
    soilType,
    irrigationType,
    yawOffset,
    isDark,
  };

  // Trigger planting growth wave ONLY when crop species changes (never stutter on weather changes!)
  const cropWaveRef = useRef<{ cropKey: string; startedAt: number }>({
    cropKey: activeFrame.cropName,
    startedAt: performance.now(),
  });

  useEffect(() => {
    if (cropWaveRef.current.cropKey !== activeFrame.cropName) {
      cropWaveRef.current = {
        cropKey: activeFrame.cropName,
        startedAt: performance.now(),
      };
    }
  }, [activeFrame.cropName]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let lastNow = performance.now();

    // Smoothly interpolated visual state (starts immediately at initial frame targets)
    const initProps = livePropsRef.current;
    const curState: SmoothWeatherTarget = buildWeatherTargets(
      initProps.activeFrame,
      initProps.soilType,
      initProps.irrigationType,
      initProps.isDark
    );
    let curYaw = initProps.yawOffset;

    const rainDrops: RainDrop[] = Array.from({ length: 110 }, () => ({
      x: Math.random() * 1020,
      y: Math.random() * 540,
      speed: 7.4 + Math.random() * 6.2,
      len: 13 + Math.random() * 15,
    }));

    const splashes: SplashRing[] = Array.from({ length: 22 }, () => ({
      x: -3.2 + Math.random() * 6.4,
      z: -3.2 + Math.random() * 6.4,
      age: Math.random(),
      maxAge: 0.6 + Math.random() * 0.45,
    }));

    const snowFlakes: SnowFlake[] = Array.from({ length: 70 }, () => ({
      x: Math.random() * 1020,
      y: Math.random() * 540,
      r: 1.7 + Math.random() * 2.5,
      speed: 0.65 + Math.random() * 1.15,
      phase: Math.random() * Math.PI * 2,
    }));

    const dustMotes: DustMote[] = Array.from({ length: 34 }, () => ({
      x: Math.random() * 1020,
      y: 120 + Math.random() * 340,
      r: 1.2 + Math.random() * 2.2,
      vx: 0.6 + Math.random() * 1.3,
      phase: Math.random() * Math.PI * 2,
    }));

    const stars = Array.from({ length: 38 }, (_, i) => ({
      xFrac: ((i * 37.3 + 11) % 96) / 100 + 0.02,
      yFrac: ((i * 19.7 + 7) % 36) / 100 + 0.03,
      r: 0.8 + (i % 3) * 0.55,
      phase: i * 1.13,
    }));

    const leaves: LeafParticle[] = Array.from({ length: 18 }, (_, i) => ({
      x: -3.8 + Math.random() * 7.6,
      y: 0.9 + Math.random() * 2.1,
      z: -3.4 + Math.random() * 6.8,
      vx: 0.008 + Math.random() * 0.012,
      rot: Math.random() * Math.PI * 2,
      vrot: (Math.random() - 0.5) * 0.08,
      color: i % 2 === 0 ? '#79C93A' : '#E3BC34',
      size: 3.8 + Math.random() * 3.2,
    }));

    const renderFrame = (now: number) => {
      const dt = Math.min(0.08, Math.max(0.004, (now - lastNow) * 0.001));
      lastNow = now;

      const {
        activeFrame: frame,
        slopeDeg: curSlopeDeg,
        soilType: curSoilType,
        irrigationType: curIrrigationType,
        yawOffset: targetYaw,
        isDark: curIsDark,
      } = livePropsRef.current;

      const target = buildWeatherTargets(frame, curSoilType, curIrrigationType, curIsDark);

      // Exponential smoothing factors: silky ~0.85s weather morphs, crisp ~0.35s orbit drag
      const kWeather = 1 - Math.exp(-dt * 2.8);
      const kFast = 1 - Math.exp(-dt * 6.5);

      curYaw = lerpVal(curYaw, targetYaw, kFast);
      curState.skyTop = lerpRgb(curState.skyTop, target.skyTop, kWeather);
      curState.skyMid = lerpRgb(curState.skyMid, target.skyMid, kWeather);
      curState.skyBot = lerpRgb(curState.skyBot, target.skyBot, kWeather);
      curState.sunXFrac = lerpVal(curState.sunXFrac, target.sunXFrac, kWeather);
      curState.sunYFrac = lerpVal(curState.sunYFrac, target.sunYFrac, kWeather);
      curState.sunIntensity = lerpVal(curState.sunIntensity, target.sunIntensity, kWeather);
      curState.sunDiskAlpha = lerpVal(curState.sunDiskAlpha, target.sunDiskAlpha, kWeather);
      curState.starAlpha = lerpVal(curState.starAlpha, target.starAlpha, kWeather);
      curState.cloudLight = lerpRgb(curState.cloudLight, target.cloudLight, kWeather);
      curState.cloudDark = lerpRgb(curState.cloudDark, target.cloudDark, kWeather);
      for (let ci = 0; ci < 4; ci += 1) {
        curState.cloudAlphas[ci] = lerpVal(curState.cloudAlphas[ci], target.cloudAlphas[ci], kWeather);
      }
      curState.cloudSpeed = lerpVal(curState.cloudSpeed, target.cloudSpeed, kWeather);
      curState.rainAlpha = lerpVal(curState.rainAlpha, target.rainAlpha, kWeather);
      curState.rainStrength = lerpVal(curState.rainStrength, target.rainStrength, kWeather);
      curState.snowAlpha = lerpVal(curState.snowAlpha, target.snowAlpha, kWeather);
      curState.heatAlpha = lerpVal(curState.heatAlpha, target.heatAlpha, kWeather);
      curState.droughtAlpha = lerpVal(curState.droughtAlpha, target.droughtAlpha, kWeather);
      curState.frostAlpha = lerpVal(curState.frostAlpha, target.frostAlpha, kWeather);
      curState.moisturePct = lerpVal(curState.moisturePct, target.moisturePct, kWeather);
      curState.irrigationSupply = lerpVal(curState.irrigationSupply, target.irrigationSupply, kWeather);
      curState.organicBoost = lerpVal(curState.organicBoost, target.organicBoost, kWeather);
      curState.soilRichness = lerpVal(curState.soilRichness, target.soilRichness, kWeather);
      curState.growthStage = lerpVal(curState.growthStage, target.growthStage, kWeather);
      curState.windAmp = lerpVal(curState.windAmp, target.windAmp, kWeather);
      curState.wateringAlpha = lerpVal(curState.wateringAlpha, target.wateringAlpha, kWeather);
      curState.droughtStress = lerpVal(curState.droughtStress, target.droughtStress, kWeather);
      curState.grassRgb = lerpRgb(curState.grassRgb, target.grassRgb, kWeather);
      curState.borderTopRgb = lerpRgb(curState.borderTopRgb, target.borderTopRgb, kWeather);
      curState.soilTopRgb = lerpRgb(curState.soilTopRgb, target.soilTopRgb, kWeather);
      curState.soilSideLRgb = lerpRgb(curState.soilSideLRgb, target.soilSideLRgb, kWeather);
      curState.soilSideRRgb = lerpRgb(curState.soilSideRRgb, target.soilSideRRgb, kWeather);
      curState.fenceTopRgb = lerpRgb(curState.fenceTopRgb, target.fenceTopRgb, kWeather);

      const cropVisual = classifyCropVisual(frame.cropName, frame.cropFamily);
      const seasonOfYear = frame.seasonOfYear ?? 'Spring';
      const slopeNorm = Math.min(1, Math.max(0, curSlopeDeg / 14));

      const terrainHeight = (x: number, z: number): number => {
        const slopeLift = (-(x + z) / 8.8) * (0.14 + slopeNorm * 0.48);
        const microWave = Math.sin(x * 0.8 + z * 0.6) * 0.028;
        return slopeLift + microWave;
      };

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width));
      const h = Math.max(260, Math.round(rect.height));

      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      const t = now * 0.001;
      const elapsedMs = now - cropWaveRef.current.startedAt;

      const angle = Math.PI / 4 + curYaw + Math.sin(t * 0.28) * 0.022;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const scale = Math.min(w / 14.3, h / 10.5);
      const originX = w * 0.5;
      const originY = h * 0.66;

      const project = (x: number, y: number, z: number): Projected => {
        const rx = x * cosA - z * sinA;
        const rz = x * sinA + z * cosA;
        return {
          x: originX + rx * scale,
          y: originY + rz * scale * 0.51 - y * scale * 0.94,
        };
      };

      const fillPoly = (pts: Projected[], fill: string, stroke?: string, lineWidth = 0.75) => {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fillStyle = fill;
        ctx.fill();
        if (stroke) {
          ctx.strokeStyle = stroke;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      };

      const drawSlopedPrism = (
        x0: number,
        z0: number,
        x1: number,
        z1: number,
        yBotOffset: number,
        yTopOffset: number,
        topColor: string,
        leftColor: string,
        rightColor: string
      ) => {
        const h00 = terrainHeight(x0, z0);
        const h10 = terrainHeight(x1, z0);
        const h11 = terrainHeight(x1, z1);
        const h01 = terrainHeight(x0, z1);

        const p00t = project(x0, h00 + yTopOffset, z0);
        const p10t = project(x1, h10 + yTopOffset, z0);
        const p11t = project(x1, h11 + yTopOffset, z1);
        const p01t = project(x0, h01 + yTopOffset, z1);

        const p10b = project(x1, h10 + yBotOffset, z0);
        const p11b = project(x1, h11 + yBotOffset, z1);
        const p01b = project(x0, h01 + yBotOffset, z1);

        fillPoly([p01t, p11t, p11b, p01b], leftColor);
        fillPoly([p10t, p11t, p11b, p10b], rightColor);
        fillPoly([p00t, p10t, p11t, p01t], topColor);
      };

      // ================================================================
      // 1. SMOOTHLY MORPHING ATMOSPHERIC SKY + TWILIGHT STARS + SUN/MOON
      // ================================================================
      const skyGrad = ctx.createLinearGradient(0, 0, w * 0.7, h);
      skyGrad.addColorStop(0, rgbCss(curState.skyTop));
      skyGrad.addColorStop(0.55, rgbCss(curState.skyMid));
      skyGrad.addColorStop(1, rgbCss(curState.skyBot));
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle twinkling stars in Dark Mode when skies are clear
      if (curState.starAlpha > 0.02) {
        for (const st of stars) {
          const twinkle = 0.55 + 0.45 * Math.sin(t * 2.1 + st.phase);
          ctx.fillStyle = `rgba(240, 248, 255, ${(curState.starAlpha * twinkle).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(w * st.xFrac, h * st.yFrac, st.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Smoothly arcing Sun / Dusk Glow
      const sunX = w * curState.sunXFrac;
      const sunY = h * curState.sunYFrac;
      if (curState.sunIntensity > 0.15) {
        const pulse = 1 + Math.sin(t * 2.1) * 0.06;
        const glowR = 64 * curState.sunIntensity * pulse;
        const glow = ctx.createRadialGradient(sunX, sunY, 5, sunX, sunY, glowR);
        const glowCore = curIsDark
          ? curState.heatAlpha > 0.4
            ? `rgba(245, 158, 11, ${(0.72 * curState.sunDiskAlpha + 0.15).toFixed(2)})`
            : `rgba(226, 238, 255, ${(0.52 * curState.sunDiskAlpha + 0.12).toFixed(2)})`
          : curState.heatAlpha > 0.4
            ? `rgba(255, 178, 28, ${(0.95 * curState.sunDiskAlpha + 0.15).toFixed(2)})`
            : `rgba(255, 224, 96, ${(0.88 * curState.sunDiskAlpha + 0.15).toFixed(2)})`;
        glow.addColorStop(0, glowCore);
        glow.addColorStop(0.45, curIsDark ? 'rgba(180, 210, 245, 0.16)' : 'rgba(255, 210, 82, 0.28)');
        glow.addColorStop(1, 'rgba(255, 210, 82, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sunX, sunY, glowR, 0, Math.PI * 2);
        ctx.fill();

        if (curState.sunDiskAlpha > 0.03) {
          const coreR = 14 * Math.min(1.35, curState.sunIntensity);
          ctx.save();
          ctx.globalAlpha = curState.sunDiskAlpha;

          if (!curIsDark || curState.heatAlpha > 0.35) {
            ctx.save();
            ctx.translate(sunX, sunY);
            ctx.rotate(t * (0.22 + curState.heatAlpha * 0.35));
            ctx.strokeStyle =
              curState.heatAlpha > 0.4
                ? 'rgba(245, 158, 11, 0.72)'
                : curState.frostAlpha > 0.4
                  ? 'rgba(255, 255, 255, 0.45)'
                  : 'rgba(235, 180, 14, 0.58)';
            ctx.lineWidth = 2.1 + curState.heatAlpha * 0.7;
            ctx.lineCap = 'round';
            for (let r = 0; r < 10; r += 1) {
              const a = (r / 10) * Math.PI * 2;
              const rIn = coreR + 5;
              const rOut = coreR + 11 + curState.heatAlpha * 7 + (r % 2) * 4;
              ctx.beginPath();
              ctx.moveTo(Math.cos(a) * rIn, Math.sin(a) * rIn);
              ctx.lineTo(Math.cos(a) * rOut, Math.sin(a) * rOut);
              ctx.stroke();
            }
            ctx.restore();
          }

          const sunBody = ctx.createRadialGradient(sunX - 4, sunY - 4, 2, sunX, sunY, coreR);
          if (curIsDark && curState.heatAlpha < 0.4) {
            // Soft luminous harvest moon in dark mode
            sunBody.addColorStop(0, '#F8FAFC');
            sunBody.addColorStop(0.65, '#CBD5E1');
            sunBody.addColorStop(1, '#94A3B8');
          } else {
            sunBody.addColorStop(0, '#FFF8C8');
            sunBody.addColorStop(0.6, curState.heatAlpha > 0.4 ? '#F59E0B' : '#F4C430');
            sunBody.addColorStop(1, curState.heatAlpha > 0.4 ? '#D97706' : '#E09F18');
          }
          ctx.fillStyle = sunBody;
          ctx.beginPath();
          ctx.arc(sunX, sunY, coreR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // ================================================================
      // 2. SMOOTHLY MORPHING LOW-POLY VOLUMETRIC CLOUDS + RAIN CURTAINS
      // ================================================================
      const cloudDrift = (ph: number) => Math.sin(t * 0.34 + ph) * (18 + curState.rainAlpha * 12);

      const drawLowPolyCloud = (cx: number, cy: number, s: number, alpha: number) => {
        if (alpha <= 0.02) return;
        const puffs = [
          { dx: -34, dy: 9, r: 19 },
          { dx: -16, dy: -6, r: 24 },
          { dx: 7, dy: -11, r: 25 },
          { dx: 27, dy: -2, r: 20 },
          { dx: 41, dy: 10, r: 16 },
          { dx: -5, dy: 11, r: 22 },
          { dx: 18, dy: 11, r: 21 },
        ];
        const light = rgbCss(curState.cloudLight);
        const dark = rgbCss(curState.cloudDark);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx, cy);
        ctx.scale(s, s);
        for (const p of puffs) {
          const g = ctx.createRadialGradient(
            p.dx - p.r * 0.28,
            p.dy - p.r * 0.34,
            p.r * 0.14,
            p.dx,
            p.dy,
            p.r
          );
          g.addColorStop(0, light);
          g.addColorStop(1, dark);
          ctx.fillStyle = g;
          ctx.beginPath();
          for (let k = 0; k < 10; k += 1) {
            const ang = (k / 10) * Math.PI * 2;
            const px = p.dx + Math.cos(ang) * p.r;
            const py = p.dy + Math.sin(ang) * p.r * 0.8;
            if (k === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      };

      const cloudSpecs = [
        { baseX: w * 0.28, baseY: h * 0.13, s: Math.min(1, w / 640) * 0.92, ph: 0 },
        { baseX: w * 0.72, baseY: h * 0.14, s: Math.min(1, w / 640) * 0.9, ph: 2.0 },
        { baseX: w * 0.5, baseY: h * 0.2, s: Math.min(1, w / 640) * 1.05, ph: 4.1 },
        { baseX: w * 0.39, baseY: h * 0.18, s: Math.min(1, w / 640) * 0.96, ph: 5.5 },
      ];

      for (let i = 0; i < 4; i += 1) {
        const cAlpha = curState.cloudAlphas[i];
        if (cAlpha <= 0.02) continue;
        const c = cloudSpecs[i];
        const cx = c.baseX + cloudDrift(c.ph);
        const cy = c.baseY + Math.cos(t * 0.65 + c.ph) * 3.2;

        if (curState.rainAlpha > 0.02) {
          const curtainGrad = ctx.createLinearGradient(cx, cy + 12, cx - 22, h * 0.62);
          const curtainA = (0.14 + curState.rainStrength * 0.14) * curState.rainAlpha * cAlpha;
          curtainGrad.addColorStop(0, `rgba(71, 134, 188, ${curtainA.toFixed(3)})`);
          curtainGrad.addColorStop(1, 'rgba(71, 134, 188, 0)');
          ctx.fillStyle = curtainGrad;
          ctx.beginPath();
          ctx.moveTo(cx - 28 * c.s, cy + 12);
          ctx.lineTo(cx + 30 * c.s, cy + 12);
          ctx.lineTo(cx + 12 * c.s, h * 0.62);
          ctx.lineTo(cx - 46 * c.s, h * 0.62);
          ctx.closePath();
          ctx.fill();
        }
        drawLowPolyCloud(cx, cy, c.s, cAlpha);
      }

      // ================================================================
      // 3. 3D SLOPED EARTH SLAB + SMOOTH SOIL MOISTURE + CUTAWAY ROOTS & WATER
      // ================================================================
      const shPts = [
        project(-4.65, -0.9, -4.65),
        project(4.65, -0.9, -4.65),
        project(4.65, -0.9, 4.65),
        project(-4.65, -0.9, 4.65),
      ];
      fillPoly(
        shPts.map((p, idx) => ({ x: p.x, y: p.y + (idx === 2 ? 16 : 11) })),
        curIsDark ? 'rgba(0, 0, 0, 0.42)' : 'rgba(55, 44, 20, 0.20)'
      );

      const humusDepth =
        0.22 +
        ((Math.max(40, Math.min(100, curState.soilRichness)) - 40) / 60) * 0.3 +
        Math.max(0, curState.organicBoost) * 0.0025;

      const borderTopCss = rgbCss(curState.borderTopRgb);
      drawSlopedPrism(-4.45, -4.45, 4.45, 4.45, -0.9, -humusDepth, borderTopCss, '#BDAA87', '#A4916F');
      drawSlopedPrism(
        -4.45,
        -4.45,
        4.45,
        4.45,
        -humusDepth,
        0,
        borderTopCss,
        rgbCss(curState.soilSideLRgb),
        rgbCss(curState.soilSideRRgb)
      );

      // Cutaway 3D Root Network + Nitrogen Nodules + Underground Water Percolation Droplets
      const rootReach = 0.2 + curState.growthStage * 0.34 + ((curState.soilRichness - 50) / 100) * 0.16;
      const isLegumeOrCover = cropVisual === 'legume' || cropVisual === 'cover';
      const percAlpha = Math.max(curState.rainAlpha, curState.wateringAlpha, curState.moisturePct >= 66 ? 0.75 : 0);
      ctx.save();
      for (let i = 0; i < 8; i += 1) {
        const rx = -3.3 + i * 0.94;
        const rz = 4.44;
        const th = terrainHeight(rx, rz);
        const rTop = project(rx, th - 0.04, rz);
        const rMid = project(rx + Math.sin(i * 1.9) * 0.12, th - rootReach * 0.55, rz);
        const rBot = project(rx + Math.cos(i * 2.3) * 0.16, th - rootReach, rz);
        ctx.strokeStyle = 'rgba(235, 218, 178, 0.62)';
        ctx.lineWidth = 1.45;
        ctx.beginPath();
        ctx.moveTo(rTop.x, rTop.y);
        ctx.quadraticCurveTo(rMid.x, rMid.y, rBot.x, rBot.y);
        ctx.stroke();

        if (isLegumeOrCover && curState.growthStage > 0.45) {
          ctx.fillStyle = '#EBB40E';
          ctx.beginPath();
          ctx.arc(rMid.x, rMid.y, 2.3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (percAlpha > 0.04) {
          const dropFrac = (t * 0.65 + i * 0.17) % 1;
          const dp = project(rx, th - 0.06 - dropFrac * (humusDepth + 0.18), rz);
          ctx.fillStyle = `rgba(56, 189, 248, ${((1 - dropFrac) * 0.85 * percAlpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(dp.x, dp.y, 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const grassCol = rgbCss(curState.grassRgb);
      const headlands = [
        [
          [-4.2, 3.6],
          [4.2, 3.6],
          [4.2, 4.28],
          [-4.2, 4.28],
        ],
        [
          [3.65, -4.1],
          [4.28, -4.1],
          [4.28, 3.8],
          [3.65, 3.8],
        ],
        [
          [-4.28, -4.1],
          [-3.7, -4.1],
          [-3.7, 3.8],
          [-4.28, 3.8],
        ],
      ];
      for (const poly of headlands) {
        fillPoly(
          poly.map(([px, pz]) => project(px, terrainHeight(px, pz) + 0.015, pz)),
          grassCol
        );
      }

      // ================================================================
      // 4. BACK WOODEN FENCE + LIVE FARM WATER TANK / IRRIGATION CISTERN
      // ================================================================
      const fenceTopCss = rgbCss(curState.fenceTopRgb);
      const drawFencePost = (px: number, pz: number) => {
        drawSlopedPrism(px - 0.1, pz - 0.1, px + 0.1, pz + 0.1, 0, 0.78, fenceTopCss, '#755237', '#5D4029');
      };

      for (let i = 0; i <= 7; i += 1) drawFencePost(-4.12 + (8.24 * i) / 7, -4.15);
      drawSlopedPrism(-4.12, -4.2, 4.12, -4.1, 0.25, 0.36, '#9B7252', '#7B573C', '#62442D');
      drawSlopedPrism(-4.12, -4.2, 4.12, -4.1, 0.54, 0.65, fenceTopCss, '#7B573C', '#62442D');

      for (let i = 1; i <= 5; i += 1) drawFencePost(-4.15, -4.12 + (7.2 * i) / 5);
      drawSlopedPrism(-4.2, -4.12, -4.1, 3.08, 0.25, 0.36, '#9B7252', '#7B573C', '#62442D');
      drawSlopedPrism(-4.2, -4.12, -4.1, 3.08, 0.54, 0.65, fenceTopCss, '#7B573C', '#62442D');

      if (curIrrigationType !== 'Rain-fed') {
        const tx = 3.85;
        const tz = -3.65;
        const waterFillH = 0.15 + (Math.max(15, Math.min(130, curState.irrigationSupply)) / 130) * 0.85;
        drawSlopedPrism(tx - 0.36, tz - 0.36, tx + 0.36, tz + 0.36, 0, 1.08, '#CBD5E1', '#94A3B8', '#64748B');
        drawSlopedPrism(
          tx - 0.38,
          tz - 0.38,
          tx + 0.38,
          tz + 0.38,
          0.08,
          0.08 + waterFillH,
          '#38BDF8',
          '#0284C7',
          '#0369A1'
        );
        drawSlopedPrism(3.45, -3.55, 3.6, 3.35, 0.05, 0.14, '#0EA5E9', '#0369A1', '#075985');
      }

      // ================================================================
      // 5. WHOLE-FIELD TILLED FURROWS: SMOOTH SOIL + PUDDLES + CRACKS + MULCH + WATERING
      // ================================================================
      const NUM_FURROWS = 7;
      const fMinX = -3.45;
      const fMaxX = 3.45;
      const fMinZ = -3.5;
      const fMaxZ = 3.35;
      const furrowStep = (fMaxZ - fMinZ) / NUM_FURROWS;

      for (let r = 0; r < NUM_FURROWS; r += 1) {
        const z0 = fMinZ + r * furrowStep + 0.06;
        const z1 = fMinZ + (r + 1) * furrowStep - 0.06;
        const zMid = (z0 + z1) * 0.5;
        const downslopeFrac = r / (NUM_FURROWS - 1);

        const localMoist = curState.moisturePct + (downslopeFrac - 0.45) * (8 + slopeNorm * 16);
        // Subtle downslope soil darkening gradient smoothly blended over the lerped soil color
        const rowShade = 1.05 - downslopeFrac * (0.1 + slopeNorm * 0.06);
        drawSlopedPrism(
          fMinX,
          z0,
          fMaxX,
          z1,
          0,
          0.14,
          rgbCss(scaleRgb(curState.soilTopRgb, rowShade)),
          rgbCss(scaleRgb(curState.soilSideLRgb, rowShade)),
          rgbCss(scaleRgb(curState.soilSideRRgb, rowShade))
        );

        // Smoothly fading rainwater puddles in furrow troughs
        if (curState.rainAlpha > 0.03 && r < NUM_FURROWS - 1) {
          const zTrough = z1 + 0.06;
          const puddleAlpha = (0.24 + curState.rainStrength * 0.22) * curState.rainAlpha;
          for (let pd = 0; pd < 3; pd += 1) {
            const px = fMinX + 1.0 + ((pd * 2.15 + r * 0.72) % 5.1);
            const pp = project(px, terrainHeight(px, zTrough) + 0.03, zTrough);
            const shimmer = 0.85 + 0.15 * Math.sin(t * 3.2 + pd * 1.9 + r);
            ctx.fillStyle = `rgba(96, 175, 245, ${(puddleAlpha * shimmer).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(
              pp.x,
              pp.y,
              13 + curState.rainStrength * 7,
              3.2 + curState.rainStrength * 1.5,
              -0.35,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
        }

        // Smoothly fading Drought Cracks etched into dry topsoil furrows
        if (curState.droughtAlpha > 0.04 && localMoist < 52) {
          ctx.strokeStyle = `rgba(42, 24, 12, ${(0.58 * curState.droughtAlpha).toFixed(3)})`;
          ctx.lineWidth = 1.1;
          for (let ck = 0; ck < 5; ck += 1) {
            const cx = fMinX + 0.7 + ((ck * 1.42 + r * 0.55) % 5.6);
            const p0 = project(cx - 0.18, terrainHeight(cx - 0.18, zMid) + 0.148, zMid - 0.12);
            const p1 = project(cx, terrainHeight(cx, zMid) + 0.148, zMid + 0.03);
            const p2 = project(cx + 0.2, terrainHeight(cx + 0.2, zMid) + 0.148, zMid - 0.08);
            const p3 = project(cx + 0.05, terrainHeight(cx + 0.05, zMid) + 0.148, zMid + 0.18);
            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p3.x, p3.y);
            ctx.stroke();
          }
        }

        // Visual Compost / Straw Residue Mulch flecks
        if (curState.organicBoost >= 4 || curState.soilRichness >= 78) {
          const mulchCount = curState.organicBoost >= 20 ? 11 : 6;
          for (let ml = 0; ml < mulchCount; ml += 1) {
            const mx = fMinX + 0.35 + ((ml * 0.87 + r * 0.63) % 6.2);
            const mz = z0 + 0.12 + ((ml * 0.31) % Math.max(0.15, z1 - z0 - 0.22));
            const mp = project(mx, terrainHeight(mx, mz) + 0.15, mz);
            ctx.fillStyle = ml % 2 === 0 ? 'rgba(218, 188, 102, 0.72)' : 'rgba(56, 36, 20, 0.62)';
            ctx.beginPath();
            ctx.ellipse(mp.x, mp.y, 3.8, 1.3, (ml % 3) * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // ACTIVE IRRIGATION: Drip tubing + smoothly fading wet moisture halos
        if (curIrrigationType === 'Drip') {
          const dStart = project(fMinX + 0.12, terrainHeight(fMinX + 0.12, zMid) + 0.155, zMid);
          const dEnd = project(fMaxX - 0.04, terrainHeight(fMaxX - 0.04, zMid) + 0.155, zMid);
          ctx.strokeStyle = 'rgba(15, 118, 138, 0.82)';
          ctx.lineWidth = 1.7;
          ctx.beginPath();
          ctx.moveTo(dStart.x, dStart.y);
          ctx.lineTo(dEnd.x, dEnd.y);
          ctx.stroke();

          if (curState.wateringAlpha > 0.03) {
            const flowSpeed = 1.8 + (curState.irrigationSupply / 100) * 2.2;
            for (let e = 0; e < 6; e += 1) {
              const ex = fMinX + 0.45 + e * 1.2;
              const wave = Math.max(0, Math.sin(t * flowSpeed - e * 0.85 - r * 0.45));
              const ep = project(ex, terrainHeight(ex, zMid) + 0.16, zMid);
              ctx.fillStyle = `rgba(38, 26, 16, ${(0.28 * wave * curState.wateringAlpha).toFixed(3)})`;
              ctx.beginPath();
              ctx.ellipse(ep.x, ep.y, 8 * (0.6 + 0.5 * wave), 3.6 * (0.6 + 0.5 * wave), 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.fillStyle = `rgba(56, 189, 248, ${((0.25 + 0.7 * wave) * curState.wateringAlpha).toFixed(3)})`;
              ctx.beginPath();
              ctx.ellipse(ep.x, ep.y, 3.8, 1.8, 0, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (curState.rainAlpha > 0.05 || localMoist >= 48) {
          const wetGlow = Math.max(curState.rainAlpha * 0.68, localMoist >= 48 ? 0.42 : 0);
          ctx.fillStyle = `rgba(56, 189, 248, ${wetGlow.toFixed(3)})`;
          for (let e = 0; e < 4; e += 1) {
            const ex = fMinX + 0.6 + ((e * 1.7 + r * 0.55) % 5.8);
            const ep = project(ex, terrainHeight(ex, zMid) + 0.155, zMid);
            ctx.beginPath();
            ctx.ellipse(ep.x, ep.y, 4.4, 2, -0.3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Gliding cloud shadows smoothly fading with clouds
      ctx.save();
      for (let i = 0; i < 4; i += 1) {
        const ca = curState.cloudAlphas[i];
        if (ca <= 0.02) continue;
        const cShift = (cloudDrift(cloudSpecs[i].ph) / 22) * 1.5;
        const scx = -1.6 + i * 1.7 + cShift;
        const scz = -0.8 + (i % 2) * 1.8;
        const sp = project(scx, terrainHeight(scx, scz) + 0.15, scz);
        const shAlpha = (0.08 + curState.rainAlpha * 0.09) * ca;
        ctx.fillStyle = `rgba(18, 28, 36, ${shAlpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(sp.x, sp.y, scale * 1.45, scale * 0.65, -0.25, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Harvest bundle & potted seedlings by the headland corner
      if (curState.growthStage >= 0.78 || seasonOfYear === 'Summer') {
        for (let s = 0; s < 12; s += 1) {
          const sx = -3.9 + (s % 4) * 0.11;
          const sz = 2.6 + Math.floor(s / 4) * 0.12;
          const sh = terrainHeight(sx, sz);
          const pB = project(sx, sh + 0.02, sz);
          const pT = project(sx + Math.sin(t * 1.4 + s) * 0.025, sh + 0.96 + (s % 3) * 0.07, sz);
          ctx.strokeStyle = s % 2 === 0 ? '#E5C63B' : '#C7A523';
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(pB.x, pB.y);
          ctx.lineTo(pT.x, pT.y);
          ctx.stroke();
        }
      }
      for (const pot of [
        { x: -3.88, z: 3.35 },
        { x: -3.42, z: 3.65 },
      ]) {
        drawSlopedPrism(pot.x - 0.16, pot.z - 0.16, pot.x + 0.16, pot.z + 0.16, 0.02, 0.34, '#BA8855', '#9E6F3E', '#83592E');
        const cTop = project(pot.x, terrainHeight(pot.x, pot.z) + 0.42, pot.z);
        for (let l = 0; l < 4; l += 1) {
          const la = (l / 4) * Math.PI * 2 + Math.sin(t * 2 + l) * 0.12;
          ctx.fillStyle = l % 2 === 0 ? '#4BAF35' : '#78D13D';
          ctx.beginPath();
          ctx.ellipse(cTop.x + Math.cos(la) * 5, cTop.y + Math.sin(la) * 2.6 - 2, 4.8, 2.4, la, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ================================================================
      // 6. WHOLE-FIELD CROP CANOPY (SMOOTH GROWTH + SMOOTH DROUGHT WILT)
      // ================================================================
      const COLS = cropVisual === 'wheat' || cropVisual === 'cover' ? 9 : 7;
      const targetGrowth = curState.growthStage;
      const windAmp = curState.windAmp;
      const droughtStressFactor = curState.droughtStress;
      const isDryVisual = curState.droughtAlpha > 0.35;

      const plants: { x: number; z: number; row: number; col: number; seed: number; vigor: number }[] = [];
      for (let r = 0; r < NUM_FURROWS; r += 1) {
        const pz = fMinZ + (r + 0.5) * furrowStep;
        const downslopeFrac = r / (NUM_FURROWS - 1);
        for (let c = 0; c < COLS; c += 1) {
          const fx = (c + 0.5) / COLS;
          const px = fMinX + 0.25 + fx * (fMaxX - fMinX - 0.5);
          const slopeStress =
            (downslopeFrac - 0.5) * (0.09 + curState.droughtAlpha * (0.19 + slopeNorm * 0.18)) -
            droughtStressFactor * 0.18;
          const waterBoost = (curState.irrigationSupply - 100) * 0.0018;
          const orgBoost = curState.organicBoost * 0.0028;
          const soilBoost = (curState.soilRichness - 65) * 0.0035;
          const microJitter = Math.sin(r * 13.7 + c * 7.3) * 0.06;
          const vigor = Math.max(
            0.55,
            Math.min(1.22, 0.96 + slopeStress + waterBoost + orgBoost + soilBoost + microJitter)
          );
          plants.push({ x: px, z: pz, row: r, col: c, seed: r * 17 + c * 11, vigor });
        }
      }

      plants.sort((a, b) => a.x * sinA + a.z * cosA - (b.x * sinA + b.z * cosA));

      for (const pl of plants) {
        const rowDelayMs = pl.row * 70 + pl.col * 22;
        const waveT = Math.max(0, Math.min(1, (elapsedMs - rowDelayMs) / 520));
        const waveEase = 1 - Math.pow(1 - waveT, 3);
        const s = Math.max(0.18, targetGrowth * pl.vigor * (0.22 + 0.78 * waveEase));

        const baseY = terrainHeight(pl.x, pl.z) + 0.145;
        const gust = Math.sin(t * 2.6 + pl.x * 0.85 + pl.z * 0.6) * windAmp * s;
        // Subtle drought wilt droop when dry + low irrigation!
        const wiltDroop = droughtStressFactor * 0.14 * s;

        const shP = project(pl.x + 0.08, baseY + 0.01, pl.z + 0.06);
        ctx.fillStyle = 'rgba(28, 18, 10, 0.22)';
        ctx.beginPath();
        ctx.ellipse(shP.x, shP.y, 6.4 * s, 3.0 * s, 0, 0, Math.PI * 2);
        ctx.fill();

        if (cropVisual === 'wheat') {
          const isRipe = targetGrowth >= 0.84 || seasonOfYear === 'Summer';
          const stemCol = isRipe
            ? '#CFA828'
            : droughtStressFactor > 0.45
              ? '#9FB03A'
              : targetGrowth >= 0.6
                ? '#7FB236'
                : '#4E9E34';
          const earCol = isRipe ? '#F4D54A' : '#B7CF4B';
          for (let k = -1; k <= 1; k += 1) {
            const ox = pl.x + k * 0.095;
            const b = project(ox, baseY, pl.z);
            const hStalk = (0.76 + ((pl.seed + k) % 3) * 0.09) * s;
            const tip = project(ox + gust + wiltDroop * 0.6, baseY + hStalk - wiltDroop * 0.4, pl.z);
            ctx.strokeStyle = stemCol;
            ctx.lineWidth = 2.3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(b.x, b.y);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();

            if (targetGrowth >= 0.54) {
              ctx.fillStyle = earCol;
              ctx.beginPath();
              ctx.ellipse(tip.x, tip.y, 2.2, 5.2 * s, gust * 0.9 + wiltDroop, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        } else if (cropVisual === 'sunflower') {
          const b = project(pl.x, baseY, pl.z);
          const hStalk = 1.05 * s;
          const tip = project(pl.x + gust * 1.15 + wiltDroop, baseY + hStalk - wiltDroop * 0.5, pl.z);
          const mid = project(pl.x + gust * 0.5, baseY + hStalk * 0.5, pl.z);

          ctx.strokeStyle = droughtStressFactor > 0.5 ? '#728F31' : '#3E822B';
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();

          ctx.fillStyle = droughtStressFactor > 0.5 ? '#88A63B' : '#53A636';
          ctx.beginPath();
          ctx.ellipse(mid.x - 5.5 * s, mid.y + 2 + wiltDroop * 10, 5.5 * s, 2.6 * s, -0.5 + wiltDroop, 0, Math.PI * 2);
          ctx.ellipse(mid.x + 5.5 * s, mid.y + wiltDroop * 10, 5.5 * s, 2.6 * s, 0.5 - wiltDroop, 0, Math.PI * 2);
          ctx.fill();

          if (targetGrowth >= 0.52) {
            const rHead = 6.8 * s;
            ctx.fillStyle = '#F7C91E';
            for (let p = 0; p < 8; p += 1) {
              const pa = (p / 8) * Math.PI * 2 + gust;
              ctx.beginPath();
              ctx.ellipse(
                tip.x + Math.cos(pa) * rHead * 0.8,
                tip.y + Math.sin(pa) * rHead * 0.72,
                3.4 * s,
                1.8 * s,
                pa,
                0,
                Math.PI * 2
              );
              ctx.fill();
            }
            ctx.fillStyle = '#52341A';
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, rHead * 0.52, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (cropVisual === 'corn') {
          const b = project(pl.x, baseY, pl.z);
          const hStalk = 1.12 * s;
          const tip = project(pl.x + gust * 1.1 + wiltDroop, baseY + hStalk - wiltDroop * 0.4, pl.z);
          const mid = project(pl.x + gust * 0.5, baseY + hStalk * 0.55, pl.z);

          ctx.strokeStyle = droughtStressFactor > 0.5 ? '#7A9632' : '#4A8E2E';
          ctx.lineWidth = 3.6;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(tip.x, tip.y);
          ctx.stroke();

          if (targetGrowth >= 0.55) {
            const cobGrad = ctx.createLinearGradient(mid.x - 5, mid.y, mid.x + 5, mid.y);
            cobGrad.addColorStop(0, '#F5BC2C');
            cobGrad.addColorStop(1, '#CC8E12');
            ctx.fillStyle = cobGrad;
            ctx.beginPath();
            ctx.roundRect(tip.x - 4.4 * s, tip.y + 2, 8.8 * s, Math.max(7, (b.y - tip.y) * 0.62), 4);
            ctx.fill();
          }
          ctx.fillStyle = '#3B7E24';
          ctx.beginPath();
          ctx.ellipse(mid.x - 5.5 * s, mid.y + 3, 5 * s, 2.2, -0.5, 0, Math.PI * 2);
          ctx.ellipse(mid.x + 5.5 * s, mid.y + 1, 5 * s, 2.2, 0.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (cropVisual === 'produce') {
          const center = project(pl.x, baseY + 0.18 * s, pl.z);
          const rad = 7.2 * s;
          ctx.fillStyle = droughtStressFactor > 0.5 ? '#7D9E38' : '#479C31';
          ctx.beginPath();
          ctx.ellipse(center.x - rad * 0.75, center.y + 1, 5.5 * s, 3 * s, -0.4, 0, Math.PI * 2);
          ctx.ellipse(center.x + rad * 0.75, center.y, 5.5 * s, 3 * s, 0.4, 0, Math.PI * 2);
          ctx.fill();

          if (targetGrowth >= 0.55) {
            const isTomato = /tomato|pepper/i.test(frame.cropName);
            const pGrad = ctx.createRadialGradient(
              center.x - rad * 0.3,
              center.y - rad * 0.3,
              rad * 0.12,
              center.x,
              center.y,
              rad
            );
            pGrad.addColorStop(0, isTomato ? '#F8614D' : '#F69D3A');
            pGrad.addColorStop(1, isTomato ? '#B81D13' : '#B85A12');
            ctx.fillStyle = pGrad;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, rad * 0.96, rad * 0.84, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (cropVisual === 'cover') {
          const c = project(pl.x, baseY + 0.14 * s, pl.z);
          for (let l = 0; l < 4; l += 1) {
            const ang = (l / 4) * Math.PI * 2 + gust * 1.8;
            ctx.fillStyle =
              droughtStressFactor > 0.55
                ? l % 2 === 0
                  ? '#5E913C'
                  : '#85B34A'
                : l % 2 === 0
                  ? '#279144'
                  : '#58CC48';
            ctx.beginPath();
            ctx.ellipse(
              c.x + Math.cos(ang) * 5.2 * s,
              c.y + Math.sin(ang) * 3.0 * s,
              6.4 * s,
              3.5 * s,
              ang,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          if (targetGrowth >= 0.58 && pl.seed % 2 === 0) {
            ctx.fillStyle = '#D94B8B';
            ctx.beginPath();
            ctx.arc(c.x, c.y - 3.5 * s, 2.5 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          const base = project(pl.x, baseY, pl.z);
          const leafPairs = [
            { dx: -7.5, dy: -4.5, rot: -0.5, col: droughtStressFactor > 0.5 ? '#7AA638' : '#40A632' },
            { dx: 7.5, dy: -4.5, rot: 0.5, col: droughtStressFactor > 0.5 ? '#91B842' : '#5EC93A' },
            { dx: -4.5, dy: -8.5, rot: -0.85, col: '#7AD942' },
            { dx: 4.5, dy: -8.5, rot: 0.85, col: '#4EB535' },
          ];
          for (const lf of leafPairs) {
            ctx.fillStyle = lf.col;
            ctx.beginPath();
            ctx.ellipse(
              base.x + (lf.dx + gust * 12) * s,
              base.y + (lf.dy + wiltDroop * 14) * s,
              5.8 * s,
              2.7 * s,
              lf.rot + gust,
              0,
              Math.PI * 2
            );
            ctx.fill();
          }
          if (targetGrowth >= 0.65) {
            ctx.fillStyle = '#FFFDF5';
            ctx.beginPath();
            ctx.arc(base.x + gust * 10, base.y - 10 * s, 2.1 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Active Sprinkler Watering Jets (Radius & opacity smoothly fade with weather & irrigationSupply!)
      if (curIrrigationType === 'Sprinkler' && curState.wateringAlpha > 0.03) {
        const sprayReach = 18 + (curState.irrigationSupply / 100) * 18;
        ctx.save();
        ctx.globalAlpha = curState.wateringAlpha;
        for (const spk of [
          { x: -1.5, z: -1.0 },
          { x: 1.5, z: 1.0 },
        ]) {
          const base = project(spk.x, terrainHeight(spk.x, spk.z) + 0.14, spk.z);
          const head = project(spk.x, terrainHeight(spk.x, spk.z) + 0.65, spk.z);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(base.x, base.y);
          ctx.lineTo(head.x, head.y);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.68)';
          ctx.lineWidth = 1.4;
          for (let a = 0; a < 6; a += 1) {
            const rot = t * 2.4 + (a / 6) * Math.PI * 2;
            const endX = head.x + Math.cos(rot) * sprayReach;
            const endY = head.y + Math.sin(rot) * (sprayReach * 0.45) + 14;
            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.quadraticCurveTo((head.x + endX) / 2, head.y - 12, endX, endY);
            ctx.stroke();
          }
        }
        ctx.restore();
      }

      // ================================================================
      // 7. SMOOTHLY CROSS-FADING WIND LEAVES, DRY DUST, RAIN, SNOW & HEAT WAVES
      // ================================================================
      const windMult = 1 + curState.rainAlpha * 1.0 + (curState.windAmp > 0.16 ? 1.2 : 0);
      for (const lf of leaves) {
        lf.x += lf.vx * windMult;
        lf.y += Math.sin(t * 2.1 + lf.rot) * 0.006;
        lf.rot += lf.vrot;
        if (lf.x > 4.3) {
          lf.x = -3.9;
          lf.z = -3.3 + Math.random() * 6.6;
          lf.y = 1.0 + Math.random() * 1.8;
        }
        const lp = project(lf.x, terrainHeight(lf.x, lf.z) + lf.y, lf.z);
        ctx.save();
        ctx.translate(lp.x, lp.y);
        ctx.rotate(lf.rot);
        ctx.fillStyle = isDryVisual ? '#D9A73A' : lf.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, lf.size, lf.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Smoothly fading airborne dust motes in Drought / Heatwave
      if (curState.droughtAlpha > 0.03) {
        ctx.fillStyle = `rgba(217, 165, 82, ${(0.34 * curState.droughtAlpha).toFixed(3)})`;
        for (const dm of dustMotes) {
          dm.x += dm.vx;
          if (dm.x > w + 10) dm.x = -10;
          const dy = dm.y + Math.sin(t * 1.8 + dm.phase) * 8;
          ctx.beginPath();
          ctx.arc(dm.x, dy, dm.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Smoothly cross-fading rainfall streaks & splash rings
      if (curState.rainAlpha > 0.02) {
        const dropLimit = Math.max(
          20,
          Math.round(rainDrops.length * Math.max(0.45, curState.rainStrength) * Math.min(1, curState.rainAlpha * 1.2))
        );
        const dropAlpha = (0.52 + curState.rainStrength * 0.3) * curState.rainAlpha;
        ctx.strokeStyle = curIsDark
          ? `rgba(125, 211, 252, ${dropAlpha.toFixed(3)})`
          : `rgba(56, 148, 224, ${dropAlpha.toFixed(3)})`;
        ctx.lineWidth = 1.45 + curState.rainStrength * 0.5;
        ctx.lineCap = 'round';
        for (let ri = 0; ri < dropLimit; ri += 1) {
          const r = rainDrops[ri];
          r.y += r.speed * (0.85 + curState.rainStrength * 0.35);
          r.x -= r.speed * 0.25;
          if (r.y > h) {
            r.y = -20;
            r.x = Math.random() * (w + 130);
          }
          ctx.beginPath();
          ctx.moveTo(r.x, r.y);
          ctx.lineTo(r.x - r.len * 0.25, r.y + r.len);
          ctx.stroke();
        }
        const splashLimit = Math.max(7, Math.round(splashes.length * Math.max(0.5, curState.rainStrength)));
        for (let si = 0; si < splashLimit; si += 1) {
          const sp = splashes[si];
          sp.age += 0.032;
          if (sp.age >= sp.maxAge) {
            sp.age = 0;
            sp.x = -3.2 + Math.random() * 6.4;
            sp.z = -3.2 + Math.random() * 6.4;
          }
          const frac = sp.age / sp.maxAge;
          const pt = project(sp.x, terrainHeight(sp.x, sp.z) + 0.16, sp.z);
          ctx.strokeStyle = `rgba(125, 211, 252, ${((1 - frac) * (0.58 + curState.rainStrength * 0.24) * curState.rainAlpha).toFixed(3)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(pt.x, pt.y, 2 + frac * 11, 1 + frac * 4.8, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Smoothly cross-fading snowfall in Frost
      if (curState.snowAlpha > 0.02) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.9 * curState.snowAlpha).toFixed(3)})`;
        for (const s of snowFlakes) {
          s.y += s.speed;
          s.x += Math.sin(t * 1.4 + s.phase) * 0.65;
          if (s.y > h) {
            s.y = -8;
            s.x = Math.random() * w;
          }
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Smoothly cross-fading heat shimmer waves in Heatwave
      if (curState.heatAlpha > 0.02) {
        ctx.strokeStyle = `rgba(245, 158, 11, ${(0.28 * curState.heatAlpha).toFixed(3)})`;
        ctx.lineWidth = 2.1;
        for (let k = 0; k < 4; k += 1) {
          const hy = h * (0.38 + k * 0.11);
          ctx.beginPath();
          for (let hx = w * 0.18; hx <= w * 0.82; hx += 12) {
            const wy = hy + Math.sin(hx * 0.048 + t * 4.4 + k) * 3.8;
            if (hx === w * 0.18) ctx.moveTo(hx, wy);
            else ctx.lineTo(hx, wy);
          }
          ctx.stroke();
        }
      }

      ctx.restore();
      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const rainUnit = activeFrame.rainfallUnitLabel ?? 'mm/yr';
  const weatherBadge =
    activeFrame.weatherMode === 'rain'
      ? {
          label: `Rainy (${activeFrame.rainfallMm} ${rainUnit})`,
          icon: <CloudRain className="w-3.5 h-3.5 text-[#0284C7]" />,
          cls: 'bg-[#E0F2FE]/95 text-[#075985] border-[#7DD3FC]',
        }
      : activeFrame.weatherMode === 'heatwave'
        ? {
            label: `Heatwave (${activeFrame.tempC}°C)`,
            icon: <Sun className="w-3.5 h-3.5 text-[#D97706]" />,
            cls: 'bg-[#FEF3C7]/95 text-[#92400E] border-[#FCD34D]',
          }
        : activeFrame.weatherMode === 'drought'
          ? {
              label: `Dry (${activeFrame.rainfallMm} ${rainUnit})`,
              icon: <Sun className="w-3.5 h-3.5 text-[#B45309]" />,
              cls: 'bg-[#FDF6DC]/95 text-[#6E5100] border-[#EBD58B]',
            }
          : activeFrame.weatherMode === 'frost'
            ? {
                label: `Frost (${activeFrame.tempC}°C)`,
                icon: <Snowflake className="w-3.5 h-3.5 text-[#0284C7]" />,
                cls: 'bg-[#E0F2FE]/95 text-[#0369A1] border-[#93C5FD]',
              }
            : {
                label: `Sunny & Mild (${activeFrame.rainfallMm} ${rainUnit})`,
                icon: <Wind className="w-3.5 h-3.5 text-[#007432]" />,
                cls: 'bg-[#E3F5EB]/95 text-[#005222] border-[#A8DEC0]',
              };

  const irrSupply = activeFrame.irrigationSupplyPct ?? 100;
  const orgBoost = activeFrame.organicInputBoostPct ?? 0;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#DFDDD6] bg-[#EEE5AB] select-none">
      {/* Top Floating Telemetry HUD */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-start justify-between gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold shadow-xs backdrop-blur-xs ${
              activeFrame.era === 'today'
                ? 'bg-[#111111]/90 text-[#EBB40E] border-[#EBB40E]'
                : activeFrame.era === 'past'
                  ? 'bg-white/92 text-[#3A3A3A] border-[#CFCBC2]'
                  : 'bg-[#007432]/92 text-white border-[#44BE7E]'
            }`}
          >
            {activeFrame.era === 'today' && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-80" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EBB40E]" />
              </span>
            )}
            <span>{titleBadge ?? activeFrame.dateLabel}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/92 border border-black/10 text-[11px] font-extrabold text-[#111111] shadow-xs backdrop-blur-xs">
            <Sprout className="w-3.5 h-3.5 text-[#007432]" />
            <span>{activeFrame.cropName}</span>
            <span className="text-[#007432]">
              · {activeFrame.growthLabel} ({Math.round(activeFrame.growthStage * 100)}%)
            </span>
          </span>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-extrabold shadow-xs backdrop-blur-xs ${weatherBadge.cls}`}
          >
            {weatherBadge.icon}
            <span>{weatherBadge.label}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {onToggleAutoPlay && safeFrames.length > 1 && (
            <button
              type="button"
              onClick={onToggleAutoPlay}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#111111]/88 hover:bg-[#007432] text-white text-[11px] font-extrabold transition cursor-pointer shadow-xs"
            >
              {isAutoPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isAutoPlaying ? 'Pause' : 'Play'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setYawOffset((y) => (Math.abs(y) > 0.05 ? 0 : 0.34))}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/92 hover:bg-[#111111] text-[#111111] hover:text-white border border-black/10 text-[11px] font-extrabold transition cursor-pointer shadow-xs"
            title="Tilt 3D view (or drag horizontally)"
          >
            <RotateCw className="w-3 h-3" />
            Orbit 3D
          </button>
        </div>
      </div>

      {/* Bottom-Left Live Multi-Parameter HUD (Moisture, Temp, Irrigation, Soil/Mulch, Stress) */}
      <div
        className={`absolute ${seasonTabs ? 'bottom-[94px]' : 'bottom-[52px]'} left-3 right-3 z-10 flex flex-wrap items-center gap-1.5 pointer-events-none`}
      >
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111]/78 text-white text-[10px] font-bold backdrop-blur-xs">
          <Droplets className="w-3 h-3 text-[#38BDF8]" />
          Soil Moisture {activeFrame.moisturePct}%
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111]/78 text-white text-[10px] font-bold backdrop-blur-xs">
          <Thermometer className="w-3 h-3 text-[#FBBF24]" />
          {activeFrame.tempC}°C
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111]/78 text-white text-[10px] font-bold backdrop-blur-xs">
          <CloudRain className="w-3 h-3 text-[#7DD3FC]" />
          {irrigationType} {irrigationType === 'Rain-fed' ? 'Only' : `${irrSupply}%`}
        </span>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111]/78 text-white text-[10px] font-bold backdrop-blur-xs">
          <Leaf className="w-3 h-3 text-[#92D500]" />
          {soilType} · {slopeDeg}° · Health {activeFrame.soilRichnessScore}/100
          {activeFrame.soilOrganicMatterPct !== undefined
            ? ` · SOM ${activeFrame.soilOrganicMatterPct}%`
            : ''}
          {orgBoost !== 0 ? ` · Mulch ${orgBoost > 0 ? '+' : ''}${orgBoost}%` : ''}
        </span>
        {activeFrame.yieldTha !== undefined && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#007432]/88 text-white text-[10px] font-extrabold backdrop-blur-xs">
            <Sprout className="w-3 h-3 text-[#EBB40E]" />
            Yield {activeFrame.yieldTha} t/ha
          </span>
        )}
        {activeFrame.extremeRiskLevel && activeFrame.extremeRiskLevel !== 'low' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#DC2626]/88 text-white text-[10px] font-extrabold backdrop-blur-xs">
            <Flame className="w-3 h-3" />
            {activeFrame.extremeRiskLevel === 'severe' ? 'Severe Stress' : 'Moderate Stress'}
          </span>
        )}
      </div>

      {/* 60 FPS Interactive 3D Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          dragRef.current = { active: true, startX: e.clientX, baseYaw: yawOffset };
        }}
        onPointerMove={(e) => {
          if (!dragRef.current.active) return;
          const dx = e.clientX - dragRef.current.startX;
          setYawOffset(Math.max(-0.65, Math.min(0.65, dragRef.current.baseYaw + dx * 0.004)));
        }}
        onPointerUp={() => {
          dragRef.current.active = false;
        }}
        onPointerLeave={() => {
          dragRef.current.active = false;
        }}
        className={`w-full block cursor-grab active:cursor-grabbing ${
          compact ? 'h-[295px] sm:h-[335px]' : 'h-[360px] sm:h-[415px]'
        }`}
      />

      {/* Optional 4-Season Sub-Bar Inside Selected Year (Winter / Spring / Summer / Autumn) */}
      {seasonTabs && (
        <div className="px-3.5 py-2 bg-[#F5F4F0] border-t border-[#E5E2D9] flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-[#2E2E2E] mr-1">
              Seasons inside {seasonTabs.yearLabel}:
            </span>
            {seasonTabs.seasons.map((s) => {
              const isAct = s === seasonTabs.activeSeason;
              const det = seasonTabs.seasonDetails?.[s];
              const isRainSeason = det?.weatherMode === 'rain';
              const isFrostSeason = det?.weatherMode === 'frost';
              const isDrySeason = det?.weatherMode === 'drought' || det?.weatherMode === 'heatwave';
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => seasonTabs.onSelectSeason(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-extrabold border transition cursor-pointer ${
                    isAct
                      ? 'bg-[#111111] text-[#EBB40E] border-[#111111] shadow-xs'
                      : isRainSeason
                        ? 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC] hover:border-[#0284C7]'
                        : 'bg-white text-[#2E2E2E] border-[#D9D5CB] hover:border-[#111111]'
                  }`}
                >
                  {isRainSeason && (
                    <CloudRain className={`w-3 h-3 ${isAct ? 'text-[#7DD3FC]' : 'text-[#0284C7]'}`} />
                  )}
                  {isFrostSeason && (
                    <Snowflake className={`w-3 h-3 ${isAct ? 'text-[#7DD3FC]' : 'text-[#0284C7]'}`} />
                  )}
                  {isDrySeason && (
                    <Sun className={`w-3 h-3 ${isAct ? 'text-[#EBB40E]' : 'text-[#D97706]'}`} />
                  )}
                  <span>{s}</span>
                  {det?.rainMm !== undefined && (
                    <span
                      className={`text-[10px] font-bold ${
                        isAct
                          ? 'text-white/85'
                          : isRainSeason
                            ? 'text-[#0369A1]'
                            : 'text-[#555555]'
                      }`}
                    >
                      · {det.rainMm} mm
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <span className="text-[10.5px] font-bold text-[#007432]">
            {areaHectares} ha whole-field seasonal sync
          </span>
        </div>
      )}

      {/* Bottom Timeline Scrubber Strip */}
      <div className="px-3.5 py-2.5 bg-[#FFFEFB]/95 border-t border-[#E5E2D9] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
        <div className="flex flex-wrap items-center gap-1.5">
          {safeFrames.map((fr, idx) => {
            const active = idx === activeFrameIndex;
            return (
              <button
                key={fr.id}
                type="button"
                onClick={() => onSelectFrame?.(idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-extrabold transition cursor-pointer border ${
                  active
                    ? fr.era === 'today'
                      ? 'bg-[#111111] text-[#EBB40E] border-[#111111]'
                      : fr.era === 'past'
                        ? 'bg-[#57534E] text-white border-[#57534E]'
                        : 'bg-[#007432] text-white border-[#007432]'
                    : 'bg-[#F5F4F0] text-[#2E2E2E] border-[#DFDDD6] hover:border-[#111111]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: fr.cropColor }}
                />
                <span>{fr.label}</span>
              </button>
            );
          })}
        </div>
        <span className="text-[10.5px] font-bold text-[#3A3A3A] truncate">
          {activeFrame.summaryNote ??
            'Drag to orbit 3D farm · Weather, watering, soil texture & roots react live'}
        </span>
      </div>
    </div>
  );
};
