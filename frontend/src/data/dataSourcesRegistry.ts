export interface LiveBackendDatasetSpec {
  id: string;
  name: string;
  modeBadge: 'Always On' | 'Optional · Earth Engine';
  provider: string;
  variables: string;
  resolution: string;
  period: string;
  access: string;
  usedFor: string;
  limitation: string;
  links: { label: string; url: string }[];
}

export interface CalculatedIndicatorSpec {
  indicator: string;
  source: string;
  definition: string;
}

export interface NonSatelliteInputSpec {
  input: string;
  origin: string;
  usedFor: string;
  limitation: string;
}

export interface ConsideredNotUsedSpec {
  dataset: string;
  reasonNotUsed: string;
  links: { label: string; url: string }[];
}

export interface DataSourceLink {
  label: string;
  url: string;
}

export interface MarketFinanceDatasetSpec {
  id: string;
  name: string;
  coverage: string;
  provider: string;
  variables: string;
  period: string;
  usedFor: string;
  limitation: string;
  links: { label: string; url: string }[];
}

export interface DataSourceEntry {
  id: string;
  name: string;
  agency: string;
  phase: 'phase1' | 'phase2' | 'phase-market' | 'phase3-nasa' | 'phase3-partner' | 'phase3-regional';
  statusBadge: string;
  farmerBenefit: string;
  links: DataSourceLink[];
}

/**
 * 1. Exact Datasets Used by the Live Backend (backend/main.py & backend/data/climate.py)
 */
export const LIVE_BACKEND_DATASETS: LiveBackendDatasetSpec[] = [
  {
    id: 'nasa-power',
    name: 'NASA POWER (Always On)',
    modeBadge: 'Always On',
    provider:
      'NASA Langley Research Center POWER project (MERRA-2 reanalysis assimilating satellite & ground observations)',
    variables:
      'Rain PRECTOTCORR (mm/day), minimum temperature T2M_MIN (°C), root-zone soil wetness GWETROOT (0 dry to 1 saturated)',
    resolution: '~0.5° × 0.625° (~50–55 km) / daily',
    period: '1981 to near-present (last N complete years)',
    access: 'REST API, no API key required',
    usedFor:
      'Annual rain, driest year, heavy-rain days, frost days, soil-wetness climatology, autumn rain onset, bad-year replay, water-fit & erosion scores',
    limitation:
      'Coarse grid; reanalysis (not a direct field sensor); soil wetness is modelled.',
    links: [
      { label: 'API Docs', url: 'https://power.larc.nasa.gov/docs/services/api/' },
      { label: 'Methodology', url: 'https://power.larc.nasa.gov/docs/methodology/' },
      { label: 'NASA POWER Portal', url: 'https://power.larc.nasa.gov/' },
    ],
  },
  {
    id: 'smap-l4',
    name: 'SMAP L4 Soil Moisture',
    modeBadge: 'Optional · Earth Engine',
    provider: 'NASA, distributed by NSIDC DAAC (satellite observations assimilated into land model, L4)',
    variables: 'Root-zone soil moisture sm_rootzone, 0–100 cm (volume fraction, m³/m³)',
    resolution: '9 km native (11 km pixel in Earth Engine) / 3-hourly',
    period: 'From 2015-03-31 · Version 008 current (v007 superseded, stops 2025-06-27)',
    access: 'Earth Engine (NASA/SMAP/SPL4SMGP/008), project ID + login (free for research & education)',
    usedFor: 'Replaces POWER soil wetness in the water-fit score and the "Dry Soil" risk calendar row',
    limitation:
      'Modelled product, coarse grid; model-only periods during instrument outages (2019, 2022).',
    links: [
      {
        label: 'Earth Engine Page',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/NASA_SMAP_SPL4SMGP_008',
      },
      { label: 'NSIDC DOI', url: 'https://doi.org/10.5067/EVYDQ32FNWTH' },
    ],
  },
  {
    id: 'modis-ndvi',
    name: 'MODIS NDVI (MOD13Q1 v061)',
    modeBadge: 'Optional · Earth Engine',
    provider: 'NASA LP DAAC at USGS EROS (satellite vegetation index)',
    variables: 'NDVI (unitless, stored ×10,000, scaled ×0.0001, range approx -0.2 to 1.0)',
    resolution: '250 m / 16-day composite',
    period: 'From 2000-02-18',
    access: 'Earth Engine (MODIS/061/MOD13Q1)',
    usedFor: 'Bare-field months and the "Bare Field" row of the risk calendar',
    limitation: '250 m pixels can mix several fields; NDVI shows greenness, not crop health or crop type.',
    links: [
      {
        label: 'Earth Engine Page',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1',
      },
      { label: 'LP DAAC DOI', url: 'https://doi.org/10.5067/MODIS/MOD13Q1.061' },
    ],
  },
  {
    id: 'srtm-elevation',
    name: 'SRTM Elevation',
    modeBadge: 'Optional · Earth Engine',
    provider: 'NASA / NGA Shuttle Radar Mission, distributed by USGS',
    variables: 'Elevation (m); slope (degrees) derived via ee.Terrain.slope',
    resolution: '30 m / static',
    period: 'Single mission, February 2000',
    access: 'Earth Engine (USGS/SRTMGL1_003)',
    usedFor: 'Slope erosion multiplier in the soil-protection score',
    limitation:
      'Year 2000 snapshot; measures surface height (trees, buildings); 1 km average can hide field-scale slope.',
    links: [
      {
        label: 'Earth Engine Page',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003',
      },
    ],
  },
];

