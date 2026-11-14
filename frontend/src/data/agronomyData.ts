import {
  Coordinates,
  CropInfo,
  FarmerProfile,
  HistoricalSeasonRecord,
  NasaBaseline,
  ProposedStrategyUpdate,
  RotationParameters,
  RotationStrategy,
  SeasonRotationStep,
  SoilType,
  ZoneCropAssignment,
  ZoneDiff,
  ZoneId,
} from '../types/farm';

export const ZONE_IDS: ZoneId[] = ['S1', 'S2', 'S3', 'S4'];

export const CROPS: Record<string, CropInfo> = {
  durum_wheat: {
    id: 'durum_wheat',
    name: 'Durum Wheat',
    family: 'Cereal',
    color: '#EBB40E',
    lightBg: '#FDF6DC',
    textColor: '#7A5B00',
    droughtTolerance: 'Moderate',
    nitrogenImpactKgHa: -48,
    waterNeedMm: 430,
    baseYieldTha: 5.4,
    revenuePerTonUsd: 340,
    rootDepthCm: 110,
    pestBreakRole: 'High biomass straw mulch; requires legume break every 2 seasons.',
    shortNote: 'High-demand staple grain with strong Mediterranean market value.',
  },
  chickpeas: {
    id: 'chickpeas',
    name: 'Chickpeas',
    family: 'Legume',
    color: '#00873A',
    lightBg: '#E3F5EB',
    textColor: '#005A26',
    droughtTolerance: 'High',
    nitrogenImpactKgHa: +54,
    waterNeedMm: 270,
    baseYieldTha: 2.3,
    revenuePerTonUsd: 890,
    rootDepthCm: 95,
    pestBreakRole: 'Breaks cereal root-rot & Hessian fly cycles while fixing atmospheric N.',
    shortNote: 'Drought-hardy nitrogen fixer ideal before winter cereals.',
  },
  sorghum: {
    id: 'sorghum',
    name: 'Grain Sorghum',
    family: 'Cereal',
    color: '#C96A1B',
    lightBg: '#FBECE0',
    textColor: '#7E3E09',
    droughtTolerance: 'Very High',
    nitrogenImpactKgHa: -32,
    waterNeedMm: 255,
    baseYieldTha: 6.1,
    revenuePerTonUsd: 295,
    rootDepthCm: 165,
    pestBreakRole: 'Deep fibrous root system fractures hardpan & suppresses nematodes.',
    shortNote: 'Ultra drought-resilient summer grain using 38% less water than maize.',
  },
  sunflower: {
    id: 'sunflower',
    name: 'Oilseed Sunflower',
    family: 'Oilseed',
    color: '#D89B00',
    lightBg: '#FEF7DF',
    textColor: '#735100',
    droughtTolerance: 'High',
    nitrogenImpactKgHa: -26,
    waterNeedMm: 310,
    baseYieldTha: 2.9,
    revenuePerTonUsd: 620,
    rootDepthCm: 185,
    pestBreakRole: 'Taproot scavenges deep subsoil nutrients & attracts native pollinators.',
    shortNote: 'Deep-rooted drought-tolerant oilseed boosting farm biodiversity.',
  },
  fava_beans: {
    id: 'fava_beans',
    name: 'Fava Beans',
    family: 'Legume',
    color: '#2B9D5A',
    lightBg: '#E5F7EC',
    textColor: '#135E33',
    droughtTolerance: 'Moderate',
    nitrogenImpactKgHa: +68,
    waterNeedMm: 320,
    baseYieldTha: 3.1,
    revenuePerTonUsd: 670,
    rootDepthCm: 105,
    pestBreakRole: 'Top biological nitrogen fixer; disrupts fungal cereal pathogens.',
    shortNote: 'Powerhouse winter legume restoring depleted topsoil nitrogen.',
  },
  alfalfa: {
    id: 'alfalfa',
    name: 'Alfalfa Forage',
    family: 'Forage / Cover',
    color: '#44BE7E',
    lightBg: '#E4F8EE',
    textColor: '#0E6B3C',
    droughtTolerance: 'High',
    nitrogenImpactKgHa: +76,
    waterNeedMm: 390,
    baseYieldTha: 9.2,
    revenuePerTonUsd: 215,
    rootDepthCm: 220,
    pestBreakRole: 'Perennial soil builder that spikes organic matter & earthworm activity.',
    shortNote: 'Deep perennial legume elevating carbon sequestration & soil porosity.',
  },
  winter_barley: {
    id: 'winter_barley',
    name: 'Winter Barley',
    family: 'Cereal',
    color: '#B58B2A',
    lightBg: '#F8F2E1',
    textColor: '#664C10',
    droughtTolerance: 'High',
    nitrogenImpactKgHa: -35,
    waterNeedMm: 330,
    baseYieldTha: 5.0,
    revenuePerTonUsd: 275,
    rootDepthCm: 100,
    pestBreakRole: 'Fast early canopy smothers winter broadleaf weeds naturally.',
    shortNote: 'Low-input early-maturing grain adapted to variable rainfall.',
  },
  tomatoes: {
    id: 'tomatoes',
    name: 'Processing Tomatoes',
    family: 'Horticulture',
    color: '#C8472C',
    lightBg: '#FCE9E4',
    textColor: '#812411',
    droughtTolerance: 'Low',
    nitrogenImpactKgHa: -58,
    waterNeedMm: 520,
    baseYieldTha: 46.0,
    revenuePerTonUsd: 135,
    rootDepthCm: 85,
    pestBreakRole: 'High-value cash crop; must rotate strictly on 3–4 yr intervals.',
    shortNote: 'High-margin drip-irrigated cash crop requiring fertile legume-rested soil.',
  },
  crimson_clover: {
    id: 'crimson_clover',
    name: 'Crimson Clover Cover',
    family: 'Forage / Cover',
    color: '#7BB800',
    lightBg: '#F0F9D9',
    textColor: '#466900',
    droughtTolerance: 'Moderate',
    nitrogenImpactKgHa: +62,
    waterNeedMm: 240,
    baseYieldTha: 4.5,
    revenuePerTonUsd: 165,
    rootDepthCm: 90,
    pestBreakRole: 'Living green manure preventing erosion, runoff & soil crusting.',
    shortNote: 'Regenerative cover crop locking carbon and suppressing winter weeds.',
  },
  canola: {
    id: 'canola',
    name: 'Winter Canola',
    family: 'Oilseed',
    color: '#92D500',
    lightBg: '#F2FAD9',
    textColor: '#486C00',
    droughtTolerance: 'Moderate',
    nitrogenImpactKgHa: -34,
    waterNeedMm: 365,
    baseYieldTha: 3.4,
    revenuePerTonUsd: 540,
    rootDepthCm: 140,
    pestBreakRole: 'Bio-fumigant brassica roots suppress soil-borne take-all fungus.',
    shortNote: 'High-oil break crop improving following wheat yields by 12–16%.',
  },
  lentils: {
    id: 'lentils',
    name: 'Red Lentils',
    family: 'Legume',
    color: '#1E7A56',
    lightBg: '#E1F3EC',
    textColor: '#0F4D35',
    droughtTolerance: 'Very High',
    nitrogenImpactKgHa: +48,
    waterNeedMm: 225,
    baseYieldTha: 1.9,
    revenuePerTonUsd: 980,
    rootDepthCm: 75,
    pestBreakRole: 'Ultra-low moisture legume ideal for semi-arid dryland rotation.',
    shortNote: 'Minimal-water protein legume with premium export pricing.',
  },
  soybeans: {
    id: 'soybeans',
    name: 'Soybeans',
    family: 'Legume',
    color: '#3B9E47',
    lightBg: '#E7F6E9',
    textColor: '#1B5E23',
    droughtTolerance: 'Moderate',
    nitrogenImpactKgHa: +52,
    waterNeedMm: 410,
    baseYieldTha: 3.3,
    revenuePerTonUsd: 495,
    rootDepthCm: 115,
    pestBreakRole: 'Classic cereal rotation partner stabilizing nitrogen & soil microbes.',
    shortNote: 'Versatile nitrogen-fixing oilseed legume for irrigated parcels.',
  },
};

export interface PresetRegion {
  id: string;
  label: string;
  country: string;
  lat: number;
  lng: number;
  defaultSoil: SoilType;
  climateNote: string;
}

