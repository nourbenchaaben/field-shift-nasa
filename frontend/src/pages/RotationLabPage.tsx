import React, { useEffect, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import {
  computeDateAccurateGrowth,
  computeSeasonalNasaClimate,
  DioramaWeatherMode,
  FarmDioramaFrame,
  IsometricFarmDiorama,
} from '../components/IsometricFarmDiorama';
import { RotationRoadmapGraph } from '../components/RotationRoadmapGraph';
import { ConfirmStrategyChangeModal } from '../components/ConfirmStrategyChangeModal';
import { useFarmLocalDate } from '../utils/farmLocalClock';
import {
  computeRealisticSeasonTargets,
  ScientificLayerType,
} from '../utils/scientificHeatmap';
import {
  computeStrategyFinancials,
  formatFarmMoney,
  getCurrencyByCode,
  getRegionalMarketProfile,
} from '../data/regionalMarketData';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bot,
  CheckCircle2,
  Coins,
  Leaf,
  Pause,
  Play,
  SkipForward,
  Sparkles,
  Sprout,
} from 'lucide-react';

export const RotationLabPage: React.FC = () => {
  const {
    profile,
    beforeAnalysis,
    top3Strategies,
    selectedStrategyId,
    activeStrategy,
    planCustomization,
    openAiAdvisorForCustomPlan,
    selectRotationStrategy,
    navigate,
  } = useFarm();

  const [seasonIndex, setSeasonIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scientificLayer, setScientificLayer] = useState<ScientificLayerType>('vitality');
  const [visualMode, setVisualMode] = useState<'3d-farm' | 'satellite'>('3d-farm');
  const [weatherOverride, setWeatherOverride] = useState<'nasa' | DioramaWeatherMode>('nasa');
  const [confirmStrategyChangeOpen, setConfirmStrategyChangeOpen] = useState(false);
  const farmDate = useFarmLocalDate(profile.countryCode, profile.coordinates.lng);

  // Live 2026 regional market & optional finance parameter (ticked in Registration or Profile)
  const regionalMarket = useMemo(() => getRegionalMarketProfile(profile), [profile]);
  const hasPersonalFinance = Boolean(profile.financeInputs?.enabled);
  const preferredCurrency = useMemo(
    () => getCurrencyByCode(profile.financeInputs?.currencyCode, profile.countryCode),
    [profile.financeInputs?.currencyCode, profile.countryCode]
  );
  const strategyFinancialMap = useMemo(() => {
    if (!hasPersonalFinance) return {} as Record<string, ReturnType<typeof computeStrategyFinancials>>;
    const map: Record<string, ReturnType<typeof computeStrategyFinancials>> = {};
    top3Strategies.forEach((s) => {
      map[s.id] = computeStrategyFinancials(profile, s);
    });
    if (!map[activeStrategy.id]) {
      map[activeStrategy.id] = computeStrategyFinancials(profile, activeStrategy);
    }
    return map;
  }, [hasPersonalFinance, profile, top3Strategies, activeStrategy]);
  const activeStrategyFinance = strategyFinancialMap[activeStrategy.id];
  const currentSeasonFinance =
    activeStrategyFinance?.seasonRows[seasonIndex] ?? activeStrategyFinance?.seasonRows[0];

  useEffect(() => {
    setSeasonIndex(0);
    setIsPlaying(false);
  }, [selectedStrategyId]);

  useEffect(() => {
    if (!isPlaying || !selectedStrategyId) return;
    const timer = setInterval(() => {
      setSeasonIndex((prev) => (prev + 1) % activeStrategy.steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, selectedStrategyId, activeStrategy.steps.length]);

  const currentStep = activeStrategy.steps[seasonIndex] ?? activeStrategy.steps[0];
  const nextSeasonIndex = (seasonIndex + 1) % activeStrategy.steps.length;
  const nextStep = activeStrategy.steps[nextSeasonIndex] ?? activeStrategy.steps[0];
  const centerTuple: [number, number] = [profile.coordinates.lat, profile.coordinates.lng];
  const seasonTargets = computeRealisticSeasonTargets({
    baselineMoisturePct: profile.nasaPower.rootMoisturePct,
    baselineNdvi: profile.nasaPower.ndviEstimate ?? 0.5,
    seasonIndex,
    cropFamily: currentStep.cropFamily,
    soilRichnessScore: currentStep.soilRichnessScore,
  });

  // Build date-accurate whole-field 3D frames strictly synced to real seasonal NASA data & Season Guide targets
  const rotationDioramaFrames: FarmDioramaFrame[] = activeStrategy.steps.map((step, idx) => {
    const phenology = computeDateAccurateGrowth(farmDate, idx, step);
    const targets = computeRealisticSeasonTargets({
      baselineMoisturePct: profile.nasaPower.rootMoisturePct,
      baselineNdvi: profile.nasaPower.ndviEstimate ?? 0.5,
      seasonIndex: idx,
      cropFamily: step.cropFamily,
      soilRichnessScore: step.soilRichnessScore,
    });
    const seasonalNasa = computeSeasonalNasaClimate(
      profile.nasaPower,
      profile.nasaPower.annualRainMm,
      profile.nasaPower.avgTempC,
      targets.projectedMoisturePct,
      phenology.seasonOfYear
    );

    const effectiveWeather: DioramaWeatherMode =
      weatherOverride === 'nasa' ? seasonalNasa.weatherMode : weatherOverride;

    const rainMm =
      weatherOverride === 'nasa'
        ? seasonalNasa.seasonRainMm
        : effectiveWeather === 'rain'
          ? Math.max(125, Math.round(seasonalNasa.seasonRainMm * 1.65))
          : effectiveWeather === 'drought' || effectiveWeather === 'heatwave'
            ? Math.max(8, Math.round(seasonalNasa.seasonRainMm * 0.3))
            : seasonalNasa.seasonRainMm;

    const rainIntensity =
      effectiveWeather === 'rain'
        ? Number(Math.max(0.5, Math.min(1, rainMm / 185)).toFixed(2))
        : 0;

    const tempC = Number(
      (
        seasonalNasa.tempC +
        (weatherOverride === 'nasa'
          ? 0
          : effectiveWeather === 'heatwave'
            ? 5.5
            : effectiveWeather === 'frost'
              ? -Math.max(8, seasonalNasa.tempC - 1)
              : effectiveWeather === 'drought'
                ? 2.8
                : effectiveWeather === 'rain'
                  ? -1.5
                  : 0)
      ).toFixed(1)
    );

    const syncedMoisture =
      weatherOverride === 'nasa'
        ? targets.projectedMoisturePct
        : effectiveWeather === 'drought' || effectiveWeather === 'heatwave'
          ? Math.max(22, targets.projectedMoisturePct - 24)
          : effectiveWeather === 'rain'
            ? Math.min(92, targets.projectedMoisturePct + 18)
            : targets.projectedMoisturePct;

    return {
      id: `rot-s-${step.stepNumber}-${effectiveWeather}`,
      label: `S${step.stepNumber}: ${step.cropName.split('&')[0].trim()}`,
      dateLabel: `${phenology.dateLabel} · ${phenology.seasonOfYear}`,
      era: idx === 0 ? 'today' : 'future',
      seasonOfYear: phenology.seasonOfYear,
      cropName: step.cropName,
      cropFamily: step.cropFamily,
      cropColor: step.cropColor,
      growthStage: phenology.growthStage,
      growthLabel: phenology.growthLabel,
      weatherMode: effectiveWeather,
      rainfallMm: rainMm,
      rainfallUnitLabel: 'mm',
      rainIntensity,
      tempC,
      moisturePct: syncedMoisture,
      soilRichnessScore: step.soilRichnessScore,
      soilOrganicMatterPct: Number((step.soilRichnessScore / 29).toFixed(2)),
      irrigationSupplyPct:
        effectiveWeather === 'drought' || effectiveWeather === 'heatwave'
          ? 70
          : effectiveWeather === 'rain'
            ? 110
            : 100,
      organicInputBoostPct: idx >= 2 ? 20 : 10,
      extremeRiskLevel:
        effectiveWeather === 'heatwave' || effectiveWeather === 'frost'
          ? 'severe'
          : effectiveWeather === 'drought'
            ? 'moderate'
            : 'low',
      summaryNote: `${phenology.seasonOfYear} (${seasonalNasa.monthsLabel}): ${rainMm} mm rain · Soil ${step.soilRichnessScore}/100 · Moisture ${syncedMoisture}% · ${step.cropName}`,
    };
  });

  // =========================================================================
  // STEP 1: "BEFORE" FARM SUMMARY + DECISION TOOL OPTIONS + CUSTOM AI BUILDER
  // =========================================================================
  if (!selectedStrategyId) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
              AI Decision Tool · Rotation Lab
            </span>
            <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#111111]">
              Decide or Build Your Crop Rotation Plan
            </h2>
            <p className="text-xs sm:text-sm text-[#3A3A3A]">
              Based on your <strong className="text-[#111111]">{profile.soilType}</strong> soil,{' '}
              <strong className="text-[#111111]">
                {profile.countryFlag} {profile.countryName}
              </strong>{' '}
              NASA weather, and recent crop history, compare starting strategies below or surpass
              them by designing your own custom plan with Tadawol AI Advisor.
            </p>
          </div>

          {/* 2-Step Progress Indicator */}
          <div className="inline-flex items-center gap-2 bg-[#FFFEFB] px-3.5 py-2 rounded-full border border-[#DFDDD6] text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-[#007432] font-extrabold">
              <span className="w-5 h-5 rounded-full bg-[#00873A] text-white flex items-center justify-center text-[11px]">
                1
              </span>
              Decide or Customize
            </span>
            <span className="text-[#9A968C]">→</span>
            <span className="inline-flex items-center gap-1.5 text-[#555555]">
              <span className="w-5 h-5 rounded-full bg-[#EFECE4] text-[#3A3A3A] flex items-center justify-center text-[11px]">
                2
              </span>
              Map Simulation
            </span>
          </div>
        </div>

        {/* Plain-Language "BEFORE" Current Farm Condition Card */}
        <div className="surface-card p-5 sm:p-6 bg-[#FFFEFB] border-l-4 border-l-[#EBB40E] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#8F6900]">
                <Sprout className="w-4 h-4" />
                Current Field Baseline (Before Rotation)
              </span>
              <h3 className="text-lg font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.headline}
              </h3>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-[#FDF6DC] text-[#6E5100] border border-[#EBD58B] text-xs font-extrabold">
              {profile.areaHectares} ha Field
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="text-xs font-bold text-[#3A3A3A]">Current Soil Status</div>
              <div className="text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.soilStatusLabel}
              </div>
              <div className="text-xs text-[#007432] font-bold mt-0.5">
                {profile.soilType} topsoil
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="text-xs font-bold text-[#3A3A3A]">Chemical Fertilizer Need</div>
              <div className="text-base font-extrabold text-[#B83B1A] mt-1">
                {beforeAnalysis.chemicalRiskLabel}
              </div>
              <div className="text-xs text-[#3A3A3A] mt-0.5">Can be cut naturally with legumes</div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="text-xs font-bold text-[#3A3A3A]">Moisture Readiness</div>
              <div className="text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.moistureStatusLabel}
              </div>
              <div className="text-xs text-[#3A3A3A] mt-0.5">
                NASA root wetness: {profile.nasaPower.rootMoisturePct}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="text-xs font-bold text-[#3A3A3A]">Slope &amp; Runoff</div>
              <div className="text-base font-extrabold text-[#111111] mt-1">
                {beforeAnalysis.slopeStatusLabel}
              </div>
              <div className="text-xs text-[#3A3A3A] mt-0.5">
                Recent crops: {profile.previousCrops.join(', ') || 'Grains'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-4 rounded-xl bg-[#E3F5EB]/70 border border-[#A8DEC0] space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#005222]">
                What&apos;s Working Well
              </div>
              {beforeAnalysis.strengths.map((s) => (
                <div key={s} className="flex items-start gap-2 text-xs sm:text-sm text-[#1E1E1E]">
                  <CheckCircle2 className="w-4 h-4 text-[#007432] shrink-0 mt-0.5" />
                  <span>{s}</span>
                </div>
              ))}
            </div>
            <div className="p-4 rounded-xl bg-[#FDF6DC]/80 border border-[#EBD58B] space-y-2">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#6E5100]">
                What Rotation Fixes Next
              </div>
              {beforeAnalysis.needsAttention.map((n) => (
                <div key={n} className="flex items-start gap-2 text-xs sm:text-sm text-[#1E1E1E]">
                  <AlertTriangle className="w-4 h-4 text-[#946D00] shrink-0 mt-0.5" />
                  <span>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* DECISION TOOL: STARTING STRATEGIES + CUSTOM AI ADVISOR OPTION */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-extrabold text-[#111111] flex items-center gap-2">
              <Award className="w-5 h-5 text-[#007432]" />
              Choose a Starting Strategy or Build Your Own with AI
            </h3>
            {hasPersonalFinance && (
              <button
                type="button"
                onClick={() => navigate('market-finance')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#E3F5EB] border border-[#A8DEC0] text-xs font-extrabold text-[#005222] hover:bg-[#D2EEDF] transition cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{preferredCurrency.flag} Market &amp; Finance ({preferredCurrency.code})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {top3Strategies.map((strategy) => {
              const fin = strategyFinancialMap[strategy.id];
              return (
              <div
                key={strategy.id}
                className={`surface-card overflow-hidden flex flex-col justify-between transition hover:-translate-y-0.5 hover:shadow-lg ${
                  strategy.rank === 1 ? 'border-2 border-[#00873A]' : 'hover:border-[#111111]'
                }`}
              >
                <div>
                  {/* Curated Photo Header */}
                  <div className="relative h-44 w-full overflow-hidden bg-[#111111]">
                    <img
                      src={strategy.image}
                      alt={strategy.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/85 via-[#111111]/20 to-transparent" />
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-extrabold shadow ${
                          strategy.rank === 1
                            ? 'bg-[#EBB40E] text-[#111111]'
                            : 'bg-[#111111]/90 text-white'
                        }`}
                      >
                        Option {strategy.rank} · {strategy.focusTag}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#00873A] text-white text-xs font-extrabold shadow">
                        {strategy.matchScore}% Match
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <h4 className="text-base font-extrabold text-white leading-snug">
                        {strategy.title}
                      </h4>
                    </div>
                  </div>

                  {/* Plain-Language Strategy Body */}
                  <div className="p-5 space-y-4">
                    <p className="text-xs sm:text-sm text-[#2E2E2E] leading-relaxed">
                      {strategy.subtitle}
                    </p>

                    {/* Sequence Pills */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {strategy.steps.map((st, idx) => (
                        <React.Fragment key={st.stepNumber}>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F5F4F0] border border-[#D9D5CB] text-xs font-bold text-[#111111]">
                            <span
                              className="w-2.5 h-2.5 rounded-full"
                              style={{ backgroundColor: st.cropColor }}
                            />
                            {st.cropName}
                          </span>
                          {idx < strategy.steps.length - 1 && (
                            <span className="text-[#555555] font-bold text-xs">→</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    {/* Compact 2026 Regional Profit & Budget Fit Strip (Shown When Finance Is Ticked) */}
                    {fin && (
                      <div className="px-3 py-2 rounded-xl bg-[#F5F4F0] border border-[#E2DFD6] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-extrabold text-[#111111]">
                          {formatFarmMoney(
                            fin.annualFarmNetProfitUsd,
                            regionalMarket,
                            preferredCurrency.code
                          )}
                          /yr
                        </span>
                        <div className="flex items-center gap-1.5">
                          {fin.withinBudget !== undefined && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                fin.withinBudget
                                  ? 'bg-[#E3F5EB] text-[#005222]'
                                  : 'bg-[#FDE8E2] text-[#9A2D11]'
                              }`}
                            >
                              {fin.withinBudget ? 'Fits Budget' : 'Over Budget'}
                            </span>
                          )}
                          <span
                            className={`font-extrabold ${
                              fin.extraAnnualFarmProfitUsd >= 0
                                ? 'text-[#007432]'
                                : 'text-[#B83B1A]'
                            }`}
                          >
                            {fin.extraAnnualFarmProfitUsd >= 0 ? '+' : ''}
                            {formatFarmMoney(
                              fin.extraAnnualFarmProfitUsd,
                              regionalMarket,
                              preferredCurrency.code
                            )}{' '}
                            vs same crop
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Key Farmer Highlight Bullets */}
                    <ul className="space-y-2 pt-2 border-t border-[#E8E5DC]">
                      {strategy.highlights.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-[#111111]"
                        >
                          <CheckCircle2 className="w-4 h-4 text-[#007432] shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    type="button"
                    onClick={() => selectRotationStrategy(strategy.id)}
                    className={`w-full btn-pill text-xs sm:text-sm ${
                      strategy.rank === 1 ? 'btn-pill-primary' : 'btn-pill-green'
                    }`}
                  >
                    Simulate This Plan on My Map
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>

          {/* 4th Option: Go Beyond the 3 Starting Plans & Build Custom with AI Advisor */}
          <div className="surface-card p-5 sm:p-6 bg-[#111111] text-white border-[#111111] relative overflow-hidden">
            <div className="absolute inset-0 bg-survey-pattern-light opacity-15 pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00873A]/30 border border-[#44BE7E]/40 text-[#92D500] text-[11px] font-extrabold uppercase tracking-wider">
                  <Bot className="w-3.5 h-3.5" />
                  Option 4 · Unlimited Custom Rotation
                </div>
                <h4 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                  Want to go beyond these 3 plans? Build your own custom rotation with AI Advisor
                </h4>
                <p className="text-xs sm:text-sm text-white/85 leading-relaxed">
                  Tell Tadawol AI your exact preferred crops, local market goals, irrigation limits,
                  or stage count (2 to 6 seasons). The AI will design a tailored strategy for your{' '}
                  {profile.areaHectares} ha field and ask for your confirmation before applying it.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {[
                    'Pick your own crops & families',
                    'Add or remove stages (2-6)',
                    'Adjust planting dates & durations',
                  ].map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold text-white/95"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#EBB40E]" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                <button
                  type="button"
                  onClick={openAiAdvisorForCustomPlan}
                  className="w-full lg:w-auto btn-pill btn-pill-primary text-xs sm:text-sm !px-6 !py-3"
                >
                  <Sparkles className="w-4 h-4" />
                  Build Custom Plan with AI Advisor
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* VISUAL 4-PATH DIVERGING COMPARISON TRAJECTORY (AFTER THE 3 CHOICES + AI CUSTOM OPTION) */}
        <RotationRoadmapGraph
          mode="compare-all"
          profile={profile}
          top3Strategies={top3Strategies}
          activeStrategy={activeStrategy}
          farmDate={farmDate}
          onSelectStrategy={(id) => selectRotationStrategy(id)}
          onOpenAiAdvisor={openAiAdvisorForCustomPlan}
          onNavigate={(page) => navigate(page)}
        />
      </div>
    );
  }

  // =========================================================================
  // STEP 2: SIMPLE, FARMER-FRIENDLY SEASON-BY-SEASON PLAN & MAP VIEW
  // =========================================================================
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Clean Single-Row Plan Header */}
      <div className="surface-card p-5 sm:p-6 bg-[#FFFEFB] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#007432]">
            <Sparkles className="w-3.5 h-3.5" />
            Your Active Rotation Plan · {profile.areaHectares} ha
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111] leading-snug">
            {activeStrategy.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs font-extrabold">
            <span className="px-2.5 py-1 rounded-full bg-[#E3F5EB] text-[#005222]">
              +{activeStrategy.expectedOutput.yieldImprovementPct}% Harvest
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FDF6DC] text-[#6E5100]">
              -{activeStrategy.expectedOutput.chemicalReductionPct}% Fertilizer
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#E4F5F8] text-[#095560]">
              -{activeStrategy.expectedOutput.waterSavingsPct}% Water Needed
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConfirmStrategyChangeOpen(true)}
            className="btn-pill btn-pill-outline text-xs !px-4 !py-2.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Change Plan
          </button>
          <button
            type="button"
            onClick={openAiAdvisorForCustomPlan}
            className="btn-pill btn-pill-green text-xs !px-4 !py-2.5"
          >
            <Bot className="w-3.5 h-3.5" />
            Customize with AI
          </button>
        </div>
      </div>

      {/* Double Confirmation Modal before changing active strategy */}
      <ConfirmStrategyChangeModal
        isOpen={confirmStrategyChangeOpen}
        activeStrategy={activeStrategy}
        planCustomization={planCustomization}
        onCancel={() => setConfirmStrategyChangeOpen(false)}
        onOpenAiAdvisorInstead={openAiAdvisorForCustomPlan}
        onConfirmChange={() => {
          setConfirmStrategyChangeOpen(false);
          selectRotationStrategy(null);
        }}
      />

      {/* INTERACTIVE SEASON BAR (1 -> 2 -> 3 -> 4) + SIDE-BY-SIDE FIELD PREVIEW */}
      <div className="surface-card p-5 sm:p-6 space-y-5 bg-[#FFFEFB]">
        {/* Row 1: Simple Clickable Season Tabs + Compact Play/Next */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#111111]">
              Tap Any Season to See What to Plant
            </h3>
            <p className="text-xs text-[#3A3A3A]">
              Step through your {activeStrategy.steps.length}-season crop cycle one season at a
              time.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="btn-pill btn-pill-primary text-xs !px-4 !py-2"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Auto-Play'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setSeasonIndex((prev) => (prev + 1) % activeStrategy.steps.length);
              }}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-[#F5F4F0] hover:bg-[#111111] hover:text-white border border-[#CFCBC2] text-xs font-extrabold text-[#111111] transition cursor-pointer"
            >
              Next
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Clean 1-Click Season Selector Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {activeStrategy.steps.map((step, idx) => {
            const active = idx === seasonIndex;
            return (
              <button
                key={step.stepNumber}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSeasonIndex(idx);
                }}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#007432] text-white border-[#007432] shadow-md'
                    : 'bg-[#F5F4F0] text-[#111111] border-[#DFDDD6] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-extrabold uppercase tracking-wider ${
                      active ? 'text-[#EBB40E]' : 'text-[#007432]'
                    }`}
                  >
                    Season {step.stepNumber}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full border border-white/70 shrink-0"
                    style={{ backgroundColor: step.cropColor }}
                  />
                </div>
                <div className="text-sm sm:text-base font-extrabold mt-1 truncate">
                  {step.cropName}
                </div>
                <div
                  className={`text-[11px] mt-0.5 truncate ${
                    active ? 'text-white/85' : 'text-[#4A4A4A]'
                  }`}
                >
                  {step.timingLabel}
                </div>
              </button>
            );
          })}
        </div>

        {/* Row 2: Clean Side-by-Side 3D Living Farm / Satellite Map (Left) + Plain-English Season Guide (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Left: 3D Animated Isometric Farm OR Satellite Field Map */}
          <div className="xl:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Primary Visual Mode Switcher */}
              <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#EFECE4] border border-[#D9D5CB]">
                <button
                  type="button"
                  onClick={() => setVisualMode('3d-farm')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    visualMode === '3d-farm'
                      ? 'bg-[#007432] text-white shadow-xs'
                      : 'text-[#2E2E2E] hover:text-[#111111]'
                  }`}
                >
                  3D Living Farm
                </button>
                <button
                  type="button"
                  onClick={() => setVisualMode('satellite')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    visualMode === 'satellite'
                      ? 'bg-[#111111] text-white shadow-xs'
                      : 'text-[#2E2E2E] hover:text-[#111111]'
                  }`}
                >
                  Satellite Map
                </button>
              </div>

              {/* Contextual Secondary Controls: Weather Switcher for 3D Farm OR Field Layers for Satellite */}
              {visualMode === '3d-farm' ? (
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F5F4F0] border border-[#DFDDD6]">
                  {(
                    [
                      { id: 'nasa', label: 'Live NASA' },
                      { id: 'rain', label: 'Rain' },
                      { id: 'drought', label: 'Dry' },
                      { id: 'heatwave', label: 'Heat' },
                      { id: 'frost', label: 'Frost' },
                    ] as { id: 'nasa' | DioramaWeatherMode; label: string }[]
                  ).map((wOpt) => (
                    <button
                      key={wOpt.id}
                      type="button"
                      onClick={() => setWeatherOverride(wOpt.id)}
                      className={`px-3 py-1 rounded-full text-[11px] font-extrabold transition cursor-pointer ${
                        weatherOverride === wOpt.id
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'text-[#3A3A3A] hover:text-[#111111]'
                      }`}
                    >
                      {wOpt.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="inline-flex flex-wrap items-center gap-1 p-1 rounded-full bg-[#F5F4F0] border border-[#DFDDD6]">
                  {(
                    [
                      { id: 'vitality', label: 'Crop Health' },
                      { id: 'nitrogen', label: 'Soil Richness' },
                      { id: 'moisture', label: 'Water & Moisture' },
                    ] as { id: ScientificLayerType; label: string }[]
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setScientificLayer(tab.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                        scientificLayer === tab.id
                          ? 'bg-[#111111] text-white shadow-xs'
                          : 'text-[#3A3A3A] hover:text-[#111111]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {visualMode === '3d-farm' ? (
              <IsometricFarmDiorama
                frames={rotationDioramaFrames}
                activeFrameIndex={seasonIndex}
                onSelectFrame={(idx) => {
                  setIsPlaying(false);
                  setSeasonIndex(idx);
                }}
                slopeDeg={profile.slopeDeg}
                soilType={profile.soilType}
                irrigationType={profile.irrigationType}
                areaHectares={profile.areaHectares}
                isAutoPlaying={isPlaying}
                onToggleAutoPlay={() => setIsPlaying((p) => !p)}
              />
            ) : (
              <FarmLeafletMap
                mode="rotation-lab"
                center={centerTuple}
                boundary={profile.boundary}
                heightClass="h-[340px] sm:h-[395px]"
                fieldOverlay={{
                  cropName: currentStep.cropName,
                  cropColor: currentStep.cropColor,
                  topBadge: `Season ${currentStep.stepNumber} · ${currentStep.cropName}`,
                  bottomMetric:
                    scientificLayer === 'moisture'
                      ? `Expected Moisture: ${seasonTargets.projectedMoisturePct}%`
                      : scientificLayer === 'nitrogen'
                        ? `Soil Richness: ${currentStep.soilRichnessScore}/100`
                        : `Healthy Crop Cover · ${currentStep.cropName}`,
                  soilRichnessScore: currentStep.soilRichnessScore,
                  chemicalReductionPct: currentStep.chemicalReductionPct,
                  ndvi: seasonTargets.projectedNdvi,
                  moisturePct: seasonTargets.projectedMoisturePct,
                  scientificLayer,
                  seasonIndex,
                  physics: {
                    slopeDeg: profile.slopeDeg,
                    soilType: profile.soilType,
                    irrigationType: profile.irrigationType,
                  },
                  sourceNote: `Projected seasonal estimate anchored to NASA POWER (${profile.nasaPower.rootMoisturePct}% baseline moisture)`,
                }}
              />
            )}
          </div>

          {/* Right: Simple Plain-English Guide for THIS Season */}
          <div className="xl:col-span-4 rounded-2xl bg-[#F8F7F2] border border-[#E2DFD6] p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#007432]">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: currentStep.cropColor }}
                  />
                  Season {currentStep.stepNumber} · {currentStep.cropFamily}
                </span>
                <h4 className="text-xl font-extrabold text-[#111111] mt-0.5">
                  {currentStep.cropName}
                </h4>
                <p className="text-xs font-semibold text-[#4A4A4A]">{currentStep.timingLabel}</p>
              </div>

              {/* Simple Action Box */}
              <div className="rounded-xl bg-white border border-[#E5E2D9] p-3.5 space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#007432]">
                  What to Do This Season
                </div>
                <p className="text-xs sm:text-sm text-[#1E1E1E] leading-relaxed">
                  {currentStep.whatToDo}
                </p>
              </div>

              {/* Simple Benefit Box */}
              <div className="rounded-xl bg-[#E3F5EB]/70 border border-[#A8DEC0] p-3.5 space-y-1">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#005222]">
                  How It Helps Your Land
                </div>
                <p className="text-xs sm:text-sm font-bold text-[#111111] leading-snug">
                  {currentStep.soilImprovementNote}
                </p>
                <p className="text-xs text-[#2E2E2E] leading-relaxed">
                  {currentStep.pestBreakNote}
                </p>
              </div>

              {/* 3 At-a-Glance Numbers */}
              <div className="space-y-2.5 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs font-extrabold">
                    <span className="text-[#2E2E2E]">Soil Health Score</span>
                    <span className="text-[#007432]">{currentStep.soilRichnessScore} / 100</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white mt-1.5 overflow-hidden border border-[#DFDDD6]">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${currentStep.soilRichnessScore}%`,
                        background:
                          'linear-gradient(90deg, #EBB40E 0%, #9ED500 52%, #007A33 100%)',
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                  <div className="rounded-xl bg-white border border-[#E5E2D9] p-3">
                    <div className="text-[11px] font-bold text-[#4A4A4A]">Less Fertilizer</div>
                    <div className="text-lg font-extrabold text-[#111111] mt-0.5">
                      -{currentStep.chemicalReductionPct}%
                    </div>
                  </div>
                  <div className="rounded-xl bg-white border border-[#E5E2D9] p-3">
                    <div className="text-[11px] font-bold text-[#4A4A4A]">More Moisture</div>
                    <div className="text-lg font-extrabold text-[#0F7B8A] mt-0.5">
                      +{currentStep.moistureRetentionPct}%
                    </div>
                  </div>
                </div>

                {currentSeasonFinance ? (
                  <button
                    type="button"
                    onClick={() => navigate('market-finance')}
                    className="w-full text-left rounded-xl bg-white border border-[#D8E5DC] hover:border-[#00873A] px-3 py-2.5 transition flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-extrabold text-[#111111]">
                      Est. {formatFarmMoney(
                        currentSeasonFinance.netProfitUsdPerHa * profile.areaHectares,
                        regionalMarket,
                        preferredCurrency.code
                      )} net
                    </span>
                    <span className="font-extrabold text-[#007432]">Profit Graphs →</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => navigate('market-finance')}
                    className="w-full text-left rounded-xl bg-white border border-[#E5E2D9] hover:border-[#00873A] px-3 py-2.5 transition flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold text-[#4A4A4A]">
                      2026 {profile.countryName} prices &amp; optional profit
                    </span>
                    <span className="font-extrabold text-[#007432]">Open →</span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSeasonIndex(nextSeasonIndex);
                }}
                className="w-full btn-pill btn-pill-green text-xs sm:text-sm"
              >
                Next Season: {nextStep.cropName}
                <SkipForward className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-[#DDDAD0]">
                <button
                  type="button"
                  onClick={() => navigate('predictions')}
                  className="w-full btn-pill btn-pill-primary text-xs sm:text-sm"
                >
                  See 5-Year Forecast
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ONE COMPACT BOTTOM SUMMARY CARD: 3 SIMPLE TAKEAWAYS */}
      <div className="surface-card p-5 bg-[#FFFEFB]">
        <h4 className="text-sm font-extrabold uppercase tracking-wider text-[#007432] mb-3 flex items-center gap-1.5">
          <Leaf className="w-4 h-4" />
          Key Tips for Your {profile.soilType} Field
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeStrategy.aiSuggestions.slice(0, 3).map((tip, idx) => (
            <div
              key={tip}
              className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB] flex items-start gap-2.5"
            >
              <span className="w-6 h-6 rounded-full bg-[#007432] text-white text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <p className="text-xs sm:text-sm text-[#1E1E1E] leading-relaxed">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
