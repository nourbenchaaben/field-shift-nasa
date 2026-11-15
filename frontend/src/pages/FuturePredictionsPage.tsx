import React, { useEffect, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  computeDateAccurateGrowth,
  computeSeasonalNasaClimate,
  DioramaSeasonOfYear,
  DioramaWeatherMode,
  FarmDioramaFrame,
  getSeasonOfYearFromMonth,
  inferCropFamily,
  IsometricFarmDiorama,
  resolveWeatherMode,
} from '../components/IsometricFarmDiorama';
import {
  buildUnifiedHistoryRecords,
  computeScenarioAdjustedForecast,
  CustomScenarioParams,
  DEFAULT_SCENARIO_PARAMS,
  getPresetScenarioParams,
  parseScenarioTextToParams,
} from '../data/decisionEngine';
import { useFarmLocalDate } from '../utils/farmLocalClock';
import { ClimateScenario } from '../api/tadawolContract';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Droplets,
  Flame,
  Leaf,
  Loader2,
  RotateCcw,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Thermometer,
  TrendingUp,
} from 'lucide-react';

const SCENARIO_OPTIONS: { id: ClimateScenario; label: string }[] = [
  { id: 'normal', label: 'Normal Weather' },
  { id: 'drought', label: 'Dry / Drought Year' },
  { id: 'wet', label: 'Wet / High Rain' },
  { id: 'heatwave', label: 'Extreme Heatwave' },
];

const QUICK_SCENARIO_PROMPTS = [
  '35% less rain, +2.5°C hotter summer, and 60% irrigation water',
  'Heavy autumn storms (+45% rain) with high runoff risk',
  'Add +30% compost mulch and upgrade to 120% drip irrigation',
  'Late -2°C spring frost with moderate field stress',
];

async function interpretScenarioWithAi(
  promptText: string,
  farmContext: string,
  fallbackParams: CustomScenarioParams
): Promise<{ params: CustomScenarioParams; summary: string; offTopic?: boolean } | null> {
  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content:
              'You are Tadawol Future Scenario Simulator. ONLY interpret agricultural weather, water, soil, fertilizer, compost, frost, heat, or field stress scenarios. ' +
              'Return ONLY a compact raw JSON object (no markdown fences) with exact keys: ' +
              '{"offTopic":boolean,"rainChangePct":number(-50..60),"tempDeltaC":number(-3..4.5),"irrigationSupplyPct":number(20..130),"organicInputBoostPct":number(-20..50),"extremeRiskLevel":"low"|"moderate"|"severe","summary":"1-2 short plain sentences explaining the agronomic impact on the farm"}. ' +
              'If the user asks something unrelated to farming/weather/soil/water, set offTopic:true and write a polite 1-sentence reminder in summary.',
          },
          {
            role: 'user',
            content: `Farm context: ${farmContext}\nCurrent sliders: ${JSON.stringify(fallbackParams)}\nFarmer scenario text: "${promptText}"`,
          },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: string; reply?: string };
    const raw = (data.content ?? data.reply ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]) as Partial<CustomScenarioParams> & {
      summary?: string;
      offTopic?: boolean;
    };
    const clamp = (v: unknown, min: number, max: number, fb: number) =>
      typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fb;

    const risk =
      parsed.extremeRiskLevel === 'severe' ||
      parsed.extremeRiskLevel === 'moderate' ||
      parsed.extremeRiskLevel === 'low'
        ? parsed.extremeRiskLevel
        : fallbackParams.extremeRiskLevel;

    return {
      offTopic: Boolean(parsed.offTopic),
      params: {
        rainChangePct: Math.round(clamp(parsed.rainChangePct, -50, 60, fallbackParams.rainChangePct)),
        tempDeltaC: Number(clamp(parsed.tempDeltaC, -3, 4.5, fallbackParams.tempDeltaC).toFixed(1)),
        irrigationSupplyPct: Math.round(
          clamp(parsed.irrigationSupplyPct, 20, 130, fallbackParams.irrigationSupplyPct)
        ),
        organicInputBoostPct: Math.round(
          clamp(parsed.organicInputBoostPct, -20, 50, fallbackParams.organicInputBoostPct)
        ),
        extremeRiskLevel: risk,
      },
      summary: typeof parsed.summary === 'string' ? parsed.summary.trim() : '',
    };
  } catch {
    return null;
  }
}