export const PRESET_REGIONS: PresetRegion[] = [
  {
    id: 'medjerda-tn',
    label: 'Medjerda Valley, Manouba',
    country: 'Tunisia',
    lat: 36.8142,
    lng: 9.8635,
    defaultSoil: 'Clay-Loam',
    climateNote: 'Mediterranean alluvial plains · High solar irradiance',
  },
  {
    id: 'beja-tn',
    label: 'Béja Cereal Plains',
    country: 'Tunisia',
    lat: 36.7256,
    lng: 9.1817,
    defaultSoil: 'Loamy',
    climateNote: 'Sub-humid northern grain belt · 560 mm rainfall',
  },
  {
    id: 'loire-fr',
    label: 'Loire Atlantic Basin',
    country: 'France',
    lat: 47.3422,
    lng: -0.6412,
    defaultSoil: 'Silt Loam',
    climateNote: 'Atlantic temperate · Horizon Europe pilot zone',
  },
  {
    id: 'andalusia-es',
    label: 'Guadalquivir Valley, Andalusia',
    country: 'Spain',
    lat: 37.5418,
    lng: -5.4231,
    defaultSoil: 'Calcareous',
    climateNote: 'Warm semi-arid Mediterranean · Precision drip zone',
  },
  {
    id: 'po-it',
    label: 'Emilia-Romagna Po Plains',
    country: 'Italy',
    lat: 44.6471,
    lng: 10.9252,
    defaultSoil: 'Clay-Loam',
    climateNote: 'Fertile alluvial valley · Mixed cereal-horticulture',
  },
  {
    id: 'iowa-us',
    label: 'Story County Heartlands, Iowa',
    country: 'USA',
    lat: 42.0308,
    lng: -93.6319,
    defaultSoil: 'Loamy',
    climateNote: 'Continental prairie loam · High-yield grain corridor',
  },
];

export const EQUIPMENT_OPTIONS = [
  'Precision Seeder / Planter',
  'GPS-Guided Tractor',
  'Soil Moisture Probes (IoT)',
  'Local Weather Station',
  'Variable-Rate Drip Controller',
  'No-Till Conservation Drill',
  'Optical Crop Health Drone',
];

export const PREVIOUS_CROP_OPTIONS = [
  'Durum Wheat',
  'Winter Barley',
  'Chickpeas',
  'Processing Tomatoes',
  'Sunflowers',
  'Alfalfa',
  'Fava Beans',
  'Grain Sorghum',
  'Soybeans',
  'Fallow / Grazing',
];

export function buildDefaultBoundary(
  lat: number,
  lng: number,
  halfHeightDeg = 0.0042,
  halfWidthDeg = 0.0056
): [number, number][] {
  // Slightly organic quadrilateral farm parcel
  return [
    [Number((lat + halfHeightDeg * 1.04).toFixed(6)), Number((lng - halfWidthDeg * 0.96).toFixed(6))],
    [Number((lat + halfHeightDeg * 0.95).toFixed(6)), Number((lng + halfWidthDeg * 1.04).toFixed(6))],
    [Number((lat - halfHeightDeg * 1.02).toFixed(6)), Number((lng + halfWidthDeg * 0.94).toFixed(6))],
    [Number((lat - halfHeightDeg * 0.96).toFixed(6)), Number((lng - halfWidthDeg * 1.03).toFixed(6))],
  ];
}

export function computePolygonAreaHectares(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const avgLat = coords.reduce((sum, [lat]) => sum + lat, 0) / coords.length;
  const metersPerLat = 111132.92;
  const metersPerLng = 111412.84 * Math.cos((avgLat * Math.PI) / 180);

  let areaSqMeters = 0;
  for (let i = 0; i < coords.length; i++) {
    const [lat1, lng1] = coords[i];
    const [lat2, lng2] = coords[(i + 1) % coords.length];
    const x1 = lng1 * metersPerLng;
    const y1 = lat1 * metersPerLat;
    const x2 = lng2 * metersPerLng;
    const y2 = lat2 * metersPerLat;
    areaSqMeters += x1 * y2 - x2 * y1;
  }
  const hectares = Math.abs(areaSqMeters / 2) / 10000;
  return Math.max(1.5, Number(hectares.toFixed(1)));
}

/**
 * Cleanly subdivides any farm boundary (using its bounding quad / 4 corners)
 * into 4 contiguous spatial plots: S1 (NW), S2 (NE), S3 (SW), S4 (SE).
 */
export function subdivideBoundaryInto4Zones(
  boundary: [number, number][]
): Record<ZoneId, [number, number][]> {
  // Normalize to 4 ordered corners [NW, NE, SE, SW]
  let nw: [number, number];
  let ne: [number, number];
  let se: [number, number];
  let sw: [number, number];

  if (boundary.length === 4) {
    // Sort top 2 (highest lat) and bottom 2 (lowest lat)
    const sortedByLat = [...boundary].sort((a, b) => b[0] - a[0]);
    const topPair = sortedByLat.slice(0, 2).sort((a, b) => a[1] - b[1]);
    const bottomPair = sortedByLat.slice(2, 4).sort((a, b) => a[1] - b[1]);
    nw = topPair[0];
    ne = topPair[1];
    sw = bottomPair[0];
    se = bottomPair[1];
  } else {
    const lats = boundary.map((p) => p[0]);
    const lngs = boundary.map((p) => p[1]);
    const maxLat = Math.max(...lats);
    const minLat = Math.min(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    nw = [maxLat, minLng];
    ne = [maxLat, maxLng];
    se = [minLat, maxLng];
    sw = [minLat, minLng];
  }

  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];

  const topMid = mid(nw, ne);
  const bottomMid = mid(sw, se);
  const leftMid = mid(nw, sw);
  const rightMid = mid(ne, se);
  const center = mid(topMid, bottomMid);

  // Subtle inward gap (2%) so each quadrant visually reads crisply like real farm tracks
  const inset = (pts: [number, number][]): [number, number][] => {
    const cLat = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cLng = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    return pts.map(([lat, lng]) => [
      cLat + (lat - cLat) * 0.96,
      cLng + (lng - cLng) * 0.96,
    ]);
  };

  return {
    S1: inset([nw, topMid, center, leftMid]),
    S2: inset([topMid, ne, rightMid, center]),
    S3: inset([leftMid, center, bottomMid, sw]),
    S4: inset([center, rightMid, se, bottomMid]),
  };
}

export function getPolygonCenter(coords: [number, number][]): [number, number] {
  const lat = coords.reduce((sum, p) => sum + p[0], 0) / coords.length;
  const lng = coords.reduce((sum, p) => sum + p[1], 0) / coords.length;
  return [lat, lng];
}

/**
 * Proportionally scales a farm boundary around its centroid to match `targetHectares`.
 */
export function scaleBoundaryToHectares(
  boundary: [number, number][],
  targetHectares: number
): [number, number][] {
  const clampedTarget = Math.max(2, Math.min(500, targetHectares));
  const currentArea = computePolygonAreaHectares(boundary);
  if (currentArea <= 0 || boundary.length < 3) {
    return boundary;
  }
  const scale = Math.sqrt(clampedTarget / currentArea);
  const [cLat, cLng] = getPolygonCenter(boundary);
  return boundary.map(([lat, lng]) => [
    Number((cLat + (lat - cLat) * scale).toFixed(6)),
    Number((cLng + (lng - cLng) * scale).toFixed(6)),
  ]);
}

export function generateNasaBaseline(
  coords: Coordinates,
  soilType: SoilType
): NasaBaseline {
  // Deterministic climate-realistic simulation based on latitude & soil water-holding capacity
  const absLat = Math.abs(coords.lat);
  const soilMoistureBonus: Record<SoilType, number> = {
    Clay: 7,
    'Clay-Loam': 5,
    Loamy: 3,
    'Silt Loam': 4,
    Calcareous: -2,
    'Sandy Loam': -5,
  };

  const baseMoisture = Math.max(
    18,
    Math.min(46, Math.round(22 + (absLat - 30) * 0.65 + (soilMoistureBonus[soilType] || 0)))
  );
  const baseTemp = Number(
    Math.max(12.5, Math.min(31.5, 29.5 - (absLat - 28) * 0.48)).toFixed(1)
  );
  const ndvi = Number(
    Math.max(0.46, Math.min(0.82, 0.62 + (soilMoistureBonus[soilType] || 0) * 0.014)).toFixed(2)
  );
  const annualPrecip = Math.round(Math.max(260, Math.min(920, 320 + (absLat - 32) * 28)));
  const solar = Number(Math.max(3.4, Math.min(6.3, 6.2 - (absLat - 30) * 0.11)).toFixed(1));

  return {
    smapSoilMoisturePct: baseMoisture,
    modisSurfaceTempC: baseTemp,
    ndviBaseline: ndvi,
    annualPrecipMm: annualPrecip,
    solarRadiationKwh: solar,
    lastSyncedIso: '2026-11-14T08:42:00Z',
    satellitePassId: `NASA-SMAP-L4-${Math.abs(Math.round(coords.lat * 100))}`,
  };
}

