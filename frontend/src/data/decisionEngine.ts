import {
  CalendarEvent,
  ClimateZone,
  CropInfo,
  FarmBeforeAnalysis,
  FarmerProfile,
  HistoricalSeasonRecord,
  ScoredRotationStrategy,
  UnifiedSeasonStep,
} from '../types/farm';
import { buildDefaultBoundary, computePolygonAreaHectares } from './agronomyData';
import { buildFallbackNasaPower, resolveSlopeDegrees } from '../api/nasaPowerService';

export const GLOBAL_CROPS: Record<string, CropInfo> = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    family: 'Cereal',
    color: '#EBB40E',
    lightBg: '#FDF6DC',
    textColor: '#7A5B00',
    droughtTolerance: 'Moderate',
    nitrogenEffect: -45,
    waterNeedMm: 420,
    baseYieldTha: 5.4,
    idealTempMin: 10,
    idealTempMax: 24,
    climates: ['Mediterranean', 'Temperate', 'Continental', 'Semi-Arid'],
    soilBenefit: 'Provides dense straw residue that shields topsoil from rain splash.',
    plainNote: 'Reliable staple grain that thrives right after nitrogen-fixing legumes.',
  },
  fava_beans: {
    id: 'fava_beans',
    name: 'Fava Beans (Legumes)',
    family: 'Legume',
    color: '#00873A',
    lightBg: '#E3F5EB',
    textColor: '#005A26',
    droughtTolerance: 'Moderate',
    nitrogenEffect: +68,
    waterNeedMm: 310,
    baseYieldTha: 3.1,
    idealTempMin: 9,
    idealTempMax: 22,
    climates: ['Mediterranean', 'Temperate', 'Continental'],
    soilBenefit: 'Naturally adds nitrogen into the soil through root nodules.',
    plainNote: 'Cuts synthetic nitrogen fertilizer costs for the next season.',
  },
  chickpeas: {
    id: 'chickpeas',
    name: 'Chickpeas',
    family: 'Legume',
    color: '#2B9D5A',
    lightBg: '#E5F7EC',
    textColor: '#135E33',
    droughtTolerance: 'High',
    nitrogenEffect: +54,
    waterNeedMm: 260,
    baseYieldTha: 2.3,
    idealTempMin: 14,
    idealTempMax: 29,
    climates: ['Mediterranean', 'Semi-Arid', 'Subtropical'],
    soilBenefit: 'Fixes nitrogen naturally while using very little water.',
    plainNote: 'Breaks cereal root diseases and earns strong market prices.',
  },
  sorghum: {
    id: 'sorghum',
    name: 'Grain Sorghum',
    family: 'Cereal',
    color: '#C96A1B',
    lightBg: '#FBECE0',
    textColor: '#7E3E09',
    droughtTolerance: 'Very High',
    nitrogenEffect: -30,
    waterNeedMm: 250,
    baseYieldTha: 6.0,
    idealTempMin: 18,
    idealTempMax: 34,
    climates: ['Semi-Arid', 'Mediterranean', 'Subtropical', 'Tropical'],
    soilBenefit: 'Deep roots break up hard soil and naturally suppress harmful nematodes.',
    plainNote: 'Tough heat-and-drought grain needing nearly 40% less water than corn.',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Sunflowers',
    family: 'Oilseed',
    color: '#D89B00',
    lightBg: '#FEF7DF',
    textColor: '#735100',
    droughtTolerance: 'High',
    nitrogenEffect: -24,
    waterNeedMm: 305,
    baseYieldTha: 2.9,
    idealTempMin: 15,
    idealTempMax: 30,
    climates: ['Mediterranean', 'Semi-Arid', 'Temperate', 'Continental'],
    soilBenefit: 'Deep taproots pull up trapped nutrients and welcome pollinators.',
    plainNote: 'Hardy summer oilseed that protects harvests during dry spells.',
  },
  clover_cover: {
    id: 'clover_cover',
    name: 'Crimson Clover & Vetch Cover',
    family: 'Cover Crop',
    color: '#7BB800',
    lightBg: '#F0F9D9',
    textColor: '#466900',
    droughtTolerance: 'Moderate',
    nitrogenEffect: +72,
    waterNeedMm: 235,
    baseYieldTha: 4.6,
    idealTempMin: 8,
    idealTempMax: 25,
    climates: ['Mediterranean', 'Temperate', 'Continental', 'Subtropical'],
    soilBenefit: 'Blankets bare soil, prevents runoff erosion, and builds rich organic humus.',
    plainNote: 'Living green fertilizer that crowds out weeds without herbicides.',
  },
  maize: {
    id: 'maize',
    name: 'Maize (Corn)',
    family: 'Cereal',
    color: '#DDA20C',
    lightBg: '#FDF6DC',
    textColor: '#7A5B00',
    droughtTolerance: 'Low',
    nitrogenEffect: -58,
    waterNeedMm: 520,
    baseYieldTha: 8.6,
    idealTempMin: 18,
    idealTempMax: 31,
    climates: ['Continental', 'Temperate', 'Subtropical', 'Tropical'],
    soilBenefit: 'Produces abundant stalks that boost soil carbon when mulched.',
    plainNote: 'High-yielding grain that performs best right after soybeans or cowpeas.',
  },
  soybeans: {
    id: 'soybeans',
    name: 'Soybeans',
    family: 'Legume',
    color: '#3B9E47',
    lightBg: '#E7F6E9',
    textColor: '#1B5E23',
    droughtTolerance: 'Moderate',
    nitrogenEffect: +56,
    waterNeedMm: 390,
    baseYieldTha: 3.4,
    idealTempMin: 16,
    idealTempMax: 30,
    climates: ['Continental', 'Temperate', 'Subtropical', 'Tropical'],
    soilBenefit: 'Replenishes soil nitrogen and disrupts corn/wheat pest cycles.',
    plainNote: 'High-protein legume that keeps soil balanced and profitable.',
  },
  cowpeas: {
    id: 'cowpeas',
    name: 'Cowpeas (Black-Eyed Peas)',
    family: 'Legume',
    color: '#1E824C',
    lightBg: '#E1F5EA',
    textColor: '#0E4E2B',
    droughtTolerance: 'Very High',
    nitrogenEffect: +58,
    waterNeedMm: 240,
    baseYieldTha: 2.1,
    idealTempMin: 20,
    idealTempMax: 35,
    climates: ['Tropical', 'Subtropical', 'Semi-Arid'],
    soilBenefit: 'Rapid leafy ground cover stops erosion and adds natural nitrogen.',
    plainNote: 'Heat-loving legume ideal for warm tropical and dry climates.',
  },
  barley_vetch: {
    id: 'barley_vetch',
    name: 'Barley + Vetch Mix',
    family: 'Cover Crop',
    color: '#92D500',
    lightBg: '#F2FAD9',
    textColor: '#486C00',
    droughtTolerance: 'High',
    nitrogenEffect: +44,
    waterNeedMm: 270,
    baseYieldTha: 5.1,
    idealTempMin: 8,
    idealTempMax: 24,
    climates: ['Mediterranean', 'Semi-Arid', 'Temperate'],
    soilBenefit: 'Dual roots hold sloping soil tight while naturally suppressing winter weeds.',
    plainNote: 'Low-water forage & grain blend that cuts herbicide and fertilizer costs.',
  },
  vegetables: {
    id: 'vegetables',
    name: 'Seasonal Vegetables (Tomatoes / Peppers)',
    family: 'Vegetable',
    color: '#C8472C',
    lightBg: '#FCE9E4',
    textColor: '#812411',
    droughtTolerance: 'Low',
    nitrogenEffect: -48,
    waterNeedMm: 470,
    baseYieldTha: 36.0,
    idealTempMin: 16,
    idealTempMax: 30,
    climates: ['Mediterranean', 'Temperate', 'Subtropical', 'Tropical'],
    soilBenefit: 'Uses the rich nutrients built up by earlier legumes & cover crops.',
    plainNote: 'High-income harvest that thrives cleanly on rested, disease-free soil.',
  },
  canola: {
    id: 'canola',
    name: 'Canola (Rapeseed)',
    family: 'Oilseed',
    color: '#B5A800',
    lightBg: '#F9F8DA',
    textColor: '#5B5400',
    droughtTolerance: 'Moderate',
    nitrogenEffect: -32,
    waterNeedMm: 350,
    baseYieldTha: 3.4,
    idealTempMin: 10,
    idealTempMax: 24,
    climates: ['Temperate', 'Continental', 'Mediterranean'],
    soilBenefit: 'Natural brassica roots cleanse soil of fungal grain diseases.',
    plainNote: 'Clean break crop that lifts the following wheat harvest by 12–15%.',
  },
};