export const FuturePredictionsPage: React.FC = () => {
  const {
    profile,
    activeStrategy,
    contractSettings,
    updateContractSettings,
    openAiAdvisorForCustomPlan,
    navigate,
  } = useFarm();

  const scenario = contractSettings.scenario;
  const [customParams, setCustomParams] = useState<CustomScenarioParams>(() =>
    getPresetScenarioParams(scenario)
  );
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isConditionEditorOpen, setIsConditionEditorOpen] = useState(false);
  const [showSliders, setShowSliders] = useState(true);
  const [scenarioInput, setScenarioInput] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [aiScenarioNote, setAiScenarioNote] = useState<string | null>(null);
  const [appliedBadges, setAppliedBadges] = useState<string[]>([]);
  const farmDate = useFarmLocalDate(profile.countryCode, profile.coordinates.lng);

  const liveWeatherMode = resolveWeatherMode(
    isCustomMode ? undefined : scenario,
    customParams.rainChangePct,
    customParams.tempDeltaC
  );

  const { points, year5Highlights } = useMemo(
    () => computeScenarioAdjustedForecast(activeStrategy, profile, scenario, customParams),
    [activeStrategy, profile, scenario, customParams]
  );

  const today = points[0];
  const year5 = points[points.length - 1];

  const SEASONS_LIST: DioramaSeasonOfYear[] = ['Winter', 'Spring', 'Summer', 'Autumn'];
  const currentSeasonOfYear = getSeasonOfYearFromMonth(farmDate.monthIndex);
  const [selectedSeasonOfYear, setSelectedSeasonOfYear] =
    useState<DioramaSeasonOfYear>(currentSeasonOfYear);

  // Build unified Past (Real NASA History) -> Today (Exact Date) -> Future (Year 1..Year 5)
  // WITH real Winter / Spring / Summer / Autumn climate, watering, soil & growth sync inside every year!
  const timelineFrames = useMemo<FarmDioramaFrame[]>(() => {
    const historyRecs = buildUnifiedHistoryRecords(profile, activeStrategy);
    const frames: FarmDioramaFrame[] = [];

    // 1. Past Years (2022..2025) strictly synced 1-to-1 with Farm History real NASA monthly archive
    for (const rec of historyRecs) {
      if (rec.year >= farmDate.year) continue;
      const sc = computeSeasonalNasaClimate(
        profile.nasaPower,
        rec.nasaSummary.rainfallMm,
        rec.nasaSummary.avgTempC,
        rec.nasaSummary.rootMoisturePct,
        selectedSeasonOfYear
      );

      frames.push({
        id: `past-${rec.year}-${selectedSeasonOfYear}`,
        label: String(rec.year),
        dateLabel: `Past · ${selectedSeasonOfYear} ${rec.year} (${sc.monthsLabel})`,
        era: 'past',
        seasonOfYear: selectedSeasonOfYear,
        cropName: rec.cropName,
        cropFamily: inferCropFamily(rec.cropName),
        cropColor: rec.cropColor,
        growthStage: sc.growthStage,
        growthLabel: sc.growthLabel,
        weatherMode: sc.weatherMode,
        rainfallMm: sc.seasonRainMm,
        rainfallUnitLabel: 'mm',
        rainIntensity: sc.rainIntensity,
        tempC: sc.tempC,
        moisturePct: sc.moisturePct,
        soilRichnessScore: Math.max(44, Math.min(92, Math.round(rec.soilOrganicMatterPct * 29))),
        soilOrganicMatterPct: rec.soilOrganicMatterPct,
        irrigationSupplyPct: sc.weatherMode === 'drought' || sc.weatherMode === 'heatwave' ? 68 : 100,
        organicInputBoostPct: rec.soilOrganicMatterPct >= 2.4 ? 15 : 0,
        extremeRiskLevel:
          sc.weatherMode === 'heatwave' || sc.heavyRainDays >= 2.2
            ? 'severe'
            : sc.weatherMode === 'drought' || sc.weatherMode === 'frost'
              ? 'moderate'
              : 'low',
        yieldTha: rec.yieldTha,
        summaryNote: `${selectedSeasonOfYear} ${rec.year} NASA: ${sc.seasonRainMm} mm rain · ${sc.tempC}°C · ${rec.cropName} · Yield ${rec.yieldTha} t/ha · SOM ${rec.soilOrganicMatterPct}%`,
      });
    }

    // 2. Current Year (2026): synced with exact farmDate + real NASA seasonal archive + points[0]
    const s1 = activeStrategy.steps[0];
    const isExactTodaySeason = selectedSeasonOfYear === currentSeasonOfYear;
    const todayPheno = computeDateAccurateGrowth(farmDate, 0, s1);
    const curRec = historyRecs.find((r) => r.year === farmDate.year);
    const curAnnualRain = curRec?.nasaSummary.rainfallMm ?? profile.nasaPower.annualRainMm;
    const curAnnualTemp = curRec?.nasaSummary.avgTempC ?? profile.nasaPower.avgTempC;
    const curAnnualMoist = curRec?.nasaSummary.rootMoisturePct ?? profile.nasaPower.rootMoisturePct;
    const curSc = computeSeasonalNasaClimate(
      profile.nasaPower,
      curAnnualRain,
      curAnnualTemp,
      curAnnualMoist,
      selectedSeasonOfYear
    );
    const todaySom = points[0]?.soilFertilityStrategy ?? curRec?.soilOrganicMatterPct ?? 1.9;
    const todayYield = points[0]?.harvestYieldStrategy ?? curRec?.yieldTha;

    frames.push({
      id: `today-${farmDate.year}-${selectedSeasonOfYear}`,
      label: `Today (${farmDate.year})`,
      dateLabel: isExactTodaySeason
        ? `${todayPheno.dateLabel} · ${selectedSeasonOfYear}`
        : `${selectedSeasonOfYear} ${farmDate.year} (${curSc.monthsLabel})`,
      era: 'today',
      seasonOfYear: selectedSeasonOfYear,
      cropName: s1.cropName,
      cropFamily: s1.cropFamily,
      cropColor: s1.cropColor,
      growthStage: isExactTodaySeason ? todayPheno.growthStage : curSc.growthStage,
      growthLabel: isExactTodaySeason ? todayPheno.growthLabel : curSc.growthLabel,
      weatherMode: curSc.weatherMode,
      rainfallMm: curSc.seasonRainMm,
      rainfallUnitLabel: 'mm',
      rainIntensity: curSc.rainIntensity,
      tempC: curSc.tempC,
      moisturePct: curSc.moisturePct,
      soilRichnessScore: Math.max(44, Math.min(96, Math.round(todaySom * 29))),
      soilOrganicMatterPct: todaySom,
      irrigationSupplyPct: 100,
      organicInputBoostPct: 5,
      extremeRiskLevel: curSc.weatherMode === 'heatwave' ? 'moderate' : 'low',
      yieldTha: todayYield,
      summaryNote: isExactTodaySeason
        ? `Live right now (${farmDate.shortDate}) · ${curSc.seasonRainMm} mm rain · ${s1.cropName} · Yield ${todayYield} t/ha · SOM ${todaySom}%`
        : `${selectedSeasonOfYear} ${farmDate.year}: ${curSc.seasonRainMm} mm rain · ${curSc.tempC}°C · ${s1.cropName} · SOM ${todaySom}%`,
    });

    // 3. Future Year 1..Year 5: strictly synced to points[yr] charts + customParams sliders + real NASA seasonal pattern
    for (let yr = 1; yr <= 5; yr += 1) {
      const pt = points[yr] ?? points[points.length - 1];
      const rotationCycleOffset = selectedSeasonOfYear === 'Autumn' ? yr : yr - 1;
      const step = activeStrategy.steps[rotationCycleOffset % activeStrategy.steps.length];
      const fYear = farmDate.year + yr;
      const projAnnualRain = Math.max(
        90,
        Math.round(profile.nasaPower.annualRainMm * (1 + customParams.rainChangePct / 100))
      );
      const projAnnualTemp = Number((profile.nasaPower.avgTempC + customParams.tempDeltaC).toFixed(1));
      const projAnnualMoist = Math.max(
        18,
        Math.min(
          94,
          Math.round(
            profile.nasaPower.rootMoisturePct +
              customParams.rainChangePct * 0.35 +
              (customParams.irrigationSupplyPct - 100) * 0.25 +
              yr * 1.8
          )
        )
      );
      const fSc = computeSeasonalNasaClimate(
        profile.nasaPower,
        projAnnualRain,
        projAnnualTemp,
        projAnnualMoist,
        selectedSeasonOfYear
      );

      // Blend seasonal NASA baseline with explicit extreme scenario overrides
      let seasonWeather: DioramaWeatherMode = fSc.weatherMode;
      if (liveWeatherMode === 'frost' && fSc.tempC <= 8) seasonWeather = 'frost';
      else if (liveWeatherMode === 'heatwave' && (selectedSeasonOfYear === 'Summer' || fSc.tempC >= 24)) {
        seasonWeather = 'heatwave';
      } else if (liveWeatherMode === 'drought' && fSc.seasonRainMm < 95) {
        seasonWeather = 'drought';
      } else if (liveWeatherMode === 'rain' && fSc.seasonRainMm >= 45 && fSc.tempC > 4) {
        seasonWeather = 'rain';
      }

      const fSom = pt?.soilFertilityStrategy ?? 2.4;
      const soilScore = Math.max(
        50,
        Math.min(98, Math.round(fSom * 29 + customParams.organicInputBoostPct * 0.2))
      );
      const fRainIntensity =
        seasonWeather === 'rain'
          ? Number(Math.max(0.45, Math.min(1, fSc.seasonRainMm / 185)).toFixed(2))
          : 0;

      frames.push({
        id: `future-y${yr}-${selectedSeasonOfYear}-${seasonWeather}-${customParams.rainChangePct}-${customParams.irrigationSupplyPct}`,
        label: `Year ${yr} (${fYear})`,
        dateLabel: `Future · ${selectedSeasonOfYear} ${fYear} (${fSc.monthsLabel})`,
        era: 'future',
        seasonOfYear: selectedSeasonOfYear,
        cropName: step.cropName,
        cropFamily: step.cropFamily,
        cropColor: step.cropColor,
        growthStage: step.cropFamily === 'Cover Crop' ? Math.max(0.68, fSc.growthStage) : fSc.growthStage,
        growthLabel:
          step.cropFamily === 'Cover Crop'
            ? `${selectedSeasonOfYear} Living Cover`
            : fSc.growthLabel,
        weatherMode: seasonWeather,
        rainfallMm: fSc.seasonRainMm,
        rainfallUnitLabel: 'mm',
        rainIntensity: fRainIntensity,
        tempC: fSc.tempC,
        moisturePct: fSc.moisturePct,
        soilRichnessScore: soilScore,
        soilOrganicMatterPct: fSom,
        irrigationSupplyPct: customParams.irrigationSupplyPct,
        organicInputBoostPct: customParams.organicInputBoostPct,
        extremeRiskLevel: customParams.extremeRiskLevel,
        yieldTha: pt?.harvestYieldStrategy,
        summaryNote: `${selectedSeasonOfYear} ${fYear}: ${step.cropName} · ${fSc.seasonRainMm} mm rain · Yield ${pt?.harvestYieldStrategy} t/ha · SOM ${fSom}% · Water ${customParams.irrigationSupplyPct}%`,
      });
    }

    return frames;
  }, [
    profile,
    activeStrategy,
    farmDate,
    points,
    customParams,
    liveWeatherMode,
    selectedSeasonOfYear,
    currentSeasonOfYear,
  ]);

  const todayFrameIdx = Math.max(
    0,
    timelineFrames.findIndex((f) => f.era === 'today')
  );
  const [dioramaFrameIdx, setDioramaFrameIdx] = useState<number>(todayFrameIdx);
  const [dioramaAutoPlay, setDioramaAutoPlay] = useState(false);

  const activeTimelineFrame = timelineFrames[dioramaFrameIdx] ?? timelineFrames[todayFrameIdx] ?? timelineFrames[0];

  // Compute exact 4-season weather & rainfall badges for the currently selected year in the 3D timeline
  const activeTimelineSeasonDetails = useMemo(() => {
    const historyRecs = buildUnifiedHistoryRecords(profile, activeStrategy);
    const details: Partial<
      Record<DioramaSeasonOfYear, { weatherMode: DioramaWeatherMode; rainMm: number }>
    > = {};
    const selectedFrame = timelineFrames[dioramaFrameIdx];
    if (!selectedFrame) return details;

    if (selectedFrame.era === 'past') {
      const yr = Number(selectedFrame.label);
      const rec = historyRecs.find((r) => r.year === yr);
      for (const s of SEASONS_LIST) {
        const sc = computeSeasonalNasaClimate(
          profile.nasaPower,
          rec?.nasaSummary.rainfallMm ?? profile.nasaPower.annualRainMm,
          rec?.nasaSummary.avgTempC ?? profile.nasaPower.avgTempC,
          rec?.nasaSummary.rootMoisturePct ?? profile.nasaPower.rootMoisturePct,
          s
        );
        details[s] = { weatherMode: sc.weatherMode, rainMm: sc.seasonRainMm };
      }
    } else if (selectedFrame.era === 'today') {
      const curRec = historyRecs.find((r) => r.year === farmDate.year);
      for (const s of SEASONS_LIST) {
        const sc = computeSeasonalNasaClimate(
          profile.nasaPower,
          curRec?.nasaSummary.rainfallMm ?? profile.nasaPower.annualRainMm,
          curRec?.nasaSummary.avgTempC ?? profile.nasaPower.avgTempC,
          curRec?.nasaSummary.rootMoisturePct ?? profile.nasaPower.rootMoisturePct,
          s
        );
        details[s] = { weatherMode: sc.weatherMode, rainMm: sc.seasonRainMm };
      }
    } else {
      const yrOffset = Math.max(1, dioramaFrameIdx - todayFrameIdx);
      const projAnnualRain = Math.max(
        90,
        Math.round(profile.nasaPower.annualRainMm * (1 + customParams.rainChangePct / 100))
      );
      const projAnnualTemp = Number((profile.nasaPower.avgTempC + customParams.tempDeltaC).toFixed(1));
      const projAnnualMoist = Math.max(
        18,
        Math.min(
          94,
          Math.round(
            profile.nasaPower.rootMoisturePct +
              customParams.rainChangePct * 0.35 +
              (customParams.irrigationSupplyPct - 100) * 0.25 +
              yrOffset * 1.8
          )
        )
      );
      for (const s of SEASONS_LIST) {
        const fSc = computeSeasonalNasaClimate(
          profile.nasaPower,
          projAnnualRain,
          projAnnualTemp,
          projAnnualMoist,
          s
        );
        let w: DioramaWeatherMode = fSc.weatherMode;
        if (liveWeatherMode === 'frost' && fSc.tempC <= 8) w = 'frost';
        else if (liveWeatherMode === 'heatwave' && (s === 'Summer' || fSc.tempC >= 24)) w = 'heatwave';
        else if (liveWeatherMode === 'drought' && fSc.seasonRainMm < 95) w = 'drought';
        else if (liveWeatherMode === 'rain' && fSc.seasonRainMm >= 45 && fSc.tempC > 4) w = 'rain';
        details[s] = { weatherMode: w, rainMm: fSc.seasonRainMm };
      }
    }
    return details;
  }, [
    profile,
    activeStrategy,
    timelineFrames,
    dioramaFrameIdx,
    todayFrameIdx,
    farmDate.year,
    customParams,
    liveWeatherMode,
  ]);

  // Auto-play steps seamlessly through seasons inside each year (Winter -> Spring -> Summer -> Autumn -> Next Year!)
  useEffect(() => {
    if (!dioramaAutoPlay || timelineFrames.length <= 1) return;
    const timer = setInterval(() => {
      setSelectedSeasonOfYear((prevSeason) => {
        const sIdx = SEASONS_LIST.indexOf(prevSeason);
        if (sIdx < SEASONS_LIST.length - 1) {
          return SEASONS_LIST[sIdx + 1];
        }
        setDioramaFrameIdx((prevYrIdx) => (prevYrIdx + 1) % timelineFrames.length);
        return SEASONS_LIST[0];
      });
    }, 2400);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dioramaAutoPlay, timelineFrames.length]);

  const handleSelectPreset = (presetId: ClimateScenario) => {
    const presetParams = getPresetScenarioParams(presetId);
    setCustomParams(presetParams);
    setIsCustomMode(false);
    setAiScenarioNote(null);
    setAppliedBadges([]);
    if (presetId !== 'normal') {
      setDioramaFrameIdx((prev) => (prev <= todayFrameIdx ? Math.min(timelineFrames.length - 1, todayFrameIdx + 1) : prev));
    }
    updateContractSettings({
      scenario: presetId,
      rain_change_pct: presetParams.rainChangePct,
    });
  };

  const handleSliderChange = <K extends keyof CustomScenarioParams>(
    key: K,
    value: CustomScenarioParams[K]
  ) => {
    setCustomParams((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'rainChangePct' && typeof value === 'number') {
        updateContractSettings({ rain_change_pct: value });
      }
      return updated;
    });
    setIsCustomMode(true);
    setDioramaFrameIdx((prev) =>
      prev <= todayFrameIdx ? Math.min(timelineFrames.length - 1, todayFrameIdx + 1) : prev
    );
  };

  const handleReset = () => {
    setCustomParams({ ...DEFAULT_SCENARIO_PARAMS });
    setIsCustomMode(false);
    setScenarioInput('');
    setAiScenarioNote(null);
    setAppliedBadges([]);
    updateContractSettings({ scenario: 'normal', rain_change_pct: 0 });
  };

  const runScenarioText = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed) return;

    // 1. Instant deterministic parse so sliders & charts respond immediately (< 50ms)
    const local = parseScenarioTextToParams(trimmed, customParams);
    if (!local.isRelevant) {
      setAiScenarioNote(
        'Please describe a farm weather, water, soil, temperature, or field stress scenario (for example: "35% less rain and +2.5°C hotter with half irrigation").'
      );
      return;
    }

    setCustomParams(local.params);
    setIsCustomMode(true);
    setAppliedBadges(local.matchedLabels);
    setDioramaFrameIdx((prev) =>
      prev <= todayFrameIdx ? Math.min(timelineFrames.length - 1, todayFrameIdx + 1) : prev
    );
    updateContractSettings({ rain_change_pct: local.params.rainChangePct });

    // 2. Enhance with live server-side Tadawol AI interpretation for nuanced wording & summary
    setIsInterpreting(true);
    const farmCtx = `${profile.farmName} (${profile.areaHectares} ha, ${profile.soilType} soil, ${profile.slopeDeg}° slope, ${profile.irrigationType} irrigation, ${profile.countryName}, active plan: ${activeStrategy.title})`;
    const aiResult = await interpretScenarioWithAi(trimmed, farmCtx, local.params);
    setIsInterpreting(false);

    if (aiResult) {
      if (aiResult.offTopic) {
        setAiScenarioNote(
          aiResult.summary ||
            'I can only simulate weather, water, soil, and crop field scenarios inside Tadawol.'
        );
        return;
      }
      setCustomParams(aiResult.params);
      updateContractSettings({ rain_change_pct: aiResult.params.rainChangePct });
      if (aiResult.summary) {
        setAiScenarioNote(aiResult.summary);
      }
      setAppliedBadges([
        `Rain ${aiResult.params.rainChangePct > 0 ? '+' : ''}${aiResult.params.rainChangePct}%`,
        `Temp ${aiResult.params.tempDeltaC > 0 ? '+' : ''}${aiResult.params.tempDeltaC}°C`,
        `Water ${aiResult.params.irrigationSupplyPct}%`,
        ...(aiResult.params.organicInputBoostPct !== 0
          ? [
              `Organic ${aiResult.params.organicInputBoostPct > 0 ? '+' : ''}${aiResult.params.organicInputBoostPct}%`,
            ]
          : []),
        `Stress: ${aiResult.params.extremeRiskLevel}`,
      ]);
    } else {
      setAiScenarioNote(
        `Applied custom scenario (${local.params.rainChangePct >= 0 ? '+' : ''}${local.params.rainChangePct}% rain, ${local.params.tempDeltaC >= 0 ? '+' : ''}${local.params.tempDeltaC}°C temp, ${local.params.irrigationSupplyPct}% water supply). All 5-year charts below updated live.`
      );
    }
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void runScenarioText(scenarioInput);
  };

  const activeScenarioSummaryLabel = isCustomMode
    ? `custom (${customParams.rainChangePct >= 0 ? '+' : ''}${customParams.rainChangePct}% rain, ${customParams.tempDeltaC >= 0 ? '+' : ''}${customParams.tempDeltaC}°C, ${customParams.irrigationSupplyPct}% water)`
    : scenario;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
            5-Year Multi-Season Farm Outlook
          </span>
          <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#111111]">
            Future Predictions: Before vs. After Rotation
          </h2>
          <p className="text-xs sm:text-sm text-[#3A3A3A]">
            Forecasting <strong className="text-[#111111]">{activeStrategy.title}</strong> across
            your {profile.areaHectares} ha field in {profile.countryFlag} {profile.countryName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('rotation-lab')}
            className="btn-pill btn-pill-outline text-xs !px-4 !py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Rotation Lab
          </button>
          <button
            type="button"
            onClick={() => setIsConditionEditorOpen((prev) => !prev)}
            className={`btn-pill text-xs !px-4 !py-2 transition cursor-pointer ${
              isConditionEditorOpen
                ? 'bg-[#111111] text-white border border-[#111111]'
                : isCustomMode || scenario !== 'normal'
                  ? 'bg-[#FDF6DC] text-[#6E5100] border border-[#D99B00] hover:bg-[#EBB40E] hover:text-[#111111]'
                  : 'bg-white text-[#111111] border border-[#CFCBC2] hover:border-[#111111]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Edit Weather &amp; Field Conditions
            {(isCustomMode || scenario !== 'normal') && (
              <span className="w-2 h-2 rounded-full bg-[#00873A]" />
            )}
            {isConditionEditorOpen ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('calendar')}
            className="btn-pill btn-pill-green text-xs !px-4 !py-2"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            View Full Farm Calendar
          </button>
        </div>
      </div>

      {/* Compact Active-Scenario Pill Bar when editor is minimized with custom/non-normal settings */}
      {!isConditionEditorOpen && (isCustomMode || scenario !== 'normal') && (
        <div className="rounded-2xl bg-[#FDF6DC]/80 border border-[#EBD58B] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-bold text-[#6E5100]">
            <CloudRain className="w-4 h-4 text-[#007432] shrink-0" />
            <span>
              Testing Conditions:{' '}
              <strong className="text-[#111111]">{activeScenarioSummaryLabel}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsConditionEditorOpen(true)}
              className="px-3 py-1 rounded-full bg-white hover:bg-[#111111] text-[#111111] hover:text-white border border-[#D99B00] font-extrabold transition cursor-pointer"
            >
              Adjust
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white hover:bg-[#111111] text-[#3A3A3A] hover:text-white border border-[#CFCBC2] font-bold transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          </div>
        </div>
      )}

      {/* COLLAPSIBLE WEATHER & FIELD PARAMETER SIMULATOR (OPENS FROM HEADER BUTTON, CAN BE MINIMIZED) */}
      {isConditionEditorOpen && (
      <div className="surface-card p-5 sm:p-6 space-y-4 bg-[#FFFEFB] animate-fade-in">
        {/* Row 1: Quick Presets + Adjust Sliders Toggle + Reset + Minimize */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#111111]">
            <CloudRain className="w-4 h-4 text-[#007432]" />
            <span>Test Future Weather &amp; Field Conditions:</span>
            {isCustomMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#FDF6DC] text-[#6E5100] border border-[#EBD58B] text-[10.5px] font-extrabold">
                Custom Parameters Active
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {SCENARIO_OPTIONS.map((opt) => {
              const active = !isCustomMode && scenario === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleSelectPreset(opt.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold border transition cursor-pointer ${
                    active
                      ? 'bg-[#007432] text-white border-[#007432] shadow-xs'
                      : 'bg-[#F5F4F0] text-[#2E2E2E] border-[#CFCBC2] hover:border-[#111111]'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setShowSliders((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold border border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-white transition cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Fine-Tune Sliders
              {showSliders ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {isCustomMode && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border border-[#CFCBC2] bg-[#F5F4F0] text-[#3A3A3A] hover:bg-[#111111] hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsConditionEditorOpen(false)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold border border-[#CFCBC2] bg-[#F5F4F0] text-[#111111] hover:bg-[#111111] hover:text-white transition cursor-pointer"
              title="Minimize weather & field conditions panel"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Minimize
            </button>
          </div>
        </div>

        {/* Row 2: Natural-Language Scenario Prompt Bar (Just Like AI Advisor) */}
        <form onSubmit={handlePromptSubmit} className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Sparkles className="w-4 h-4 text-[#00873A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={scenarioInput}
                onChange={(e) => setScenarioInput(e.target.value)}
                placeholder='Describe your scenario in plain words (e.g., "35% less rain, +2.5°C hotter, and 60% irrigation water" or "add compost mulch")...'
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F7F2] border border-[#CFCBC2] text-xs sm:text-sm text-[#111111] placeholder:text-[#555555] focus:outline-none focus:border-[#00873A] focus:bg-white transition"
              />
            </div>
            <button
              type="submit"
              disabled={isInterpreting || !scenarioInput.trim()}
              className="btn-pill btn-pill-primary text-xs !px-5 !py-2.5 disabled:opacity-55 disabled:cursor-not-allowed shrink-0"
            >
              {isInterpreting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Simulate Scenario
                </>
              )}
            </button>
          </div>

          {/* Clickable Quick Example Prompts */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#4A4A4A]">Try typing:</span>
            {QUICK_SCENARIO_PROMPTS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => {
                  setScenarioInput(sample);
                  void runScenarioText(sample);
                }}
                className="px-2.5 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#E3F5EB] border border-[#DFDDD6] hover:border-[#00873A] text-[11px] font-bold text-[#2E2E2E] hover:text-[#005222] transition cursor-pointer"
              >
                {sample}
              </button>
            ))}
          </div>
        </form>

        {/* AI Interpretation Feedback Banner */}
        {aiScenarioNote && (
          <div className="rounded-xl bg-[#E3F5EB]/75 border border-[#A8DEC0] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-[#111111]">
              <Bot className="w-4 h-4 text-[#007432] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="leading-relaxed font-medium">{aiScenarioNote}</p>
                {appliedBadges.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {appliedBadges.map((badge) => (
                      <span
                        key={badge}
                        className="px-2 py-0.5 rounded-full bg-white border border-[#A8DEC0] text-[10.5px] font-extrabold text-[#005222]"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={openAiAdvisorForCustomPlan}
              className="px-3 py-1.5 rounded-full bg-[#111111] hover:bg-[#007432] text-white text-[11px] font-extrabold transition cursor-pointer shrink-0 self-start sm:self-center"
            >
              Adapt Plan in AI Advisor
            </button>
          </div>
        )}

        {/* Row 3: Fine-Grained Live Parameter Sliders */}
        {showSliders && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3.5 pt-2 border-t border-[#ECEAE2]">
            {/* 1. Annual Rainfall Shift */}
            <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[#2E2E2E]">
                  <CloudRain className="w-3.5 h-3.5 text-[#0284C7]" />
                  Rainfall Shift
                </span>
                <span className="font-mono-tech text-[#007432]">
                  {customParams.rainChangePct > 0 ? '+' : ''}
                  {customParams.rainChangePct}%
                </span>
              </div>
              <input
                type="range"
                min={-50}
                max={60}
                step={5}
                value={customParams.rainChangePct}
                onChange={(e) => handleSliderChange('rainChangePct', Number(e.target.value))}
                className="w-full accent-[#00873A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#555555]">
                <span>-50% Dry</span>
                <span>Normal</span>
                <span>+60% Wet</span>
              </div>
            </div>

            {/* 2. Temperature Change */}
            <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[#2E2E2E]">
                  <Thermometer className="w-3.5 h-3.5 text-[#D97706]" />
                  Temperature
                </span>
                <span className="font-mono-tech text-[#B45309]">
                  {customParams.tempDeltaC > 0 ? '+' : ''}
                  {customParams.tempDeltaC}°C
                </span>
              </div>
              <input
                type="range"
                min={-3}
                max={4.5}
                step={0.5}
                value={customParams.tempDeltaC}
                onChange={(e) => handleSliderChange('tempDeltaC', Number(e.target.value))}
                className="w-full accent-[#EBB40E] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#555555]">
                <span>-3°C Frost</span>
                <span>0°C</span>
                <span>+4.5°C Heat</span>
              </div>
            </div>

            {/* 3. Irrigation Water Supply */}
            <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[#2E2E2E]">
                  <Droplets className="w-3.5 h-3.5 text-[#0F7B8A]" />
                  Water Supply
                </span>
                <span className="font-mono-tech text-[#0F7B8A]">
                  {customParams.irrigationSupplyPct}%
                </span>
              </div>
              <input
                type="range"
                min={20}
                max={130}
                step={5}
                value={customParams.irrigationSupplyPct}
                onChange={(e) =>
                  handleSliderChange('irrigationSupplyPct', Number(e.target.value))
                }
                className="w-full accent-[#0F7B8A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#555555]">
                <span>20% Scarce</span>
                <span>100%</span>
                <span>130% Drip+</span>
              </div>
            </div>

            {/* 4. Organic Compost / Mulch Boost */}
            <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] p-3 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[#2E2E2E]">
                  <Leaf className="w-3.5 h-3.5 text-[#00873A]" />
                  Compost / Mulch
                </span>
                <span className="font-mono-tech text-[#007432]">
                  {customParams.organicInputBoostPct > 0 ? '+' : ''}
                  {customParams.organicInputBoostPct}%
                </span>
              </div>
              <input
                type="range"
                min={-20}
                max={50}
                step={5}
                value={customParams.organicInputBoostPct}
                onChange={(e) =>
                  handleSliderChange('organicInputBoostPct', Number(e.target.value))
                }
                className="w-full accent-[#00873A] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-bold text-[#555555]">
                <span>-20% Bare</span>
                <span>Std</span>
                <span>+50% Rich</span>
              </div>
            </div>

            {/* 5. Extreme Event / Pest Stress */}
            <div className="rounded-xl bg-[#F8F7F2] border border-[#E5E2D9] p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="inline-flex items-center gap-1 text-[#2E2E2E]">
                  <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
                  Extreme Stress
                </span>
                <span className="text-[11px] uppercase font-extrabold text-[#111111]">
                  {customParams.extremeRiskLevel}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {(['low', 'moderate', 'severe'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => handleSliderChange('extremeRiskLevel', lvl)}
                    className={`py-1.5 rounded-lg text-[10.5px] font-extrabold capitalize border transition cursor-pointer ${
                      customParams.extremeRiskLevel === lvl
                        ? lvl === 'severe'
                          ? 'bg-[#DC2626] text-white border-[#DC2626]'
                          : lvl === 'moderate'
                            ? 'bg-[#EBB40E] text-[#111111] border-[#D99B00]'
                            : 'bg-[#00873A] text-white border-[#00873A]'
                        : 'bg-white text-[#3A3A3A] border-[#D9D5CB] hover:border-[#111111]'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <div className="text-[10px] font-bold text-[#555555]">
                Storm, frost &amp; pest pressure
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* BEFORE & AFTER 5-YEAR COMPARISON CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#00873A]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#3A3A3A]">
            <span>Soil Fertility (Organic Matter)</span>
            <Leaf className="w-4 h-4 text-[#007432]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#555555] line-through">
              {today.soilFertilityBaseline}%
            </span>
            <span className="text-2xl font-extrabold text-[#007432]">
              {year5.soilFertilityStrategy}%
            </span>
          </div>
          <p className="text-xs text-[#2E2E2E] leading-relaxed">
            +{year5Highlights.soilFertilityPctGain}% richer topsoil by Year 5 from natural legume
            nitrogen &amp; living cover.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#EBB40E]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#3A3A3A]">
            <span>Reduced Chemical Usage</span>
            <ShieldCheck className="w-4 h-4 text-[#946D00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#555555] line-through">100%</span>
            <span className="text-2xl font-extrabold text-[#111111]">
              -{year5Highlights.chemicalSavedPct}% Less
            </span>
          </div>
          <p className="text-xs text-[#2E2E2E] leading-relaxed">
            Est. ~${year5Highlights.estimatedCostSavedUsd.toLocaleString()}/yr saved on inputs
            across {profile.areaHectares} ha.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#0F7B8A]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#3A3A3A]">
            <span>Water Efficiency</span>
            <Droplets className="w-4 h-4 text-[#0F7B8A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#555555] line-through">
              {today.waterEfficiencyBaseline}
            </span>
            <span className="text-2xl font-extrabold text-[#0F7B8A]">
              {year5.waterEfficiencyStrategy} kg/m³
            </span>
          </div>
          <p className="text-xs text-[#2E2E2E] leading-relaxed">
            Saves ~{year5Highlights.waterSavedM3PerYear.toLocaleString()} m³/yr by holding moisture
            deep in the soil.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#44BE7E]">
          <div className="flex items-center justify-between text-xs font-extrabold text-[#3A3A3A]">
            <span>Expected Harvest Yield</span>
            <TrendingUp className="w-4 h-4 text-[#007432]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#555555] line-through">
              {year5.harvestYieldBaseline} t/ha
            </span>
            <span className="text-2xl font-extrabold text-[#111111]">
              {year5.harvestYieldStrategy} t/ha
            </span>
          </div>
          <p className="text-xs text-[#2E2E2E] leading-relaxed">
            +{year5Highlights.yieldIncreasePct}% stronger annual harvests than repeating the same
            crop.
          </p>
        </div>
      </div>

      {/* LIVE 3D ANIMATED PAST -> TODAY -> FUTURE FIELD & WEATHER TIMELINE */}
      <div className="surface-card p-5 sm:p-6 space-y-3.5 bg-[#FFFEFB]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#007432]">
              Live 3D Planting History, Today &amp; 5-Year Forecast
            </span>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Watch Your Whole {profile.areaHectares} ha Field Evolve ({timelineFrames[0]?.label} →{' '}
              {timelineFrames[timelineFrames.length - 1]?.label})
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {activeTimelineFrame?.yieldTha !== undefined && (
              <span className="px-2.5 py-1 rounded-full bg-[#E3F5EB] text-[#005222] border border-[#A8DEC0] font-extrabold">
                {activeTimelineFrame.label}: {activeTimelineFrame.yieldTha} t/ha
                {activeTimelineFrame.soilOrganicMatterPct !== undefined
                  ? ` · SOM ${activeTimelineFrame.soilOrganicMatterPct}%`
                  : ''}
              </span>
            )}
            <span className="text-[#3A3A3A]">
              Synced to NASA &amp; weather ({activeScenarioSummaryLabel})
            </span>
          </div>
        </div>

        <IsometricFarmDiorama
          frames={timelineFrames}
          activeFrameIndex={dioramaFrameIdx}
          onSelectFrame={(idx) => {
            setDioramaAutoPlay(false);
            setDioramaFrameIdx(idx);
          }}
          seasonTabs={{
            seasons: SEASONS_LIST,
            activeSeason: selectedSeasonOfYear,
            onSelectSeason: (s) => {
              setDioramaAutoPlay(false);
              setSelectedSeasonOfYear(s);
            },
            yearLabel: timelineFrames[dioramaFrameIdx]?.label ?? String(farmDate.year),
            seasonDetails: activeTimelineSeasonDetails,
          }}
          slopeDeg={profile.slopeDeg}
          soilType={profile.soilType}
          irrigationType={profile.irrigationType}
          areaHectares={profile.areaHectares}
          isAutoPlaying={dioramaAutoPlay}
          onToggleAutoPlay={() => setDioramaAutoPlay((p) => !p)}
          compact
        />
      </div>

      {/* YEAR 1-5 INTERACTIVE BEFORE VS AFTER CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#007432]">
              5-Year Soil Fertility Trend
            </span>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Soil Organic Matter (%): With Rotation vs. Without
            </h3>
            <p className="text-xs sm:text-sm text-[#3A3A3A]">
              Higher organic matter means darker, sponge-like soil that feeds crops naturally.
            </p>
          </div>

          <div className="h-[265px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="soilAfterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00873A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00873A" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }} />
                <YAxis
                  domain={[1.1, 3.6]}
                  tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #C9C6BC',
                    boxShadow: '0 8px 20px rgba(17,17,17,0.12)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Area
                  type="monotone"
                  dataKey="soilFertilityStrategy"
                  name="After Rotation (%)"
                  stroke="#007432"
                  strokeWidth={3}
                  fill="url(#soilAfterGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="soilFertilityBaseline"
                  name="Before / No Rotation (%)"
                  stroke="#555555"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5 sm:p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#946D00]">
              5-Year Harvest Outlook
            </span>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Expected Harvest Yield (tons/ha): Before vs. After
            </h3>
            <p className="text-xs sm:text-sm text-[#3A3A3A]">
              Projected harvest volume per hectare under{' '}
              <strong className="text-[#111111]">{activeScenarioSummaryLabel}</strong> conditions.
            </p>
          </div>

          <div className="h-[265px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2DFD6" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }} />
                <YAxis tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 600 }} unit="t" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #C9C6BC',
                    boxShadow: '0 8px 20px rgba(17,17,17,0.12)',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                <Bar
                  dataKey="harvestYieldBaseline"
                  name="Before (Same Crop)"
                  fill="#A9A59B"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="harvestYieldStrategy"
                  name="After (Tadawol Plan)"
                  fill="#EBB40E"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Year-by-Year Plain Farmer Breakdown Table */}
      <div className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8E5DC] flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base sm:text-lg font-extrabold text-[#111111] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#007432]" />
            Year-by-Year Before &amp; After Progress (Today → Year 5)
          </h3>
          <span className="px-3 py-1 rounded-full bg-[#E3F5EB] text-[#005222] text-xs font-extrabold">
            Sustainability Score: {year5Highlights.sustainabilityScore}/100
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5F4F0] text-xs uppercase tracking-wider text-[#2E2E2E]">
              <tr>
                <th className="px-5 py-3.5">Horizon</th>
                <th className="px-5 py-3.5">Soil Organic Matter</th>
                <th className="px-5 py-3.5">Chemical Input Level</th>
                <th className="px-5 py-3.5">Water Efficiency</th>
                <th className="px-5 py-3.5">Expected Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E5DC]">
              {points.map((row) => (
                <tr key={row.yearLabel} className="hover:bg-[#F5F4F0]">
                  <td className="px-5 py-4 font-extrabold text-[#111111]">{row.yearLabel}</td>
                  <td className="px-5 py-4">
                    <span className="font-extrabold text-[#007432]">
                      {row.soilFertilityStrategy}%
                    </span>{' '}
                    <span className="text-xs text-[#3A3A3A]">
                      (vs {row.soilFertilityBaseline}%)
                    </span>
                  </td>
                  <td className="px-5 py-4 font-bold text-[#111111]">
                    {row.chemicalUsageStrategy}% of today{' '}
                    <span className="text-xs font-bold text-[#007432]">
                      ({Math.max(0, 100 - row.chemicalUsageStrategy)}% saved)
                    </span>
                  </td>
                  <td className="px-5 py-4 font-extrabold text-[#0F7B8A]">
                    {row.waterEfficiencyStrategy} kg/m³
                  </td>
                  <td className="px-5 py-4 font-extrabold text-[#111111]">
                    {row.harvestYieldStrategy} t/ha{' '}
                    <span className="text-xs font-medium text-[#3A3A3A]">
                      (vs {row.harvestYieldBaseline})
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