export const DEFAULT_FARMER_PROFILE: FarmerProfile = (() => {
  const lat = 36.8142;
  const lng = 9.8635;
  const boundary = buildDefaultBoundary(lat, lng);
  return {
    name: 'Amine Ben Salem',
    email: 'amine@medjerdafarms.tn',
    farmName: 'El-Khadhra Valley Estate',
    regionLabel: 'Medjerda Valley, Tunisia',
    coordinates: { lat, lng },
    boundary,
    areaHectares: computePolygonAreaHectares(boundary),
    soilType: 'Clay-Loam',
    irrigationType: 'Precision Drip',
    waterAccess: 'Moderate',
    equipment: [
      'GPS-Guided Tractor',
      'Soil Moisture Probes (IoT)',
      'Variable-Rate Drip Controller',
      'Local Weather Station',
    ],
    previousCrops: ['Durum Wheat', 'Winter Barley', 'Processing Tomatoes'],
    nasaBaseline: generateNasaBaseline({ lat, lng }, 'Clay-Loam'),
  };
})();

const PRIORITY_ROTATION_CYCLES: Record<
  RotationParameters['priority'],
  [string, string, string, string]
> = {
  balanced: ['durum_wheat', 'chickpeas', 'sunflower', 'fava_beans'],
  'drought-resilient': ['winter_barley', 'sorghum', 'lentils', 'sunflower'],
  'soil-regeneration': ['fava_beans', 'durum_wheat', 'crimson_clover', 'alfalfa'],
  'high-yield': ['durum_wheat', 'tomatoes', 'chickpeas', 'canola'],
};

const SEASON_METADATA = [
  {
    seasonLabel: 'Season 1 · Autumn / Winter 2026–27',
    shortLabel: 'S1 · 2026–27',
    focusObjective: 'Establish baseline nitrogen fixation & moisture-matched canopy',
  },
  {
    seasonLabel: 'Season 2 · Spring / Summer 2027',
    shortLabel: 'S2 · 2027',
    focusObjective: 'Shift deep-root break crops to fracture soil & disrupt pest cycles',
  },
  {
    seasonLabel: 'Season 3 · Autumn / Winter 2027–28',
    shortLabel: 'S3 · 2027–28',
    focusObjective: 'Capitalize on mineralized organic nitrogen for peak cereal output',
  },
  {
    seasonLabel: 'Season 4 · Spring / Summer 2028',
    shortLabel: 'S4 · 2028',
    focusObjective: 'Lock organic carbon & complete 4-zone restorative cycle',
  },
];

const GROWTH_STAGES = [
  'Tillering / Active Vegetative',
  'Canopy Closure · Optimal',
  'Flowering / Pod Initiation',
  'Root Establishment · Healthy',
];

function buildZoneAssignment(
  zoneId: ZoneId,
  cropId: string,
  seasonIndex: number,
  params: RotationParameters,
  profile: FarmerProfile,
  prevCropId?: string
): ZoneCropAssignment {
  const crop = CROPS[cropId] ?? CROPS.durum_wheat;
  const prevCrop = prevCropId ? CROPS[prevCropId] : undefined;
  const zoneIdx = ZONE_IDS.indexOf(zoneId);

  const legumeSynergy = prevCrop?.family === 'Legume' && crop.family !== 'Legume' ? 0.14 : 0;
  const waterPenalty =
    params.waterConservationPct >= 30 && crop.droughtTolerance === 'Low' ? -0.08 : 0.04;
  const organicBoost = params.organicFocus && crop.family === 'Legume' ? 0.06 : 0;

  const baseNdvi = profile.nasaBaseline.ndviBaseline;
  const ndvi = Number(
    Math.min(
      0.89,
      Math.max(
        0.54,
        baseNdvi + 0.07 + zoneIdx * 0.018 + (crop.family === 'Legume' ? 0.03 : 0.01) + legumeSynergy * 0.2
      )
    ).toFixed(2)
  );

  const soilMoisturePct = Math.round(
    Math.min(
      48,
      Math.max(
        22,
        profile.nasaBaseline.smapSoilMoisturePct +
          (crop.droughtTolerance === 'Very High' ? 4 : crop.droughtTolerance === 'High' ? 2 : -2) +
          (zoneIdx % 2 === 0 ? 2 : -1)
      )
    )
  );

  const nitrogenKgHa = Math.round(
    Math.max(
      45,
      Math.min(
        142,
        82 +
          crop.nitrogenImpactKgHa * 0.45 +
          (prevCrop?.family === 'Legume' ? 18 : 0) +
          (params.organicFocus ? 8 : 0)
      )
    )
  );

  const healthScore = Math.round(
    Math.min(
      98,
      Math.max(72, 82 + (ndvi - 0.6) * 42 + (legumeSynergy > 0 ? 6 : 0) + (params.organicFocus ? 3 : 0))
    )
  );

  const expectedYieldTha = Number(
    (crop.baseYieldTha * (1 + 0.08 + legumeSynergy + waterPenalty + organicBoost + seasonIndex * 0.025)).toFixed(2)
  );

  const rationale =
    prevCrop?.family === 'Legume' && crop.family !== 'Legume'
      ? `Follows ${prevCrop.name} to capture +${Math.round(prevCrop.nitrogenImpactKgHa * 0.6)} kg/ha residual fixed nitrogen.`
      : crop.family === 'Legume'
        ? `Fixes +${crop.nitrogenImpactKgHa} kg N/ha biologically and interrupts cereal root-disease pressure.`
        : crop.pestBreakRole;

  return {
    zoneId,
    cropId: crop.id,
    growthStage: GROWTH_STAGES[(zoneIdx + seasonIndex) % GROWTH_STAGES.length],
    ndvi,
    soilMoisturePct,
    nitrogenKgHa,
    healthScore,
    expectedYieldTha,
    rationale,
  };
}

