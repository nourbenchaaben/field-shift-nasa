import React, { useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import { buildUnifiedHistoryRecords } from '../data/decisionEngine';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CheckCircle2, CloudRain, Droplets, History, Leaf, Wheat } from 'lucide-react';

export const FarmHistoryPage: React.FC = () => {
  const { profile, activeStrategy } = useFarm();

  const records = useMemo(
    () => buildUnifiedHistoryRecords(profile, activeStrategy),
    [profile, activeStrategy]
  );
  const [selectedYear, setSelectedYear] = useState<number>(records[records.length - 1]?.year ?? 2026);

  const activeRecord =
    records.find((r) => r.year === selectedYear) ?? records[records.length - 1];

  const chartData = useMemo(
    () =>
      records.map((r) => ({
        year: String(r.year),
        yieldT: r.yieldTha,
        somPct: r.soilOrganicMatterPct,
      })),
    [records]
  );

  const centerTuple: [number, number] = [profile.coordinates.lat, profile.coordinates.lng];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Year Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
            Past Harvests &amp; NASA Weather Archive
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            Farm History — Season-by-Season Log
          </h2>
          <p className="text-xs sm:text-sm text-[#6F6F6F]">
            Toggle any past season to inspect what grew on your unified {profile.areaHectares} ha
            field and how weather &amp; soil responded.
          </p>
        </div>

        <div className="inline-flex flex-wrap items-center bg-[#FFFEFB] p-1 rounded-full border border-[#DFDDD6] shadow-xs">
          {records.map((rec) => (
            <button
              key={rec.year}
              type="button"
              onClick={() => setSelectedYear(rec.year)}
              className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition cursor-pointer ${
                activeRecord.year === rec.year
                  ? 'bg-[#00873A] text-white'
                  : 'text-[#474747] hover:text-[#111111]'
              }`}
            >
              {rec.year}
            </button>
          ))}
        </div>
      </div>

      {/* TOP SECTION: Unified Historical Field Map + Selected Season Detail Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-7 surface-card p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-extrabold text-[#111111]">
                {activeRecord.year} Unified Field View — {activeRecord.cropName}
              </h3>
              <p className="text-xs text-[#6F6F6F]">{activeRecord.seasonLabel}</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-[#EBB40E] text-[#111111] text-xs font-extrabold">
              {activeRecord.yieldTha} t/ha Harvested
            </span>
          </div>

          <FarmLeafletMap
            mode="history"
            center={centerTuple}
            boundary={profile.boundary}
            heightClass="h-[340px] sm:h-[370px]"
            fieldOverlay={{
              cropName: activeRecord.cropName,
              cropColor: activeRecord.cropColor,
              topBadge: `${activeRecord.year} Harvest: ${activeRecord.yieldTha} t/ha`,
              bottomMetric: `Rain ${activeRecord.nasaSummary.rainfallMm} mm · Moisture ${activeRecord.nasaSummary.rootMoisturePct}%`,
              moisturePct: activeRecord.nasaSummary.rootMoisturePct,
              ndvi: activeRecord.nasaSummary.ndviAvg,
            }}
          />
        </div>

        <div className="xl:col-span-5 flex flex-col gap-4">
          <div className="surface-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#00873A]">
                <History className="w-4 h-4" />
                {activeRecord.year} Season Summary
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#F5F4F0] text-xs font-bold text-[#111111]">
                {activeRecord.nasaSummary.moistureLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#F5F4F0]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6F6F6F]">
                  <Wheat className="w-3.5 h-3.5 text-[#A17800]" />
                  Harvest Yield
                </div>
                <div className="text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.yieldTha} t/ha
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F4F0]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6F6F6F]">
                  <CloudRain className="w-3.5 h-3.5 text-[#1696A8]" />
                  Season Rainfall
                </div>
                <div className="text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.nasaSummary.rainfallMm} mm
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F4F0]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6F6F6F]">
                  <Droplets className="w-3.5 h-3.5 text-[#00873A]" />
                  Soil Moisture
                </div>
                <div className="text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.nasaSummary.rootMoisturePct}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-[#F5F4F0]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#6F6F6F]">
                  <Leaf className="w-3.5 h-3.5 text-[#4E7A00]" />
                  Soil Organic Matter
                </div>
                <div className="text-lg font-extrabold text-[#00873A] mt-1">
                  {activeRecord.soilOrganicMatterPct}%{' '}
                  <span className="text-xs font-bold">
                    ({activeRecord.somDeltaPct >= 0 ? '+' : ''}
                    {activeRecord.somDeltaPct}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#E3F5EB]/60 border border-[#B8E5CC] space-y-1.5">
              <div className="text-xs font-extrabold text-[#005A26]">Soil &amp; Field Note</div>
              <p className="text-xs text-[#2D2D2D] leading-relaxed">{activeRecord.soilNotes}</p>
              <ul className="space-y-1 pt-1">
                {activeRecord.farmerActions.map((act) => (
                  <li key={act} className="flex items-start gap-1.5 text-[11px] text-[#005A26]">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#EFECE6]">
              <span className="text-[#6F6F6F]">Chemical Input Level (100 = Full Baseline):</span>
              <span className="font-bold text-[#111111]">
                {activeRecord.chemicalInputIndex}% ({100 - activeRecord.chemicalInputIndex}% saved)
              </span>
            </div>
          </div>

          {/* Historical Yield Comparison Bar Chart */}
          <div className="surface-card p-5 flex-1">
            <h4 className="text-sm font-extrabold text-[#111111] mb-3">
              5-Year Harvest Yield Trend (tons/ha)
            </h4>
            <div className="h-[155px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                  <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#474747' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#474747' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFEFB',
                      borderRadius: '10px',
                      border: '1px solid #D9D9D9',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="yieldT" name="Harvest (t/ha)" fill="#00873A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Complete Season-by-Season Log Table */}
      <div className="surface-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#EFECE6] flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111111]">
            Complete Past Seasons Log (2022–2026)
          </h3>
          <span className="text-xs text-[#6F6F6F]">Click any row to inspect on the map</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-[#F5F4F0] text-[11px] uppercase tracking-wider text-[#6F6F6F]">
              <tr>
                <th className="px-5 py-3">Year &amp; Season</th>
                <th className="px-5 py-3">Crop Grown</th>
                <th className="px-5 py-3">NASA Weather &amp; Moisture</th>
                <th className="px-5 py-3">Harvest &amp; Soil Health</th>
                <th className="px-5 py-3">Chemical Use &amp; Field Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6]">
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
                        selected ? 'bg-[#E3F5EB]/60' : 'hover:bg-[#F5F4F0]/70'
                      }`}
                    >
                      <td className="px-5 py-3.5 font-extrabold text-[#111111] whitespace-nowrap">
                        {rec.year}{' '}
                        <span className="block text-[11px] font-medium text-[#6F6F6F]">
                          {rec.seasonLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-2 font-bold text-[#111111]">
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: rec.cropColor }}
                          />
                          {rec.cropName}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#474747]">
                        <div>
                          {rec.nasaSummary.rainfallMm} mm rain · {rec.nasaSummary.avgTempC}°C
                        </div>
                        <div className="text-[#00873A] font-semibold">
                          Moisture: {rec.nasaSummary.rootMoisturePct}% (
                          {rec.nasaSummary.moistureLabel})
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-[#111111] whitespace-nowrap">
                        {rec.yieldTha} t/ha
                        <span className="block text-[11px] font-semibold text-[#00873A]">
                          Organic Matter: {rec.soilOrganicMatterPct}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#474747] max-w-xs">
                        <div className="font-semibold text-[#111111]">
                          Chemical Usage Index: {rec.chemicalInputIndex}%
                        </div>
                        <div className="line-clamp-2 text-[#6F6F6F] mt-0.5">{rec.soilNotes}</div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
