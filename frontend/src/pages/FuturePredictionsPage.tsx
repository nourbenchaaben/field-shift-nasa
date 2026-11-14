import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Award,
  Droplets,
  FlaskConical,
  Leaf,
  Sparkles,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFarm } from '../context/FarmContext';
import { computeFiveYearForecast, CROPS, ZONE_IDS } from '../data/agronomyData';

export const FuturePredictionsPage: React.FC = () => {
  const { profile, strategy, navigate } = useFarm();
  const [horizonYear, setHorizonYear] = useState<number>(5);

  const forecast = useMemo(
    () => computeFiveYearForecast(strategy, profile),
    [strategy, profile]
  );

  const visibleYears = useMemo(
    () => forecast.years.slice(0, horizonYear + 1),
    [forecast.years, horizonYear]
  );

  const baselinePoint = forecast.years[0];
  const selectedYearPoint = forecast.years[horizonYear] ?? forecast.years[5];

  const yieldDeltaPct = Math.round(
    ((selectedYearPoint.yieldStrategy - selectedYearPoint.yieldBaseline) /
      selectedYearPoint.yieldBaseline) *
      100
  );
  const waterEffDeltaPct = Math.round(
    ((selectedYearPoint.waterEffStrategy - selectedYearPoint.waterEffBaseline) /
      selectedYearPoint.waterEffBaseline) *
      100
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO FORECAST BANNER — "State of the Farm After Chosen Strategy" */}
      <section className="bg-[#00873A] text-white rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-[#00873A]">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-survey-pattern-light opacity-40 pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-24 w-72 h-72 rounded-full border-[20px] border-white/15"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-[700px]">
            <div className="inline-flex items-center gap-2 bg-white/15 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest text-[#92D500]">
              <Sparkles className="w-3.5 h-3.5" />
              State of the Farm After Chosen Strategy
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight text-white">
              Multi-Year Regenerative Forecast: {strategy.name}
            </h2>
            <p className="text-sm text-white/90 leading-relaxed">
              Comparing your approved 4-zone rotation (
              {ZONE_IDS.map((z) => CROPS[strategy.seasons[0].zones[z].cropId]?.name).join(', ')}) on{' '}
              <strong>{profile.areaHectares} ha</strong> of {profile.soilType} land against a
              no-rotation monoculture baseline through{' '}
              <strong>Year {horizonYear} ({2026 + horizonYear})</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
            {/* Horizon Year Selector */}
            <div className="bg-[#111111]/40 backdrop-blur-xs p-1.5 rounded-full border border-white/20 inline-flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => setHorizonYear(yr)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                    horizonYear === yr
                      ? 'bg-[#EBB40E] text-[#111111]'
                      : 'text-white/85 hover:bg-white/10'
                  }`}
                >
                  Yr {yr}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('rotation-lab')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white text-[#111111] hover:bg-[#EBB40E] text-xs font-extrabold transition cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Adjust Strategy in Rotation Lab
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Before vs After Summary Stat Strip */}
        <div className="relative z-10 mt-7 pt-6 border-t border-white/20 grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">
              Soil Organic Matter (Yr {horizonYear})
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-tech text-2xl sm:text-3xl font-extrabold text-[#92D500]">
                {selectedYearPoint.somStrategy}%
              </span>
              <span className="font-mono-tech text-xs text-white/75">
                vs {selectedYearPoint.somBaseline}% base
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">
              Expected Yield Advantage
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-tech text-2xl sm:text-3xl font-extrabold text-[#EBB40E]">
                +{yieldDeltaPct}%
              </span>
              <span className="font-mono-tech text-xs text-white/75">
                {selectedYearPoint.yieldStrategy} t/ha
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">
              Water Efficiency Gain
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-tech text-2xl sm:text-3xl font-extrabold text-white">
                +{waterEffDeltaPct}%
              </span>
              <span className="font-mono-tech text-xs text-white/75">
                {forecast.year5Summary.waterSavedM3PerYear.toLocaleString()} m³/yr
              </span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/15">
            <div className="text-[11px] font-bold uppercase tracking-wider text-white/75">
              Sustainability Score
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="font-mono-tech text-2xl sm:text-3xl font-extrabold text-[#92D500]">
                {selectedYearPoint.sustainStrategy}
                <span className="text-base text-white/70">/100</span>
              </span>
              <span className="font-mono-tech text-xs text-[#EBB40E]">
                +{selectedYearPoint.sustainStrategy - selectedYearPoint.sustainBaseline} pts
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* BEFORE-AND-AFTER COMPARISON CHARTS (2x2 GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Soil Fertility & Organic Matter (%) */}
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Sprout className="w-4 h-4 text-[#00873A]" />
                Soil Fertility &amp; Organic Matter (%)
              </h3>
              <p className="text-xs text-[#6F6F6F] mt-0.5">
                Regenerative humus accumulation vs. monoculture depletion
              </p>
            </div>
            <span className="font-mono-tech text-xs font-extrabold bg-[#E3F5EB] text-[#005A26] px-2.5 py-1 rounded-full">
              +{(selectedYearPoint.somStrategy - selectedYearPoint.somBaseline).toFixed(2)}% Gap
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visibleYears}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="somStrategyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00873A" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#00873A" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis unit="%" domain={[1.4, 3.8]} tick={{ fontSize: 11, fill: '#474747' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    border: '1px solid #D9D9D9',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="somStrategy"
                  name="With Approved Rotation (%)"
                  stroke="#00873A"
                  strokeWidth={3}
                  fill="url(#somStrategyFill)"
                />
                <Line
                  type="monotone"
                  dataKey="somBaseline"
                  name="Baseline Without Rotation (%)"
                  stroke="#979797"
                  strokeWidth={2.2}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Expected Crop Yield (t/ha) */}
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#EBB40E]" />
                Expected Crop Yield (t/ha Equivalent)
              </h3>
              <p className="text-xs text-[#6F6F6F] mt-0.5">
                Compounding legume-cereal synergy vs. continuous cropping yield drag
              </p>
            </div>
            <span className="font-mono-tech text-xs font-extrabold bg-[#FDF6DC] text-[#7A5B00] px-2.5 py-1 rounded-full">
              +{yieldDeltaPct}% Uplift
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={visibleYears}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis unit=" t" domain={[3, 7.5]} tick={{ fontSize: 11, fill: '#474747' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    border: '1px solid #D9D9D9',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar
                  dataKey="yieldBaseline"
                  name="Baseline (No Rotation)"
                  fill="#C8C6BE"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="yieldStrategy"
                  name="Approved Rotation Strategy"
                  fill="#EBB40E"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Water Efficiency (kg yield / m³ water) */}
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-[#1696A8]" />
                Water Productivity (kg Crop / m³ Water)
              </h3>
              <p className="text-xs text-[#6F6F6F] mt-0.5">
                Higher humus retention &amp; drought-matched canopies maximize every cubic meter
              </p>
            </div>
            <span className="font-mono-tech text-xs font-extrabold bg-[#E0F3F8] text-[#0A6E8A] px-2.5 py-1 rounded-full">
              -{strategy.summaryMetrics.waterSavingsPct}% Water Use
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleYears}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis domain={[0.9, 2.1]} tick={{ fontSize: 11, fill: '#474747' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    border: '1px solid #D9D9D9',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line
                  type="monotone"
                  dataKey="waterEffStrategy"
                  name="Approved Rotation (kg/m³)"
                  stroke="#1696A8"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1696A8' }}
                />
                <Line
                  type="monotone"
                  dataKey="waterEffBaseline"
                  name="Baseline Monoculture (kg/m³)"
                  stroke="#979797"
                  strokeWidth={2.2}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Overall Farm Sustainability Score (0-100) */}
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#00873A]" />
                Overall Farm Sustainability Score (0–100)
              </h3>
              <p className="text-xs text-[#6F6F6F] mt-0.5">
                Composite score of biodiversity, carbon storage, soil N &amp; economic stability
              </p>
            </div>
            <span className="font-mono-tech text-xs font-extrabold bg-[#111111] text-[#92D500] px-2.5 py-1 rounded-full">
              {selectedYearPoint.sustainStrategy} / 100
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={visibleYears}
                margin={{ top: 10, right: 12, left: -12, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="sustainFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#92D500" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#92D500" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis domain={[30, 100]} tick={{ fontSize: 11, fill: '#474747' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    border: '1px solid #D9D9D9',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area
                  type="monotone"
                  dataKey="sustainStrategy"
                  name="With Approved Rotation"
                  stroke="#00873A"
                  strokeWidth={3}
                  fill="url(#sustainFill)"
                />
                <Line
                  type="monotone"
                  dataKey="sustainBaseline"
                  name="Baseline Without Rotation"
                  stroke="#979797"
                  strokeWidth={2.2}
                  strokeDasharray="6 4"
                  dot={{ r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Executive Panel: Multi-Axis Ecological Radar + Year 0 vs Year 5 Transformation Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-3">
          <div>
            <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
              <Leaf className="w-4 h-4 text-[#00873A]" />
              6-Dimension Farm Resilience Radar
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              Before (No Rotation) vs. After 5 Years of {strategy.name}
            </p>
          </div>

          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={forecast.radarComparison}>
                <PolarGrid stroke="#E2E0D8" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#111111', fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#6F6F6F' }} />
                <Radar
                  name="Without Rotation"
                  dataKey="baseline"
                  stroke="#979797"
                  fill="#979797"
                  fillOpacity={0.22}
                />
                <Radar
                  name="Approved Strategy"
                  dataKey="strategy"
                  stroke="#00873A"
                  fill="#92D500"
                  fillOpacity={0.42}
                  strokeWidth={2.5}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Before & After Estate Transformation Table */}
        <div className="lg:col-span-7 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-lg font-bold text-[#111111]">
              Before vs. After Estate Transformation ({profile.areaHectares} ha)
            </h3>
            <p className="text-xs text-[#6F6F6F] mt-0.5">
              Quantified 5-year environmental and economic return on {profile.farmName}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
                Carbon Sequestered
              </div>
              <div className="font-mono-tech text-2xl font-extrabold text-[#00873A] mt-1">
                {forecast.year5Summary.carbonSequesteredTons} t
              </div>
              <div className="text-xs text-[#474747] mt-1">
                CO₂e locked in topsoil across 5 years
              </div>
            </div>

            <div className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
                Annual Water Saved
              </div>
              <div className="font-mono-tech text-2xl font-extrabold text-[#1696A8] mt-1">
                {forecast.year5Summary.waterSavedM3PerYear.toLocaleString()}
              </div>
              <div className="text-xs text-[#474747] mt-1">
                Cubic meters conserved per season
              </div>
            </div>

            <div className="bg-[#FDF6DC] border border-[#EBB40E] rounded-xl p-4">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#7A5B00]">
                Year 5 Extra Net Margin
              </div>
              <div className="font-mono-tech text-2xl font-extrabold text-[#111111] mt-1">
                +${forecast.year5Summary.extraNetRevenueUsd.toLocaleString()}
              </div>
              <div className="text-xs text-[#7A5B00] mt-1">
                Annual estate advantage over baseline
              </div>
            </div>
          </div>

          {/* Side-by-side Year 0 vs Year 5 Metrics Bar */}
          <div className="bg-[#F5F4F0] rounded-xl p-4 border border-[#E2E0D8] space-y-3">
            {[
              {
                label: 'Soil Organic Matter',
                before: `${baselinePoint.somBaseline}%`,
                after: `${selectedYearPoint.somStrategy}%`,
                pct: Math.min(100, Math.round((selectedYearPoint.somStrategy / 3.5) * 100)),
              },
              {
                label: 'Estate Crop Yield Index',
                before: `${baselinePoint.yieldBaseline} t/ha`,
                after: `${selectedYearPoint.yieldStrategy} t/ha`,
                pct: Math.min(100, Math.round((selectedYearPoint.yieldStrategy / 7.2) * 100)),
              },
              {
                label: 'Sustainability Index',
                before: `${baselinePoint.sustainBaseline} / 100`,
                after: `${selectedYearPoint.sustainStrategy} / 100`,
                pct: selectedYearPoint.sustainStrategy,
              },
            ].map((row) => (
              <div key={row.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#111111]">{row.label}</span>
                  <span className="font-mono-tech">
                    <span className="text-[#6F6F6F]">{row.before}</span>
                    <span className="mx-1.5 text-[#00873A] font-bold">→</span>
                    <strong className="text-[#00873A]">{row.after}</strong>
                  </span>
                </div>
                <div className="h-2 bg-[#E2E0D8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#00873A] rounded-full transition-all duration-500"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