/**
 * 2. Non-Satellite Inputs (Transparently documented for farmers & reviewers)
 */
export const NON_SATELLITE_INPUTS: NonSatelliteInputSpec[] = [
  {
    input: 'Farmer Inputs',
    origin: 'Frontend forms: location, optional slope, priorities, scenario, custom rotation',
    usedFor: 'Priority weights and crop rotations compared',
    limitation: 'Only as accurate as farmer knowledge; missing values remain optional/explicit.',
  },
  {
    input: 'Crop Library (engine/crops.py)',
    origin: 'Team agronomic parameters: water need, nitrogen fixing, cover months, market',
    usedFor: 'Scoring how each crop responds to NASA climate & wetness conditions',
    limitation: 'Generic and illustrative until verified by a local agronomist or extension office.',
  },
  {
    input: 'Regional Market & Farm Finance Benchmarks',
    origin: 'Verified 2025-2026 official quotes (World Bank, USDA, EC/TESEO, ODC, ONICL, MinAg, CACP, AGRA) + editable local price overrides',
    usedFor: 'Comparing rotation net profit, fertilizer cash savings, break-even yields & subsidies',
    limitation: 'Regional reference averages; non-quoted local crops and cultivation costs are editable estimates.',
  },
];

/**
 * 2B. Verified 2025-2026 Agricultural Market, Input Cost & Subsidy Datasets
 */