export const GLOBAL_EQUIPMENT_OPTIONS = [
  'Tractor & Basic Plow',
  'Precision Seeder / Planter',
  'Drip Irrigation Lines',
  'Soil Moisture Sensor',
  'No-Till Conservation Drill',
  'Local Weather Gauge',
];

export const GLOBAL_PREVIOUS_CROPS = [
  'Wheat',
  'Maize (Corn)',
  'Barley',
  'Rice',
  'Tomatoes / Vegetables',
  'Chickpeas / Beans',
  'Soybeans',
  'Sunflowers',
  'Sorghum / Millet',
  'Fallow / Bare Land',
];

export const DEFAULT_GLOBAL_PROFILE: FarmerProfile = (() => {
  const lat = 36.8142;
  const lng = 9.8635;
  const boundary = buildDefaultBoundary(lat, lng, 0.0032, 0.0044);
  const slopeDeg = resolveSlopeDegrees('Gentle Slope', { lat, lng });
  return {
    name: 'Amine Ben Salem',
    email: 'amine@medjerdafarms.tn',
    farmName: 'El-Khadhra Valley Farm',
    countryCode: 'TN',
    countryName: 'Tunisia',
    countryFlag: '🇹🇳',
    climateZone: 'Mediterranean',
    regionLabel: 'Medjerda Valley, Tunisia',
    coordinates: { lat, lng },
    boundary,
    areaHectares: computePolygonAreaHectares(boundary),
    soilType: 'Loamy',
    slopeOption: 'Gentle Slope',
    slopeDeg,
    irrigationType: 'Drip',
    equipment: ['Tractor & Basic Plow', 'Drip Irrigation Lines', 'Soil Moisture Sensor'],
    previousCrops: ['Wheat', 'Barley'],
    nasaPower: buildFallbackNasaPower({ lat, lng }, 'Loamy', slopeDeg),
  };
})();

/**
 * Generates a plain-language "Before" analysis from the farmer's live NASA POWER data,
 * soil type, slope, and recent crop history.
 */
export function buildBeforeFarmAnalysis(profile: FarmerProfile): FarmBeforeAnalysis {
  const nasa = profile.nasaPower;
  const lastCropsLower = profile.previousCrops.map((c) => c.toLowerCase()).join(' ');
  const repeatedCereal = /wheat|corn|maize|barley|rice/.test(lastCropsLower) && !/bean|chickpea|soy|clover|pea/.test(lastCropsLower);
  const wasFallow = /fallow|bare/.test(lastCropsLower);

  const slopeStatusLabel =
    profile.slopeDeg <= 3
      ? 'Low Erosion Slope (Flat)'
      : profile.slopeDeg <= 7
        ? `Gentle Slope (${profile.slopeDeg}°) — Cover Helps`
        : `Steep Slope (${profile.slopeDeg}°) — Keep Soil Covered`;

  const soilStatusLabel =
    profile.soilType === 'Loamy'
      ? 'Loamy Soil — Balanced & Workable'
      : profile.soilType === 'Clay'
        ? 'Clay Soil — Holds Moisture, Needs Deep Roots'
        : profile.soilType === 'Sandy'
          ? 'Sandy Soil — Drains Fast, Needs Organic Mulch'
          : profile.soilType === 'Silt'
            ? 'Silt Soil — Fertile, Protect Against Runoff'
            : 'Peaty Soil — High Carbon, Watch Drainage';

  const chemicalRiskLabel = repeatedCereal
    ? 'High Fertilizer Need (Continuous Grains)'
    : wasFallow
      ? 'Moderate Erosion & Weed Risk (Bare Soil)'
      : 'Moderate Input Cost — Can Cut 25–35%';

  const strengths: string[] = [
    `${nasa.moisturePlainText.split('—')[0].trim()} (${nasa.rootMoisturePct}% root-zone wetness from NASA POWER).`,
    `${profile.soilType} topsoil in a ${profile.climateZone} climate (${nasa.avgTempC}°C avg, ${nasa.annualRainMm} mm/yr rain).`,
    profile.irrigationType === 'Drip'
      ? 'Precision Drip irrigation lets you save water and target nutrients cleanly.'
      : `${profile.irrigationType} setup fits seasonal rotation transitions well.`,
  ];

  const needsAttention: string[] = [];
  if (repeatedCereal) {
    needsAttention.push(
      `Growing consecutive grains (${profile.previousCrops.join(', ')}) drains soil nitrogen and lets grain pests build up.`
    );
  }
  if (nasa.rootMoisturePct < 45 || profile.irrigationType === 'Rain-fed') {
    needsAttention.push(
      'Water conservation matters — adding deep-rooted and drought-hardy crops protects your harvest during dry weeks.'
    );
  }
  if (profile.slopeDeg >= 4) {
    needsAttention.push(
      `On a ${profile.slopeDeg}° slope, leaving soil bare between harvests risks washing away rich topsoil.`
    );
  }
  if (needsAttention.length === 0) {
    needsAttention.push(
      'Introducing a nitrogen-fixing legume and a living cover crop can reduce chemical fertilizer bills by 30%+.'
    );
  }

  return {
    headline: repeatedCereal
      ? 'Your soil is ready for a nitrogen-restoring legume break to boost next season’s harvest and cut fertilizer costs.'
      : `Your ${profile.soilType.toLowerCase()} field in ${profile.countryName} is well-suited for a smart multi-season rotation.`,
    soilStatusLabel,
    moistureStatusLabel: `Soil Moisture: ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)`,
    slopeStatusLabel,
    chemicalRiskLabel,
    strengths,
    needsAttention,
  };
}

