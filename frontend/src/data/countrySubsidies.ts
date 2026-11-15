export interface CountrySubsidyProgram {
  title: string;
  agency: string;
  benefitSummary: string;
  /** Estimated rotation / eco-scheme cash bonus per hectare in USD (0 if price-floor or credit only) */
  estimatedUsdPerHa: number;
  category: 'Price Floor' | 'Rotation Bonus' | 'Input Subsidy' | 'Irrigation Grant';
  /** Verified official ministry or national agency web portal */
  officialUrl: string;
}

/**
 * Country-specific agricultural subsidies, price-floor guarantees, input vouchers,
 * and irrigation grants covering ALL 42 countries supported by Tadawol.
 */
export const COUNTRY_SUBSIDY_PROGRAMS: Record<string, CountrySubsidyProgram[]> = {
  TN: [
    {
      title: 'Office des Cereales Guaranteed Farmgate Price',
      agency: 'Office des Cereales (Tunisia)',
      benefitSummary:
        'Guaranteed state collection floor price for durum wheat, soft wheat, and barley delivered to official collection centers.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://www.oc.com.tn/fr/',
    },
    {
      title: 'Water-Saving Drip Irrigation Grant (APIA / FOSDAP)',
      agency: 'APIA & Ministry of Agriculture (MARHP)',
      benefitSummary:
        'Up to 40-60% capital grant on localized drip irrigation and water-saving farm modernization equipment.',
      estimatedUsdPerHa: 45,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.apia.com.tn/',
    },
    {
      title: 'Certified Cereal & Legume Seed Support',
      agency: 'Ministry of Agriculture (MARHP Tunisia)',
      benefitSummary:
        'Subsidized certified drought-tolerant durum, fava bean, and chickpea seed distribution through regional CRDA offices.',
      estimatedUsdPerHa: 35,
      category: 'Input Subsidy',
      officialUrl: 'http://www.agriculture.tn/',
    },
  ],
  MA: [
    {
      title: 'ONICL Domestic Wheat Reference Price & Storage Bonus',
      agency: 'ONICL Morocco',
      benefitSummary:
        'Official domestic soft wheat reference marketing window with storage premiums for accredited cooperatives and producers.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://www.onicl.org.ma/',
    },
    {
      title: 'Generation Green Drip Irrigation & Direct-Seed Grant (FDA)',
      agency: 'Ministry of Agriculture (MAPMDREF)',
      benefitSummary:
        'Agricultural Development Fund (FDA) grants covering up to 80% of drip irrigation upgrades and zero-till seeders.',
      estimatedUsdPerHa: 55,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.agriculture.gov.ma/',
    },
  ],
  DZ: [
    {
      title: 'OAIC Guaranteed Cereal & Pulse Procurement Prices',
      agency: 'OAIC Algeria',
      benefitSummary:
        'Fixed state buy-back prices for durum wheat, bread wheat, barley, lentils, and chickpeas delivered to CCLS cooperatives.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://madr.gov.dz/',
    },
    {
      title: 'FNDIA Irrigation & Certified Seed Subsidy',
      agency: 'Ministry of Agriculture & Rural Development (MADR)',
      benefitSummary:
        'National agricultural investment fund support covering irrigation kits, certified cereal seeds, and fertilizer price rebates.',
      estimatedUsdPerHa: 48,
      category: 'Input Subsidy',
      officialUrl: 'https://madr.gov.dz/',
    },
  ],
  EG: [
    {
      title: '2026 State Wheat Procurement Guarantee',
      agency: 'Ministry of Agriculture (MALR) & Supply',
      benefitSummary:
        'Official seasonal procurement price paid per ardeb (150 kg) at state silos with fast cash settlement.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://moa.gov.eg/',
    },
    {
      title: 'Cooperative Subsidized Fertilizer & Modern Irrigation Support',
      agency: 'Agricultural Bank of Egypt & MALR',
      benefitSummary:
        'Smart-card subsidized nitrogen fertilizer quotas plus low-interest financing for drip and solar irrigation upgrades.',
      estimatedUsdPerHa: 60,
      category: 'Input Subsidy',
      officialUrl: 'https://moa.gov.eg/',
    },
  ],
  FR: [
    {
      title: 'EU CAP Eco-Scheme: Crop Diversification & Soil Cover',
      agency: 'Ministere de l Agriculture (TelePAC)',
      benefitSummary:
        'Annual per-hectare eco-scheme payment for multi-family rotations, legumes, and winter soil cover under France CAP 2023-2027.',
      estimatedUsdPerHa: 95,
      category: 'Rotation Bonus',
      officialUrl: 'https://agriculture.gouv.fr/la-pac-2023-2027',
    },
    {
      title: 'Coupled Legume & Vegetable Protein Support',
      agency: 'ASP / European Commission CAP',
      benefitSummary:
        'Extra coupled income aid per hectare for nitrogen-fixing fava beans, peas, soybeans, and alfalfa.',
      estimatedUsdPerHa: 110,
      category: 'Rotation Bonus',
      officialUrl: 'https://agriculture.ec.europa.eu/common-agricultural-policy_en',
    },
  ],
  ES: [
    {
      title: 'PAC Spain Eco-Regimen: Crop Rotation with Legumes',
      agency: 'MAPA & FEGA (Spain)',
      benefitSummary:
        'Direct eco-regime payment for annual crop rotation including soil-improving legumes and direct-seeding conservation.',
      estimatedUsdPerHa: 88,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.fega.gob.es/',
    },
    {
      title: 'Coupled Protein Crops & Irrigation Modernization Aid',
      agency: 'Ministerio de Agricultura (MAPA)',
      benefitSummary:
        'Coupled support for protein crops plus water-efficiency modernization grants in semi-arid river basins.',
      estimatedUsdPerHa: 96,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.mapa.gob.es/',
    },
  ],
  IT: [
    {
      title: 'PAC Italia Eco-Schema 4: Extensive Forage & Rotation Systems',
      agency: 'MASAF & AGEA (Italy)',
      benefitSummary:
        'Per-hectare bonus for rotating cereals with nitrogen-fixing legumes or soil-improving crops without synthetic pesticides.',
      estimatedUsdPerHa: 105,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.politicheagricole.it/',
    },
    {
      title: 'Coupled Durum Wheat & Protein Legume Support',
      agency: 'AGEA / EU CAP Italy',
      benefitSummary:
        'Coupled payments supporting quality durum wheat and legume protein acres across Italian regions.',
      estimatedUsdPerHa: 85,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.agea.gov.it/',
    },
  ],
  DE: [
    {
      title: 'GAP Oko-Regelung 2: Diverse Crop Rotation with Legumes',
      agency: 'BMEL Germany (CAP 2023-2027)',
      benefitSummary:
        'Eco-scheme payment for farms growing at least 5 main crops per year with at least 10% legumes.',
      estimatedUsdPerHa: 92,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.bmel.de/',
    },
    {
      title: 'Federal Agri-Environment & Climate Measures (AUKM)',
      agency: 'BMEL & State Ministries',
      benefitSummary:
        'Multi-year state payments for cover crops, reduced tillage, and nitrogen reduction practices.',
      estimatedUsdPerHa: 98,
      category: 'Rotation Bonus',
      officialUrl: 'https://agriculture.ec.europa.eu/common-agricultural-policy_en',
    },
  ],
  GB: [
    {
      title: 'Sustainable Farming Incentive (SFI): Legume Fallow & Soil Health',
      agency: 'DEFRA & Rural Payments Agency (UK)',
      benefitSummary:
        'Per-hectare annual payments for multi-species winter cover crops, legume fallow, and companion cropping without insecticides.',
      estimatedUsdPerHa: 120,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.gov.uk/guidance/sfi-actions-for-farmland',
    },
    {
      title: 'Farming Equipment and Technology Fund (FETF)',
      agency: 'DEFRA (UK)',
      benefitSummary:
        'Capital grants toward precision slurry applicators, direct drills, and water-efficiency irrigation hardware.',
      estimatedUsdPerHa: 55,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.gov.uk/government/organisations/department-for-environment-food-rural-affairs',
    },
  ],
  NL: [
    {
      title: 'GLB Eco-Regeling: Nitrogen-Fixing Crops & Green Cover',
      agency: 'RVO (Netherlands Enterprise Agency)',
      benefitSummary:
        'Bronze, Silver, or Gold per-hectare eco-points payments for diverse rotations, legumes, and catch crops.',
      estimatedUsdPerHa: 115,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.rvo.nl/onderwerpen/glb',
    },
    {
      title: 'Sustainable Water & Precision Farming Investment Grant',
      agency: 'RVO / Ministry of LVVN',
      benefitSummary:
        'Co-financing for precision nutrient management, drip irrigation, and soil moisture telemetry.',
      estimatedUsdPerHa: 60,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.rvo.nl/',
    },
  ],
  PT: [
    {
      title: 'PEPAC Portugal Eco-Regime: Conservation & Soil Diversity',
      agency: 'IFAP & Ministry of Agriculture (Portugal)',
      benefitSummary:
        'Annual eco-scheme payments for crop rotation, no-till sowing, and winter soil cover in Mediterranean zones.',
      estimatedUsdPerHa: 85,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.ifap.pt/',
    },
    {
      title: 'Efficient Irrigation & Protein Crop Support',
      agency: 'DGADR / PEPAC Portugal',
      benefitSummary:
        'Grants for water-saving drip systems and coupled support for dryland and irrigated legumes.',
      estimatedUsdPerHa: 75,
      category: 'Irrigation Grant',
      officialUrl: 'https://agriculture.ec.europa.eu/common-agricultural-policy_en',
    },
  ],
  GR: [
    {
      title: 'CAP Greece Eco-Schemes: Climate-Resilient Crop Diversification',
      agency: 'OPEKEPE & Ministry of Rural Development',
      benefitSummary:
        'Direct per-hectare incentives for rotating winter cereals with drought-hardy legumes and soil-improving cover crops.',
      estimatedUsdPerHa: 90,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.opekepe.gr/',
    },
    {
      title: 'Coupled Durum Wheat, Legumes & Irrigation Upgrade Grants',
      agency: 'MinAgric Greece',
      benefitSummary:
        'Coupled payments for certified durum wheat and edible pulses plus Rural Development drip irrigation grants.',
      estimatedUsdPerHa: 82,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.minagric.gr/',
    },
  ],
  TR: [
    {
      title: 'Diesel, Fertilizer & Certified Seed Direct Acreage Support',
      agency: 'Ministry of Agriculture and Forestry (Tarimorman)',
      benefitSummary:
        'Per-decare national production planning support covering fuel, fertilizer, and certified seed for planned basin crops.',
      estimatedUsdPerHa: 65,
      category: 'Input Subsidy',
      officialUrl: 'https://www.tarimorman.gov.tr/',
    },
    {
      title: 'TMO Grain Intervention Price & Pressurized Irrigation Grant',
      agency: 'Turkish Grain Board (TMO) & Tarimorman',
      benefitSummary:
        'Annual grain procurement floor prices plus 50% rural development grant for drip and sprinkler irrigation.',
      estimatedUsdPerHa: 50,
      category: 'Price Floor',
      officialUrl: 'https://www.tmo.gov.tr/',
    },
  ],
  PL: [
    {
      title: 'ARiMR Eco-Scheme: Diversified Crop Structure & Carbon Farming',
      agency: 'ARiMR (Agency for Restructuring & Modernisation)',
      benefitSummary:
        'Point-based eco-scheme payments for multi-crop rotations, catch crops, and straw incorporation.',
      estimatedUsdPerHa: 86,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.gov.pl/web/arimr',
    },
    {
      title: 'Coupled Legume Grain & Fodder Protein Aid',
      agency: 'Ministry of Agriculture (MRiRW Poland)',
      benefitSummary:
        'Dedicated per-hectare coupled aid for soybeans, lupins, field peas, and faba beans.',
      estimatedUsdPerHa: 92,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.gov.pl/web/rolnictwo',
    },
  ],
  UA: [
    {
      title: 'State Agrarian Registry (DAR) Per-Hectare & Credit Support',
      agency: 'Ministry of Agrarian Policy (DAR Ukraine)',
      benefitSummary:
        '5-7-9% affordable seasonal working-capital loans and per-hectare small/medium grower support via the State Agrarian Registry.',
      estimatedUsdPerHa: 45,
      category: 'Input Subsidy',
      officialUrl: 'https://www.dar.gov.ua/',
    },
    {
      title: 'Irrigation Restoration & Agricultural Equipment Compensation',
      agency: 'Ministry of Agrarian Policy & Food of Ukraine',
      benefitSummary:
        '25% compensation on domestic agricultural machinery and grants for restoring irrigation infrastructure.',
      estimatedUsdPerHa: 35,
      category: 'Irrigation Grant',
      officialUrl: 'https://minagro.gov.ua/',
    },
  ],
  RO: [
    {
      title: 'APIA Eco-Scheme PD-04: Soil-Friendly Rotation & Winter Cover',
      agency: 'APIA Romania (PS PAC 2023-2027)',
      benefitSummary:
        'Annual eco-scheme payment for diversified arable rotations with at least 10% nitrogen-fixing crops and winter cover.',
      estimatedUsdPerHa: 80,
      category: 'Rotation Bonus',
      officialUrl: 'https://apia.org.ro/',
    },
    {
      title: 'Coupled Soybean, Alfalfa & Irrigation Energy Subsidy',
      agency: 'MADR Romania',
      benefitSummary:
        'Coupled income support for protein legumes plus up to 50% reimbursement of irrigation electricity costs.',
      estimatedUsdPerHa: 88,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.madr.ro/',
    },
  ],
  US: [
    {
      title: 'USDA EQIP & CSP Cover Crop / Conservation Rotation Incentives',
      agency: 'USDA NRCS',
      benefitSummary:
        'Direct conservation cost-share payments for multi-species cover crops, no-till, and diversified crop rotations.',
      estimatedUsdPerHa: 75,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives',
    },
    {
      title: 'ARC / PLC & Federal Crop Insurance Premium Subsidy',
      agency: 'USDA Farm Service Agency (FSA)',
      benefitSummary:
        'Revenue and price-loss safety nets alongside 50-65% federal crop insurance premium support.',
      estimatedUsdPerHa: 45,
      category: 'Price Floor',
      officialUrl: 'https://www.fsa.usda.gov/',
    },
  ],
  CA: [
    {
      title: 'On-Farm Climate Action Fund (OFCAF): Nitrogen & Cover Cropping',
      agency: 'Agriculture and Agri-Food Canada (AAFC)',
      benefitSummary:
        'Cost-share funding for 4R nitrogen management, cover crops, and legume rotational grazing practices.',
      estimatedUsdPerHa: 65,
      category: 'Rotation Bonus',
      officialUrl: 'https://agriculture.canada.ca/en/programs/agricultural-climate-solutions-farm-climate-action-fund',
    },
    {
      title: 'AgriStability & AgriInsurance Margin Protection',
      agency: 'AAFC & Provincial Crop Insurance',
      benefitSummary:
        'Whole-farm margin protection and subsidized multi-peril crop insurance against weather and price drops.',
      estimatedUsdPerHa: 40,
      category: 'Price Floor',
      officialUrl: 'https://agriculture.canada.ca/en/programs',
    },
  ],
  MX: [
    {
      title: 'Produccion para el Bienestar & Fertilizantes para el Bienestar',
      agency: 'SADER Mexico',
      benefitSummary:
        'Direct annual acreage cash support and free regional fertilizer packages for small and medium grain & bean growers.',
      estimatedUsdPerHa: 55,
      category: 'Input Subsidy',
      officialUrl: 'https://www.gob.mx/agricultura',
    },
    {
      title: 'SEGALMEX Guaranteed Prices for Maize, Wheat & Beans',
      agency: 'SEGALMEX / Alimentacion para el Bienestar',
      benefitSummary:
        'Official reference purchase prices for staple white corn, bread wheat, and dry beans.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://www.gob.mx/segalmex',
    },
  ],
  BR: [
    {
      title: 'Plano Safra & RenovAgro (ABC+) Low-Carbon Rotation Credit',
      agency: 'MAPA & BNDES (Brazil)',
      benefitSummary:
        'Preferential rural credit interest rates for no-till rotations, biological nitrogen fixation, and crop-livestock integration.',
      estimatedUsdPerHa: 42,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.gov.br/agricultura/pt-br/assuntos/politica-agricola/plano-safra',
    },
    {
      title: 'CONAB Minimum Price Guarantee Policy (PGPM)',
      agency: 'CONAB Brazil',
      benefitSummary:
        'Official seasonal minimum price support floor for corn, wheat, soybeans, and staple pulses.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://www.conab.gov.br/',
    },
  ],
  AR: [
    {
      title: 'Regional Agricultural Financing & Conservation Soil Programs',
      agency: 'Secretaria de Agricultura (SAGyP Argentina)',
      benefitSummary:
        'Preferential provincial seed/input financing lines and technical support for sustainable double-crop rotations.',
      estimatedUsdPerHa: 28,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.argentina.gob.ar/agricultura',
    },
    {
      title: 'INTA Precision Agronomy & Drought-Resilient Seed Access',
      agency: 'INTA Argentina',
      benefitSummary:
        'Public research guidance, climate forecasting, and regional cultivar trials optimizing wheat-soybean-maize rotations.',
      estimatedUsdPerHa: 15,
      category: 'Input Subsidy',
      officialUrl: 'https://www.argentina.gob.ar/inta',
    },
  ],
  CO: [
    {
      title: 'FINAGRO Subsidized Rural Credit (LEC) & Crop Insurance (ISA)',
      agency: 'FINAGRO & MinAgricultura Colombia',
      benefitSummary:
        'Interest-rate subsidized credit lines for crop diversification plus up to 70% agricultural insurance premium subsidies.',
      estimatedUsdPerHa: 45,
      category: 'Input Subsidy',
      officialUrl: 'https://www.finagro.com.co/',
    },
    {
      title: 'FAIA Input Cost Support Fund',
      agency: 'Ministerio de Agricultura y Desarrollo Rural',
      benefitSummary:
        'Targeted fertilizer and certified seed rebates for small and medium food-crop producers.',
      estimatedUsdPerHa: 35,
      category: 'Input Subsidy',
      officialUrl: 'https://www.minagricultura.gov.co/',
    },
  ],
  PE: [
    {
      title: 'Agroideas & AGROPERU Preferential Seasonal Credit',
      agency: 'MIDAGRI Peru',
      benefitSummary:
        'Low-interest working capital loans (3.5% APR) and co-financing grants for irrigation and crop modernization.',
      estimatedUsdPerHa: 40,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.gob.pe/midagri',
    },
    {
      title: 'Seguro Agricola Catastrofico (SAC)',
      agency: 'MIDAGRI Peru',
      benefitSummary:
        'State-funded catastrophic weather crop insurance compensating growers for drought, frost, or flood losses.',
      estimatedUsdPerHa: 22,
      category: 'Price Floor',
      officialUrl: 'https://www.gob.pe/midagri',
    },
  ],
  CL: [
    {
      title: 'CNR Irrigation Law Grants (Ley de Riego)',
      agency: 'Comision Nacional de Riego (CNR Chile)',
      benefitSummary:
        'Competitive state subsidies covering up to 70-90% of drip irrigation, water storage, and solar pumping projects.',
      estimatedUsdPerHa: 65,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.cnr.gob.cl/',
    },
    {
      title: 'INDAP SIRSD-S Degraded Soil Recovery & Crop Insurance',
      agency: 'INDAP / MinAgri Chile',
      benefitSummary:
        'Soil fertility restoration bonuses (organic matter, legumes, lime) plus Agroseguros climate insurance subsidies.',
      estimatedUsdPerHa: 48,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.indap.gob.cl/',
    },
  ],
  IN: [
    {
      title: 'Government Minimum Support Price (MSP 2026-27)',
      agency: 'CACP & Ministry of Agriculture (India)',
      benefitSummary:
        'Guaranteed procurement floor prices for wheat, paddy rice, pulses (chana, lentil), mustard, and oilseeds.',
      estimatedUsdPerHa: 0,
      category: 'Price Floor',
      officialUrl: 'https://agricoop.gov.in/',
    },
    {
      title: 'PM-KISAN Direct Income Support & Nutrient Fertilizer Subsidy',
      agency: 'Government of India (PM-KISAN)',
      benefitSummary:
        'Direct annual farmer transfers plus heavily subsidized Urea/DAP retail pricing and PMKSY micro-irrigation grants.',
      estimatedUsdPerHa: 72,
      category: 'Input Subsidy',
      officialUrl: 'https://pmkisan.gov.in/',
    },
  ],
  PK: [
    {
      title: 'Kissan Card Subsidized Seed & Fertilizer Program',
      agency: 'Ministry of National Food Security & Provincial Agri Dept',
      benefitSummary:
        'Interest-free seasonal input loans and direct digital vouchers for certified wheat, canola, and pulse seeds.',
      estimatedUsdPerHa: 45,
      category: 'Input Subsidy',
      officialUrl: 'https://mnfsr.gov.pk/',
    },
    {
      title: 'Solar & High-Efficiency Irrigation Scheme',
      agency: 'Provincial Agriculture Departments (Pakistan)',
      benefitSummary:
        'Up to 60% subsidy on drip/sprinkler irrigation and solar tube-well conversion for water-stressed farms.',
      estimatedUsdPerHa: 40,
      category: 'Irrigation Grant',
      officialUrl: 'https://agripunjab.gov.pk/',
    },
  ],
  CN: [
    {
      title: 'Arable Land Fertility Protection & Grain-Legume Rotation Subsidy',
      agency: 'Ministry of Agriculture and Rural Affairs (MARA China)',
      benefitSummary:
        'Direct per-mu subsidies promoting maize-soybean strip intercropping, soil organic matter improvement, and wheat minimums.',
      estimatedUsdPerHa: 85,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.moa.gov.cn/',
    },
    {
      title: 'High-Standard Farmland & Agricultural Machinery Subsidy',
      agency: 'MARA China',
      benefitSummary:
        'Capital subsidies for precision planters, water-saving drip systems, and full-cost grain crop insurance.',
      estimatedUsdPerHa: 55,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.moa.gov.cn/',
    },
  ],
  JP: [
    {
      title: 'Direct Payment for Upland Crops & Environmentally Friendly Farming',
      agency: 'MAFF Japan',
      benefitSummary:
        'Per-hectare incentives for wheat, soybeans, and organic/reduced-fertilizer farming reducing chemical inputs by 50%.',
      estimatedUsdPerHa: 145,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.maff.go.jp/e/',
    },
    {
      title: 'Smart Agriculture & Revenue Insurance Safety Net',
      agency: 'MAFF & NOSAI Japan',
      benefitSummary:
        'Subsidized whole-farm revenue insurance protecting against yield or market price declines.',
      estimatedUsdPerHa: 70,
      category: 'Price Floor',
      officialUrl: 'https://www.maff.go.jp/e/',
    },
  ],
  VN: [
    {
      title: 'Irrigation Fee Exemption & Low-Carbon Rice/Crop Program',
      agency: 'MARD Vietnam',
      benefitSummary:
        'Full public irrigation fee waivers plus technical and input grants for low-emission rice-legume/maize crop rotation.',
      estimatedUsdPerHa: 50,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.mard.gov.vn/en/',
    },
    {
      title: 'Preferential Green Agricultural Credit & Seed Support',
      agency: 'Agribank & MARD Vietnam',
      benefitSummary:
        'Reduced-rate seasonal financing and climate-tolerant seed subsidies across Delta and Highland regions.',
      estimatedUsdPerHa: 32,
      category: 'Input Subsidy',
      officialUrl: 'https://www.mard.gov.vn/en/',
    },
  ],
  ID: [
    {
      title: 'Pupuk Bersubsidi (Subsidized Urea & NPK Fertilizer Allocation)',
      agency: 'Ministry of Agriculture (Kementan Indonesia)',
      benefitSummary:
        'Substantially discounted Urea and NPK fertilizer allocations for registered food-crop farmers via e-RDKK.',
      estimatedUsdPerHa: 65,
      category: 'Input Subsidy',
      officialUrl: 'https://pertanian.go.id/',
    },
    {
      title: 'KUR Micro Agricultural Credit & BULOG Floor Prices',
      agency: 'Kementan & BULOG Indonesia',
      benefitSummary:
        '6% subsidized working capital loans plus government reference purchasing prices for paddy rice, corn, and soybeans.',
      estimatedUsdPerHa: 25,
      category: 'Price Floor',
      officialUrl: 'https://www.bulog.co.id/',
    },
  ],
  TH: [
    {
      title: 'BAAC Low-Interest Crop Credit & Production Cost Support',
      agency: 'Ministry of Agriculture (MOAC) & BAAC Thailand',
      benefitSummary:
        'Preferential seasonal loans, crop insurance subsidies, and farm-input cost relief for grain and upland crop growers.',
      estimatedUsdPerHa: 48,
      category: 'Input Subsidy',
      officialUrl: 'https://www.moac.go.th/',
    },
    {
      title: 'Smart Water Management & Crop Diversification Grant',
      agency: 'Department of Agricultural Extension (DOAE Thailand)',
      benefitSummary:
        'Technical grants supporting soil-improving legume and vegetable rotations after main-season rice.',
      estimatedUsdPerHa: 35,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.doae.go.th/',
    },
  ],
  AU: [
    {
      title: 'Future Drought Fund & Carbon Farming Outreach Grants',
      agency: 'DAFF Australia',
      benefitSummary:
        'Regional drought resilience grants, soil carbon measurement rebates, and climate-smart rotation extension funding.',
      estimatedUsdPerHa: 42,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.agriculture.gov.au/agriculture-land/farm-food-drought/drought/future-drought-fund',
    },
    {
      title: 'RIC Concessional Farm Investment Loans & Tax Incentives',
      agency: 'Regional Investment Corporation (Australia)',
      benefitSummary:
        'Concessional drought/water infrastructure loans plus instant tax write-offs for fodder storage and irrigation upgrades.',
      estimatedUsdPerHa: 30,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.ric.gov.au/',
    },
  ],
  NZ: [
    {
      title: 'Sustainable Food and Fibre Futures (SFF Futures) Co-Funding',
      agency: 'Ministry for Primary Industries (MPI New Zealand)',
      benefitSummary:
        'Co-investment grants for regenerative soil health, precision nitrogen reduction, and resilient forage/arable rotations.',
      estimatedUsdPerHa: 45,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.mpi.govt.nz/funding-rural-support/sustainable-food-and-fibre-futures/',
    },
    {
      title: 'Catchment Water-Efficiency & Climate Resilience Support',
      agency: 'MPI New Zealand',
      benefitSummary:
        'Advisory and capital support for water-efficient irrigation scheduling and low-emission nutrient budgeting.',
      estimatedUsdPerHa: 28,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.mpi.govt.nz/',
    },
  ],
  KE: [
    {
      title: 'National Fertilizer Subsidy & e-Voucher Program',
      agency: 'Ministry of Agriculture & Livestock (Kilimo Kenya)',
      benefitSummary:
        'Subsidized planting and top-dressing fertilizer bags distributed via NCPB depots to registered farmers.',
      estimatedUsdPerHa: 55,
      category: 'Input Subsidy',
      officialUrl: 'https://kilimo.go.ke/',
    },
    {
      title: 'NCPB Strategic Grain Reserve & Kenya Agricultural Insurance',
      agency: 'NCPB & Kilimo Kenya',
      benefitSummary:
        'Seasonal maize/grain buying windows plus subsidized weather-index crop insurance for drought protection.',
      estimatedUsdPerHa: 22,
      category: 'Price Floor',
      officialUrl: 'https://www.ncpb.co.ke/',
    },
  ],
  ET: [
    {
      title: 'National Fertilizer & Improved Seed Cooperative Distribution',
      agency: 'Ministry of Agriculture (MoA Ethiopia)',
      benefitSummary:
        'Coordinated cooperative access to Urea/NPS fertilizers and improved rust-resistant wheat, teff, and pulse seeds.',
      estimatedUsdPerHa: 42,
      category: 'Input Subsidy',
      officialUrl: 'https://www.moa.gov.et/',
    },
    {
      title: 'Irrigated Wheat Cluster & Small-Scale Irrigation Initiative',
      agency: 'MoA Ethiopia & Agricultural Transformation Institute',
      benefitSummary:
        'Cluster mechanization, solar/pump irrigation support, and buyer aggregation for dry-season irrigated wheat and legumes.',
      estimatedUsdPerHa: 35,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.ati.gov.et/',
    },
  ],
  NG: [
    {
      title: 'National Agricultural Growth Scheme (NAGS-AP) Input Subsidy',
      agency: 'Federal Ministry of Agriculture (FMAFS Nigeria)',
      benefitSummary:
        'Up to 50% digital agro-dealer voucher subsidy on certified wheat, rice, maize, and legume seeds plus NPK fertilizer.',
      estimatedUsdPerHa: 52,
      category: 'Input Subsidy',
      officialUrl: 'https://fmard.gov.ng/',
    },
    {
      title: 'NIRSAL Credit Risk Guarantee & Mechanization Support',
      agency: 'NIRSAL / Bank of Agriculture (Nigeria)',
      benefitSummary:
        'Interest rebate and credit risk guarantees lowering working-capital borrowing costs for verified crop farmers.',
      estimatedUsdPerHa: 25,
      category: 'Price Floor',
      officialUrl: 'https://nirsal.com/',
    },
  ],
  GH: [
    {
      title: 'Planting for Food and Jobs (PFJ 2.0) Input Credit System',
      agency: 'Ministry of Food and Agriculture (MoFA Ghana)',
      benefitSummary:
        'Zero-collateral input credit providing certified seeds, fertilizer, and extension support repaid in kind or cash post-harvest.',
      estimatedUsdPerHa: 48,
      category: 'Input Subsidy',
      officialUrl: 'https://mofa.gov.gh/',
    },
    {
      title: 'NAFCO Buffer Stock Grain Offtake & Warehouse Receipts',
      agency: 'National Food Buffer Stock Company (Ghana)',
      benefitSummary:
        'Guaranteed minimum grain purchase prices and warehouse receipt financing to avoid post-harvest price dips.',
      estimatedUsdPerHa: 18,
      category: 'Price Floor',
      officialUrl: 'https://mofa.gov.gh/',
    },
  ],
  SN: [
    {
      title: 'Programme National de Subvention des Intrants Agricoles',
      agency: 'MAERSA (Ministry of Agriculture Senegal)',
      benefitSummary:
        'Direct seasonal subsidies on certified groundnut, millet, maize, cowpea seeds, and NPK/Urea fertilizer.',
      estimatedUsdPerHa: 54,
      category: 'Input Subsidy',
      officialUrl: 'https://www.maersa.gouv.sn/',
    },
    {
      title: 'LBA Preferential Farm Credit & CNAAS Weather Insurance',
      agency: 'La Banque Agricole (LBA) & CNAAS Senegal',
      benefitSummary:
        '50% state-subsidized weather-index crop insurance premiums and subsidized seasonal farm input loans.',
      estimatedUsdPerHa: 26,
      category: 'Price Floor',
      officialUrl: 'https://www.cnaas.sn/',
    },
  ],
  ZA: [
    {
      title: 'Comprehensive Agricultural Support Programme (CASP) & Blended Finance',
      agency: 'DALRRD & Land Bank (South Africa)',
      benefitSummary:
        'Blended grant-and-loan finance for irrigation modernization, grain storage, and commercial input expansion.',
      estimatedUsdPerHa: 45,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.dalrrd.gov.za/',
    },
    {
      title: 'LandCare Conservation & Soil Health Grants',
      agency: 'DALRRD South Africa',
      benefitSummary:
        'Support for conservation tillage, cover crops, and water-harvesting infrastructure in dryland grain belts.',
      estimatedUsdPerHa: 30,
      category: 'Rotation Bonus',
      officialUrl: 'https://www.dalrrd.gov.za/',
    },
  ],
  JO: [
    {
      title: 'Agricultural Credit Corporation (ACC) Zero/Low-Interest Loans',
      agency: 'ACC & Ministry of Agriculture (Jordan)',
      benefitSummary:
        'Interest-free and low-interest seasonal loans for drip irrigation, water harvesting, and drought-tolerant crops.',
      estimatedUsdPerHa: 45,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.acc.gov.jo/',
    },
    {
      title: 'Guaranteed Wheat & Barley Local Purchase Program',
      agency: 'Ministry of Industry, Trade & Supply / MoA Jordan',
      benefitSummary:
        'Preferential state purchase price above import parity for domestically produced wheat and barley.',
      estimatedUsdPerHa: 35,
      category: 'Price Floor',
      officialUrl: 'https://moa.gov.jo/',
    },
  ],
  SA: [
    {
      title: 'Reef Saudi Direct Sustainable Farming Support',
      agency: 'MEWA (Reef Saudi Program)',
      benefitSummary:
        'Direct financial subsidies supporting local fruit, vegetable, pulse, and sustainable rainfed/drip farmers.',
      estimatedUsdPerHa: 95,
      category: 'Rotation Bonus',
      officialUrl: 'https://reef.gov.sa/',
    },
    {
      title: 'Agricultural Development Fund (ADF) Smart Irrigation Financing',
      agency: 'ADF Saudi Arabia & GFSA',
      benefitSummary:
        'Interest-free loans up to 70% for precision drip irrigation and greenhouse water-saving technology plus GFSA wheat offtake.',
      estimatedUsdPerHa: 65,
      category: 'Irrigation Grant',
      officialUrl: 'https://adf.gov.sa/',
    },
  ],
  LB: [
    {
      title: 'National Wheat & Pulse Seed Support Program',
      agency: 'Ministry of Agriculture (Lebanon) & LARI',
      benefitSummary:
        'Certified drought-resilient durum wheat and legume seed distribution plus agronomic soil testing through LARI.',
      estimatedUsdPerHa: 38,
      category: 'Input Subsidy',
      officialUrl: 'https://www.agriculture.gov.lb/',
    },
    {
      title: 'FAO / MoA Solar Irrigation & Climate-Smart Farming Grants',
      agency: 'MoA Lebanon & FAO Resilience Programme',
      benefitSummary:
        'Targeted technical grants for solar water pumping, drip irrigation upgrades, and conservation agriculture.',
      estimatedUsdPerHa: 42,
      category: 'Irrigation Grant',
      officialUrl: 'https://www.agriculture.gov.lb/',
    },
  ],
};