export const MARKET_FINANCE_DATASETS: MarketFinanceDatasetSpec[] = [
  {
    id: 'world-bank-pink-sheet',
    name: 'World Bank Commodity Markets Pink Sheet',
    coverage: 'Global Benchmarks (42 Countries)',
    provider: 'World Bank Prospects Group',
    variables: 'DAP ($803.1/t), Urea ($407.5/t, Q2 peak $693.5/t), Soybeans ($515/t), Maize ($226.5/t), US HRW Wheat ($286/t)',
    period: 'Oct-Nov 2026',
    usedFor: 'Global fertilizer input pricing, export grain/oilseed anchors, and fertilizer cash-saving calculations',
    limitation: 'International FOB/spot benchmarks; local farmgate prices differ by transport, currency & subsidies.',
    links: [
      {
        label: 'Pink Sheet (Nov 2026 PDF)',
        url: 'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf',
      },
      {
        label: 'World Bank Commodity Markets',
        url: 'https://www.worldbank.org/en/research/commodity-markets',
      },
    ],
  },
  {
    id: 'usda-fas-nass-2026',
    name: 'USDA NASS Agricultural Prices & FAS GAIN Reports',
    coverage: 'USA, Tunisia, Kenya, Brazil & Argentina',
    provider: 'U.S. Department of Agriculture (NASS / FAS)',
    variables: 'US corn ($4.11-4.15/bu), soybeans ($10.20-10.60/bu), wheat ($4.90-5.12/bu), sorghum ($6.23/cwt), chickpeas ($31-33.30/cwt); Tunisia durum (1,300-1,400 TND/t) & barley (800-900 TND/t); Kenya wheat (KSh 52,778/t); Brazil ($229/t) & Argentina ($212/t) maize',
    period: 'Feb-May 2026 (MY 2025/26-2026/27)',
    usedFor: 'National farmgate grain/pulse reference prices, procurement floors & regional market outlooks',
    limitation: 'National/state monthly averages; individual buyer contracts vary by grade and harvest month.',
    links: [
      {
        label: 'USDA NASS Prices (Mar 2026)',
        url: 'https://esmis.nal.usda.gov/sites/default/release-files/795838/agpr0326.pdf',
      },
      {
        label: 'USDA FAS Tunisia Grain (TS2026-0004)',
        url: 'https://www.fas.usda.gov/data/gain-report/2026/04/Grain%20and%20Feed%20Annual_Tunis_Tunisia_TS2026-0004.pdf',
      },
      {
        label: 'USDA FAS World Grain (May 2026)',
        url: 'https://www.fas.usda.gov/sites/default/files/2026-05/grain.pdf',
      },
    ],
  },
  {
    id: 'eu-ec-teseo-2026',
    name: 'EU-27 Cereals Market Group & TESEO/CLAL Oilseeds',
    coverage: 'European Union (FR, DE, ES, IT, PL, RO, NL, PT, GR)',
    provider: 'European Commission DG AGRI / TESEO CLAL',
    variables: 'Milling wheat (€184-209/t), Italian durum (€263-275/t), FR maize (€188-215/t), rapeseed (€492-570/t), sunflower (€525.66/t), CAP Eco-Scheme rotation bonuses',
    period: '2026 (through Nov 2026)',
    usedFor: 'European cereal/oilseed crop pricing and EU CAP crop-diversification payment estimates',
    limitation: 'Wholesale port/regional reference quotations; CAP Eco-Scheme rates vary by member state.',
    links: [
      {
        label: 'EC Cereals Market PDF',
        url: 'https://circabc.europa.eu/sd/a/92653d37-7fff-40c1-8d5e-b6bb3625c04a/EU%20cereals%20market.pdf',
      },
      {
        label: 'TESEO EU Oilseeds',
        url: 'https://teseo.clal.it/en/?section=oilseeds-price-eu',
      },
    ],
  },
  {
    id: 'mena-asia-africa-procurement-2026',
    name: 'National Procurement & Floor Prices (ONICL, Egypt MinAg, India MSP, AGRA)',
    coverage: 'Morocco, Egypt, India & East/Southern Africa',
    provider: 'Morocco ONICL, Egypt Ministry of Agriculture, India CACP, AGRA',
    variables: 'Morocco soft wheat (258.8-270 MAD/q); Egypt wheat (EGP 2,500/ardeb) & subsidized urea (EGP 4,500/t); India 2026-27 MSPs (wheat ₹2,585/q, mustard ₹6,200/q, gram ₹5,650/q, soybean ₹5,328/q); Kenya NCPB maize (KSh 4,000/90kg) & Ethiopia wheat ($520/t)',
    period: '2025-Nov 2026',
    usedFor: 'Guaranteed state price floors, input subsidies, and farmgate comparison across MENA, South Asia & Africa',
    limitation: 'Official floor/wholesale prices; farmer eligibility for state procurement or subsidized bags depends on local quotas.',
    links: [
      {
        label: 'Egypt MinAg Briefing (Nov 2026)',
        url: 'https://dailynewsegypt.com/2026/11/10/egypts-wheat-output-reaches-11m-tonnes-agriculture-minister-tells-senate/',
      },
      {
        label: 'AGRA Food Security Monitor (2026)',
        url: 'https://agra.org/wp-content/uploads/2026/04/Food-Security-Monitor_March-2026_Final.pdf',
      },
      {
        label: 'India MSP 2026-27 Rates',
        url: 'https://www.global-agriculture.com/india-region/wheat-msp-raised-by-%E2%82%B9160-will-indian-farmers-be-satisfied/',
      },
    ],
  },
];