export function buildStrategyFromParameters(
  params: RotationParameters,
  profile: FarmerProfile,
  zone0Overrides?: Partial<Record<ZoneId, string>>,
  customName?: string
): RotationStrategy {
  const baseCycle = [...PRIORITY_ROTATION_CYCLES[params.priority]];

  // Adjust cycle slightly when high water conservation or organic focus is active
  if (params.waterConservationPct >= 30 && !zone0Overrides) {
    if (baseCycle.includes('tomatoes')) {
      baseCycle[baseCycle.indexOf('tomatoes')] = 'sorghum';
    }
    if (baseCycle.includes('durum_wheat') && params.waterConservationPct >= 35) {
      baseCycle[baseCycle.indexOf('durum_wheat')] = 'winter_barley';
    }
  }
  if (params.organicFocus && !zone0Overrides) {
    if (!baseCycle.includes('crimson_clover') && !baseCycle.includes('alfalfa')) {
      baseCycle[3] = 'crimson_clover';
    }
  }

  // Starting 4 zones for season 0
  const season0Crops: Record<ZoneId, string> = {
    S1: zone0Overrides?.S1 ?? baseCycle[0],
    S2: zone0Overrides?.S2 ?? baseCycle[1],
    S3: zone0Overrides?.S3 ?? baseCycle[2],
    S4: zone0Overrides?.S4 ?? baseCycle[3],
  };

  // Build ordered rotation ring from the 4 season-0 crops (preserving uniqueness when possible)
  const ringOrder: [string, string, string, string] = [
    season0Crops.S1,
    season0Crops.S2,
    season0Crops.S3,
    season0Crops.S4,
  ];

  const seasons: SeasonRotationStep[] = SEASON_METADATA.map((meta, sIdx) => {
    const zones = {} as Record<ZoneId, ZoneCropAssignment>;
    ZONE_IDS.forEach((zoneId, zIdx) => {
      // Each zone shifts cyclically along the 4-crop ring each season
      const cropId = ringOrder[(zIdx + sIdx) % 4];
      const prevCropId = sIdx > 0 ? ringOrder[(zIdx + sIdx - 1) % 4] : undefined;
      zones[zoneId] = buildZoneAssignment(zoneId, cropId, sIdx, params, profile, prevCropId);
    });
    return {
      seasonIndex: sIdx,
      seasonLabel: meta.seasonLabel,
      shortLabel: meta.shortLabel,
      focusObjective: meta.focusObjective,
      zones,
    };
  });

  // Compute aggregate metrics from actual crops in season 0
  const activeCrops = ZONE_IDS.map((z) => CROPS[seasons[0].zones[z].cropId] ?? CROPS.durum_wheat);
  const avgWaterNeed = activeCrops.reduce((s, c) => s + c.waterNeedMm, 0) / 4;
  const legumeCount = activeCrops.filter((c) => c.family === 'Legume' || c.family === 'Forage / Cover').length;
  const droughtReadyCount = activeCrops.filter(
    (c) => c.droughtTolerance === 'High' || c.droughtTolerance === 'Very High'
  ).length;
  const uniqueFamilies = new Set(activeCrops.map((c) => c.family)).size;

  const waterSavingsPct = Math.round(
    Math.min(42, Math.max(8, ((440 - avgWaterNeed) / 440) * 65 + params.waterConservationPct * 0.48))
  );
  const nitrogenGainKgHa = Math.round(
    Math.max(10, legumeCount * 22 + (params.organicFocus ? 14 : 4))
  );
  const projectedYieldGainPct = Number(
    (
      9.5 +
      uniqueFamilies * 2.1 +
      legumeCount * 1.4 +
      (params.priority === 'high-yield' ? 4.8 : params.priority === 'drought-resilient' ? 1.5 : 0)
    ).toFixed(1)
  );
  const sustainabilityScore = Math.round(
    Math.min(
      96,
      Math.max(
        64,
        56 +
          uniqueFamilies * 4.5 +
          legumeCount * 4.2 +
          droughtReadyCount * 2.0 +
          (params.organicFocus ? 6 : 0) +
          (params.cycleLengthYears === 4 ? 4 : params.cycleLengthYears === 3 ? 2 : 0)
      )
    )
  );
  const soilOrganicMatterGainPct = Number(
    (0.38 + legumeCount * 0.18 + (params.organicFocus ? 0.28 : 0.08) + params.cycleLengthYears * 0.06).toFixed(2)
  );

  const priorityLabels: Record<RotationParameters['priority'], string> = {
    balanced: 'Balanced Yield & Soil Restoration',
    'drought-resilient': 'Climate-Resilient Dryland Rotation',
    'soil-regeneration': 'Regenerative Carbon & Nitrogen Recovery',
    'high-yield': 'High-Margin Precision Cash Rotation',
  };

  return {
    id: `strat-${Date.now().toString(36)}`,
    name: customName ?? priorityLabels[params.priority],
    approvedAt: new Date().toISOString(),
    parameters: { ...params },
    seasons,
    restorationPillars: [
      {
        title: 'Biological Nitrogen Fixation',
        metric: `+${nitrogenGainKgHa} kg N/ha`,
        detail: `${legumeCount} restorative plot${legumeCount === 1 ? '' : 's'} actively replenish soil nitrates via root-nodule rhizobia, reducing synthetic urea needs by ${Math.round(nitrogenGainKgHa * 0.7)}%.`,
        category: 'nitrogen',
      },
      {
        title: 'Pest & Pathogen Cycle Break',
        metric: `${uniqueFamilies} Plant Families`,
        detail: `Alternating cereals, legumes, and deep-taproot oilseeds across S1–S4 interrupts Fusarium root rot, aphids, and winter broadleaf weed resistance.`,
        category: 'pest',
      },
      {
        title: 'NASA-Calibrated Water Savings',
        metric: `-${waterSavingsPct}% Irrigation`,
        detail: `Matching root depths (${Math.round(activeCrops.reduce((s, c) => s + c.rootDepthCm, 0) / 4)} cm avg) to SMAP soil moisture cuts evaporative loss during dry spells.`,
        category: 'water',
      },
      {
        title: 'Soil Organic Matter Recovery',
        metric: `+${soilOrganicMatterGainPct}% SOM / 4yr`,
        detail: `Residue retention and ${params.cycleLengthYears}-year multi-species roots rebuild topsoil structure and water-holding capacity on ${profile.soilType} land.`,
        category: 'carbon',
      },
    ],
    summaryMetrics: {
      projectedYieldGainPct,
      waterSavingsPct,
      nitrogenGainKgHa,
      sustainabilityScore,
      soilOrganicMatterGainPct,
    },
  };
}

export function createInitialStrategy(profile: FarmerProfile): RotationStrategy {
  return buildStrategyFromParameters(
    {
      priority: 'balanced',
      waterConservationPct: 20,
      cycleLengthYears: 4,
      organicFocus: false,
    },
    profile
  );
}

/**
 * Generates a Pending Strategy Proposal from parameter changes in the Rotation Lab.
 */
