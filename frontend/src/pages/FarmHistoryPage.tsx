import React, { useEffect, useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import {
  computeDateAccurateGrowth,
  computeSeasonalNasaClimate,
  DioramaSeasonOfYear,
  FarmDioramaFrame,
  getSeasonOfYearFromMonth,
  inferCropFamily,
  IsometricFarmDiorama,
  SeasonalNasaClimate,
} from '../components/IsometricFarmDiorama';
import { RiskCalendarMatrix } from '../components/RiskCalendarMatrix';
import { StrategyChangeRoadmap } from '../components/StrategyChangeRoadmap';
import { buildUnifiedHistoryRecords } from '../data/decisionEngine';
import { useFarmLocalDate } from '../utils/farmLocalClock';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  CheckCircle2,
  CloudRain,
  Droplets,
  FlaskConical,
  History,
  Leaf,
  Snowflake,
  Sprout,
  Sun,
  Wheat,
  Wind,
} from 'lucide-react';

const SEASONS_ORDER: DioramaSeasonOfYear[] = ['Winter', 'Spring', 'Summer', 'Autumn'];

export const FarmHistoryPage: React.FC = () => {
  const {
    profile,
    selectedStrategyId,
    activeStrategy,
    planCustomization,
    strategyHistory,
  } = useFarm();

  // Strictly Past 5 Years historical records (2022-2026, zero future projections)
  const records = useMemo(
    () => buildUnifiedHistoryRecords(profile, activeStrategy),
    [profile, activeStrategy]
  );

  const farmDate = useFarmLocalDate(profile.countryCode, profile.coordinates.lng);
  const currentSeasonOfYear = getSeasonOfYearFromMonth(farmDate.monthIndex);

  const [selectedYear, setSelectedYear] = useState<number>(
    records[records.length - 1]?.year ?? 2026
  );
  const [selectedSeasonOfYear, setSelectedSeasonOfYear] =
    useState<DioramaSeasonOfYear>(currentSeasonOfYear);
  const [historyAutoPlay, setHistoryAutoPlay] = useState(false);

  const activeRecord =
    records.find((r) => r.year === selectedYear) ?? records[records.length - 1];
  const activeHistoryIdx = Math.max(
    0,
    records.findIndex((r) => r.year === activeRecord.year)
  );

  // Auto-play steps cleanly through Winter -> Spring -> Summer -> Autumn -> Next Historical Year
  useEffect(() => {
    if (!historyAutoPlay || records.length === 0) return;
    const timer = setInterval(() => {
      setSelectedSeasonOfYear((prevSeason) => {
        const sIdx = SEASONS_ORDER.indexOf(prevSeason);
        if (sIdx < SEASONS_ORDER.length - 1) {
          return SEASONS_ORDER[sIdx + 1];
        }
        setSelectedYear((prevYr) => {
          const curIdx = records.findIndex((r) => r.year === prevYr);
          const nextIdx = (curIdx + 1) % records.length;
          return records[nextIdx]?.year ?? prevYr;
        });
        return SEASONS_ORDER[0];
      });
    }, 2800);
    return () => clearInterval(timer);
  }, [historyAutoPlay, records]);

  // All 4 seasons (Winter / Spring / Summer / Autumn) for the selected past year from real NASA monthly climatology
  const activeYearSeasonalBreakdown = useMemo<SeasonalNasaClimate[]>(() => {
    return SEASONS_ORDER.map((season) =>
      computeSeasonalNasaClimate(
        profile.nasaPower,
        activeRecord.nasaSummary.rainfallMm,
        activeRecord.nasaSummary.avgTempC,
        activeRecord.nasaSummary.rootMoisturePct,
        season
      )
    );
  }, [profile.nasaPower, activeRecord]);

  const activeSeasonClimate =
    activeYearSeasonalBreakdown.find((s) => s.seasonOfYear === selectedSeasonOfYear) ??
    activeYearSeasonalBreakdown[0];

  const activeYearSeasonDetails = useMemo(() => {
    const map: Partial<
      Record<DioramaSeasonOfYear, { weatherMode: SeasonalNasaClimate['weatherMode']; rainMm: number }>
    > = {};
    for (const s of activeYearSeasonalBreakdown) {
      map[s.seasonOfYear] = {
        weatherMode: s.weatherMode,
        rainMm: s.seasonRainMm,
      };
    }
    return map;
  }, [activeYearSeasonalBreakdown]);

  // Strictly Past-5-Year (2022-2026) x Per-Season (Winter/Spring/Summer/Autumn) 3D Field & Real NASA Rain Replay
  const pastDioramaFrames = useMemo<FarmDioramaFrame[]>(() => {
    return records.map((rec) => {
      const isCurrentYear = rec.year === farmDate.year;
      const isExactTodaySeason = isCurrentYear && selectedSeasonOfYear === currentSeasonOfYear;
      const sc = computeSeasonalNasaClimate(
        profile.nasaPower,
        rec.nasaSummary.rainfallMm,
        rec.nasaSummary.avgTempC,
        rec.nasaSummary.rootMoisturePct,
        selectedSeasonOfYear
      );
      const todayPheno = isExactTodaySeason
        ? computeDateAccurateGrowth(farmDate, 0, activeStrategy.steps[0])
        : null;

      return {
        id: `hist-${rec.year}-${selectedSeasonOfYear}`,
        label: isCurrentYear ? `${rec.year} (Now)` : String(rec.year),
        dateLabel: todayPheno
          ? `${todayPheno.dateLabel} · ${selectedSeasonOfYear}`
          : `${selectedSeasonOfYear} ${rec.year} (${sc.monthsLabel}) · NASA Archive`,
        era: isExactTodaySeason ? 'today' : 'past',
        seasonOfYear: selectedSeasonOfYear,
        cropName: rec.cropName,
        cropFamily: inferCropFamily(rec.cropName),
        cropColor: rec.cropColor,
        growthStage: todayPheno ? todayPheno.growthStage : sc.growthStage,
        growthLabel: todayPheno ? todayPheno.growthLabel : sc.growthLabel,
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
        summaryNote: `${selectedSeasonOfYear} ${rec.year} NASA: ${sc.seasonRainMm} mm rain (${sc.hasRain ? 'Rainy' : sc.weatherMode === 'frost' ? 'Frost' : sc.weatherMode === 'heatwave' ? 'Heatwave' : sc.weatherMode === 'drought' ? 'Dry' : 'Mild'}) · ${sc.tempC}°C · ${rec.cropName}`,
      };
    });
  }, [
    records,
    profile.nasaPower,
    farmDate,
    selectedSeasonOfYear,
    currentSeasonOfYear,
    activeStrategy.steps,
  ]);

  const pastFiveYearData = useMemo(
    () =>
      records.map((r) => ({
        year: String(r.year),
        crop: r.cropName,
        yieldT: r.yieldTha,
        rainfallMm: r.nasaSummary.rainfallMm,
        somPct: r.soilOrganicMatterPct,
        chemicalIndex: r.chemicalInputIndex,
        moisturePct: r.nasaSummary.rootMoisturePct,
        ndviPct: r.nasaSummary.ndviAvg === null ? null : Math.round(r.nasaSummary.ndviAvg * 100),
      })),
    [records]
  );

  const firstRec = records[0];
  const latestRec = records[records.length - 1];
  const yieldDeltaPct = firstRec
    ? Math.round(((latestRec.yieldTha - firstRec.yieldTha) / firstRec.yieldTha) * 100)
    : 0;
  const somDeltaTotal = firstRec
    ? Number((latestRec.soilOrganicMatterPct - firstRec.soilOrganicMatterPct).toFixed(2))
    : 0;
  const chemSavedTotal = firstRec
    ? Math.max(0, firstRec.chemicalInputIndex - latestRec.chemicalInputIndex)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Past 5-Year Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
            Past 5 Years Only · Historical Field &amp; NASA Archive
          </span>
          <h2 className="text-2xl sm:text-[1.75rem] font-extrabold text-[#111111]">
            Farm History: Strategy Evolution &amp; Past 5-Year Trends
          </h2>
          <p className="text-xs sm:text-sm text-[#3A3A3A]">
            Track every strategy switch on your {profile.areaHectares} ha field and review the past
            5 years ({firstRec?.year} to {latestRec?.year}) of harvest, soil, moisture, and NASA
            weather records.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-[#FFFEFB] p-1 rounded-full border border-[#CFCBC2] shadow-xs">
          {records.map((rec) => (
            <button
              key={rec.year}
              type="button"
              onClick={() => setSelectedYear(rec.year)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                activeRecord.year === rec.year
                  ? 'bg-[#007432] text-white shadow-xs'
                  : 'text-[#2E2E2E] hover:text-[#111111]'
              }`}
            >
              {rec.year}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 1: VISUAL STRATEGY CHANGE HISTORY ROADMAP */}
      <StrategyChangeRoadmap
        profile={profile}
        selectedStrategyId={selectedStrategyId}
        activeStrategy={activeStrategy}
        planCustomization={planCustomization}
        strategyHistory={strategyHistory}
      />

      {/* SECTION 1.5: STRICTLY PAST 5-YEAR x PER-SEASON 3D FIELD & REAL NASA RAIN REPLAY */}
      <div className="surface-card p-5 sm:p-6 space-y-4 bg-[#FFFEFB]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#007432]">
              Past 5-Year Seasonal 3D Planting &amp; NASA Rain Replay ({firstRec?.year}–{latestRec?.year})
            </span>
            <h3 className="text-lg font-extrabold text-[#111111]">
              Each Past Year by Season: Rain, Sun, Moisture &amp; Crop Growth
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            {activeSeasonClimate.hasRain && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#075985] border border-[#7DD3FC] font-extrabold">
                <CloudRain className="w-3.5 h-3.5 text-[#0284C7]" />
                Rainy Season · {activeSeasonClimate.seasonRainMm} mm
              </span>
            )}
            <span className="text-[#3A3A3A]">
              {selectedSeasonOfYear} {activeRecord.year}: {activeRecord.cropName} ·{' '}
              {activeSeasonClimate.seasonRainMm} mm ({activeRecord.nasaSummary.rainfallMm} mm/yr)
            </span>
          </div>
        </div>

        <IsometricFarmDiorama
          frames={pastDioramaFrames}
          activeFrameIndex={activeHistoryIdx}
          onSelectFrame={(idx) => {
            setHistoryAutoPlay(false);
            const yr = records[idx]?.year;
            if (yr) setSelectedYear(yr);
          }}
          seasonTabs={{
            seasons: SEASONS_ORDER,
            activeSeason: selectedSeasonOfYear,
            onSelectSeason: (s) => {
              setHistoryAutoPlay(false);
              setSelectedSeasonOfYear(s);
            },
            yearLabel: String(activeRecord.year),
            seasonDetails: activeYearSeasonDetails,
          }}
          slopeDeg={profile.slopeDeg}
          soilType={profile.soilType}
          irrigationType={profile.irrigationType}
          areaHectares={profile.areaHectares}
          isAutoPlaying={historyAutoPlay}
          onToggleAutoPlay={() => setHistoryAutoPlay((p) => !p)}
          compact
        />

        {/* Interactive 4-Season NASA Rainfall & Field Summary for Selected Past Year */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          {activeYearSeasonalBreakdown.map((sc) => {
            const isSelected = sc.seasonOfYear === selectedSeasonOfYear;
            const badge =
              sc.weatherMode === 'rain'
                ? {
                    label: 'Rainy',
                    cls: 'bg-[#E0F2FE] text-[#075985] border-[#7DD3FC]',
                    icon: <CloudRain className="w-3 h-3 text-[#0284C7]" />,
                  }
                : sc.weatherMode === 'frost'
                  ? {
                      label: 'Frost',
                      cls: 'bg-[#E0F2FE] text-[#0369A1] border-[#93C5FD]',
                      icon: <Snowflake className="w-3 h-3 text-[#0284C7]" />,
                    }
                  : sc.weatherMode === 'heatwave'
                    ? {
                        label: 'Heatwave',
                        cls: 'bg-[#FEF3C7] text-[#92400E] border-[#FCD34D]',
                        icon: <Sun className="w-3 h-3 text-[#D97706]" />,
                      }
                    : sc.weatherMode === 'drought'
                      ? {
                          label: 'Dry',
                          cls: 'bg-[#FDF6DC] text-[#6E5100] border-[#EBD58B]',
                          icon: <Sun className="w-3 h-3 text-[#B45309]" />,
                        }
                      : {
                          label: 'Mild',
                          cls: 'bg-[#E3F5EB] text-[#005222] border-[#A8DEC0]',
                          icon: <Wind className="w-3 h-3 text-[#007432]" />,
                        };

            return (
              <button
                key={`${activeRecord.year}-${sc.seasonOfYear}`}
                type="button"
                onClick={() => {
                  setHistoryAutoPlay(false);
                  setSelectedSeasonOfYear(sc.seasonOfYear);
                }}
                className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-[#111111] text-white border-[#111111] shadow-sm'
                    : sc.hasRain
                      ? 'bg-[#F0F9FF] text-[#111111] border-[#BAE6FD] hover:border-[#0284C7]'
                      : 'bg-[#F7F6F2] text-[#111111] border-[#E5E2D9] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div>
                    <div
                      className={`text-xs font-extrabold ${
                        isSelected ? 'text-[#EBB40E]' : 'text-[#111111]'
                      }`}
                    >
                      {sc.seasonOfYear} {activeRecord.year}
                    </div>
                    <div
                      className={`text-[10.5px] font-semibold ${
                        isSelected ? 'text-white/75' : 'text-[#4A4A4A]'
                      }`}
                    >
                      {sc.monthsLabel}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-extrabold ${badge.cls}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between gap-2">
                  <span
                    className={`text-sm font-extrabold ${
                      isSelected
                        ? 'text-[#7DD3FC]'
                        : sc.hasRain
                          ? 'text-[#0369A1]'
                          : 'text-[#111111]'
                    }`}
                  >
                    {sc.seasonRainMm} mm rain
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      isSelected ? 'text-white/85' : 'text-[#3A3A3A]'
                    }`}
                  >
                    {sc.tempC}°C · {sc.moisturePct}% moist
                  </span>
                </div>
                <div
                  className={`mt-1 text-[10.5px] font-semibold truncate ${
                    isSelected ? 'text-white/80' : 'text-[#3A3A3A]'
                  }`}
                >
                  {sc.growthLabel}
                  {sc.heavyRainDays >= 0.5 ? ` · ${sc.heavyRainDays} heavy rain d` : ''}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: ANIMATED PAST 5-YEAR GRAPHS (STRICTLY HISTORICAL, ZERO FUTURE) */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#007432]">
              5-Year Historical Analytics ({firstRec?.year} to {latestRec?.year})
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-[#111111]">
              Past 5 Years Field Performance Graphs
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-extrabold">
            <span className="px-3 py-1 rounded-full bg-[#E3F5EB] text-[#005222] border border-[#A9DEC0]">
              Yield: {yieldDeltaPct >= 0 ? `+${yieldDeltaPct}%` : `${yieldDeltaPct}%`} over 5 yrs
            </span>
            <span className="px-3 py-1 rounded-full bg-[#ECF7DC] text-[#2F4D00] border border-[#C5E49A]">
              Organic Matter: {somDeltaTotal >= 0 ? `+${somDeltaTotal}%` : `${somDeltaTotal}%`}
            </span>
            <span className="px-3 py-1 rounded-full bg-[#FDF6DC] text-[#6E5100] border border-[#EBD58B]">
              Chemicals: -{chemSavedTotal}% vs {firstRec?.year}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Animated Past Graph 1: Harvest Yield (t/ha) vs. Past NASA Annual Rainfall (mm) */}
          <div className="surface-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#007432]">
                  <Wheat className="w-3.5 h-3.5 text-[#946D00]" />
                  Past Harvest vs. Rainfall
                </div>
                <h4 className="text-base font-extrabold text-[#111111] mt-0.5">
                  5-Year Harvest Yield &amp; NASA Rainfall ({firstRec?.year}–{latestRec?.year})
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#F5F4F0] border border-[#DFDDD6] text-[11px] font-extrabold text-[#111111]">
                {activeRecord.year}: {activeRecord.yieldTha} t/ha
              </span>
            </div>

            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={pastFiveYearData}
                  margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="histYieldBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00873A" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#44BE7E" stopOpacity={0.75} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="yield"
                    tick={{ fontSize: 11, fill: '#007432', fontWeight: 700 }}
                    unit=" t"
                  />
                  <YAxis
                    yAxisId="rain"
                    orientation="right"
                    tick={{ fontSize: 11, fill: '#0F7B8A', fontWeight: 700 }}
                    unit=" mm"
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
                  <Bar
                    yAxisId="yield"
                    dataKey="yieldT"
                    name="Harvest Yield (t/ha)"
                    fill="url(#histYieldBarGrad)"
                    radius={[8, 8, 0, 0]}
                    barSize={32}
                    isAnimationActive
                    animationBegin={120}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                  <Line
                    yAxisId="rain"
                    type="monotone"
                    dataKey="rainfallMm"
                    name="NASA Rainfall (mm)"
                    stroke="#0F7B8A"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#0F7B8A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#0F7B8A', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive
                    animationBegin={280}
                    animationDuration={1250}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Animated Past Graph 2: Soil Organic Matter (%) vs. Chemical Input Index */}
          <div className="surface-card p-5 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#3F6300]">
                  <FlaskConical className="w-3.5 h-3.5 text-[#946D00]" />
                  Past Soil Health vs. Chemical Use
                </div>
                <h4 className="text-base font-extrabold text-[#111111] mt-0.5">
                  Organic Matter Recovery &amp; Fertilizer Drop ({firstRec?.year}–{latestRec?.year})
                </h4>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#E3F5EB] border border-[#A9DEC0] text-[11px] font-extrabold text-[#005222]">
                SOM: {activeRecord.soilOrganicMatterPct}%
              </span>
            </div>

            <div className="h-[230px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={pastFiveYearData}
                  margin={{ top: 10, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="histSomAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00873A" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#00873A" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 700 }}
                  />
                  <YAxis
                    yAxisId="som"
                    domain={[1.4, 2.8]}
                    tick={{ fontSize: 11, fill: '#007432', fontWeight: 700 }}
                    unit="%"
                  />
                  <YAxis
                    yAxisId="chem"
                    orientation="right"
                    domain={[50, 105]}
                    tick={{ fontSize: 11, fill: '#B88400', fontWeight: 700 }}
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
                  <Area
                    yAxisId="som"
                    type="monotone"
                    dataKey="somPct"
                    name="Soil Organic Matter (%)"
                    stroke="#00873A"
                    strokeWidth={3.2}
                    fill="url(#histSomAreaGrad)"
                    dot={{ r: 5, fill: '#00873A', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#00873A', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive
                    animationBegin={140}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Line
                    yAxisId="chem"
                    type="monotone"
                    dataKey="chemicalIndex"
                    name="Chemical Input Index (100 = Base)"
                    stroke="#D49B00"
                    strokeWidth={3}
                    strokeDasharray="6 4"
                    className="chart-flow-dash"
                    dot={{ r: 5, fill: '#EBB40E', stroke: '#111111', strokeWidth: 1.5 }}
                    activeDot={{ r: 7, fill: '#EBB40E', stroke: '#111111', strokeWidth: 2 }}
                    isAnimationActive
                    animationBegin={320}
                    animationDuration={1300}
                    animationEasing="ease-out"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Animated Past Graph 3: Past Root-Zone Soil Moisture & Crop Canopy Cover (NDVI) */}
          <div className="surface-card p-5 space-y-3 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#0F7B8A]">
                  <Sprout className="w-3.5 h-3.5 text-[#3F6300]" />
                  Past Satellite Moisture &amp; Crop Greenness Archive
                </div>
                <h4 className="text-base font-extrabold text-[#111111] mt-0.5">
                  5-Year Soil Moisture (%) &amp; Crop Cover Index ({firstRec?.year}–{latestRec?.year})
                </h4>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-extrabold">
                <span className="px-2.5 py-1 rounded-full bg-[#E0F2FE] text-[#075985] border border-[#7DD3FC]">
                  {activeRecord.year} Moisture: {activeRecord.nasaSummary.rootMoisturePct}%
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#ECF7DC] text-[#2F4D00] border border-[#C5E49A]">
                  {activeRecord.year} Canopy NDVI: {activeRecord.nasaSummary.ndviAvg === null ? 'unavailable' : activeRecord.nasaSummary.ndviAvg.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={pastFiveYearData}
                  margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="histMoistArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0284C7" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#0284C7" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="histNdviArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4E7A00" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4E7A00" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E2D9" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12, fill: '#2E2E2E', fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[20, 95]}
                    tick={{ fontSize: 11, fill: '#2E2E2E', fontWeight: 700 }}
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
                  <Area
                    type="monotone"
                    dataKey="moisturePct"
                    name="Root-Zone Soil Moisture (%)"
                    stroke="#0284C7"
                    strokeWidth={3}
                    fill="url(#histMoistArea)"
                    dot={{ r: 5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive
                    animationBegin={160}
                    animationDuration={1200}
                    animationEasing="ease-out"
                  />
                  <Area
                    type="monotone"
                    dataKey="ndviPct"
                    name="Crop Cover / Greenness Index (%)"
                    stroke="#4E7A00"
                    strokeWidth={3}
                    fill="url(#histNdviArea)"
                    dot={{ r: 5, fill: '#4E7A00', stroke: '#FFFFFF', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#4E7A00', stroke: '#FFFFFF', strokeWidth: 2.5 }}
                    isAnimationActive
                    animationBegin={320}
                    animationDuration={1300}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: SELECTED PAST SEASON DETAIL CARD + COMPLETE PAST SEASONS LOG */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        <div className="xl:col-span-5 surface-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00873A]">
              <History className="w-4 h-4" />
              {activeRecord.year} Past Season Snapshot
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#EBB40E] text-xs font-extrabold text-[#111111]">
              {activeRecord.cropName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]">
                <Wheat className="w-3.5 h-3.5 text-[#946D00]" />
                Harvest Yield
              </div>
              <div className="text-lg font-extrabold text-[#111111] mt-1">
                {activeRecord.yieldTha} t/ha
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]">
                <CloudRain className="w-3.5 h-3.5 text-[#0F7B8A]" />
                {selectedSeasonOfYear} Rainfall
              </div>
              <div className="text-lg font-extrabold text-[#111111] mt-1">
                {activeSeasonClimate.seasonRainMm} mm
              </div>
              <div className="text-[10.5px] font-semibold text-[#4A4A4A] mt-0.5">
                Annual total: {activeRecord.nasaSummary.rainfallMm} mm
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]">
                <Droplets className="w-3.5 h-3.5 text-[#007432]" />
                {selectedSeasonOfYear} Moisture
              </div>
              <div className="text-lg font-extrabold text-[#111111] mt-1">
                {activeSeasonClimate.moisturePct}%
              </div>
              <div className="text-[10.5px] font-semibold text-[#4A4A4A] mt-0.5">
                Annual avg: {activeRecord.nasaSummary.rootMoisturePct}%
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#E5E3DB]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#3A3A3A]">
                <Leaf className="w-3.5 h-3.5 text-[#3F6300]" />
                Organic Matter
              </div>
              <div className="text-lg font-extrabold text-[#007432] mt-1">
                {activeRecord.soilOrganicMatterPct}%{' '}
                <span className="text-xs font-bold">
                  ({activeRecord.somDeltaPct >= 0 ? '+' : ''}
                  {activeRecord.somDeltaPct}%)
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#E3F5EB]/70 border border-[#A8DEC0] space-y-2">
            <div className="text-xs font-extrabold uppercase tracking-wider text-[#005222]">
              {activeRecord.year} Soil &amp; Field Note
            </div>
            <p className="text-xs sm:text-sm text-[#1E1E1E] leading-relaxed">
              {activeRecord.soilNotes}
            </p>
            <ul className="space-y-1.5 pt-1">
              {activeRecord.farmerActions.map((act) => (
                <li key={act} className="flex items-start gap-2 text-xs text-[#005222] font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#007432]" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E8E5DC]">
            <span className="text-[#3A3A3A] font-medium">Chemical Input Level (100 = Base):</span>
            <span className="font-extrabold text-[#111111]">
              {activeRecord.chemicalInputIndex}% ({100 - activeRecord.chemicalInputIndex}% saved)
            </span>
          </div>
        </div>

        <div className="xl:col-span-7 surface-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E8E5DC] flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-extrabold text-[#111111]">
              Complete Past Seasons Log ({firstRec?.year}–{latestRec?.year})
            </h3>
            <span className="text-xs font-medium text-[#3A3A3A]">
              Click any past year to inspect details
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#F5F4F0] text-xs uppercase tracking-wider text-[#2E2E2E]">
                <tr>
                  <th className="px-4 py-3.5">Year</th>
                  <th className="px-4 py-3.5">Crop Grown</th>
                  <th className="px-4 py-3.5">NASA Weather</th>
                  <th className="px-4 py-3.5">Harvest &amp; Soil</th>
                  <th className="px-4 py-3.5">Chemicals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E5DC]">
                {records
                  .slice()
                  .reverse()
                  .map((rec) => {
                    const selected = rec.year === activeRecord.year;
                    return (
                      <tr
                        key={rec.year}
                        onClick={() => setSelectedYear(rec.year)}
                        className={`cursor-pointer transition ${
                          selected ? 'bg-[#E3F5EB]/70' : 'hover:bg-[#F5F4F0]'
                        }`}
                      >
                        <td className="px-4 py-3.5 font-extrabold text-[#111111] whitespace-nowrap">
                          {rec.year}
                          <span className="block text-[11px] font-medium text-[#3A3A3A]">
                            {rec.seasonLabel}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-2 font-extrabold text-[#111111]">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: rec.cropColor }}
                            />
                            {rec.cropName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-[#2E2E2E] whitespace-nowrap">
                          <div className="font-semibold">
                            {rec.nasaSummary.rainfallMm} mm · {rec.nasaSummary.avgTempC}°C
                          </div>
                          <div className="text-[#007432] font-bold mt-0.5">
                            Moisture: {rec.nasaSummary.rootMoisturePct}%
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-extrabold text-[#111111] whitespace-nowrap">
                          {rec.yieldTha} t/ha
                          <span className="block text-xs font-bold text-[#007432] mt-0.5">
                            SOM: {rec.soilOrganicMatterPct}%
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-extrabold text-[#111111] whitespace-nowrap">
                          {rec.chemicalInputIndex}%
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SECTION 4: 12-MONTH HISTORICAL NASA FIELD RISK MATRIX (2021-2025 PAST ARCHIVE) */}
      <RiskCalendarMatrix
        nasa={profile.nasaPower}
        countryName={profile.countryName}
        countryCode={profile.countryCode}
        lng={profile.coordinates.lng}
      />
    </div>
  );
};