/**
 * 3. Exact Indicators Calculated From the Data
 */
export const CALCULATED_INDICATORS: CalculatedIndicatorSpec[] = [
  {
    indicator: 'Annual rainfall & Driest year',
    source: 'NASA POWER PRECTOTCORR',
    definition: 'Sum of daily rain per year; year with the lowest total rainfall.',
  },
  {
    indicator: 'Heavy-rain days per year',
    source: 'NASA POWER PRECTOTCORR',
    definition: 'Days with ≥ 20 mm rainfall, counted per month and averaged across complete years.',
  },
  {
    indicator: 'Frost days per year',
    source: 'NASA POWER T2M_MIN',
    definition: 'Days with minimum temperature < 0 °C, counted per month.',
  },
  {
    indicator: 'Soil wetness (monthly)',
    source: 'NASA POWER GWETROOT or SMAP L4',
    definition: 'Monthly mean root-zone soil wetness (0–1 scale or SMAP sm_rootzone).',
  },
  {
    indicator: 'Autumn rain onset',
    source: 'NASA POWER PRECTOTCORR',
    definition: 'First day on or after 1 September with 3-day cumulative rain ≥ 20 mm.',
  },
  {
    indicator: 'Risk calendar levels (Green / Yellow / Red)',
    source: 'POWER + SMAP + MODIS NDVI',
    definition:
      'Frost: yellow ≥ 0.2, red ≥ 1.0 days/yr · Heavy rain: yellow ≥ 0.3, red ≥ 1.0 days/yr · Dry soil: yellow ≤ 0.45, red ≤ 0.30 · Bare field (NDVI): yellow ≤ 0.35, red ≤ 0.25.',
  },
  {
    indicator: 'Rotation scores',
    source: 'Indicators + Crop Library + Weights',
    definition: 'Soil, Water, Erosion, and Income sub-scores weighted by farmer priorities.',
  },
];

/**
 * 4. Datasets Considered But NOT Used in Live Scoring (Pitch Transparency)
 */
export const NOT_USED_IN_LIVE_BACKEND: ConsideredNotUsedSpec[] = [
  {
    dataset: 'GPM IMERG (Rainfall)',
    reasonNotUsed: 'Optional cross-check of POWER rainfall; not required for live rotation scoring.',
    links: [
      {
        label: 'Earth Engine Page',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/NASA_GPM_L3_IMERG_V07',
      },
    ],
  },
  {
    dataset: 'ECOSTRESS, GRACE/GRACE-FO, GEDI',
    reasonNotUsed: 'Irregular coverage, too coarse for a single farm field, or built for forest canopy.',
    links: [
      { label: 'ECOSTRESS', url: 'https://ecostress.jpl.nasa.gov/' },
      { label: 'GEDI', url: 'https://gedi.umd.edu/' },
    ],
  },
  {
    dataset: 'Landsat, VIIRS, Sentinel-2',
    reasonNotUsed: 'Redundant with MODIS MOD13Q1 in v1; candidates for finer 10–30 m field detail later.',
    links: [
      { label: 'ESA Sentinel-2', url: 'https://sentiwiki.copernicus.eu/web/s2-mission' },
    ],
  },
  {
    dataset: 'FAO GAEZ',
    reasonNotUsed: 'Large integration effort while crop suitability assumptions remain generic.',
    links: [{ label: 'gaez.fao.org', url: 'https://gaez.fao.org/' }],
  },
  {
    dataset: 'SoilGrids (ISRIC)',
    reasonNotUsed: 'Included in the data-pipeline prototype only, not in live rotation scoring.',
    links: [
      { label: 'soilgrids.org', url: 'https://soilgrids.org/' },
      { label: 'REST Docs', url: 'https://rest.isric.org/soilgrids/v2.0/docs' },
    ],
  },
  {
    dataset: 'Meteomatics Weather API',
    reasonNotUsed: 'Commercial API (not NASA); used only in the Streamlit prototype tab.',
    links: [
      {
        label: 'Agricultural Parameters',
        url: 'https://www.meteomatics.com/en/api/available-parameters/agricultural-parameters/',
      },
    ],
  },
];

