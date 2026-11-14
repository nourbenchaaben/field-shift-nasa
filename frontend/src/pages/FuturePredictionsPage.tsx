import React, { useMemo } from 'react';
import { useFarm } from '../context/FarmContext';
import { computeUnifiedFiveYearForecast } from '../data/decisionEngine';
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
  CalendarDays,
  CloudRain,
  Droplets,
  Leaf,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

const SCENARIO_OPTIONS: { id: ClimateScenario; label: string }[] = [
  { id: 'normal', label: 'Normal Weather' },
  { id: 'drought', label: 'Dry / Drought Year' },
  { id: 'wet', label: 'Wet / High Rain' },
];

export const FuturePredictionsPage: React.FC = () => {
  const {
    profile,
    activeStrategy,
    contractSettings,
    updateContractSettings,
    navigate,
  } = useFarm();

  const scenario = contractSettings.scenario;

  const { points, year5Highlights } = useMemo(() => {
    const base = computeUnifiedFiveYearForecast(activeStrategy, profile);
    const climateMult = scenario === 'drought' ? 0.91 : scenario === 'wet' ? 1.05 : 1;
    const adjusted = base.points.map((pt) => ({
      ...pt,
      harvestYieldStrategy: Number((pt.harvestYieldStrategy * climateMult).toFixed(2)),
      harvestYieldBaseline: Number(
        (pt.harvestYieldBaseline * (scenario === 'drought' ? 0.8 : climateMult)).toFixed(2)
      ),
    }));
    return { points: adjusted, year5Highlights: base.year5Highlights };
  }, [activeStrategy, profile, scenario]);

  const today = points[0];
  const year5 = points[points.length - 1];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
            5-Year Multi-Season Farm Outlook
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            Future Predictions — Before vs. After Rotation
          </h2>
          <p className="text-xs sm:text-sm text-[#6F6F6F]">
            Forecasting <strong>{activeStrategy.title}</strong> across your {profile.areaHectares}{' '}
            ha field in {profile.countryFlag} {profile.countryName}.
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
            onClick={() => navigate('calendar')}
            className="btn-pill btn-pill-green text-xs !px-4 !py-2"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Open Farm Calendar
          </button>
        </div>
      </div>

      {/* Weather Scenario Switcher */}
      <div className="surface-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-extrabold text-[#111111]">
          <CloudRain className="w-4 h-4 text-[#00873A]" />
          <span>Test Future Weather Conditions:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {SCENARIO_OPTIONS.map((opt) => {
            const active = scenario === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() =>
                  updateContractSettings({
                    scenario: opt.id,
                    rain_change_pct: opt.id === 'drought' ? -22 : opt.id === 'wet' ? 20 : 0,
                  })
                }
                className={`px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer ${
                  active
                    ? 'bg-[#00873A] text-white border-[#00873A]'
                    : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* BEFORE & AFTER 5-YEAR COMPARISON CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#00873A]">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F6F6F]">
            <span>Soil Fertility (Organic Matter)</span>
            <Leaf className="w-4 h-4 text-[#00873A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#979797] line-through">
              {today.soilFertilityBaseline}%
            </span>
            <span className="text-2xl font-extrabold text-[#00873A]">
              {year5.soilFertilityStrategy}%
            </span>
          </div>
          <p className="text-xs text-[#474747]">
            +{year5Highlights.soilFertilityPctGain}% richer topsoil by Year 5 from natural legume
            nitrogen &amp; living cover.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#EBB40E]">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F6F6F]">
            <span>Reduced Chemical Usage</span>
            <ShieldCheck className="w-4 h-4 text-[#A17800]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#979797] line-through">100%</span>
            <span className="text-2xl font-extrabold text-[#111111]">
              -{year5Highlights.chemicalSavedPct}% Less
            </span>
          </div>
          <p className="text-xs text-[#474747]">
            Est. ~${year5Highlights.estimatedCostSavedUsd.toLocaleString()}/yr saved on inputs
            across {profile.areaHectares} ha.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#1696A8]">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F6F6F]">
            <span>Water Efficiency</span>
            <Droplets className="w-4 h-4 text-[#1696A8]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#979797] line-through">
              {today.waterEfficiencyBaseline}
            </span>
            <span className="text-2xl font-extrabold text-[#1696A8]">
              {year5.waterEfficiencyStrategy} kg/m³
            </span>
          </div>
          <p className="text-xs text-[#474747]">
            Saves ~{year5Highlights.waterSavedM3PerYear.toLocaleString()} m³/yr by holding moisture
            deep in the soil.
          </p>
        </div>

        <div className="surface-card p-5 space-y-2 border-t-4 border-t-[#44BE7E]">
          <div className="flex items-center justify-between text-xs font-bold text-[#6F6F6F]">
            <span>Expected Harvest Yield</span>
            <TrendingUp className="w-4 h-4 text-[#00873A]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-[#979797] line-through">
              {year5.harvestYieldBaseline} t/ha
            </span>
            <span className="text-2xl font-extrabold text-[#111111]">
              {year5.harvestYieldStrategy} t/ha
            </span>
          </div>
          <p className="text-xs text-[#474747]">
            +{year5Highlights.yieldIncreasePct}% stronger annual harvests than repeating the same
            crop.
          </p>
        </div>
      </div>

      {/* YEAR 1-5 INTERACTIVE BEFORE VS AFTER CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="surface-card p-5 space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00873A]">
              5-Year Soil Fertility Trend
            </span>
            <h3 className="text-base font-extrabold text-[#111111]">
              Soil Organic Matter (%): With Rotation vs. Without
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              Higher organic matter means darker, sponge-like soil that feeds crops naturally.
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="soilAfterGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00873A" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#00873A" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis domain={[1.4, 3.6]} tick={{ fontSize: 11, fill: '#474747' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #D9D9D9',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area
                  type="monotone"
                  dataKey="soilFertilityStrategy"
                  name="After Rotation (%)"
                  stroke="#00873A"
                  strokeWidth={3}
                  fill="url(#soilAfterGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="soilFertilityBaseline"
                  name="Before / No Rotation (%)"
                  stroke="#979797"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5 space-y-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A17800]">
              5-Year Harvest Outlook
            </span>
            <h3 className="text-base font-extrabold text-[#111111]">
              Expected Harvest Yield (tons/ha) — Before vs. After
            </h3>
            <p className="text-xs text-[#6F6F6F]">
              Projected harvest volume per hectare under <strong>{scenario}</strong> weather.
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="yearLabel" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis tick={{ fontSize: 11, fill: '#474747' }} unit="t" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #D9D9D9',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar
                  dataKey="harvestYieldBaseline"
                  name="Before (Same Crop)"
                  fill="#C7C5BE"
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
        <div className="px-5 py-4 border-b border-[#EFECE6] flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111111] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00873A]" />
            Year-by-Year Before &amp; After Progress (Today → Year 5)
          </h3>
          <span className="text-xs font-bold text-[#00873A]">
            Sustainability Score: {year5Highlights.sustainabilityScore}/100
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5F4F0] text-[11px] uppercase tracking-wider text-[#6F6F6F]">
              <tr>
                <th className="px-5 py-3">Horizon</th>
                <th className="px-5 py-3">Soil Organic Matter</th>
                <th className="px-5 py-3">Chemical Input Level</th>
                <th className="px-5 py-3">Water Efficiency</th>
                <th className="px-5 py-3">Expected Yield</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
              {points.map((row) => (
                <tr key={row.yearLabel} className="hover:bg-[#F5F4F0]/60">
                  <td className="px-5 py-3.5 font-extrabold text-[#111111]">{row.yearLabel}</td>
                  <td className="px-5 py-3.5">
                    <span className="font-extrabold text-[#00873A]">
                      {row.soilFertilityStrategy}%
                    </span>{' '}
                    <span className="text-xs text-[#6F6F6F]">
                      (vs {row.soilFertilityBaseline}%)
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#111111]">
                    {row.chemicalUsageStrategy}% of today{' '}
                    <span className="text-xs text-[#00873A]">
                      ({Math.max(0, 100 - row.chemicalUsageStrategy)}% saved)
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-[#1696A8]">
                    {row.waterEfficiencyStrategy} kg/m³
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-[#111111]">
                    {row.harvestYieldStrategy} t/ha{' '}
                    <span className="text-xs font-normal text-[#6F6F6F]">
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