function makeStepsFromSequence(
  cropIds: [string, string, string, string],
  profile: FarmerProfile,
  baseChemDrop: number
): UnifiedSeasonStep[] {
  const seasons = [
    { name: 'Season 1 · Starting Crop', short: 'Season 1', timing: 'Months 1–6' },
    { name: 'Season 2 · Soil Builder', short: 'Season 2', timing: 'Months 7–12' },
    { name: 'Season 3 · Nutrient Harvester', short: 'Season 3', timing: 'Year 2 · Half 1' },
    { name: 'Season 4 · Protective Renewal', short: 'Season 4', timing: 'Year 2 · Half 2' },
  ];

  let soilScore = 62;
  let chemDrop = Math.round(baseChemDrop * 0.35);

  return cropIds.map((id, idx) => {
    const crop = GLOBAL_CROPS[id] ?? GLOBAL_CROPS.wheat;
    const prevCrop = idx > 0 ? GLOBAL_CROPS[cropIds[idx - 1]] : null;

    if (crop.family === 'Legume' || crop.family === 'Cover Crop') {
      soilScore = Math.min(96, soilScore + 12);
      chemDrop = Math.min(52, chemDrop + 12);
    } else {
      soilScore = Math.min(95, soilScore + 6);
      chemDrop = Math.min(48, chemDrop + 6);
    }

    const moistureRetention = Math.min(94, 62 + idx * 8 + (crop.droughtTolerance === 'High' || crop.droughtTolerance === 'Very High' ? 6 : 2));

    const whatToDo =
      idx === 0
        ? `Plant ${crop.name} across your ${profile.areaHectares} ha field using gentle soil preparation to keep moisture locked in.`
        : crop.family === 'Legume'
          ? `Rotate the entire field into ${crop.name} right after ${prevCrop?.name ?? 'harvest'} to pump natural nitrogen back into the root zone.`
          : crop.family === 'Cover Crop'
            ? `Seed ${crop.name} immediately after harvest so your land never sits bare against wind or rain.`
            : `Plant ${crop.name} to capture the fresh natural nutrients left behind by ${prevCrop?.name ?? 'the previous crop'}.`;

    const soilImprovementNote =
      crop.family === 'Legume'
        ? `Natural Nitrogen Boost: adds ~${crop.nitrogenEffect} kg/ha of plant-ready nitrogen without buying bags of synthetic fertilizer.`
        : crop.family === 'Cover Crop'
          ? 'Living ground blanket shields topsoil, feeds earthworms, and builds dark organic matter.'
          : prevCrop?.family === 'Legume'
            ? `Thrives on leftover nitrogen from ${prevCrop.name} — needing far less chemical top-dressing.`
            : crop.soilBenefit;

    const pestBreakNote =
      idx === 0
        ? 'Sets clean baseline across your unified field surface.'
        : `Switching plant family (${prevCrop?.family} → ${crop.family}) starves soil pests and weeds naturally, reducing spray needs.`;

    return {
      stepNumber: idx + 1,
      seasonName: seasons[idx].name,
      shortSeason: seasons[idx].short,
      timingLabel: seasons[idx].timing,
      cropId: crop.id,
      cropName: crop.name,
      cropColor: crop.color,
      cropFamily: crop.family,
      stageLabel: idx === 0 ? 'Active Establishment' : idx === 1 ? 'Nitrogen Recovery' : idx === 2 ? 'Peak Harvest Gain' : 'Soil Carbon Lock',
      soilRichnessScore: soilScore,
      chemicalReductionPct: chemDrop,
      moistureRetentionPct: moistureRetention,
      whatToDo,
      soilImprovementNote,
      pestBreakNote,
    };
  });
}

function pickRegionalSequences(climate: ClimateZone, isDry: boolean): {
  top1: [string, string, string, string];
  top2: [string, string, string, string];
  top3: [string, string, string, string];
} {
  if (climate === 'Tropical' || climate === 'Subtropical') {
    return {
      top1: ['maize', 'cowpeas', 'vegetables', 'clover_cover'],
      top2: ['cowpeas', 'maize', 'soybeans', 'clover_cover'],
      top3: ['sorghum', 'cowpeas', 'sunflower', 'barley_vetch'],
    };
  }
  if (climate === 'Continental' || climate === 'Temperate') {
    return {
      top1: ['wheat', 'soybeans', 'canola', 'clover_cover'],
      top2: ['fava_beans', 'wheat', 'clover_cover', 'canola'],
      top3: isDry
        ? ['sorghum', 'chickpeas', 'sunflower', 'barley_vetch']
        : ['barley_vetch', 'fava_beans', 'sunflower', 'wheat'],
    };
  }
  // Mediterranean & Semi-Arid
  return {
    top1: isDry
      ? ['wheat', 'chickpeas', 'sunflower', 'barley_vetch']
      : ['wheat', 'fava_beans', 'vegetables', 'clover_cover'],
    top2: ['fava_beans', 'wheat', 'clover_cover', 'chickpeas'],
    top3: ['sorghum', 'chickpeas', 'sunflower', 'barley_vetch'],
  };
}

/**
 * Agronomic Decision Engine:
 * Scores & ranks the Top 3 Crop Rotation Strategies tailored to the farmer's live
 * NASA POWER data, country climate, soil type, slope, and recent crop history.
 */