export function createProposalFromParameters(
  newParams: RotationParameters,
  currentStrategy: RotationStrategy,
  profile: FarmerProfile
): ProposedStrategyUpdate {
  const proposedStrategy = buildStrategyFromParameters(newParams, profile);
  const zoneDiffs: ZoneDiff[] = [];

  ZONE_IDS.forEach((zoneId) => {
    const fromCropId = currentStrategy.seasons[0].zones[zoneId].cropId;
    const toCropId = proposedStrategy.seasons[0].zones[zoneId].cropId;
    if (fromCropId !== toCropId) {
      zoneDiffs.push({
        zoneId,
        fromCropId,
        toCropId,
        reason: `Re-optimized for ${proposedStrategy.name.toLowerCase()}`,
      });
    }
  });

  // Even if crops happen to stay identical (e.g., water slider minor shift), record parameter update cleanly
  return {
    id: `prop-${Date.now().toString(36)}`,
    source: 'parameters',
    title: `Parameter Update: ${proposedStrategy.name}`,
    summary:
      zoneDiffs.length > 0
        ? `Rebalances ${zoneDiffs.length} plot${zoneDiffs.length > 1 ? 's' : ''} (${zoneDiffs.map((d) => d.zoneId).join(', ')}) to meet ${newParams.waterConservationPct}% water conservation target over a ${newParams.cycleLengthYears}-year cycle.`
        : `Updates irrigation scheduling (${newParams.waterConservationPct}% conservation target), ${newParams.cycleLengthYears}-year cycle pacing${newParams.organicFocus ? ', and organic-first nutrient targets' : ''}.`,
    zoneDiffs,
    metricDeltas: {
      yieldDeltaPct: Number(
        (
          proposedStrategy.summaryMetrics.projectedYieldGainPct -
          currentStrategy.summaryMetrics.projectedYieldGainPct
        ).toFixed(1)
      ),
      waterSavingsDeltaPct:
        proposedStrategy.summaryMetrics.waterSavingsPct -
        currentStrategy.summaryMetrics.waterSavingsPct,
      nitrogenDeltaKgHa:
        proposedStrategy.summaryMetrics.nitrogenGainKgHa -
        currentStrategy.summaryMetrics.nitrogenGainKgHa,
      sustainabilityDelta:
        proposedStrategy.summaryMetrics.sustainabilityScore -
        currentStrategy.summaryMetrics.sustainabilityScore,
    },
    proposedStrategy,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Intelligent Agronomy Chatbot Parser for the AI Rotation Lab.
 * Understands zone-specific instructions (S1–S4), crop swaps, drought resilience,
 * water conservation, nitrogen regeneration, high-margin crops, pest breaks, and Q&A.
 */
export function processAgronomyChatPrompt(
  rawPrompt: string,
  currentStrategy: RotationStrategy,
  profile: FarmerProfile
): { reply: string; proposal?: ProposedStrategyUpdate } {
  const text = rawPrompt.toLowerCase();

  // Detect mentioned zones
  const mentionedZones: ZoneId[] = [];
  if (/\bs1\b|section 1|zone 1|quadrant 1|plot 1|northwest/.test(text)) mentionedZones.push('S1');
  if (/\bs2\b|section 2|zone 2|quadrant 2|plot 2|northeast/.test(text)) mentionedZones.push('S2');
  if (/\bs3\b|section 3|zone 3|quadrant 3|plot 3|southwest/.test(text)) mentionedZones.push('S3');
  if (/\bs4\b|section 4|zone 4|quadrant 4|plot 4|southeast/.test(text)) mentionedZones.push('S4');

  // Detect explicitly requested crop
  const cropKeywords: Array<[RegExp, string]> = [
    [/sorghum/, 'sorghum'],
    [/chickpea/, 'chickpeas'],
    [/lentil/, 'lentils'],
    [/tomato/, 'tomatoes'],
    [/sunflower/, 'sunflower'],
    [/alfalfa/, 'alfalfa'],
    [/fava|faba|broad bean/, 'fava_beans'],
    [/clover|cover crop/, 'crimson_clover'],
    [/barley/, 'winter_barley'],
    [/canola|rapeseed/, 'canola'],
    [/soybean|soy/, 'soybeans'],
    [/wheat/, 'durum_wheat'],
  ];

  let requestedCropId: string | undefined;
  for (const [regex, cropId] of cropKeywords) {
    if (regex.test(text)) {
      requestedCropId = cropId;
      break;
    }
  }

  // Informational Q&A checks (only if no modification intent is present)
  const isActionIntent =
    mentionedZones.length > 0 ||
    Boolean(requestedCropId) ||
    /prioritize|switch|change|replace|swap|optimize|reduce|boost|increase|maximize|break|plant|add|make|use|focus|regenerate|save water|drought|organic|profit|margin/.test(
      text
    );

  if (!isActionIntent) {
    const s1Crop = CROPS[currentStrategy.seasons[0].zones.S1.cropId];
    const s2Crop = CROPS[currentStrategy.seasons[0].zones.S2.cropId];
    if (/nasa|smap|satellite|ndvi|modis/.test(text)) {
      return {
        reply: `Tadawol fuses NASA SMAP Level-4 root-zone soil moisture (currently ${profile.nasaBaseline.smapSoilMoisturePct}% at ${profile.coordinates.lat.toFixed(2)}°N, ${profile.coordinates.lng.toFixed(2)}°E) with MODIS surface thermal readings (${profile.nasaBaseline.modisSurfaceTempC}°C) and Sentinel/Landsat NDVI (${profile.nasaBaseline.ndviBaseline}). Because your ${profile.soilType} topsoil retains moisture well in the upper 30 cm, we cross-check satellite passes against your local probes to schedule drip cycles right before vegetative stress begins.`,
      };
    }
    return {
      reply: `Your current approved rotation (**${currentStrategy.name}**) pairs **${s1Crop.name}** in S1 with **${s2Crop.name}** in S2 on ${profile.soilType} soil (${profile.areaHectares} ha). Together, all 4 plots project a **+${currentStrategy.summaryMetrics.projectedYieldGainPct}% yield uplift** and **-${currentStrategy.summaryMetrics.waterSavingsPct}% irrigation demand**. If you'd like me to modify any plot — for example *"Prioritize drought-resistant crops in S2"* or *"Boost natural nitrogen in S1 & S3"* — just ask and I'll prepare an approval-ready update.`,
    };
  }

  // Prepare updated overrides & parameters starting from current approved strategy
  const currentSeason0: Record<ZoneId, string> = {
    S1: currentStrategy.seasons[0].zones.S1.cropId,
    S2: currentStrategy.seasons[0].zones.S2.cropId,
    S3: currentStrategy.seasons[0].zones.S3.cropId,
    S4: currentStrategy.seasons[0].zones.S4.cropId,
  };

  const nextParams: RotationParameters = { ...currentStrategy.parameters };
  const overrides: Record<ZoneId, string> = { ...currentSeason0 };
  let proposalTitle = 'AI-Proposed Strategy Adjustment';
  let explanation = '';

  const isDroughtIntent = /drought|dry|heat|arid|water|irrigation|less water|scarce/.test(text);
  const isNitrogenIntent = /nitrogen|legume|fixation|fertilizer|soil health|regenerate|organic|carbon|cover/.test(text);
  const isHighMarginIntent = /tomato|cash|margin|profit|revenue|high-yield|yield/.test(text);
  const isPestIntent = /pest|disease|root rot|fungus|weed|break/.test(text);

  if (requestedCropId && mentionedZones.length > 0) {
    const crop = CROPS[requestedCropId];
    mentionedZones.forEach((z) => {
      overrides[z] = requestedCropId!;
    });
    if (crop.droughtTolerance === 'Very High' || crop.droughtTolerance === 'High') {
      nextParams.waterConservationPct = Math.min(40, nextParams.waterConservationPct + 6);
    }
    proposalTitle = `Assign ${crop.name} to ${mentionedZones.join(' & ')}`;
    explanation = `I've modeled placing **${crop.name}** (${crop.family}, ${crop.droughtTolerance.toLowerCase()} drought tolerance, ${crop.waterNeedMm} mm seasonal water need) into **${mentionedZones.join(' and ')}** on your ${profile.soilType} land. ${crop.pestBreakRole} Review the projected shifts below and click **Approve Changes** to commit this layout to your farm map and 5-year forecast.`;
  } else if (isDroughtIntent && mentionedZones.length > 0) {
    nextParams.waterConservationPct = Math.min(40, Math.max(30, nextParams.waterConservationPct + 10));
    const droughtPool = ['sorghum', 'lentils', 'sunflower', 'winter_barley'];
    const used = new Set<string>();
    mentionedZones.forEach((z, idx) => {
      const existing = currentSeason0[z];
      const pick =
        droughtPool.find((c) => c !== existing && !used.has(c)) ??
        droughtPool[idx % droughtPool.length];
      used.add(pick);
      overrides[z] = pick;
    });
    const chosenNames = mentionedZones.map((z) => `${z} → ${CROPS[overrides[z]].name}`).join(', ');
    proposalTitle = `Drought-Resilient Reallocation (${mentionedZones.join(', ')})`;
    explanation = `Given NASA MODIS surface heat trends (${profile.nasaBaseline.modisSurfaceTempC}°C) and your ${profile.waterAccess.toLowerCase()} water access, I recommend transitioning **${chosenNames}**. Deep-rooted, low-transpiration varieties cut peak summer evapotranspiration while protecting moisture reserves on ${profile.soilType} soil. Click **Approve Changes** below to apply.`;
  } else if (isNitrogenIntent && mentionedZones.length > 0) {
    nextParams.organicFocus = true;
    const legumePool = ['fava_beans', 'crimson_clover', 'chickpeas', 'alfalfa'];
    const used = new Set<string>();
    mentionedZones.forEach((z, idx) => {
      const pick =
        legumePool.find((c) => c !== currentSeason0[z] && !used.has(c)) ??
        legumePool[idx % legumePool.length];
      used.add(pick);
      overrides[z] = pick;
    });
    const chosenNames = mentionedZones.map((z) => `${z} → ${CROPS[overrides[z]].name}`).join(', ');
    proposalTitle = `Biological Nitrogen Boost (${mentionedZones.join(', ')})`;
    explanation = `To restore natural soil nitrogen without synthetic urea, I propose assigning **${chosenNames}**. These diverse legume/cover species fix **+54 to +76 kg N/ha** symbiotically and enrich microbial humus ahead of next season's cereal rotation. Approve the changes below to recalculate all 4 zones.`;
  } else if (requestedCropId) {
    const crop = CROPS[requestedCropId];
    // Pick the best plot that does not already grow this crop
    const targetZone = ZONE_IDS.find((z) => currentSeason0[z] !== requestedCropId) ?? 'S4';
    overrides[targetZone] = requestedCropId;
    proposalTitle = `Integrate ${crop.name} in ${targetZone}`;
    explanation = `I placed **${crop.name}** in **${targetZone}** where it complements adjacent plots without duplicating plant families. ${crop.shortNote} Review the impact summary and click **Approve Changes** when ready.`;
  } else if (isDroughtIntent) {
    nextParams.priority = 'drought-resilient';
    nextParams.waterConservationPct = Math.max(32, nextParams.waterConservationPct);
    const fresh = buildStrategyFromParameters(nextParams, profile);
    ZONE_IDS.forEach((z) => {
      overrides[z] = fresh.seasons[0].zones[z].cropId;
    });
    proposalTitle = 'Farm-Wide Drought & Water Optimization';
    explanation = `I redesigned your full 4-zone plan (**S1–S4**) around drought-hardy cultivars (**${CROPS[overrides.S1].name}**, **${CROPS[overrides.S2].name}**, **${CROPS[overrides.S3].name}**, **${CROPS[overrides.S4].name}**) calibrated to NASA SMAP root-zone moisture (${profile.nasaBaseline.smapSoilMoisturePct}%). This cuts total farm water demand significantly while keeping soil cover intact. Click **Approve Changes** to activate.`;
  } else if (isNitrogenIntent) {
    nextParams.priority = 'soil-regeneration';
    nextParams.organicFocus = true;
    const fresh = buildStrategyFromParameters(nextParams, profile);
    ZONE_IDS.forEach((z) => {
      overrides[z] = fresh.seasons[0].zones[z].cropId;
    });
    proposalTitle = 'Regenerative Soil & Nitrogen Recovery Plan';
    explanation = `I shifted your rotation to prioritize organic nitrogen recovery and carbon sequestration using **Fava Beans**, **Crimson Clover**, and **Alfalfa** alongside **Durum Wheat**. This raises biological nitrogen inputs and accelerates topsoil organic matter recovery over the next 4 seasons. Approve below to update your roadmap.`;
  } else if (isHighMarginIntent) {
    nextParams.priority = 'high-yield';
    const fresh = buildStrategyFromParameters(nextParams, profile);
    ZONE_IDS.forEach((z) => {
      overrides[z] = fresh.seasons[0].zones[z].cropId;
    });
    proposalTitle = 'High-Margin Precision Cash Rotation';
    explanation = `To boost per-hectare farm revenue using your ${profile.irrigationType.toLowerCase()} system, I scheduled **Processing Tomatoes** alongside **Durum Wheat**, **Chickpeas**, and **Winter Canola** — pairing high-value horticulture with nitrogen-fixing legumes so soil fertility stays protected. Click **Approve Changes** to apply.`;
  } else if (isPestIntent) {
    overrides.S1 = 'canola';
    overrides.S2 = 'chickpeas';
    overrides.S3 = 'sorghum';
    overrides.S4 = 'fava_beans';
    proposalTitle = '4-Family Bio-Fumigant Pest-Break Rotation';
    explanation = `To break cereal root-rot, nematode, and broadleaf weed cycles simultaneously, I separated all 4 quadrants into distinct botanical families: **Winter Canola** (bio-fumigant brassica in S1), **Chickpeas** (S2), **Grain Sorghum** (S3), and **Fava Beans** (S4). No host pathogen can carry over across adjacent seasons. Click **Approve Changes** to confirm.`;
  } else {
    // General optimization fallback
    const targetZone: ZoneId = mentionedZones[0] ?? 'S2';
    overrides[targetZone] = currentSeason0[targetZone] === 'sorghum' ? 'chickpeas' : 'sorghum';
    proposalTitle = `AI Plot Optimization (${targetZone})`;
    explanation = `Based on your current NASA NDVI telemetry and ${profile.soilType} profile, swapping **${targetZone}** to **${CROPS[overrides[targetZone]].name}** strengthens multi-season resilience and nutrient balance across the estate. Review and click **Approve Changes** to commit.`;
  }

  const proposedStrategy = buildStrategyFromParameters(
    nextParams,
    profile,
    overrides,
    proposalTitle
  );

  const zoneDiffs: ZoneDiff[] = [];
  ZONE_IDS.forEach((z) => {
    const fromCropId = currentSeason0[z];
    const toCropId = proposedStrategy.seasons[0].zones[z].cropId;
    if (fromCropId !== toCropId) {
      zoneDiffs.push({
        zoneId: z,
        fromCropId,
        toCropId,
        reason: CROPS[toCropId].shortNote,
      });
    }
  });

  // Guarantee at least one visible change if user requested an optimization matching current state
  if (zoneDiffs.length === 0) {
    const fallbackZone: ZoneId = mentionedZones[0] ?? 'S2';
    const altCrop = currentSeason0[fallbackZone] === 'lentils' ? 'sorghum' : 'lentils';
    overrides[fallbackZone] = altCrop;
    const revised = buildStrategyFromParameters(nextParams, profile, overrides, proposalTitle);
    zoneDiffs.push({
      zoneId: fallbackZone,
      fromCropId: currentSeason0[fallbackZone],
      toCropId: altCrop,
      reason: CROPS[altCrop].shortNote,
    });
    const proposal: ProposedStrategyUpdate = {
      id: `prop-${Date.now().toString(36)}`,
      source: 'ai',
      title: proposalTitle,
      summary: `Proposes updating ${fallbackZone} to ${CROPS[altCrop].name} for stronger climate & nutrient efficiency.`,
      zoneDiffs,
      metricDeltas: {
        yieldDeltaPct: Number(
          (
            revised.summaryMetrics.projectedYieldGainPct -
            currentStrategy.summaryMetrics.projectedYieldGainPct
          ).toFixed(1)
        ),
        waterSavingsDeltaPct:
          revised.summaryMetrics.waterSavingsPct - currentStrategy.summaryMetrics.waterSavingsPct,
        nitrogenDeltaKgHa:
          revised.summaryMetrics.nitrogenGainKgHa - currentStrategy.summaryMetrics.nitrogenGainKgHa,
        sustainabilityDelta:
          revised.summaryMetrics.sustainabilityScore -
          currentStrategy.summaryMetrics.sustainabilityScore,
      },
      proposedStrategy: revised,
      createdAt: new Date().toISOString(),
    };
    return { reply: explanation, proposal };
  }

  const proposal: ProposedStrategyUpdate = {
    id: `prop-${Date.now().toString(36)}`,
    source: 'ai',
    title: proposalTitle,
    summary: zoneDiffs
      .map((d) => `${d.zoneId}: ${CROPS[d.fromCropId].name} → ${CROPS[d.toCropId].name}`)
      .join(' · '),
    zoneDiffs,
    metricDeltas: {
      yieldDeltaPct: Number(
        (
          proposedStrategy.summaryMetrics.projectedYieldGainPct -
          currentStrategy.summaryMetrics.projectedYieldGainPct
        ).toFixed(1)
      ),
      waterSavingsDeltaPct:
        proposedStrategy.summaryMetrics.waterSavingsPct -
        currentStrategy.summaryMetrics.waterSavingsPct,
      nitrogenDeltaKgHa:
        proposedStrategy.summaryMetrics.nitrogenGainKgHa -
        currentStrategy.summaryMetrics.nitrogenGainKgHa,
      sustainabilityDelta:
        proposedStrategy.summaryMetrics.sustainabilityScore -
        currentStrategy.summaryMetrics.sustainabilityScore,
    },
    proposedStrategy,
    createdAt: new Date().toISOString(),
  };

  return { reply: explanation, proposal };
}

export interface RealtimePoint {
  label: string;
  nasaSmapMoisture: number;
  localProbeMoisture: number;
  nasaModisTemp: number;
  localAirTemp: number;
  nasaNdvi: number;
  nasaPrecipForecastMm: number;
  localIrrigationMm: number;
  evapotranspirationMm: number;
}

export function generateRealtimeAnalytics(
  profile: FarmerProfile,
  strategy: RotationStrategy,
  range: '7D' | '30D' | 'Season'
): {
  timeseries: RealtimePoint[];
  nutrients: { zone: ZoneId; crop: string; nitrogen: number; phosphorus: number; potassium: number; ph: number; optimalN: number }[];
  localWeather: {
    airTempC: number;
    humidityPct: number;
    windKmh: number;
    et0MmDay: number;
    dewPointC: number;
    soilPhAvg: number;
  };
} {
  const baseM = profile.nasaBaseline.smapSoilMoisturePct;
  const baseT = profile.nasaBaseline.modisSurfaceTempC;
  const baseNdvi = profile.nasaBaseline.ndviBaseline;

  const labels =
    range === '7D'
      ? ['Nov 08', 'Nov 09', 'Nov 10', 'Nov 11', 'Nov 12', 'Nov 13', 'Nov 14']
      : range === '30D'
        ? ['Oct 16', 'Oct 20', 'Oct 24', 'Oct 28', 'Nov 01', 'Nov 05', 'Nov 09', 'Nov 14']
        : ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'];

  const rainPattern =
    range === '7D'
      ? [0, 3.2, 11.4, 2.0, 0, 1.5, 6.8]
      : range === '30D'
        ? [4.5, 0, 14.2, 8.0, 0, 2.5, 11.4, 6.8]
        : [26, 12, 5, 8, 29, 44, 58];

  const irrigationPattern =
    range === '7D'
      ? [9, 6, 0, 4, 10, 8, 2]
      : range === '30D'
        ? [12, 16, 4, 8, 15, 13, 6, 5]
        : [38, 64, 78, 72, 42, 24, 14];

  const waterFactor = 1 - strategy.summaryMetrics.waterSavingsPct / 240;

  const timeseries: RealtimePoint[] = labels.map((label, i) => {
    const wave = Math.sin(i * 0.95) * 2.8;
    const nasaSmapMoisture = Number(Math.max(16, Math.min(48, baseM + wave + rainPattern[i] * 0.25)).toFixed(1));
    const localProbeMoisture = Number(Math.max(18, Math.min(50, nasaSmapMoisture + 1.8 + Math.cos(i) * 1.1)).toFixed(1));
    const nasaModisTemp = Number((baseT + Math.cos(i * 0.8) * 2.1 - (range === 'Season' ? (i - 2) * 1.2 : 0)).toFixed(1));
    const localAirTemp = Number((nasaModisTemp - 1.9 + Math.sin(i * 0.6) * 0.7).toFixed(1));
    const nasaNdvi = Number(
      Math.min(0.91, Math.max(0.44, baseNdvi + 0.04 + i * 0.015 + Math.sin(i * 0.7) * 0.02)).toFixed(2)
    );
    const localIrrigationMm = Number((irrigationPattern[i] * waterFactor).toFixed(1));
    const evapotranspirationMm = Number((3.4 + (nasaModisTemp - 15) * 0.16).toFixed(1));

    return {
      label,
      nasaSmapMoisture,
      localProbeMoisture,
      nasaModisTemp,
      localAirTemp,
      nasaNdvi,
      nasaPrecipForecastMm: rainPattern[i],
      localIrrigationMm,
      evapotranspirationMm,
    };
  });

  const nutrients = ZONE_IDS.map((z, idx) => {
    const assignment = strategy.seasons[0].zones[z];
    const crop = CROPS[assignment.cropId] ?? CROPS.durum_wheat;
    return {
      zone: z,
      crop: crop.name,
      nitrogen: assignment.nitrogenKgHa,
      phosphorus: 34 + idx * 5 + (crop.family === 'Legume' ? 6 : 0),
      potassium: 148 + idx * 11,
      ph: Number((6.7 + (idx % 3) * 0.2).toFixed(1)),
      optimalN: 95,
    };
  });

  return {
    timeseries,
    nutrients,
    localWeather: {
      airTempC: Number((baseT - 1.8).toFixed(1)),
      humidityPct: Math.min(78, Math.max(41, Math.round(48 + baseM * 0.48))),
      windKmh: 11.4,
      et0MmDay: Number((3.2 + (baseT - 16) * 0.14).toFixed(1)),
      dewPointC: Number((baseT - 8.4).toFixed(1)),
      soilPhAvg: 6.9,
    },
  };
}

export function generateHistoricalRecords(
  profile: FarmerProfile,
  activeStrategy: RotationStrategy
): HistoricalSeasonRecord[] {
  const baseRain = profile.nasaBaseline.annualPrecipMm;
  const baseTemp = profile.nasaBaseline.modisSurfaceTempC;

  return [
    {
      id: 'hist-2022',
      year: 2022,
      seasonLabel: '2022 · Conventional Cereal Baseline',
      nasaTelemetry: {
        rainfallMm: Math.round(baseRain * 0.84),
        avgSurfaceTempC: Number((baseTemp + 1.1).toFixed(1)),
        meanNdvi: 0.56,
        droughtAnomaly: '-16% Rainfall Deficit',
        smapAvgMoisturePct: Math.max(18, profile.nasaBaseline.smapSoilMoisturePct - 5),
      },
      zones: {
        S1: { zoneId: 'S1', cropId: 'durum_wheat', yieldTha: 4.1, ndviAvg: 0.57, soilNitrogenEnd: 56, notes: 'Third consecutive wheat season; visible root-rot patches.' },
        S2: { zoneId: 'S2', cropId: 'durum_wheat', yieldTha: 3.9, ndviAvg: 0.54, soilNitrogenEnd: 52, notes: 'High synthetic urea required to sustain grain fill.' },
        S3: { zoneId: 'S3', cropId: 'winter_barley', yieldTha: 3.8, ndviAvg: 0.56, soilNitrogenEnd: 58, notes: 'Moderate drought stress during April heading.' },
        S4: { zoneId: 'S4', cropId: 'tomatoes', yieldTha: 34.5, ndviAvg: 0.59, soilNitrogenEnd: 49, notes: 'Heavy surface irrigation elevated salinity in topsoil.' },
      },
      farmerDecisions: [
        'Conventional moldboard tillage across S1–S3 before autumn sowing',
        'Applied 135 kg/ha synthetic nitrogen fertilizer on continuous wheat plots',
        'Emergency supplemental irrigation triggered in late April due to dry spell',
      ],
      avgYieldTha: 4.1,
      soilOrganicMatterPct: 1.72,
      somDeltaPct: -0.09,
      nitrogenBalanceKgHa: -38,
    },
    {
      id: 'hist-2023',
      year: 2023,
      seasonLabel: '2023 · Early Legume Transition',
      nasaTelemetry: {
        rainfallMm: Math.round(baseRain * 0.92),
        avgSurfaceTempC: Number((baseTemp + 0.8).toFixed(1)),
        meanNdvi: 0.62,
        droughtAnomaly: '-8% Mild Dry Spring',
        smapAvgMoisturePct: Math.max(20, profile.nasaBaseline.smapSoilMoisturePct - 3),
      },
      zones: {
        S1: { zoneId: 'S1', cropId: 'chickpeas', yieldTha: 2.0, ndviAvg: 0.63, soilNitrogenEnd: 88, notes: 'First legume break crop; strong rhizobia nodulation.' },
        S2: { zoneId: 'S2', cropId: 'winter_barley', yieldTha: 4.4, ndviAvg: 0.60, soilNitrogenEnd: 62, notes: 'Early maturity avoided peak May heatwave.' },
        S3: { zoneId: 'S3', cropId: 'sunflower', yieldTha: 2.4, ndviAvg: 0.61, soilNitrogenEnd: 65, notes: 'Taproots broke compacted plow pan at 45 cm.' },
        S4: { zoneId: 'S4', cropId: 'durum_wheat', yieldTha: 4.6, ndviAvg: 0.64, soilNitrogenEnd: 61, notes: 'Improved canopy density vs. 2022 monoculture.' },
      },
      farmerDecisions: [
        'Introduced chickpeas in S1 to break 3-year cereal pathogen buildup',
        'Converted S4 from furrow irrigation to precision drip lines (-22% water)',
        'Reduced tillage depth to minimum chisel pass to preserve residue',
      ],
      avgYieldTha: 4.5,
      soilOrganicMatterPct: 1.84,
      somDeltaPct: +0.12,
      nitrogenBalanceKgHa: -4,
    },
    {
      id: 'hist-2024',
      year: 2024,
      seasonLabel: '2024 · Satellite-Guided Multi-Zone Rotation',
      nasaTelemetry: {
        rainfallMm: Math.round(baseRain * 1.03),
        avgSurfaceTempC: Number((baseTemp + 0.3).toFixed(1)),
        meanNdvi: 0.71,
        droughtAnomaly: '+3% Near-Normal Moisture',
        smapAvgMoisturePct: profile.nasaBaseline.smapSoilMoisturePct,
      },
      zones: {
        S1: { zoneId: 'S1', cropId: 'durum_wheat', yieldTha: 5.5, ndviAvg: 0.74, soilNitrogenEnd: 74, notes: 'Following 2023 chickpeas yielded +34% over 2022 baseline!' },
        S2: { zoneId: 'S2', cropId: 'fava_beans', yieldTha: 2.9, ndviAvg: 0.72, soilNitrogenEnd: 102, notes: 'Fixed +64 kg N/ha and rebuilt crumbly loam structure.' },
        S3: { zoneId: 'S3', cropId: 'durum_wheat', yieldTha: 5.1, ndviAvg: 0.69, soilNitrogenEnd: 68, notes: 'Benefited from sunflower root channels & deeper moisture.' },
        S4: { zoneId: 'S4', cropId: 'crimson_clover', yieldTha: 4.1, ndviAvg: 0.70, soilNitrogenEnd: 96, notes: 'Winter cover crop completely eliminated winter gully runoff.' },
      },
      farmerDecisions: [
        'Adopted NASA SMAP + local soil probe alerts for variable-rate drip timing',
        'Cut synthetic nitrogen on S1 wheat by 35% using prior chickpea N credits',
        'Seeded crimson clover cover in S4 for organic carbon restoration',
      ],
      avgYieldTha: 5.3,
      soilOrganicMatterPct: 2.06,
      somDeltaPct: +0.22,
      nitrogenBalanceKgHa: +24,
    },
    {
      id: 'hist-2025',
      year: 2025,
      seasonLabel: '2025 · Climate-Adaptive Precision Season',
      nasaTelemetry: {
        rainfallMm: Math.round(baseRain * 0.89),
        avgSurfaceTempC: Number((baseTemp + 0.6).toFixed(1)),
        meanNdvi: 0.75,
        droughtAnomaly: '-11% Warm Dry Spring',
        smapAvgMoisturePct: profile.nasaBaseline.smapSoilMoisturePct + 1,
      },
      zones: {
        S1: { zoneId: 'S1', cropId: 'sunflower', yieldTha: 2.9, ndviAvg: 0.74, soilNitrogenEnd: 76, notes: 'Resilient deep-root performance despite April dry spell.' },
        S2: { zoneId: 'S2', cropId: 'durum_wheat', yieldTha: 5.8, ndviAvg: 0.78, soilNitrogenEnd: 79, notes: 'Peak estate grain protein (14.1%) following fava beans.' },
        S3: { zoneId: 'S3', cropId: 'chickpeas', yieldTha: 2.4, ndviAvg: 0.73, soilNitrogenEnd: 98, notes: 'Zero fungicide required; strong nodulation.' },
        S4: { zoneId: 'S4', cropId: 'sorghum', yieldTha: 6.0, ndviAvg: 0.76, soilNitrogenEnd: 82, notes: 'High water-use efficiency during 34°C July peak.' },
      },
      farmerDecisions: [
        'Switched S4 summer cycle to drought-tolerant sorghum ahead of heat forecast',
        'Maintained full no-till residue cover on S1 and S2 after harvest',
        'Logged 28% irrigation water savings compared to regional neighbors',
      ],
      avgYieldTha: 5.7,
      soilOrganicMatterPct: 2.28,
      somDeltaPct: +0.22,
      nitrogenBalanceKgHa: +31,
    },
    {
      id: 'hist-2026',
      year: 2026,
      seasonLabel: '2026 · Current Active AI Strategy',
      nasaTelemetry: {
        rainfallMm: Math.round(baseRain * 0.98),
        avgSurfaceTempC: baseTemp,
        meanNdvi: Number((profile.nasaBaseline.ndviBaseline + 0.11).toFixed(2)),
        droughtAnomaly: 'Optimal Sync · Live Pass',
        smapAvgMoisturePct: profile.nasaBaseline.smapSoilMoisturePct + 2,
      },
      zones: {
        S1: {
          zoneId: 'S1',
          cropId: activeStrategy.seasons[0].zones.S1.cropId,
          yieldTha: activeStrategy.seasons[0].zones.S1.expectedYieldTha,
          ndviAvg: activeStrategy.seasons[0].zones.S1.ndvi,
          soilNitrogenEnd: activeStrategy.seasons[0].zones.S1.nitrogenKgHa,
          notes: activeStrategy.seasons[0].zones.S1.rationale,
        },
        S2: {
          zoneId: 'S2',
          cropId: activeStrategy.seasons[0].zones.S2.cropId,
          yieldTha: activeStrategy.seasons[0].zones.S2.expectedYieldTha,
          ndviAvg: activeStrategy.seasons[0].zones.S2.ndvi,
          soilNitrogenEnd: activeStrategy.seasons[0].zones.S2.nitrogenKgHa,
          notes: activeStrategy.seasons[0].zones.S2.rationale,
        },
        S3: {
          zoneId: 'S3',
          cropId: activeStrategy.seasons[0].zones.S3.cropId,
          yieldTha: activeStrategy.seasons[0].zones.S3.expectedYieldTha,
          ndviAvg: activeStrategy.seasons[0].zones.S3.ndvi,
          soilNitrogenEnd: activeStrategy.seasons[0].zones.S3.nitrogenKgHa,
          notes: activeStrategy.seasons[0].zones.S3.rationale,
        },
        S4: {
          zoneId: 'S4',
          cropId: activeStrategy.seasons[0].zones.S4.cropId,
          yieldTha: activeStrategy.seasons[0].zones.S4.expectedYieldTha,
          ndviAvg: activeStrategy.seasons[0].zones.S4.ndvi,
          soilNitrogenEnd: activeStrategy.seasons[0].zones.S4.nitrogenKgHa,
          notes: activeStrategy.seasons[0].zones.S4.rationale,
        },
      },
      farmerDecisions: [
        `Active Tadawol strategy approved: ${activeStrategy.name}`,
        `Water conservation target set to ${activeStrategy.parameters.waterConservationPct}% via ${profile.irrigationType}`,
        'Continuous NASA SMAP + MODIS satellite verification active across S1–S4',
      ],
      avgYieldTha: Number(
        (
          5.7 *
          (1 + activeStrategy.summaryMetrics.projectedYieldGainPct / 100)
        ).toFixed(1)
      ),
      soilOrganicMatterPct: 2.48,
      somDeltaPct: +0.2,
      nitrogenBalanceKgHa: activeStrategy.summaryMetrics.nitrogenGainKgHa,
    },
  ];
}

export interface ForecastYearPoint {
  year: string;
  yearNum: number;
  // Soil Fertility / Organic Matter (%)
  somStrategy: number;
  somBaseline: number;
  // Expected Yield Index (t/ha equivalent)
  yieldStrategy: number;
  yieldBaseline: number;
  // Water Efficiency (kg yield per m³ water)
  waterEffStrategy: number;
  waterEffBaseline: number;
  // Overall Sustainability Score (0-100)
  sustainStrategy: number;
  sustainBaseline: number;
  // Estimated Net Margin ($/ha)
  marginStrategy: number;
  marginBaseline: number;
}

export function computeFiveYearForecast(
  strategy: RotationStrategy,
  profile: FarmerProfile
): {
  years: ForecastYearPoint[];
  radarComparison: { metric: string; baseline: number; strategy: number }[];
  year5Summary: {
    somGainPct: number;
    yieldUpliftPct: number;
    waterSavedM3PerYear: number;
    sustainabilityScore: number;
    sustainabilityDelta: number;
    carbonSequesteredTons: number;
    extraNetRevenueUsd: number;
  };
} {
  const {
    projectedYieldGainPct,
    waterSavingsPct,
    nitrogenGainKgHa,
    sustainabilityScore,
    soilOrganicMatterGainPct,
  } = strategy.summaryMetrics;

  const baseSom = 2.25;
  const baseYield = 5.1;
  const baseWaterEff = 1.24;
  const baseSustain = 56;
  const baseMargin = 1120;

  const years: ForecastYearPoint[] = [0, 1, 2, 3, 4, 5].map((yr) => {
    const progress = yr / 5;
    const curve = Math.pow(progress, 0.85);

    const somStrategy = Number((baseSom + soilOrganicMatterGainPct * 1.15 * curve).toFixed(2));
    const somBaseline = Number((baseSom - 0.11 * yr).toFixed(2));

    const yieldStrategy = Number(
      (baseYield * (1 + (projectedYieldGainPct / 100) * (0.35 + 0.95 * curve))).toFixed(2)
    );
    const yieldBaseline = Number((baseYield * (1 - 0.036 * yr)).toFixed(2));

    const waterEffStrategy = Number(
      (baseWaterEff * (1 + (waterSavingsPct / 100) * (0.4 + 0.85 * curve))).toFixed(2)
    );
    const waterEffBaseline = Number((baseWaterEff * (1 - 0.025 * yr)).toFixed(2));

    const sustainStrategy = Math.round(
      Math.min(97, baseSustain + (sustainabilityScore - baseSustain + 3) * curve)
    );
    const sustainBaseline = Math.round(Math.max(36, baseSustain - 3.2 * yr));

    const marginStrategy = Math.round(
      baseMargin * (1 + (projectedYieldGainPct * 0.011 + waterSavingsPct * 0.004) * curve)
    );
    const marginBaseline = Math.round(baseMargin * (1 - 0.042 * yr));

    return {
      year: yr === 0 ? 'Baseline (Now)' : `Year ${yr} (${2026 + yr})`,
      yearNum: yr,
      somStrategy,
      somBaseline,
      yieldStrategy,
      yieldBaseline,
      waterEffStrategy,
      waterEffBaseline,
      sustainStrategy,
      sustainBaseline,
      marginStrategy,
      marginBaseline,
    };
  });

  const y5 = years[5];
  const radarComparison = [
    { metric: 'Soil Fertility', baseline: 48, strategy: Math.min(96, Math.round(70 + soilOrganicMatterGainPct * 18)) },
    { metric: 'Water Efficiency', baseline: 51, strategy: Math.min(96, Math.round(62 + waterSavingsPct * 0.85)) },
    { metric: 'Nitrogen Balance', baseline: 44, strategy: Math.min(97, Math.round(60 + nitrogenGainKgHa * 0.45)) },
    { metric: 'Pest Resilience', baseline: 46, strategy: Math.min(95, sustainabilityScore + 2) },
    { metric: 'Carbon Storage', baseline: 42, strategy: Math.min(94, Math.round(64 + soilOrganicMatterGainPct * 20)) },
    { metric: 'Yield Stability', baseline: 54, strategy: Math.min(96, Math.round(72 + projectedYieldGainPct * 0.9)) },
  ];

  const waterSavedM3PerYear = Math.round(profile.areaHectares * 4200 * (waterSavingsPct / 100));
  const carbonSequesteredTons = Number(
    (profile.areaHectares * (0.95 + soilOrganicMatterGainPct * 0.55) * 5).toFixed(1)
  );
  const extraNetRevenueUsd = Math.round((y5.marginStrategy - y5.marginBaseline) * profile.areaHectares);

  return {
    years,
    radarComparison,
    year5Summary: {
      somGainPct: Number((y5.somStrategy - y5.somBaseline).toFixed(2)),
      yieldUpliftPct: Math.round(((y5.yieldStrategy - y5.yieldBaseline) / y5.yieldBaseline) * 100),
      waterSavedM3PerYear,
      sustainabilityScore: y5.sustainStrategy,
      sustainabilityDelta: y5.sustainStrategy - y5.sustainBaseline,
      carbonSequesteredTons,
      extraNetRevenueUsd,
    },
  };
}
