import {
  CalendarEvent,
  ClimateZone,
  CropInfo,
  CustomStageSpec,
  FarmBeforeAnalysis,
  FarmerProfile,
  HistoricalSeasonRecord,
  PlanCustomization,
  PlanStageOverride,
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
        ? `Gentle Slope (${profile.slopeDeg}°) · Cover Helps`
        : `Steep Slope (${profile.slopeDeg}°) · Keep Soil Covered`;

  const soilStatusLabel =
    profile.soilType === 'Loamy'
      ? 'Loamy Soil · Balanced & Workable'
      : profile.soilType === 'Clay'
        ? 'Clay Soil · Holds Moisture, Needs Deep Roots'
        : profile.soilType === 'Sandy'
          ? 'Sandy Soil · Drains Fast, Needs Organic Mulch'
          : profile.soilType === 'Silt'
            ? 'Silt Soil · Fertile, Protect Against Runoff'
            : 'Peaty Soil · High Carbon, Watch Drainage';

  const chemicalRiskLabel = repeatedCereal
    ? 'High Fertilizer Need (Continuous Grains)'
    : wasFallow
      ? 'Moderate Erosion & Weed Risk (Bare Soil)'
      : 'Moderate Input Cost · Can Cut 25-35%';

  const strengths: string[] = [
    `${nasa.moisturePlainText.split('·')[0].trim()} (${nasa.rootMoisturePct}% root-zone wetness from NASA POWER).`,
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
      'Water conservation matters: adding deep-rooted and drought-hardy crops protects your harvest during dry weeks.'
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
            ? `Thrives on leftover nitrogen from ${prevCrop.name}, needing far less chemical top-dressing.`
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
        `Your NASA POWER moisture (${nasa.rootMoisturePct}%, ${nasa.moistureStatus}) supports planting ${s1Steps[0].cropName} first, followed directly by ${s1Steps[1].cropName}.`,
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
        'Avoid deep plowing after cover crops. Light mulching keeps organic carbon trapped in your topsoil.',
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
        'Low chemical inputs, naturally drought & pest resilient',
        'Protects your harvest even during dry or hot seasons',
      ],
      steps: s3Steps,
      aiSuggestions: [
        `Built for ${profile.countryName}'s warm months (${nasa.avgTempC}°C avg): ${s3Steps[0].cropName} and ${s3Steps[1].cropName} thrive with minimal water.`,
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
  const s2 = activeStrategy.steps[1] ?? s1;
  const s3 = activeStrategy.steps[2];
  const s4 = activeStrategy.steps[3];
  const extraSteps = activeStrategy.steps.slice(4);
  const prevCrop = profile.previousCrops[0] || 'Wheat';

  const events: CalendarEvent[] = [
    // PAST HISTORY (2024 & 2025)
    {
      id: 'cal-2024-01',
      date: '2024-01-14',
      year: 2024,
      month: 1,
      season: 'Winter',
      phase: 'past',
      category: 'water',
      title: `Winter Drainage & Root Check (${prevCrop})`,
      description: `Checked winter rainfall infiltration and early ${prevCrop} root establishment across ${profile.slopeDeg}° slope.`,
      cropName: prevCrop,
      completed: true,
    },
    {
      id: 'cal-2024-02',
      date: '2024-02-16',
      year: 2024,
      month: 2,
      season: 'Winter',
      phase: 'past',
      category: 'soil',
      title: `Late-Winter Weed & Soil Cover Check (${prevCrop})`,
      description: `Verified canopy closure and early topsoil nitrogen levels ahead of spring growth.`,
      cropName: prevCrop,
      completed: true,
    },
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
      title: 'Autumn Sowing · Transition Season',
      description: `Sowed ${profile.previousCrops[1] || prevCrop} with reduced tillage to keep topsoil moisture.`,
      cropName: profile.previousCrops[1] || prevCrop,
      completed: true,
    },
    {
      id: 'cal-2025-01',
      date: '2025-01-15',
      year: 2025,
      month: 1,
      season: 'Winter',
      phase: 'past',
      category: 'water',
      title: 'Winter Rainfall & Root Moisture Review',
      description: `Monitored winter rainfall absorption on ${profile.soilType} soil during active crop tillering.`,
      cropName: profile.previousCrops[1] || prevCrop,
      completed: true,
    },
    {
      id: 'cal-2025-02',
      date: '2025-02-18',
      year: 2025,
      month: 2,
      season: 'Winter',
      phase: 'past',
      category: 'soil',
      title: 'Late-Winter Soil Vitality & Field Walk',
      description: 'Inspected winter crop vigor and checked organic cover before spring warm-up.',
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
      id: 'cal-2026-01',
      date: '2026-01-16',
      year: 2026,
      month: 1,
      season: 'Winter',
      phase: 'past',
      category: 'water',
      title: `Winter Growth & Rainfall Drainage Check (${prevCrop})`,
      description: `Checked winter soil moisture recharge (${profile.nasaPower.rootMoisturePct}% baseline) and field runoff channels.`,
      cropName: prevCrop,
      completed: true,
    },
    {
      id: 'cal-2026-02',
      date: '2026-02-14',
      year: 2026,
      month: 2,
      season: 'Winter',
      phase: 'past',
      category: 'soil',
      title: `Pre-Spring Root & Soil Health Check (${prevCrop})`,
      description: `Checked winter ${prevCrop} vigor and early nitrogen demand ahead of spring growth.`,
      cropName: prevCrop,
      completed: true,
    },
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
      id: 'cal-2027-01',
      date: '2027-01-15',
      year: 2027,
      month: 1,
      season: 'Winter',
      phase: 'future',
      category: 'water',
      title: `Winter Moisture & Frost Watch (${s1.cropName})`,
      description: `Verify winter canopy ground cover and rainwater infiltration for ${s1.cropName}.`,
      cropName: s1.cropName,
    },
    {
      id: 'cal-2027-02',
      date: '2027-02-16',
      year: 2027,
      month: 2,
      season: 'Winter',
      phase: 'future',
      category: 'soil',
      title: `Late-Winter Root & Weed Inspection (${s1.cropName})`,
      description: `Inspect ${s1.cropName} root vigor and plan low-chemical spring nutrition.`,
      cropName: s1.cropName,
    },
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
    ...(s3
      ? [
          {
            id: 'cal-2028-10',
            date: '2028-10-18',
            year: 2028,
            month: 10,
            season: 'Autumn' as const,
            phase: 'future' as const,
            category: 'rotation' as const,
            title: `Rotate Field to Season 3: ${s3.cropName}`,
            description: s3.whatToDo,
            cropName: s3.cropName,
          },
          {
            id: 'cal-2029-06',
            date: '2029-06-15',
            year: 2029,
            month: 6,
            season: 'Summer' as const,
            phase: 'future' as const,
            category: 'harvest' as const,
            title: `Peak Yield Harvest: ${s3.cropName}`,
            description: `Projected +${activeStrategy.expectedOutput.yieldImprovementPct}% stronger harvest with -${activeStrategy.expectedOutput.chemicalReductionPct}% chemical cost.`,
            cropName: s3.cropName,
          },
        ]
      : []),
    ...(s4
      ? [
          {
            id: 'cal-2029-10',
            date: '2029-10-20',
            year: 2029,
            month: 10,
            season: 'Autumn' as const,
            phase: 'future' as const,
            category: 'rotation' as const,
            title: `Rotate Field to Season 4: ${s4.cropName}`,
            description: s4.soilImprovementNote,
            cropName: s4.cropName,
          },
        ]
      : []),
    ...extraSteps.map((step, extraIdx) => {
      const yr = 2030 + extraIdx;
      return {
        id: `cal-custom-stage-${step.stepNumber}-${yr}`,
        date: `${yr}-04-15`,
        year: yr,
        month: 4,
        season: 'Spring' as const,
        phase: 'future' as const,
        category: 'rotation' as const,
        title: `Custom Stage ${step.stepNumber}: ${step.cropName}`,
        description: step.whatToDo || step.soilImprovementNote,
        cropName: step.cropName,
      };
    }),
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
 * Shared scenario-adjusted 5-year forecast used by both Future Predictions and Dashboard
 * so every projected number (soil fertility, water efficiency, chemical reduction, harvest yield)
 * stays 1:1 synchronized across the entire app.
 */
export interface CustomScenarioParams {
  rainChangePct: number; // -50 to +60
  tempDeltaC: number; // -3.0 to +4.5
  irrigationSupplyPct: number; // 20 to 130 (100 = normal)
  organicInputBoostPct: number; // -20 to +50 (0 = standard)
  extremeRiskLevel: 'low' | 'moderate' | 'severe';
}

export const DEFAULT_SCENARIO_PARAMS: CustomScenarioParams = {
  rainChangePct: 0,
  tempDeltaC: 0,
  irrigationSupplyPct: 100,
  organicInputBoostPct: 0,
  extremeRiskLevel: 'low',
};

export function getPresetScenarioParams(
  scenario: 'normal' | 'drought' | 'wet' | 'heatwave'
): CustomScenarioParams {
  if (scenario === 'drought') {
    return {
      rainChangePct: -30,
      tempDeltaC: 1.8,
      irrigationSupplyPct: 75,
      organicInputBoostPct: 0,
      extremeRiskLevel: 'moderate',
    };
  }
  if (scenario === 'wet') {
    return {
      rainChangePct: 30,
      tempDeltaC: -0.4,
      irrigationSupplyPct: 110,
      organicInputBoostPct: 0,
      extremeRiskLevel: 'moderate',
    };
  }
  if (scenario === 'heatwave') {
    return {
      rainChangePct: -25,
      tempDeltaC: 3.2,
      irrigationSupplyPct: 70,
      organicInputBoostPct: 0,
      extremeRiskLevel: 'severe',
    };
  }
  return { ...DEFAULT_SCENARIO_PARAMS };
}

/**
 * Deterministic instant NLP parser for farmer-written future stress-test scenarios
 * (works immediately offline and acts as a reliable base alongside live LLM parsing).
 */
export function parseScenarioTextToParams(
  text: string,
  base: CustomScenarioParams = DEFAULT_SCENARIO_PARAMS
): {
  params: CustomScenarioParams;
  matchedLabels: string[];
  isRelevant: boolean;
} {
  const q = text.toLowerCase().trim();
  const next: CustomScenarioParams = { ...base };
  const matchedLabels: string[] = [];

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

  // Explicit rainfall % shift (e.g. "-35% rain", "30% less rain", "+40% rainfall", "more rain 25%")
  const rainLessMatch = q.match(/(\d{1,2})\s*%\s*(?:less|lower|drop|deficit|fewer)\s*(?:rain|rainfall|precipitation|precip)/)
    || q.match(/(?:rain|rainfall|precipitation)\s*(?:drops?|down|minus|-)\s*(?:by\s*)?(\d{1,2})\s*%/);
  const rainMoreMatch = q.match(/\+?(\d{1,2})\s*%\s*(?:more|higher|extra|increase)\s*(?:rain|rainfall|precipitation)/)
    || q.match(/(?:rain|rainfall|precipitation)\s*(?:up|plus|\+|increases?\s*by)\s*(\d{1,2})\s*%/);
  const signedRainMatch = q.match(/([+-]\d{1,2})\s*%\s*(?:rain|rainfall)/);

  if (rainLessMatch) {
    next.rainChangePct = clamp(-Number(rainLessMatch[1]), -50, 60);
    matchedLabels.push(`Rain ${next.rainChangePct}%`);
  } else if (rainMoreMatch) {
    next.rainChangePct = clamp(Number(rainMoreMatch[1]), -50, 60);
    matchedLabels.push(`Rain +${next.rainChangePct}%`);
  } else if (signedRainMatch) {
    next.rainChangePct = clamp(Number(signedRainMatch[1]), -50, 60);
    matchedLabels.push(`Rain ${next.rainChangePct > 0 ? '+' : ''}${next.rainChangePct}%`);
  } else if (/\b(severe drought|extreme drought|no rain|zero rain|bone dry)\b/.test(q)) {
    next.rainChangePct = -45;
    next.extremeRiskLevel = 'severe';
    matchedLabels.push('Severe Drought (-45% rain)');
  } else if (/\b(drought|dry|arid|dry spell|less rain|low rain|scarce rain)\b/.test(q)) {
    next.rainChangePct = -30;
    matchedLabels.push('Dry / Drought (-30% rain)');
  } else if (/\b(flood|flooding|deluge|torrential|heavy storm|cyclone|extreme rain)\b/.test(q)) {
    next.rainChangePct = 50;
    next.extremeRiskLevel = 'severe';
    matchedLabels.push('Heavy Storm (+50% rain)');
  } else if (/\b(wet|heavy rain|more rain|rainy|high rain)\b/.test(q)) {
    next.rainChangePct = 30;
    matchedLabels.push('Wet Year (+30% rain)');
  }

  // Explicit temperature delta (e.g. "+2.5°C", "+3 C hotter", "2 degrees warmer", "-2°C frost")
  const tempWarmMatch =
    q.match(/\+?(\d(?:\.\d)?)\s*(?:°\s*c|c\b|deg|degree|degrees)\s*(?:hotter|warmer|higher|heat|up)/) ||
    q.match(/(?:hotter|warmer|heat|temp(?:erature)?)\s*(?:by\s*)?\+?(\d(?:\.\d)?)\s*(?:°\s*c|c\b|deg|degrees?)/) ||
    q.match(/\+(\d(?:\.\d)?)\s*(?:°\s*c|°)/);
  const tempCoolMatch =
    q.match(/(\d(?:\.\d)?)\s*(?:°\s*c|c\b|deg|degrees?)\s*(?:colder|cooler|lower|frost|drop)/) ||
    q.match(/-(\d(?:\.\d)?)\s*(?:°\s*c|°)/);

  if (tempWarmMatch) {
    next.tempDeltaC = clamp(Number(tempWarmMatch[1]), -3, 4.5);
    matchedLabels.push(`Temp +${next.tempDeltaC}°C`);
  } else if (tempCoolMatch) {
    next.tempDeltaC = clamp(-Number(tempCoolMatch[1]), -3, 4.5);
    matchedLabels.push(`Temp ${next.tempDeltaC}°C`);
  } else if (/\b(extreme heat|heatwave|heat wave|scorching|blistering|very hot)\b/.test(q)) {
    next.tempDeltaC = 3.2;
    next.extremeRiskLevel = 'severe';
    matchedLabels.push('Heatwave (+3.2°C)');
  } else if (/\b(hotter|warmer|hot summer|warm)\b/.test(q)) {
    next.tempDeltaC = 1.8;
    matchedLabels.push('Warmer (+1.8°C)');
  } else if (/\b(severe frost|hard freeze|freezing|ice storm)\b/.test(q)) {
    next.tempDeltaC = -2.6;
    next.extremeRiskLevel = 'severe';
    matchedLabels.push('Severe Frost (-2.6°C)');
  } else if (/\b(frost|cold|chilly|cooler|freeze)\b/.test(q)) {
    next.tempDeltaC = -1.6;
    next.extremeRiskLevel = next.extremeRiskLevel === 'severe' ? 'severe' : 'moderate';
    matchedLabels.push('Frost / Cold (-1.6°C)');
  }

  // Irrigation / water availability
  const irrExactMatch = q.match(/(\d{2,3})\s*%\s*(?:irrigation|water supply|water capacity|watering)/);
  const irrCutMatch = q.match(/(\d{1,2})\s*%\s*(?:less|cut|lower|reduced)\s*(?:irrigation|water|watering)/);
  if (irrExactMatch) {
    next.irrigationSupplyPct = clamp(Number(irrExactMatch[1]), 20, 130);
    matchedLabels.push(`Irrigation ${next.irrigationSupplyPct}%`);
  } else if (irrCutMatch) {
    next.irrigationSupplyPct = clamp(100 - Number(irrCutMatch[1]), 20, 130);
    matchedLabels.push(`Irrigation ${next.irrigationSupplyPct}%`);
  } else if (/\b(no irrigation|rain-fed only|rainfed|pump broke|pump broken|well dry|water cut)\b/.test(q)) {
    next.irrigationSupplyPct = 35;
    matchedLabels.push('Severe Water Limit (35%)');
  } else if (/\b(half water|half irrigation|limited water|water shortage|water restriction|scarce water)\b/.test(q)) {
    next.irrigationSupplyPct = 55;
    matchedLabels.push('Limited Irrigation (55%)');
  } else if (/\b(drip upgrade|new drip|full irrigation|extra irrigation|more water)\b/.test(q)) {
    next.irrigationSupplyPct = 120;
    matchedLabels.push('Upgraded Irrigation (120%)');
  }

  // Organic matter / compost / mulch / fertilizer change
  const orgBoostMatch = q.match(/\+?(\d{1,2})\s*%\s*(?:more\s*)?(?:compost|manure|organic|mulch)/);
  if (orgBoostMatch) {
    next.organicInputBoostPct = clamp(Number(orgBoostMatch[1]), -20, 50);
    matchedLabels.push(`Organic Boost +${next.organicInputBoostPct}%`);
  } else if (/\b(compost|manure|organic|mulch|biochar|cover mulch|no-till|no till)\b/.test(q)) {
    next.organicInputBoostPct = 25;
    matchedLabels.push('Compost / Mulch (+25%)');
  } else if (/\b(heavy chemical|synthetic only|no mulch|bare soil|burn residue|tillage)\b/.test(q)) {
    next.organicInputBoostPct = -15;
    matchedLabels.push('Low Organic Input (-15%)');
  }

  // Pest / storm / wind / erosion shock
  if (/\b(severe|extreme|locust|outbreak|hail|cyclone|erosion|washout)\b/.test(q)) {
    next.extremeRiskLevel = 'severe';
    matchedLabels.push('Severe Extreme Stress');
  } else if (/\b(pest|weed|fungus|disease|wind|storm|moderate risk)\b/.test(q)) {
    next.extremeRiskLevel = next.extremeRiskLevel === 'severe' ? 'severe' : 'moderate';
    matchedLabels.push('Moderate Field Stress');
  } else if (/\b(normal|baseline|reset|standard|average)\b/.test(q)) {
    Object.assign(next, DEFAULT_SCENARIO_PARAMS);
    matchedLabels.push('Reset to Normal Baseline');
  }

  const farmScenarioKeyword =
    /(rain|water|drought|dry|wet|storm|flood|temp|heat|hot|cold|frost|freeze|irrigat|pump|well|compost|manure|organic|mulch|fertiliz|soil|pest|weed|wind|erosion|slope|crop|yield|season|weather|climate|normal|reset|°|%|deg)/i.test(
      q
    );

  return {
    params: next,
    matchedLabels,
    isRelevant: matchedLabels.length > 0 || farmScenarioKeyword,
  };
}

export function computeScenarioAdjustedForecast(
  strategy: ScoredRotationStrategy,
  profile: FarmerProfile,
  scenario: 'normal' | 'drought' | 'wet' | 'heatwave',
  customParams?: CustomScenarioParams
) {
  const base = computeUnifiedFiveYearForecast(strategy, profile);
  const p = customParams ?? getPresetScenarioParams(scenario);

  // Rain effect: deficits punish monoculture much harder than deep-rooted rotation;
  // excess rain (> +30%) causes runoff/leaching on steeper slopes.
  const rainDeficit = Math.min(0, p.rainChangePct); // -50..0
  const rainExcess = Math.max(0, p.rainChangePct - 25); // 0..35
  const slopeFactor = 1 + Math.min(0.6, profile.slopeDeg / 18);

  const rainMultStrategy =
    1 +
    (p.rainChangePct > 0 && p.rainChangePct <= 25 ? p.rainChangePct * 0.0022 : 0) +
    rainDeficit * 0.0024 -
    rainExcess * 0.0022 * slopeFactor;
  const rainMultBaseline =
    1 +
    (p.rainChangePct > 0 && p.rainChangePct <= 20 ? p.rainChangePct * 0.002 : 0) +
    rainDeficit * 0.0052 -
    rainExcess * 0.0042 * slopeFactor;

  // Temperature stress (heat > 0.5°C or frost < -0.5°C)
  const heatStress = Math.max(0, p.tempDeltaC - 0.5);
  const frostStress = Math.max(0, -p.tempDeltaC - 0.5);
  const tempMultStrategy = 1 - heatStress * 0.024 - frostStress * 0.026;
  const tempMultBaseline = 1 - heatStress * 0.048 - frostStress * 0.042;

  // Irrigation capacity relative to 100% normal
  const irrDelta = (p.irrigationSupplyPct - 100) / 100; // -0.8..+0.3
  const irrMultStrategy = 1 + (irrDelta < 0 ? irrDelta * 0.16 : irrDelta * 0.08);
  const irrMultBaseline = 1 + (irrDelta < 0 ? irrDelta * 0.34 : irrDelta * 0.12);

  // Organic matter / compost / mulch input boost (-20..+50)
  const orgFactor = p.organicInputBoostPct / 100; // -0.2..+0.5
  const extremeMultStrategy =
    p.extremeRiskLevel === 'severe' ? 0.94 : p.extremeRiskLevel === 'moderate' ? 0.975 : 1;
  const extremeMultBaseline =
    p.extremeRiskLevel === 'severe' ? 0.83 : p.extremeRiskLevel === 'moderate' ? 0.92 : 1;

  const yieldMultStrategy = Math.max(
    0.58,
    Math.min(1.28, rainMultStrategy * tempMultStrategy * irrMultStrategy * (1 + orgFactor * 0.14) * extremeMultStrategy)
  );
  const yieldMultBaseline = Math.max(
    0.42,
    Math.min(1.18, rainMultBaseline * tempMultBaseline * irrMultBaseline * (1 + orgFactor * 0.06) * extremeMultBaseline)
  );

  // Soil Organic Matter is in % (typically 1.4% to 3.6%, baseline ~2.2%)
  const soilSomDeltaStrategy =
    orgFactor * 0.42 - rainExcess * 0.004 * slopeFactor - heatStress * 0.035;
  const soilSomDeltaBaseline =
    orgFactor * 0.14 -
    rainExcess * 0.0085 * slopeFactor -
    heatStress * 0.065 -
    (p.extremeRiskLevel === 'severe' ? 0.14 : 0);

  const chemDeltaStrategy = Math.round(
    -orgFactor * 24 + (p.extremeRiskLevel === 'severe' ? 6 : p.extremeRiskLevel === 'moderate' ? 3 : 0)
  );
  const waterEffMultStrategy = Math.max(
    0.72,
    Math.min(1.32, 1 + orgFactor * 0.18 + (p.irrigationSupplyPct >= 110 ? 0.06 : 0) - heatStress * 0.025)
  );
  const waterEffMultBaseline = Math.max(
    0.6,
    Math.min(1.15, 1 + rainDeficit * 0.002 - heatStress * 0.045)
  );

  const points = base.points.map((pt, idx) => {
    const ramp = idx === 0 ? 0 : idx / (base.points.length - 1);
    return {
      ...pt,
      soilFertilityStrategy: Number(
        Math.max(1.35, Math.min(3.55, pt.soilFertilityStrategy + soilSomDeltaStrategy * ramp)).toFixed(2)
      ),
      soilFertilityBaseline: Number(
        Math.max(1.2, Math.min(3.2, pt.soilFertilityBaseline + soilSomDeltaBaseline * ramp)).toFixed(2)
      ),
      chemicalUsageStrategy: Math.max(
        20,
        Math.min(105, Math.round(pt.chemicalUsageStrategy + chemDeltaStrategy * ramp))
      ),
      waterEfficiencyStrategy: Number(
        (pt.waterEfficiencyStrategy * (1 + (waterEffMultStrategy - 1) * ramp)).toFixed(2)
      ),
      waterEfficiencyBaseline: Number(
        (pt.waterEfficiencyBaseline * (1 + (waterEffMultBaseline - 1) * ramp)).toFixed(2)
      ),
      harvestYieldStrategy: Number((pt.harvestYieldStrategy * yieldMultStrategy).toFixed(2)),
      harvestYieldBaseline: Number((pt.harvestYieldBaseline * yieldMultBaseline).toFixed(2)),
    };
  });

  const startPt = points[0];
  const endPt = points[points.length - 1];
  const soilFertilityPctGain = Math.max(
    2,
    Math.round(
      ((endPt.soilFertilityStrategy - startPt.soilFertilityBaseline) /
        Math.max(0.5, startPt.soilFertilityBaseline)) *
        100
    )
  );
  const chemicalSavedPct = Math.max(8, Math.min(82, 100 - endPt.chemicalUsageStrategy));
  const yieldIncreasePct = Math.max(
    3,
    Math.round(
      ((endPt.harvestYieldStrategy - endPt.harvestYieldBaseline) /
        Math.max(0.5, endPt.harvestYieldBaseline)) *
        100
    )
  );
  const estimatedCostSavedUsd = Math.round(
    profile.areaHectares * (chemicalSavedPct * 4.8 + strategy.expectedOutput.waterSavingsPct * 2.6)
  );
  const waterSavedM3PerYear = Math.max(
    400,
    Math.round(
      base.year5Highlights.waterSavedM3PerYear *
        (1 + Math.abs(rainDeficit) * 0.008 + orgFactor * 0.25 + (100 - p.irrigationSupplyPct) * 0.003)
    )
  );
  const sustainabilityScore = Math.max(
    50,
    Math.min(
      99,
      Math.round(
        base.year5Highlights.sustainabilityScore +
          orgFactor * 10 -
          (p.extremeRiskLevel === 'severe' ? 4 : p.extremeRiskLevel === 'moderate' ? 2 : 0) -
          Math.max(0, heatStress - 1) * 1.5
      )
    )
  );

  return {
    points,
    year5Highlights: {
      soilFertilityPctGain,
      chemicalSavedPct,
      yieldIncreasePct,
      estimatedCostSavedUsd,
      waterSavedM3PerYear,
      sustainabilityScore,
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
    return `Here is how your **Top 3 Strategies** compare for **${profile.farmName}** (${profile.countryFlag} ${profile.countryName}, ${profile.soilType} soil):\n\n• **Top 1 (${top3[0].matchScore}% match):** ${top3[0].title}: best all-around balance (+${top3[0].expectedOutput.yieldImprovementPct}% yield, -${top3[0].expectedOutput.chemicalReductionPct}% chemicals).\n• **Top 2 (${top3[1].matchScore}% match):** ${top3[1].title}: fastest soil restoration (-${top3[1].expectedOutput.chemicalReductionPct}% chemicals).\n• **Top 3 (${top3[2].matchScore}% match):** ${top3[2].title}: maximum water savings (-${top3[2].expectedOutput.waterSavingsPct}% water).\n\nOpen **Rotation Lab** to click any of the 3 boxes and simulate it step-by-step on your field!`;
  }

  if (/when|sow|plant|calendar|schedule|task|month|date/.test(q)) {
    return `For **${profile.countryName}** (${profile.climateZone} climate, avg **${nasa.avgTempC}°C**), the best time to sow **${s1.cropName}** is right after the first steady autumn rain when soil wetness rises above **${Math.max(28, nasa.topMoisturePct - 4)}%**.\n\nYou can check exact **Days, Months, Seasons, and Years** milestones, plus Bare-Field Protection reminders, inside your **Farm Calendar** tab.`;
  }

  if (/nasa|satellite|power|smap|srtm|modis|source|data|limit|how does|frost|heavy|onset|driest/.test(q)) {
    return `Here is the exact live dataset snapshot for **${profile.countryFlag} ${profile.countryName}** (${profile.coordinates.lat.toFixed(3)}°, ${profile.coordinates.lng.toFixed(3)}°):\n\n• **NASA POWER (Always On, ${nasa.yearsAnalyzed}):** **${nasa.annualRainMm} mm/yr** mean rain, **driest year ${nasa.driestYear} (${nasa.driestYearMm} mm)**, **${nasa.heavyRainDaysPerYear} heavy-rain days/yr** (≥20 mm), **${nasa.frostDaysPerYear} frost days/yr** (T2M_MIN < 0°C), median **autumn rain onset ${nasa.autumnRainOnset}**, and **${nasa.rootMoisturePct}%** root wetness.\n• **Optional Earth Engine Layers:** **SMAP L4 v008** (9–11 km \`sm_rootzone\`), **MODIS MOD13Q1 v061** (250 m NDVI for bare-field risk), and **SRTM 30 m** (\`ee.Terrain.slope\`).\n• **Honest Limitation:** NASA POWER (~50 km MERRA-2 reanalysis) & SMAP are modelled regional datasets rather than field sensors, and MODIS NDVI tracks greenness rather than crop type.\n\nClick the **NASA POWER Live** pill on your Dashboard to view the complete dataset & risk threshold table!`;
  }

  return `I'm looking at your **${profile.areaHectares} ha ${profile.soilType}** farm in **${profile.countryFlag} ${profile.countryName}** (currently on **${currentPage}**).\n\n• **Live NASA Soil Moisture:** ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)\n• **Active Rotation:** ${activeStrategy.title} (${activeStrategy.steps.map((s) => s.cropName.split(' ')[0]).join(' → ')})\n• **Projected Savings:** ~${activeStrategy.expectedOutput.chemicalReductionPct}% less chemical fertilizer & +${activeStrategy.expectedOutput.yieldImprovementPct}% harvest gain.\n\nTell me about any real field event or custom change (like *"Heavy rain delayed sowing"*, *"Swap Stage 2 to chickpeas"*, *"Dry spell this month"*, or *"Delay planting by 1 month"*) and I will adjust your rotation plan live!`;
}

const EXTRA_CROP_ALIASES: {
  patterns: string[];
  cropId: string;
  cropName: string;
  cropFamily: CropInfo['family'];
  cropColor: string;
  soilNote: string;
}[] = [
  {
    patterns: ['chickpea', 'garbanzo', 'hummus'],
    cropId: 'chickpeas',
    cropName: 'Chickpeas',
    cropFamily: 'Legume',
    cropColor: '#2E9E5B',
    soilNote: 'Drought-hardy legume that fixes natural nitrogen into dry soil.',
  },
  {
    patterns: ['fava', 'faba', 'broad bean', 'horse bean', 'bean'],
    cropId: 'fava_beans',
    cropName: 'Fava Beans (Legumes)',
    cropFamily: 'Legume',
    cropColor: '#00873A',
    soilNote: 'Adds heavy natural nitrogen (~95 kg/ha) and breaks cereal root diseases.',
  },
  {
    patterns: ['lentil'],
    cropId: 'lentils',
    cropName: 'Lentils',
    cropFamily: 'Legume',
    cropColor: '#1E824C',
    soilNote: 'Fast, low-water legume that enriches soil nitrogen before winter grains.',
  },
  {
    patterns: ['wheat', 'durum'],
    cropId: 'wheat',
    cropName: 'Wheat',
    cropFamily: 'Cereal',
    cropColor: '#EBB40E',
    soilNote: 'Dense straw residue shields topsoil from rain splash and heat.',
  },
  {
    patterns: ['barley'],
    cropId: 'barley_vetch',
    cropName: 'Barley + Vetch Mix',
    cropFamily: 'Cereal',
    cropColor: '#D9A404',
    soilNote: 'Hardy early cereal-vetch mix that thrives on low rainfall and suppresses weeds.',
  },
  {
    patterns: ['sorghum', 'millet'],
    cropId: 'sorghum',
    cropName: 'Grain Sorghum',
    cropFamily: 'Cereal',
    cropColor: '#C97B1A',
    soilNote: 'Deep drought-tolerant roots pull water from lower soil layers.',
  },
  {
    patterns: ['sunflower'],
    cropId: 'sunflower',
    cropName: 'Sunflowers',
    cropFamily: 'Oilseed',
    cropColor: '#F59E0B',
    soilNote: 'Deep taproot breaks compacted soil layers and recycles deep nutrients.',
  },
  {
    patterns: ['clover', 'vetch', 'cover crop', 'mustard'],
    cropId: 'clover_cover',
    cropName: 'Crimson Clover & Vetch Cover',
    cropFamily: 'Cover Crop',
    cropColor: '#4E7A00',
    soilNote: 'Living soil blanket prevents storm erosion and pumps organic matter into topsoil.',
  },
  {
    patterns: ['corn', 'maize'],
    cropId: 'maize',
    cropName: 'Maize (Corn)',
    cropFamily: 'Cereal',
    cropColor: '#E59A00',
    soilNote: 'High-biomass grain that makes strong use of nitrogen left by legumes.',
  },
  {
    patterns: ['soybean', 'soya', 'soy'],
    cropId: 'soybeans',
    cropName: 'Soybeans',
    cropFamily: 'Legume',
    cropColor: '#2FA866',
    soilNote: 'Fixes atmospheric nitrogen and pairs cleanly between cereal crops.',
  },
  {
    patterns: ['cowpea', 'black-eyed', 'pea'],
    cropId: 'cowpeas',
    cropName: 'Cowpeas (Legumes)',
    cropFamily: 'Legume',
    cropColor: '#16A34A',
    soilNote: 'Heat-tolerant legume cover that keeps soil shaded in hot dry summers.',
  },
  {
    patterns: ['canola', 'rapeseed'],
    cropId: 'canola',
    cropName: 'Canola (Rapeseed)',
    cropFamily: 'Oilseed',
    cropColor: '#CA8A04',
    soilNote: 'Deep brassica roots loosen soil and naturally suppress cereal root diseases.',
  },
  {
    patterns: ['tomato', 'pepper', 'vegetable', 'veggie', 'potato', 'onion'],
    cropId: 'vegetables',
    cropName: 'Seasonal Vegetables',
    cropFamily: 'Vegetable',
    cropColor: '#DC2626',
    soilNote: 'High-value cash crop rotated away from related families to avoid soil blight.',
  },
  {
    patterns: ['oat'],
    cropId: 'oats',
    cropName: 'Oats',
    cropFamily: 'Cereal',
    cropColor: '#CA8A04',
    soilNote: 'Fast-growing cereal with fibrous roots that suppress weeds and protect slopes.',
  },
  {
    patterns: ['alfalfa', 'lucerne'],
    cropId: 'alfalfa',
    cropName: 'Alfalfa (Legume)',
    cropFamily: 'Legume',
    cropColor: '#15803D',
    soilNote: 'Deep perennial nitrogen-fixer that rebuilds soil structure and organic matter.',
  },
];

function buildStepsFromCustomSpecs(specs: CustomStageSpec[]): UnifiedSeasonStep[] {
  const total = specs.length;
  return specs.map((spec, idx) => {
    const progress = total > 1 ? idx / (total - 1) : 1;
    const isLegume = spec.cropFamily === 'Legume';
    const isCover = spec.cropFamily === 'Cover Crop';
    const soilRichnessScore = Math.min(96, Math.round(58 + progress * 30 + (isLegume ? 5 : 0) + (isCover ? 4 : 0)));
    const chemicalReductionPct = Math.min(58, Math.round(14 + progress * 24 + (isLegume ? 8 : 0) + (isCover ? 6 : 0)));
    const moistureRetentionPct = Math.min(92, Math.round(62 + progress * 20 + (isCover ? 7 : 0)));
    return {
      stepNumber: idx + 1,
      seasonName: `Stage ${idx + 1} · Custom (${spec.durationMonths} mos)`,
      shortSeason: `Stage ${idx + 1}`,
      timingLabel: `${spec.durationMonths} mos`,
      cropId: spec.cropId,
      cropName: spec.cropName,
      cropColor: spec.cropColor,
      cropFamily: spec.cropFamily,
      stageLabel: idx === 0 ? 'Current Active Stage' : `Planned Stage ${idx + 1}`,
      soilRichnessScore,
      chemicalReductionPct,
      moistureRetentionPct,
      whatToDo: spec.whatToDo,
      soilImprovementNote: spec.soilImprovementNote,
      pestBreakNote: spec.pestBreakNote,
    };
  });
}

function estimateCustomExpectedOutput(
  steps: UnifiedSeasonStep[],
  base: ScoredRotationStrategy['expectedOutput']
): ScoredRotationStrategy['expectedOutput'] {
  const families = new Set(steps.map((s) => s.cropFamily));
  const legumeCount = steps.filter((s) => s.cropFamily === 'Legume').length;
  const coverCount = steps.filter((s) => s.cropFamily === 'Cover Crop').length;
  const vegetableCount = steps.filter((s) => s.cropFamily === 'Vegetable').length;

  const diversityBonus = Math.min(12, Math.max(0, (families.size - 2) * 4));
  const yieldImprovementPct = Math.min(
    36,
    Math.max(12, Math.round(15 + diversityBonus * 0.7 + legumeCount * 3 + vegetableCount * 2))
  );
  const chemicalReductionPct = Math.min(
    55,
    Math.max(15, Math.round(18 + legumeCount * 10 + coverCount * 8 + diversityBonus * 0.6))
  );
  const waterSavingsPct = Math.min(
    34,
    Math.max(10, Math.round(12 + coverCount * 7 + legumeCount * 3 - vegetableCount * 2))
  );
  const soilFertilityGainPct = Math.min(
    45,
    Math.max(16, Math.round(18 + legumeCount * 8 + coverCount * 7 + diversityBonus * 0.5))
  );
  const sustainabilityScore = Math.min(
    97,
    Math.max(70, Math.round(72 + diversityBonus + legumeCount * 4 + coverCount * 5))
  );
  const bareDaysPerYear = Math.max(12, Math.min(55, Math.round(38 - coverCount * 10 - (steps.length >= 5 ? 5 : 0))));

  return {
    ...base,
    yieldImprovementPct,
    chemicalReductionPct,
    waterSavingsPct,
    soilFertilityGainPct,
    sustainabilityScore,
    bareDaysPerYear,
    plainSummary: `Custom ${steps.length}-stage rotation across ${families.size} crop families tailored to your field goals.`,
  };
}

/**
 * Applies farmer-requested AI Advisor customizations cleanly on top of the active strategy
 * so Roadmap, Calendar, Rotation Lab, and Dashboard Graphs stay 100% live-synced.
 * Supports full bespoke custom strategies (2-6 stages), adding/removing stages, and single-stage overrides.
 */
export function applyPlanCustomization(
  strategy: ScoredRotationStrategy,
  custom?: PlanCustomization
): ScoredRotationStrategy {
  if (!custom) return strategy;

  const hasCustomStages = Boolean(custom.customStages && custom.customStages.length >= 2);
  const hasStageOverrides = Boolean(
    custom.stageOverrides && Object.keys(custom.stageOverrides).length > 0
  );
  const hasCustomMeta = Boolean(custom.customStrategyTitle || custom.customStrategyFocus);

  if (!hasCustomStages && !hasStageOverrides && !hasCustomMeta) {
    return strategy;
  }

  let nextSteps: UnifiedSeasonStep[] = hasCustomStages
    ? buildStepsFromCustomSpecs(custom.customStages!)
    : strategy.steps.map((s) => ({ ...s }));

  if (hasStageOverrides) {
    nextSteps = nextSteps.map((step, idx) => {
      const ov = custom.stageOverrides[idx];
      if (!ov) return step;
      return {
        ...step,
        cropId: ov.cropId ?? step.cropId,
        cropName: ov.cropName ?? step.cropName,
        cropFamily: ov.cropFamily ?? step.cropFamily,
        cropColor: ov.cropColor ?? step.cropColor,
        whatToDo: ov.whatToDo ?? step.whatToDo,
        soilImprovementNote: ov.soilImprovementNote ?? step.soilImprovementNote,
        pestBreakNote: ov.pestBreakNote ?? step.pestBreakNote,
      };
    });
  }

  const expectedOutput =
    hasCustomStages || hasStageOverrides
      ? estimateCustomExpectedOutput(nextSteps, strategy.expectedOutput)
      : strategy.expectedOutput;

  return {
    ...strategy,
    tierLabel: hasCustomStages || custom.customStrategyTitle ? 'Custom AI Strategy' : strategy.tierLabel,
    title: custom.customStrategyTitle || strategy.title,
    focusTag: custom.customStrategyFocus || (hasCustomStages ? 'Farmer Custom Plan' : strategy.focusTag),
    steps: nextSteps,
    expectedOutput,
  };
}

export interface FarmerChatAdjustmentResult {
  reply: string;
  planChangeSummary?: string;
  nextSelectedStrategyId?: string;
  nextCustomization?: PlanCustomization | null;
  nextScenario?: 'normal' | 'drought' | 'wet';
  calendarAlert?: {
    title: string;
    description: string;
    category: CalendarEvent['category'];
  };
}

function emptyCustomization(prev?: PlanCustomization): PlanCustomization {
  return {
    monthShift: prev?.monthShift ?? 0,
    stageOverrides: { ...(prev?.stageOverrides ?? {}) },
    ...(prev?.customStages ? { customStages: prev.customStages.map((s) => ({ ...s })) } : {}),
    ...(prev?.customStrategyTitle ? { customStrategyTitle: prev.customStrategyTitle } : {}),
    ...(prev?.customStrategyFocus ? { customStrategyFocus: prev.customStrategyFocus } : {}),
    recentNotes: [...(prev?.recentNotes ?? [])],
  };
}

function detectStageIndex(q: string): number | null {
  if (/stage\s*1|season\s*1|\bfirst\b|current\s*(stage|crop)/.test(q)) return 0;
  if (/stage\s*2|season\s*2|\bsecond\b|next\s*(stage|crop)/.test(q)) return 1;
  if (/stage\s*3|season\s*3|\bthird\b/.test(q)) return 2;
  if (/stage\s*4|season\s*4|\bfourth\b/.test(q)) return 3;
  if (/stage\s*5|season\s*5|\bfifth\b/.test(q)) return 4;
  if (/stage\s*6|season\s*6|\bsixth\b/.test(q)) return 5;
  return null;
}

/**
 * Interactive AI Advisor processor: understands real farmer field events & custom edits
 * (crop swaps, storm delays, droughts, pest outbreaks, frost, timeline shifts)
 * and immediately returns live plan updates alongside plain-language guidance.
 */
export function interpretAndApplyFarmerChatEvent(
  message: string,
  profile: FarmerProfile,
  activeStrategy: ScoredRotationStrategy,
  top3: ScoredRotationStrategy[],
  selectedStrategyId: string | null,
  currentCustom: PlanCustomization | undefined,
  currentPage: string
): FarmerChatAdjustmentResult {
  const q = message.toLowerCase();
  const baseCustom = emptyCustomization(currentCustom);
  const ensureStrategyId = selectedStrategyId ?? activeStrategy.id;

  // 1) Reset / undo custom adjustments
  if (/(reset|undo|clear|restore|revert).*(plan|change|edit|custom|original)/.test(q)) {
    return {
      reply: `Done! I restored **${activeStrategy.title}** back to its original Rotation Lab sequence and timing. Tell me anytime if weather or field events change.`,
      planChangeSummary: 'Restored original Rotation Lab plan',
      nextCustomization: null,
    };
  }

  // 2) Specific crop swap / replacement request
  const wantsCropChange =
    /(swap|replace|change|switch|use|plant|grow|prefer|want|put|instead of|no\s+\w+)/.test(q);
  if (wantsCropChange) {
    const matchedCrops = EXTRA_CROP_ALIASES.filter((c) =>
      c.patterns.some((p) => q.includes(p))
    );

    if (matchedCrops.length > 0) {
      let targetCrop = matchedCrops[0];
      let targetIdx = detectStageIndex(q);

      if (matchedCrops.length >= 2) {
        const insteadMatch = q.match(/instead of\s+([a-z\s]+)/);
        const replaceMatch = q.match(/(?:replace|swap|change)\s+([a-z\s]+?)\s+(?:with|to|for)\s+([a-z\s]+)/);
        if (replaceMatch) {
          const oldPart = replaceMatch[1];
          const newPart = replaceMatch[2];
          const oldCrop = matchedCrops.find((c) => c.patterns.some((p) => oldPart.includes(p)));
          const newCrop = matchedCrops.find((c) => c.patterns.some((p) => newPart.includes(p)));
          if (newCrop) targetCrop = newCrop;
          if (oldCrop && targetIdx === null) {
            const foundIdx = activeStrategy.steps.findIndex((s) =>
              oldCrop.patterns.some((p) => s.cropName.toLowerCase().includes(p))
            );
            if (foundIdx >= 0) targetIdx = foundIdx;
          }
        } else if (insteadMatch) {
          const oldPart = insteadMatch[1];
          const oldCrop = matchedCrops.find((c) => c.patterns.some((p) => oldPart.includes(p)));
          const newCrop = matchedCrops.find((c) => c !== oldCrop) ?? matchedCrops[0];
          targetCrop = newCrop;
          if (oldCrop && targetIdx === null) {
            const foundIdx = activeStrategy.steps.findIndex((s) =>
              oldCrop.patterns.some((p) => s.cropName.toLowerCase().includes(p))
            );
            if (foundIdx >= 0) targetIdx = foundIdx;
          }
        }
      }

      if (targetIdx === null) {
        targetIdx = /now|this season|start|today/.test(q) ? 0 : 1;
      }

      const prevStep = activeStrategy.steps[targetIdx];
      const durationMatch = q.match(/(\d+)\s*(?:month|mo)/);
      const customDur = durationMatch
        ? Math.max(2, Math.min(10, Number(durationMatch[1])))
        : undefined;

      const updatedOverride: PlanStageOverride = {
        ...(baseCustom.stageOverrides[targetIdx] ?? {}),
        cropId: targetCrop.cropId,
        cropName: targetCrop.cropName,
        cropFamily: targetCrop.cropFamily,
        cropColor: targetCrop.cropColor,
        durationMonths: customDur ?? baseCustom.stageOverrides[targetIdx]?.durationMonths,
        whatToDo: `Plant ${targetCrop.cropName} in Stage ${targetIdx + 1} across your ${profile.areaHectares} ha ${profile.soilType.toLowerCase()} field (updated from ${prevStep.cropName} per your request).`,
        soilImprovementNote: targetCrop.soilNote,
        eventTag: 'Custom Crop Swap',
      };

      baseCustom.stageOverrides[targetIdx] = updatedOverride;
      baseCustom.recentNotes = [
        `Stage ${targetIdx + 1}: swapped ${prevStep.cropName} to ${targetCrop.cropName}`,
        ...baseCustom.recentNotes.slice(0, 4),
      ];

      return {
        reply: `Updated your rotation plan! **Stage ${targetIdx + 1}** is now **${targetCrop.cropName}** (${targetCrop.cropFamily}) instead of **${prevStep.cropName}**.\n\n• **Why this works:** ${targetCrop.soilNote}\n• **Live sync:** Your Dashboard Roadmap, stage timeline, and Farm Calendar are already updated.`,
        planChangeSummary: `Stage ${targetIdx + 1} changed to ${targetCrop.cropName}`,
        nextSelectedStrategyId: ensureStrategyId,
        nextCustomization: baseCustom,
        calendarAlert: {
          title: `Custom Plan: Sow ${targetCrop.cropName} (Stage ${targetIdx + 1})`,
          description: `Adjusted via AI Advisor from ${prevStep.cropName}. ${targetCrop.soilNote}`,
          category: 'rotation',
        },
      };
    }
  }

  // 3) Heavy rain / flood / storm / muddy / waterlogged field event
  if (/(heavy rain|flood|storm|waterlog|mud|too wet|soaked|rain delay|washout)/.test(q)) {
    const numMatch = q.match(/(\d+)\s*(?:month|mo)/);
    const delayMonths = numMatch ? Math.max(1, Math.min(4, Number(numMatch[1]))) : 1;
    baseCustom.monthShift = Math.min(6, baseCustom.monthShift + delayMonths);
    baseCustom.stageOverrides[0] = {
      ...(baseCustom.stageOverrides[0] ?? {}),
      whatToDo: `Hold off heavy tractor work until topsoil drains after the heavy rain. Sow ${activeStrategy.steps[0].cropName} ${delayMonths} month later with shallow contour furrows to protect your ${profile.slopeDeg}° slope.`,
      soilImprovementNote:
        'Avoiding wet-soil tillage prevents compaction and keeps root channels open for oxygen.',
      eventTag: 'Adjusted for Heavy Rain',
    };
    baseCustom.recentNotes = [
      `Heavy rain event: shifted start +${delayMonths} mo & added drainage protection`,
      ...baseCustom.recentNotes.slice(0, 4),
    ];

    return {
      reply: `I adjusted your plan for the **heavy rain / wet soil event**:\n\n• **Timeline shifted +${delayMonths} month(s):** Gives your ${profile.soilType} soil time to drain so machinery does not compact the field.\n• **Slope protection:** Added contour shallow-seeding advice for your ${profile.slopeDeg}° slope and switched your outlook to **Wet Year**.\n• **Live sync:** Your Roadmap dates, Stage 1 instructions, and Farm Calendar now reflect this delay.`,
      planChangeSummary: `Shifted +${delayMonths} mo for heavy rain + added drainage guidance`,
      nextSelectedStrategyId: ensureStrategyId,
      nextCustomization: baseCustom,
      nextScenario: 'wet',
      calendarAlert: {
        title: 'Heavy Rain Adjustment: Wait for Field Drainage',
        description: `Sowing shifted +${delayMonths} month after storm event. Inspect drainage channels on your ${profile.slopeDeg}° slope before entering field.`,
        category: 'alert',
      },
    };
  }

  // 4) Drought / dry spell / heatwave / broken pump / water shortage event
  if (/(drought|dry spell|no rain|heatwave|pump broke|low water|water shortage|less water|very dry)/.test(q)) {
    const s1 = activeStrategy.steps[0];
    const isHighWater = /maize|corn|vegetable|tomato|rice/i.test(s1.cropName);
    const droughtCrop = EXTRA_CROP_ALIASES.find((c) => c.cropId === 'chickpeas')!;

    baseCustom.stageOverrides[0] = {
      ...(baseCustom.stageOverrides[0] ?? {}),
      ...(isHighWater
        ? {
            cropId: droughtCrop.cropId,
            cropName: droughtCrop.cropName,
            cropFamily: droughtCrop.cropFamily,
            cropColor: droughtCrop.cropColor,
          }
        : {}),
      whatToDo: isHighWater
        ? `Swapped to drought-hardy ${droughtCrop.cropName} for Stage 1 due to low water. Keep straw mulch on top and irrigate only at flowering.`
        : `Switch ${s1.cropName} to drought-saving mode: keep crop residue mulch on your ${profile.soilType} topsoil, lower seeding density by 10%, and save irrigation for flowering.`,
      soilImprovementNote:
        'Surface mulch cuts soil evaporation by up to 25% during dry spells.',
      eventTag: 'Drought-Adjusted',
    };
    baseCustom.recentNotes = [
      `Dry spell event: enabled drought water-saving mode${isHighWater ? ' + swapped to Chickpeas' : ''}`,
      ...baseCustom.recentNotes.slice(0, 4),
    ];

    return {
      reply: `I updated your plan for **dry / low-water conditions**:\n\n• **Stage 1 updated:** ${
        isHighWater
          ? `Swapped thirsty ${s1.cropName} to drought-hardy **Chickpeas** so your harvest survives low water.`
          : `Added mulch & flowering-only watering instructions for **${s1.cropName}**.`
      }\n• **Forecast synced:** Switched your Future Predictions & Dashboard graphs to **Dry / Drought** weather so numbers stay realistic.\n• **Tip:** You can also compare the **Water-Saver** path anytime in Rotation Lab.`,
      planChangeSummary: isHighWater
        ? 'Drought mode: swapped Stage 1 to Chickpeas + Drought forecast'
        : 'Drought mode: added water-saving mulch plan + Drought forecast',
      nextSelectedStrategyId: ensureStrategyId,
      nextCustomization: baseCustom,
      nextScenario: 'drought',
      calendarAlert: {
        title: 'Dry Spell Action: Apply Mulch & Save Water',
        description: `Dry conditions logged via AI Advisor. Prioritize moisture retention on ${profile.soilType} soil and irrigate only during flowering.`,
        category: 'water',
      },
    };
  }

  // 5) Pest / disease / fungus / rust / aphids / weed outbreak event
  if (/(pest|disease|fungus|rust|aphid|blight|insect|worm|locust|weed outbreak|mildew|rot)/.test(q)) {
    const breakCrop =
      activeStrategy.steps[0].cropFamily === 'Legume'
        ? EXTRA_CROP_ALIASES.find((c) => c.cropId === 'sunflower')!
        : EXTRA_CROP_ALIASES.find((c) => c.cropId === 'clover_cover')!;

    baseCustom.stageOverrides[1] = {
      ...(baseCustom.stageOverrides[1] ?? {}),
      cropId: breakCrop.cropId,
      cropName: breakCrop.cropName,
      cropFamily: breakCrop.cropFamily,
      cropColor: breakCrop.cropColor,
      whatToDo: `Follow Stage 1 immediately with non-host ${breakCrop.cropName} (${breakCrop.cropFamily}) to starve out the pest/disease cycle naturally without heavy chemical sprays.`,
      soilImprovementNote: breakCrop.soilNote,
      pestBreakNote: `Family break (${activeStrategy.steps[0].cropFamily} -> ${breakCrop.cropFamily}) cuts carryover pests and soil fungi naturally.`,
      eventTag: 'Pest-Break Adjusted',
    };
    baseCustom.recentNotes = [
      `Pest/disease event: set Stage 2 to non-host ${breakCrop.cropName}`,
      ...baseCustom.recentNotes.slice(0, 4),
    ];

    return {
      reply: `I adjusted your rotation to **break the pest / disease cycle**:\n\n• **Stage 2 updated to ${breakCrop.cropName} (${breakCrop.cropFamily}):** Because it belongs to a completely different plant family than **${activeStrategy.steps[0].cropName}**, carryover soil pests and fungi lose their host and die off naturally.\n• **Calendar alert added:** Added a field scouting reminder so you can check leaf health before spraying.\n• **Live sync:** Check your Dashboard Roadmap to see the updated Stage 2 tile.`,
      planChangeSummary: `Pest break: Stage 2 switched to ${breakCrop.cropName}`,
      nextSelectedStrategyId: ensureStrategyId,
      nextCustomization: baseCustom,
      calendarAlert: {
        title: `Pest-Break Action: Scout Now & Follow With ${breakCrop.cropName}`,
        description: `Pest/disease event reported via AI Advisor. Rotating into ${breakCrop.cropFamily} next season breaks the host cycle naturally.`,
        category: 'alert',
      },
    };
  }

  // 6) Frost / freeze / cold snap event
  if (/(frost|freeze|frozen|cold snap|hail|snow)/.test(q)) {
    baseCustom.monthShift = Math.min(6, baseCustom.monthShift + 1);
    baseCustom.stageOverrides[0] = {
      ...(baseCustom.stageOverrides[0] ?? {}),
      whatToDo: `Delay tender seeding by 1 month until night temperatures stay above 2°C. Keep residue cover on ${profile.soilType} topsoil to insulate roots from frost.`,
      eventTag: 'Frost-Adjusted',
    };
    baseCustom.recentNotes = [
      'Frost event: shifted Stage 1 sowing +1 month for safer temperatures',
      ...baseCustom.recentNotes.slice(0, 4),
    ];

    return {
      reply: `I updated your schedule for the **frost / cold snap**:\n\n• **Sowing shifted +1 month:** Protects emerging seedlings from night freezes.\n• **Stage 1 updated:** Added frost-insulation mulch guidance directly to your active Roadmap tile and added a Farm Calendar alert.`,
      planChangeSummary: 'Frost protection: shifted start +1 month',
      nextSelectedStrategyId: ensureStrategyId,
      nextCustomization: baseCustom,
      calendarAlert: {
        title: 'Frost Watch: Delay Seeding & Inspect Seedlings',
        description:
          'Cold snap reported via AI Advisor. Wait until nighttime lows clear 2°C before planting tender crops.',
        category: 'alert',
      },
    };
  }

  // 7) Explicit timeline delay / early harvest / stage duration edit
  if (/(delay|postpone|shift|push back|start later|earlier|early harvest|shorten|extend)/.test(q)) {
    const numMatch = q.match(/(\d+)\s*(?:month|mo)/);
    const monthsVal = numMatch ? Math.max(1, Math.min(6, Number(numMatch[1]))) : 1;
    const targetIdx = detectStageIndex(q);

    if (/(shorten|extend|make.*month|last.*month)/.test(q) && targetIdx !== null) {
      baseCustom.stageOverrides[targetIdx] = {
        ...(baseCustom.stageOverrides[targetIdx] ?? {}),
        durationMonths: Math.max(2, Math.min(10, monthsVal)),
        eventTag: `Duration: ${monthsVal} mos`,
      };
      baseCustom.recentNotes = [
        `Stage ${targetIdx + 1} duration set to ${monthsVal} months`,
        ...baseCustom.recentNotes.slice(0, 4),
      ];
      return {
        reply: `Updated **Stage ${targetIdx + 1} (${activeStrategy.steps[targetIdx].cropName})** to run for **${monthsVal} months**! Your Dashboard Roadmap tile width and follow-on dates have been recalculated automatically.`,
        planChangeSummary: `Stage ${targetIdx + 1} duration set to ${monthsVal} months`,
        nextSelectedStrategyId: ensureStrategyId,
        nextCustomization: baseCustom,
      };
    }

    const delta = /(earlier|early|sooner|ahead)/.test(q) ? -monthsVal : monthsVal;
    baseCustom.monthShift = Math.max(-3, Math.min(6, baseCustom.monthShift + delta));
    baseCustom.recentNotes = [
      `Timeline shifted ${delta > 0 ? `+${delta}` : delta} month(s)`,
      ...baseCustom.recentNotes.slice(0, 4),
    ];

    return {
      reply: `Shifted your rotation schedule **${delta > 0 ? `forward by +${delta}` : `earlier by ${Math.abs(delta)}`} month(s)**!\n\nEvery stage window on your Dashboard Roadmap now starts from your updated timing so your upcoming crops stay aligned.`,
      planChangeSummary: `Timeline shifted ${delta > 0 ? `+${delta}` : delta} month(s)`,
      nextSelectedStrategyId: ensureStrategyId,
      nextCustomization: baseCustom,
    };
  }

  // 8) Switch strategy goal directly via chat
  if (/(switch|change|use|pick|choose).*(water|drought|soil|organic|chemical|balanced|harvest|top\s*[123])/.test(q)) {
    const picked = /water|drought|top\s*3/.test(q)
      ? top3[2]
      : /soil|organic|chemical|eco|top\s*2/.test(q)
        ? top3[1]
        : top3[0];
    return {
      reply: `Switched your active plan to **${picked.tierLabel}: ${picked.title}**!\n\n• **Crop Sequence:** ${picked.steps.map((s) => s.cropName).join(' → ')}\n• **Expected Gains:** +${picked.expectedOutput.yieldImprovementPct}% harvest, -${picked.expectedOutput.chemicalReductionPct}% chemicals, +${picked.expectedOutput.waterSavingsPct}% water saved.\n• Your Dashboard Roadmap and all 4 graphs are updated live.`,
      planChangeSummary: `Switched to ${picked.tierLabel}: ${picked.title}`,
      nextSelectedStrategyId: picked.id,
      nextCustomization: null,
    };
  }

  return {
    reply: generateGlobalAgronomyReply(message, profile, activeStrategy, top3, currentPage),
  };
}