export function evaluateTop3Strategies(profile: FarmerProfile): ScoredRotationStrategy[] {
  const nasa = profile.nasaPower;
  const isDry = nasa.rootMoisturePct < 45 || nasa.annualRainMm < 450 || profile.irrigationType === 'Rain-fed';
  const seqs = pickRegionalSequences(profile.climateZone, isDry);

  const slopeBonus = profile.slopeDeg >= 5 ? 4 : 2;
  const dryBonus = isDry ? 5 : 1;

  const top1Score = Math.min(97, Math.round(88 + (profile.soilType === 'Loamy' ? 5 : 3) + (nasa.moistureStatus === 'Good' ? 3 : 1)));
  const top2Score = Math.min(95, Math.round(85 + slopeBonus + (profile.previousCrops.some((c) => /wheat|corn|barley|maize/i.test(c)) ? 4 : 1)));
  const top3Score = Math.min(96, Math.round(83 + dryBonus + (profile.irrigationType === 'Rain-fed' || profile.irrigationType === 'Drip' ? 4 : 1)));

  const s1Steps = makeStepsFromSequence(seqs.top1, profile, 32);
  const s2Steps = makeStepsFromSequence(seqs.top2, profile, 44);
  const s3Steps = makeStepsFromSequence(seqs.top3, profile, 38);

  const strategies: ScoredRotationStrategy[] = [
    {
      id: 'top-1-balanced',
      rank: 1,
      tierLabel: 'Top 1 Strategy',
      focusTag: 'Best Overall Match for Soil & Climate',
      title: 'Balanced Harvest & Natural Fertility Cycle',
      subtitle: `${s1Steps.map((s) => s.cropName.split(' ')[0]).join(' → ')}`,
      image: '/images/hero-crop-rotation.jpg',
      matchScore: top1Score,
      highlights: [
        'Best overall fit for your NASA weather & soil moisture',
        'Natural nitrogen boost from legumes cuts fertilizer by ~32%',
        'Steady harvest income while breaking grain pest cycles',
      ],
      steps: s1Steps,
      aiSuggestions: [
        `Your NASA POWER moisture (${nasa.rootMoisturePct}% — ${nasa.moistureStatus}) supports planting ${s1Steps[0].cropName} first, followed directly by ${s1Steps[1].cropName}.`,
        `Wait for autumn topsoil moisture above ${Math.max(28, nasa.topMoisturePct - 4)}% before sowing to get fast, even sprouting.`,
        `Leave crop stalks on the field after harvest to protect your ${profile.soilType.toLowerCase()} soil from sun drying.`,
      ],
      benefits: [
        {
          title: 'Richer Soil Components',
          metric: '+24% Soil Fertility',
          detail: 'Alternating grains, legumes, and cover crops rebuilds dark humus and feeds healthy soil microbes.',
        },
        {
          title: 'Less Chemical Fertilizer Needed',
          metric: '-32% Chemicals',
          detail: 'Legume roots pull free nitrogen from the air, cutting your annual synthetic fertilizer spend.',
        },
        {
          title: 'Natural Pest & Weed Break',
          metric: '-38% Spray Risk',
          detail: 'Changing crop families every season stops fungal root rot and stubborn weeds from carrying over.',
        },
      ],
      expectedOutput: {
        yieldImprovementPct: 19,
        chemicalReductionPct: 32,
        waterSavingsPct: 22,
        soilFertilityGainPct: 24,
        sustainabilityScore: 89,
        bareDaysPerYear: 46,
        plainSummary:
          'Expect ~19% stronger multi-season harvests, nearly one-third less synthetic fertilizer, and healthier, easier-to-work soil.',
      },
    },
    {
      id: 'top-2-soil-restore',
      rank: 2,
      tierLabel: 'Top 2 Strategy',
      focusTag: 'Maximum Soil Restoration & Nitrogen Boost',
      title: 'Deep Soil Recovery & Organic Nitrogen Plan',
      subtitle: `${s2Steps.map((s) => s.cropName.split(' ')[0]).join(' → ')}`,
      image: '/images/strategy-legume-restore.jpg',
      matchScore: top2Score,
      highlights: [
        'Double legume & cover-crop boost restores tired soils fast',
        'Up to 44% less chemical fertilizer & pesticide needed',
        `Keeps ground covered on your ${profile.slopeDeg}° slope to stop erosion`,
      ],
      steps: s2Steps,
      aiSuggestions: [
        `Starting with ${s2Steps[0].cropName} immediately heals nitrogen depletion left by previous crops (${profile.previousCrops.join(', ') || 'grains'}).`,
        'Avoid deep plowing after cover crops — light mulching keeps organic carbon trapped in your topsoil.',
        'Expect noticeably darker, spongier soil structure after Season 2 that holds rainwater much longer.',
      ],
      benefits: [
        {
          title: 'Maximum Natural Nitrogen Boost',
          metric: '+68 kg N/ha Free',
          detail: 'Fava beans and crimson clover act like a living fertilizer factory right inside your field.',
        },
        {
          title: 'Major Cut in Chemical Costs',
          metric: '-44% Chemicals',
          detail: 'Dense cover crops smother weeds naturally and eliminate heavy synthetic urea applications.',
        },
        {
          title: 'Year-Round Erosion Shield',
          metric: '91% Soil Covered',
          detail: 'Keeps living roots anchored during heavy rain months so fertile topsoil stays on your farm.',
        },
      ],
      expectedOutput: {
        yieldImprovementPct: 16,
        chemicalReductionPct: 44,
        waterSavingsPct: 26,
        soilFertilityGainPct: 36,
        sustainabilityScore: 94,
        bareDaysPerYear: 31,
        plainSummary:
          'Fastest soil healing plan: +36% fertility growth, 44% lower chemical input costs, and rock-solid erosion protection.',
      },
    },
    {
      id: 'top-3-water-smart',
      rank: 3,
      tierLabel: 'Top 3 Strategy',
      focusTag: 'Water-Saving & Low-Chemical Input',
      title: 'Drought-Smart Water Conservation Rotation',
      subtitle: `${s3Steps.map((s) => s.cropName.split(' ')[0]).join(' → ')}`,
      image: '/images/strategy-water-smart.jpg',
      matchScore: top3Score,
      highlights: [
        'Saves up to 36% water with heat-hardy deep-root crops',
        'Low chemical inputs — naturally drought & pest resilient',
        'Protects your harvest even during dry or hot seasons',
      ],
      steps: s3Steps,
      aiSuggestions: [
        `Built for ${profile.countryName}'s warm months (${nasa.avgTempC}°C avg) — ${s3Steps[0].cropName} and ${s3Steps[1].cropName} thrive with minimal water.`,
        `Pair with ${profile.irrigationType} during flowering only to stretch every cubic meter of water.`,
        'Deep sunflower & sorghum roots reach subsoil moisture ordinary grains cannot touch.',
      ],
      benefits: [
        {
          title: 'Big Water & Pumping Savings',
          metric: '-36% Water Needed',
          detail: 'Hardy varieties and straw mulch slash evaporation and keep harvests safe in dry years.',
        },
        {
          title: 'Low-Input Resilience',
          metric: '-38% Chemicals',
          detail: 'Tough crops naturally outcompete weeds and resist heat stress without costly chemical sprays.',
        },
        {
          title: 'Deep Soil Loosening',
          metric: '165 cm Root Depth',
          detail: 'Strong taproots naturally break compacted soil layers so rain soaks in instead of running off.',
        },
      ],
      expectedOutput: {
        yieldImprovementPct: 17,
        chemicalReductionPct: 38,
        waterSavingsPct: 36,
        soilFertilityGainPct: 28,
        sustainabilityScore: 91,
        bareDaysPerYear: 42,
        plainSummary:
          'Saves 36% water and 38% chemical inputs while keeping harvests steady even in hot, dry weather.',
      },
    },
  ];

  return strategies;
}