/**
 * Full Extended Reference Portal Directory (33+ Official Links)
 */
export const DATA_SOURCES_REGISTRY: DataSourceEntry[] = [
  {
    id: 'nasa-power',
    name: 'NASA POWER Agroclimatology API',
    agency: 'NASA Langley Research Center',
    phase: 'phase1',
    statusBadge: 'Live Active · Always On',
    farmerBenefit:
      'Always-on daily PRECTOTCORR rain, T2M_MIN frost tracking, and GWETROOT root-zone wetness (~50 km MERRA-2 reanalysis, 1981–present).',
    links: [
      { label: 'NASA POWER Portal', url: 'https://power.larc.nasa.gov/' },
      { label: 'API Docs', url: 'https://power.larc.nasa.gov/docs/services/api/' },
      { label: 'Methodology', url: 'https://power.larc.nasa.gov/docs/methodology/' },
    ],
  },
  {
    id: 'nasa-smap',
    name: 'NASA SMAP L4 Soil Moisture (v008)',
    agency: 'NASA / NSIDC DAAC',
    phase: 'phase2',
    statusBadge: 'Optional · Earth Engine',
    farmerBenefit:
      'sm_rootzone (0–100 cm, 9 km native / 11 km EE, 3-hourly) replaces POWER soil wetness in water-fit & dry-soil risk.',
    links: [
      {
        label: 'Earth Engine (SPL4SMGP/008)',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/NASA_SMAP_SPL4SMGP_008',
      },
      { label: 'NSIDC DOI', url: 'https://doi.org/10.5067/EVYDQ32FNWTH' },
    ],
  },
  {
    id: 'nasa-modis',
    name: 'MODIS NDVI (MOD13Q1 v061)',
    agency: 'NASA LP DAAC / USGS EROS',
    phase: 'phase2',
    statusBadge: 'Optional · Earth Engine',
    farmerBenefit:
      '250 m / 16-day greenness composite (NDVI ×0.0001) powering bare-field months & the Bare Field risk calendar row.',
    links: [
      {
        label: 'Earth Engine (MOD13Q1)',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/MODIS_061_MOD13Q1',
      },
      { label: 'LP DAAC DOI', url: 'https://doi.org/10.5067/MODIS/MOD13Q1.061' },
    ],
  },
  {
    id: 'nasa-srtm',
    name: 'SRTM 30m Elevation & Slope (GL1 v003)',
    agency: 'NASA / NGA / USGS',
    phase: 'phase2',
    statusBadge: 'Optional · Earth Engine',
    farmerBenefit:
      '30 m static Feb 2000 elevation & ee.Terrain.slope degrees driving the soil-protection erosion multiplier.',
    links: [
      {
        label: 'Earth Engine (SRTMGL1_003)',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/USGS_SRTMGL1_003',
      },
      { label: 'NASA SRTM Mission', url: 'https://www.earthdata.nasa.gov/sensors/srtm' },
    ],
  },
  {
    id: 'nasa-gpm',
    name: 'NASA GPM / IMERG Precipitation',
    agency: 'NASA Goddard',
    phase: 'phase3-nasa',
    statusBadge: 'Considered · Not in Live Scoring',
    farmerBenefit: 'Optional global rainfall cross-check against POWER PRECTOTCORR.',
    links: [
      {
        label: 'Earth Engine IMERG v07',
        url: 'https://developers.google.com/earth-engine/datasets/catalog/NASA_GPM_L3_IMERG_V07',
      },
      { label: 'NASA GPM Mission', url: 'https://gpm.nasa.gov/data/imerg' },
    ],
  },
  {
    id: 'nasa-worldview',
    name: 'NASA Worldview & GIBS',
    agency: 'NASA EOSDIS',
    phase: 'phase3-nasa',
    statusBadge: 'Reference Portal',
    farmerBenefit: 'Interactive global satellite imagery explorer for visual inspection.',
    links: [{ label: 'NASA Worldview', url: 'https://worldview.earthdata.nasa.gov/' }],
  },
  {
    id: 'nasa-ecostress',
    name: 'NASA ECOSTRESS & GEDI',
    agency: 'NASA JPL / UMD',
    phase: 'phase3-nasa',
    statusBadge: 'Considered · Not in Live Scoring',
    farmerBenefit: 'Canopy temperature and forest structure portals (too irregular or forest-focused for field rotation v1).',
    links: [
      { label: 'ECOSTRESS', url: 'https://ecostress.jpl.nasa.gov/' },
      { label: 'GEDI Biomass', url: 'https://gedi.umd.edu/' },
    ],
  },
  {
    id: 'openet',
    name: 'OpenET Evapotranspiration',
    agency: 'NASA / USGS / EDF',
    phase: 'phase3-nasa',
    statusBadge: 'Reference Portal',
    farmerBenefit: 'Field-scale crop water consumption tracking.',
    links: [{ label: 'OpenET Portal', url: 'https://openetdata.org/' }],
  },
  {
    id: 'fao-gaez',
    name: 'FAO GAEZ & ISRIC SoilGrids',
    agency: 'UN FAO / ISRIC',
    phase: 'phase3-nasa',
    statusBadge: 'Prototype / Future Reference',
    farmerBenefit: 'Global agro-ecological zones and soil grids explored in the prototype pipeline.',
    links: [
      { label: 'FAO GAEZ', url: 'https://gaez.fao.org/' },
      { label: 'ISRIC SoilGrids', url: 'https://soilgrids.org/' },
      { label: 'SoilGrids REST Docs', url: 'https://rest.isric.org/soilgrids/v2.0/docs' },
    ],
  },
  {
    id: 'esa-sentinel2',
    name: 'ESA Copernicus Sentinel-2 & Browser',
    agency: 'European Space Agency',
    phase: 'phase3-partner',
    statusBadge: 'Future Fine-Scale Candidate',
    farmerBenefit: '10 m optical crop greenness candidate for future finer field detail beyond 250 m MODIS.',
    links: [
      { label: 'Sentinel-2 Mission', url: 'https://sentiwiki.copernicus.eu/web/s2-mission' },
      { label: 'Copernicus Browser', url: 'https://browser.dataspace.copernicus.eu/' },
    ],
  },
  {
    id: 'ecmwf-era5',
    name: 'ECMWF ERA5 & Meteomatics Prototype',
    agency: 'ECMWF / Meteomatics',
    phase: 'phase3-partner',
    statusBadge: 'Reference / Prototype Only',
    farmerBenefit: 'Global reanalysis climate reference and commercial prototype comparison.',
    links: [
      { label: 'Copernicus ERA5', url: 'https://cds.climate.copernicus.eu/' },
      {
        label: 'Meteomatics Ag Params',
        url: 'https://www.meteomatics.com/en/api/available-parameters/agricultural-parameters/',
      },
    ],
  },
  {
    id: 'usda-soils',
    name: 'USDA Web Soil Survey & SSURGO',
    agency: 'USDA NRCS',
    phase: 'phase3-regional',
    statusBadge: 'Regional Reference',
    farmerBenefit: 'Authoritative U.S. soil texture, drainage, and productivity profiles.',
    links: [
      { label: 'Web Soil Survey', url: 'https://websoilsurvey.nrcs.usda.gov/' },
      { label: 'USDA Ag Data Commons', url: 'https://data.nal.usda.gov/' },
    ],
  },
  {
    id: 'usda-cropscape',
    name: 'USDA CropScape (CDL), NAIP & NLCD',
    agency: 'USDA NASS / USGS',
    phase: 'phase3-regional',
    statusBadge: 'Regional Reference',
    farmerBenefit: 'Historical crop land cover maps and high-res agricultural imagery.',
    links: [
      { label: 'CropScape CDL', url: 'https://nassgeodata.gmu.edu/CropScape/' },
      { label: 'USGS NLCD', url: 'https://www.mrlc.gov/' },
    ],
  },
  {
    id: 'prism-usgs-water',
    name: 'PRISM Climate, CoCoRaHS & USGS NWIS',
    agency: 'OSU / USGS',
    phase: 'phase3-regional',
    statusBadge: 'Regional Reference',
    farmerBenefit: 'Station rainfall, local climate normals, and streamflow monitoring.',
    links: [
      { label: 'PRISM Climate', url: 'https://prism.oregonstate.edu/' },
      { label: 'CoCoRaHS', url: 'https://www.cocorahs.org/' },
      { label: 'USGS Water (NWIS)', url: 'https://waterdata.usgs.gov/nwis' },
    ],
  },
  {
    id: 'world-bank-markets-portal',
    name: 'World Bank Commodity Markets Pink Sheet (2026)',
    agency: 'World Bank Prospects Group',
    phase: 'phase-market',
    statusBadge: 'Active · Market & Finance',
    farmerBenefit:
      'Monthly global fertilizer (DAP, Urea) and grain/oilseed (Soybeans, Maize, Wheat) benchmarks.',
    links: [
      {
        label: 'Nov 2026 Pink Sheet PDF',
        url: 'https://thedocs.worldbank.org/en/doc/74e8be41ceb20fa0da750cda2f6b9e4e-0050012026/related/CMO-Pink-Sheet-November-2026.pdf',
      },
      {
        label: 'Commodity Markets Portal',
        url: 'https://www.worldbank.org/en/research/commodity-markets',
      },
    ],
  },
  {
    id: 'eu-teseo-markets-portal',
    name: 'EC Cereals Market Group & TESEO EU Oilseeds (2026)',
    agency: 'European Commission / TESEO CLAL',
    phase: 'phase-market',
    statusBadge: 'Active · Market & Finance',
    farmerBenefit:
      'EU-27 wheat, durum, maize, rapeseed, and sunflower wholesale prices plus CAP Eco-Schemes.',
    links: [
      {
        label: 'EC Cereals PDF',
        url: 'https://circabc.europa.eu/sd/a/92653d37-7fff-40c1-8d5e-b6bb3625c04a/EU%20cereals%20market.pdf',
      },
      {
        label: 'TESEO Oilseeds',
        url: 'https://teseo.clal.it/en/?section=oilseeds-price-eu',
      },
    ],
  },
  {
    id: 'regional-agencies-markets-portal',
    name: 'USDA FAS/NASS, ODC, ONICL, Egypt MinAg, India MSP & AGRA (2026)',
    agency: 'National Agricultural Ministries & USDA',
    phase: 'phase-market',
    statusBadge: 'Active · Market & Finance',
    farmerBenefit:
      'Regional 2025-2026 farmgate prices, state grain procurement floors, and fertilizer subsidies.',
    links: [
      {
        label: 'USDA NASS Prices (2026)',
        url: 'https://esmis.nal.usda.gov/sites/default/release-files/795838/agpr0326.pdf',
      },
      {
        label: 'Tunisia GAIN (TS2026-0004)',
        url: 'https://www.fas.usda.gov/data/gain-report/2026/04/Grain%20and%20Feed%20Annual_Tunis_Tunisia_TS2026-0004.pdf',
      },
      {
        label: 'AGRA Monitor (2026)',
        url: 'https://agra.org/wp-content/uploads/2026/04/Food-Security-Monitor_March-2026_Final.pdf',
      },
    ],
  },
  {
    id: 'usda-markets',
    name: 'USDA AMS Market News, QuickStats & LANDFIRE',
    agency: 'USDA / USFS',
    phase: 'phase3-regional',
    statusBadge: 'Regional Reference',
    farmerBenefit: 'Crop prices, national yield benchmarks, and vegetation disturbance datasets.',
    links: [
      { label: 'AMS Market News', url: 'https://www.ams.usda.gov/market-news' },
      { label: 'NASS QuickStats', url: 'https://quickstats.nass.usda.gov/' },
      { label: 'USFS LANDFIRE', url: 'https://landfire.gov/' },
    ],
  },
];