/**
 * Generates multi-year Farm Calendar events covering Past History (2024-2025),
 * Current Progress (2026), and Future Plan (2027-2029) with Bare-Field Protection Alerts.
 */
export function buildFarmCalendarEvents(
  profile: FarmerProfile,
  activeStrategy: ScoredRotationStrategy
): CalendarEvent[] {
  const s1 = activeStrategy.steps[0];
  const s2 = activeStrategy.steps[1];
  const s3 = activeStrategy.steps[2];
  const s4 = activeStrategy.steps[3];
  const prevCrop = profile.previousCrops[0] || 'Wheat';

  const events: CalendarEvent[] = [
    // PAST HISTORY (2024 & 2025)
    {
      id: 'cal-2024-03',
      date: '2024-03-18',
      year: 2024,
      month: 3,
      season: 'Spring',
      phase: 'past',
      category: 'soil',
      title: `Spring Top-Dressing on ${prevCrop}`,
      description: 'Completed mid-season nutrient check and weed inspection on field.',
      cropName: prevCrop,
      completed: true,
    },
    {
      id: 'cal-2024-06',
      date: '2024-06-22',
      year: 2024,
      month: 6,
      season: 'Summer',
      phase: 'past',
      category: 'harvest',
      title: `2024 ${prevCrop} Harvest Completed`,
      description: 'Harvested 4.6 t/ha. Noted early signs of soil fatigue after consecutive grain seasons.',
      cropName: prevCrop,
      completed: true,
    },
    {
      id: 'cal-2024-11',
      date: '2024-11-05',
      year: 2024,
      month: 11,
      season: 'Autumn',
      phase: 'past',
      category: 'planting',
      title: 'Autumn Sowing — Transition Season',
      description: `Sowed ${profile.previousCrops[1] || prevCrop} with reduced tillage to keep topsoil moisture.`,
      cropName: profile.previousCrops[1] || prevCrop,
      completed: true,
    },
    {
      id: 'cal-2025-04',
      date: '2025-04-12',
      year: 2025,
      month: 4,
      season: 'Spring',
      phase: 'past',
      category: 'water',
      title: 'Spring Moisture Check & Irrigation Tuning',
      description: `Adjusted ${profile.irrigationType} schedule during mild April dry spell.`,
      completed: true,
    },
    {
      id: 'cal-2025-06',
      date: '2025-06-28',
      year: 2025,
      month: 6,
      season: 'Summer',
      phase: 'past',
      category: 'harvest',
      title: '2025 Summer Harvest Logged',
      description: 'Recorded 5.1 t/ha harvest and left straw mulch on the field surface.',
      cropName: profile.previousCrops[1] || prevCrop,
      completed: true,
    },
    {
      id: 'cal-2025-10',
      date: '2025-10-19',
      year: 2025,
      month: 10,
      season: 'Autumn',
      phase: 'past',
      category: 'soil',
      title: 'Baseline Soil & NASA Satellite Sync',
      description: `Synced ${profile.soilType} soil profile and ${profile.slopeDeg}° slope with NASA POWER data.`,
      completed: true,
    },

    // CURRENT PROGRESS (2026)
    {
      id: 'cal-2026-03',
      date: '2026-03-14',
      year: 2026,
      month: 3,
      season: 'Spring',
      phase: 'past',
      category: 'water',
      title: 'Spring NASA Moisture Verification',
      description: `Root-zone soil wetness measured at ${profile.nasaPower.rootMoisturePct}% (${profile.nasaPower.moistureStatus}).`,
      completed: true,
    },
    {
      id: 'cal-2026-06',
      date: '2026-06-20',
      year: 2026,
      month: 6,
      season: 'Summer',
      phase: 'past',
      category: 'harvest',
      title: 'Mid-Year Field Harvest & Residue Mulching',
      description: 'Harvest finished cleanly; chopped stalks retained on surface to stop sun crusting.',
      completed: true,
    },
    {
      id: 'cal-2026-10',
      date: '2026-10-28',
      year: 2026,
      month: 10,
      season: 'Autumn',
      phase: 'current',
      category: 'planting',
      title: `Sow Season 1: ${s1.cropName}`,
      description: s1.whatToDo,
      cropName: s1.cropName,
      completed: true,
    },
    {
      id: 'cal-2026-11-16',
      date: '2026-11-16',
      year: 2026,
      month: 11,
      season: 'Autumn',
      phase: 'current',
      category: 'soil',
      title: `Emergence Check & Soil Cover Inspection`,
      description: `Check early sprouting of ${s1.cropName} and confirm rainwater drainage on ${profile.slopeDeg}° slope.`,
      cropName: s1.cropName,
      completed: false,
    },
    {
      id: 'cal-2026-11-24',
      date: '2026-11-24',
      year: 2026,
      month: 11,
      season: 'Autumn',
      phase: 'current',
      category: 'water',
      title: 'NASA Moisture Check Before December Rains',
      description: 'Review NASA POWER rainfall update to skip unnecessary irrigation passes.',
      cropName: s1.cropName,
      completed: false,
    },
    {
      id: 'cal-2026-12-10',
      date: '2026-12-10',
      year: 2026,
      month: 12,
      season: 'Winter',
      phase: 'current',
      category: 'alert',
      title: 'Bare-Field Protection Check',
      description: 'Ensure full winter ground cover so heavy rain does not wash away rich topsoil.',
      completed: false,
    },

    // FUTURE SCHEDULE (2027 - 2029)
    {
      id: 'cal-2027-03',
      date: '2027-03-15',
      year: 2027,
      month: 3,
      season: 'Spring',
      phase: 'future',
      category: 'soil',
      title: `Reduced-Chemical Nutrition Check (${s1.cropName})`,
      description: `Apply ~${s1.chemicalReductionPct}% less synthetic fertilizer as soil health builds.`,
      cropName: s1.cropName,
    },
    {
      id: 'cal-2027-06',
      date: '2027-06-18',
      year: 2027,
      month: 6,
      season: 'Summer',
      phase: 'future',
      category: 'harvest',
      title: `Harvest Season 1: ${s1.cropName}`,
      description: 'Complete Season 1 harvest and prepare light mulch bed for Season 2 transition.',
      cropName: s1.cropName,
    },
    {
      id: 'cal-2027-09',
      date: '2027-09-25',
      year: 2027,
      month: 9,
      season: 'Autumn',
      phase: 'future',
      category: 'alert',
      title: 'Bare-Field Alert: Transition Window (< 30 Days)',
      description: `Avoid leaving soil exposed after summer; seed ${s2.cropName} right after first autumn rain.`,
      cropName: s2.cropName,
    },
    {
      id: 'cal-2027-10',
      date: '2027-10-22',
      year: 2027,
      month: 10,
      season: 'Autumn',
      phase: 'future',
      category: 'rotation',
      title: `Rotate Field to Season 2: ${s2.cropName}`,
      description: s2.soilImprovementNote,
      cropName: s2.cropName,
    },
    {
      id: 'cal-2028-05',
      date: '2028-05-24',
      year: 2028,
      month: 5,
      season: 'Spring',
      phase: 'future',
      category: 'harvest',
      title: `Harvest Season 2: ${s2.cropName}`,
      description: `Leaves natural nitrogen bank in your ${profile.soilType.toLowerCase()} soil for Season 3.`,
      cropName: s2.cropName,
    },
    {
      id: 'cal-2028-10',
      date: '2028-10-18',
      year: 2028,
      month: 10,
      season: 'Autumn',
      phase: 'future',
      category: 'rotation',
      title: `Rotate Field to Season 3: ${s3.cropName}`,
      description: s3.whatToDo,
      cropName: s3.cropName,
    },
    {
      id: 'cal-2029-06',
      date: '2029-06-15',
      year: 2029,
      month: 6,
      season: 'Summer',
      phase: 'future',
      category: 'harvest',
      title: `Peak Yield Harvest: ${s3.cropName}`,
      description: `Projected +${activeStrategy.expectedOutput.yieldImprovementPct}% stronger harvest with -${activeStrategy.expectedOutput.chemicalReductionPct}% chemical cost.`,
      cropName: s3.cropName,
    },
    {
      id: 'cal-2029-10',
      date: '2029-10-20',
      year: 2029,
      month: 10,
      season: 'Autumn',
      phase: 'future',
      category: 'rotation',
      title: `Rotate Field to Season 4: ${s4.cropName}`,
      description: s4.soilImprovementNote,
      cropName: s4.cropName,
    },
  ];

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Single-surface multi-year Farm History (2022–2026) combining NASA climate records
 * with the farmer's past crop choices, soil notes, and harvest outcomes.
 */
export function buildUnifiedHistoryRecords(
  profile: FarmerProfile,
  activeStrategy: ScoredRotationStrategy
): HistoricalSeasonRecord[] {
  const baseRain = profile.nasaPower.annualRainMm;
  const baseTemp = profile.nasaPower.avgTempC;
  const currentCrop = activeStrategy.steps[0];

  return [
    {
      id: 'hist-2022',
      year: 2022,
      seasonLabel: '2022 · Single-Crop Baseline',
      cropId: 'wheat',
      cropName: profile.previousCrops[0] || 'Wheat',
      cropColor: '#EBB40E',
      yieldTha: 4.1,
      soilOrganicMatterPct: 1.75,
      somDeltaPct: -0.08,
      chemicalInputIndex: 100,
      nasaSummary: {
        rainfallMm: Math.round(baseRain * 0.84),
        avgTempC: Number((baseTemp + 0.9).toFixed(1)),
        moistureLabel: 'Dry Spring',
        rootMoisturePct: Math.max(24, profile.nasaPower.rootMoisturePct - 9),
        ndviAvg: 0.56,
      },
      soilNotes:
        'Third year growing similar grains on the same land. Soil felt harder to plow and needed extra synthetic nitrogen.',
      farmerActions: [
        'Conventional full tillage before autumn planting',
        'Full synthetic fertilizer & herbicide application across entire field',
      ],
    },
    {
      id: 'hist-2023',
      year: 2023,
      seasonLabel: '2023 · First Legume Break Trial',
      cropId: 'chickpeas',
      cropName: 'Chickpeas',
      cropColor: '#2B9D5A',
      yieldTha: 2.2,
      soilOrganicMatterPct: 1.88,
      somDeltaPct: +0.13,
      chemicalInputIndex: 82,
      nasaSummary: {
        rainfallMm: Math.round(baseRain * 0.93),
        avgTempC: Number((baseTemp + 0.5).toFixed(1)),
        moistureLabel: 'Fair Moisture',
        rootMoisturePct: Math.max(28, profile.nasaPower.rootMoisturePct - 4),
        ndviAvg: 0.64,
      },
      soilNotes:
        'Legume roots naturally added nitrogen back into the soil and visibly loosened compacted clods.',
      farmerActions: [
        'Switched whole field to drought-hardy chickpeas to break grain root pests',
        'Cut synthetic nitrogen fertilizer by 18% and reduced tillage depth',
      ],
    },
    {
      id: 'hist-2024',
      year: 2024,
      seasonLabel: '2024 · Post-Legume Grain Rebound',
      cropId: 'wheat',
      cropName: 'Wheat',
      cropColor: '#EBB40E',
      yieldTha: 5.3,
      soilOrganicMatterPct: 2.08,
      somDeltaPct: +0.2,
      chemicalInputIndex: 74,
      nasaSummary: {
        rainfallMm: Math.round(baseRain * 1.04),
        avgTempC: Number((baseTemp + 0.2).toFixed(1)),
        moistureLabel: 'Good Moisture',
        rootMoisturePct: Math.min(82, profile.nasaPower.rootMoisturePct + 2),
        ndviAvg: 0.73,
      },
      soilNotes:
        'Harvest jumped +29% over 2022 while spending 26% less on chemical fertilizer thanks to prior legume nitrogen.',
      farmerActions: [
        'Sowed wheat directly into light legume residue mulch',
        'Skipped one chemical spray pass due to healthy, vigorous early canopy',
      ],
    },
    {
      id: 'hist-2025',
      year: 2025,
      seasonLabel: '2025 · Cover & Deep-Root Protection',
      cropId: 'sunflower',
      cropName: 'Sunflowers + Winter Cover',
      cropColor: '#D89B00',
      yieldTha: 3.1,
      soilOrganicMatterPct: 2.29,
      somDeltaPct: +0.21,
      chemicalInputIndex: 68,
      nasaSummary: {
        rainfallMm: Math.round(baseRain * 0.91),
        avgTempC: Number((baseTemp + 0.6).toFixed(1)),
        moistureLabel: 'Fair to Good',
        rootMoisturePct: profile.nasaPower.rootMoisturePct,
        ndviAvg: 0.75,
      },
      soilNotes:
        'Deep sunflower taproots broke subsoil compaction; autumn rain soaked cleanly into soil with zero gully runoff.',
      farmerActions: [
        'Planted drought-tolerant sunflowers followed by quick autumn cover mix',
        `Scheduled ${profile.irrigationType} using satellite moisture checks`,
      ],
    },
    {
      id: 'hist-2026',
      year: 2026,
      seasonLabel: `2026 · Current Active Plan (${activeStrategy.tierLabel})`,
      cropId: currentCrop.cropId,
      cropName: currentCrop.cropName,
      cropColor: currentCrop.cropColor,
      yieldTha: Number((5.2 * (1 + activeStrategy.expectedOutput.yieldImprovementPct / 100)).toFixed(1)),
      soilOrganicMatterPct: 2.52,
      somDeltaPct: +0.23,
      chemicalInputIndex: 100 - activeStrategy.expectedOutput.chemicalReductionPct,
      nasaSummary: {
        rainfallMm: baseRain,
        avgTempC: baseTemp,
        moistureLabel: profile.nasaPower.moistureStatus,
        rootMoisturePct: profile.nasaPower.rootMoisturePct,
        ndviAvg: profile.nasaPower.ndviEstimate,
      },
      soilNotes: currentCrop.soilImprovementNote,
      farmerActions: [
        `Activated "${activeStrategy.title}" from Tadawol Decision Engine`,
        `Live NASA POWER sync active (${profile.nasaPower.rootMoisturePct}% root wetness)`,
      ],
    },
  ];
}

export interface UnifiedForecastPoint {
  yearLabel: string;
  yearNum: number;
  soilFertilityStrategy: number; // % SOM
  soilFertilityBaseline: number;
  chemicalUsageStrategy: number; // % of baseline (100 = today, lower is better!)
  chemicalUsageBaseline: number;
  waterEfficiencyStrategy: number; // kg harvest per m3 water
  waterEfficiencyBaseline: number;
  harvestYieldStrategy: number; // t/ha
  harvestYieldBaseline: number;
}

export function computeUnifiedFiveYearForecast(
  strategy: ScoredRotationStrategy,
  profile: FarmerProfile
): {
  points: UnifiedForecastPoint[];
  year5Highlights: {
    soilFertilityPctGain: number;
    chemicalSavedPct: number;
    waterSavedM3PerYear: number;
    yieldIncreasePct: number;
    estimatedCostSavedUsd: number;
    sustainabilityScore: number;
  };
} {
  const out = strategy.expectedOutput;
  const baseSom = 2.2;
  const baseYield = 5.0;
  const baseWaterEff = 1.25;

  const points: UnifiedForecastPoint[] = [0, 1, 2, 3, 4, 5].map((yr) => {
    const progress = yr / 5;
    const curve = Math.pow(progress, 0.85);

    const soilFertilityStrategy = Number(
      (baseSom * (1 + (out.soilFertilityGainPct / 100) * curve)).toFixed(2)
    );
    const soilFertilityBaseline = Number((baseSom * (1 - 0.045 * yr)).toFixed(2));

    const chemicalUsageStrategy = Math.round(100 - out.chemicalReductionPct * curve);
    const chemicalUsageBaseline = Math.round(100 + 3.5 * yr);

    const waterEfficiencyStrategy = Number(
      (baseWaterEff * (1 + (out.waterSavingsPct / 100) * 1.15 * curve)).toFixed(2)
    );
    const waterEfficiencyBaseline = Number((baseWaterEff * (1 - 0.025 * yr)).toFixed(2));

    const harvestYieldStrategy = Number(
      (baseYield * (1 + (out.yieldImprovementPct / 100) * 1.1 * curve)).toFixed(2)
    );
    const harvestYieldBaseline = Number((baseYield * (1 - 0.035 * yr)).toFixed(2));

    return {
      yearLabel: yr === 0 ? 'Today' : `Year ${yr}`,
      yearNum: yr,
      soilFertilityStrategy,
      soilFertilityBaseline,
      chemicalUsageStrategy,
      chemicalUsageBaseline,
      waterEfficiencyStrategy,
      waterEfficiencyBaseline,
      harvestYieldStrategy,
      harvestYieldBaseline,
    };
  });

  const y5 = points[5];
  const waterSavedM3PerYear = Math.round(profile.areaHectares * 3900 * (out.waterSavingsPct / 100));
  const estimatedCostSavedUsd = Math.round(
    profile.areaHectares * (out.chemicalReductionPct * 4.8 + out.waterSavingsPct * 2.6)
  );

  return {
    points,
    year5Highlights: {
      soilFertilityPctGain: out.soilFertilityGainPct,
      chemicalSavedPct: out.chemicalReductionPct,
      waterSavedM3PerYear,
      yieldIncreasePct: Math.round(
        ((y5.harvestYieldStrategy - y5.harvestYieldBaseline) / y5.harvestYieldBaseline) * 100
      ),
      estimatedCostSavedUsd,
      sustainabilityScore: out.sustainabilityScore,
    },
  };
}

/**
 * Context-aware farmer-friendly Conversational AI Advisor.
 * Uses the farmer's live country, coordinates, NASA POWER data, soil, slope,
 * recent crops, and active strategy to answer plain-language questions.
 */
export function generateGlobalAgronomyReply(
  question: string,
  profile: FarmerProfile,
  activeStrategy: ScoredRotationStrategy,
  top3: ScoredRotationStrategy[],
  currentPage: string
): string {
  const q = question.toLowerCase();
  const nasa = profile.nasaPower;
  const firstName = profile.name.split(' ')[0];
  const s1 = activeStrategy.steps[0];
  const s2 = activeStrategy.steps[1];

  if (/water|moisture|dry|drought|irrigat|rain/.test(q)) {
    return `Based on live **NASA POWER** readings for your farm in **${profile.countryName}** (${profile.coordinates.lat.toFixed(2)}°, ${profile.coordinates.lng.toFixed(2)}°), your root-zone soil wetness is **${nasa.rootMoisturePct}% (${nasa.moistureStatus})** with **${nasa.recentRain14dMm} mm** of rain over the last 14 days.\n\n**Practical tip:** Keep crop residue mulch on your **${profile.soilType}** soil and use **${profile.irrigationType}** mainly during flowering. Switching to **${top3[2].title}** can cut water demand by up to **${top3[2].expectedOutput.waterSavingsPct}%**.`;
  }

  if (/fertiliz|nitrogen|chemical|cost|money|save|organic|manure|legume/.test(q)) {
    return `Great question, ${firstName}! Rotating your field from **${s1.cropName}** into **${s2.cropName}** adds natural nitrogen straight into your **${profile.soilType}** topsoil through root bacteria.\n\nWith your active **${activeStrategy.tierLabel} (${activeStrategy.title})**, you can expect **~${activeStrategy.expectedOutput.chemicalReductionPct}% less synthetic fertilizer and pesticide needed** while boosting soil fertility by **+${activeStrategy.expectedOutput.soilFertilityGainPct}%**.`;
  }

  if (/slope|erosion|runoff|hill|steep|wash|bare/.test(q)) {
    const slopeDesc =
      profile.slopeDeg <= 3
        ? 'flat (low erosion risk)'
        : profile.slopeDeg <= 7
          ? `a gentle ${profile.slopeDeg}° slope`
          : `a steeper ${profile.slopeDeg}° slope`;
    return `Your field is marked as **${slopeDesc}** (elevation ~${nasa.elevationM} m). Leaving soil bare between harvests is the #1 cause of topsoil washout.\n\n**What to do:** Follow the **Bare-Field Alerts** in your Farm Calendar and seed a fast cover crop right after summer harvest so your land stays covered over **${Math.round(((365 - activeStrategy.expectedOutput.bareDaysPerYear) / 365) * 100)}% of the year**.`;
  }

  if (/pest|disease|weed|fungus|bug|spray/.test(q)) {
    return `Growing the same crop family year after year (${profile.previousCrops.join(', ') || 'grains'}) lets root diseases and weeds survive in the soil. By rotating across distinct plant families (**${activeStrategy.steps.map((s) => s.cropName.split(' ')[0]).join(' → ')}**), you naturally break pest lifecycles and cut chemical spray costs significantly.`;
  }

  if (/best|which|compar|top 1|top 2|top 3|recommend|choose|strateg/.test(q)) {
    return `Here is how your **Top 3 Strategies** compare for **${profile.farmName}** (${profile.countryFlag} ${profile.countryName}, ${profile.soilType} soil):\n\n• **Top 1 (${top3[0].matchScore}% match):** ${top3[0].title} — best all-around balance (+${top3[0].expectedOutput.yieldImprovementPct}% yield, -${top3[0].expectedOutput.chemicalReductionPct}% chemicals).\n• **Top 2 (${top3[1].matchScore}% match):** ${top3[1].title} — fastest soil restoration (-${top3[1].expectedOutput.chemicalReductionPct}% chemicals).\n• **Top 3 (${top3[2].matchScore}% match):** ${top3[2].title} — maximum water savings (-${top3[2].expectedOutput.waterSavingsPct}% water).\n\nOpen **Rotation Lab** to click any of the 3 boxes and simulate it step-by-step on your field!`;
  }

  if (/when|sow|plant|calendar|schedule|task|month|date/.test(q)) {
    return `For **${profile.countryName}** (${profile.climateZone} climate, avg **${nasa.avgTempC}°C**), the best time to sow **${s1.cropName}** is right after the first steady autumn rain when soil wetness rises above **${Math.max(28, nasa.topMoisturePct - 4)}%**.\n\nYou can check exact **Days, Months, Seasons, and Years** milestones — plus Bare-Field Protection reminders — inside your **Farm Calendar** tab.`;
  }

  if (/nasa|satellite|power|smap|srtm|modis|source|data|limit|how does|frost|heavy|onset|driest/.test(q)) {
    return `Here is the exact live dataset snapshot for **${profile.countryFlag} ${profile.countryName}** (${profile.coordinates.lat.toFixed(3)}°, ${profile.coordinates.lng.toFixed(3)}°):\n\n• **NASA POWER (Always On, ${nasa.yearsAnalyzed}):** **${nasa.annualRainMm} mm/yr** mean rain, **driest year ${nasa.driestYear} (${nasa.driestYearMm} mm)**, **${nasa.heavyRainDaysPerYear} heavy-rain days/yr** (≥20 mm), **${nasa.frostDaysPerYear} frost days/yr** (T2M_MIN < 0°C), median **autumn rain onset ${nasa.autumnRainOnset}**, and **${nasa.rootMoisturePct}%** root wetness.\n• **Optional Earth Engine Layers:** **SMAP L4 v008** (9–11 km \`sm_rootzone\`), **MODIS MOD13Q1 v061** (250 m NDVI for bare-field risk), and **SRTM 30 m** (\`ee.Terrain.slope\`).\n• **Honest Limitation:** NASA POWER (~50 km MERRA-2 reanalysis) & SMAP are modelled regional datasets rather than field sensors, and MODIS NDVI tracks greenness rather than crop type.\n\nClick the **NASA POWER Live** pill on your Dashboard to view the complete dataset & risk threshold table!`;
  }

  return `I'm looking at your **${profile.areaHectares} ha ${profile.soilType}** farm in **${profile.countryFlag} ${profile.countryName}** (currently on **${currentPage}**).\n\n• **Live NASA Soil Moisture:** ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)\n• **Active Rotation:** ${activeStrategy.title} (${activeStrategy.steps.map((s) => s.cropName.split(' ')[0]).join(' → ')})\n• **Projected Savings:** ~${activeStrategy.expectedOutput.chemicalReductionPct}% less chemical fertilizer & +${activeStrategy.expectedOutput.yieldImprovementPct}% harvest gain.\n\nAsk me anything practical — like *"How do I reduce fertilizer costs?"*, *"When should I sow?"*, *"Compare my Top 3 strategies"*, or *"How do I save water on my soil?"*`;
}
