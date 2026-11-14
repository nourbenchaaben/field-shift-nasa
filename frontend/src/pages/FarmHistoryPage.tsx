import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  CloudRain,
  History,
  Leaf,
  Pause,
  Play,
  Satellite,
  Sprout,
  Thermometer,
  TrendingUp,
} from 'lucide-react';
import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  Bar,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FarmLeafletMap, MapZoneDisplay } from '../components/FarmLeafletMap';
import { useFarm } from '../context/FarmContext';
import { CROPS, generateHistoricalRecords, ZONE_IDS } from '../data/agronomyData';
import { ZoneId } from '../types/farm';

export const FarmHistoryPage: React.FC = () => {
  const { profile, strategy, updateContractSettings } = useFarm();
  const records = useMemo(
    () => generateHistoricalRecords(profile, strategy),
    [profile, strategy]
  );

  const [selectedIdx, setSelectedIdx] = useState<number>(records.length - 2); // Default to 2025 or toggle freely
  const [selectedZone, setSelectedZone] = useState<ZoneId>('S1');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const yr = records[selectedIdx]?.year;
    updateContractSettings({
      replay_year: yr && yr < 2026 ? yr : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIdx]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % records.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying, records.length]);

  const activeRecord = records[selectedIdx] ?? records[0];

  const mapZones = useMemo(() => {
    const out = {} as Record<ZoneId, MapZoneDisplay>;
    ZONE_IDS.forEach((z) => {
      const hz = activeRecord.zones[z];
      out[z] = {
        zoneId: z,
        cropId: hz.cropId,
        ndvi: hz.ndviAvg,
        soilMoisturePct: activeRecord.nasaTelemetry.smapAvgMoisturePct,
        nitrogenKgHa: hz.soilNitrogenEnd,
        yieldTha: hz.yieldTha,
      };
    });
    return out;
  }, [activeRecord]);

  const trendChartData = useMemo(
    () =>
      records.map((r) => ({
        year: String(r.year),
        avgYield: r.avgYieldTha,
        soilOrganicMatter: r.soilOrganicMatterPct,
        meanNdvi: r.nasaTelemetry.meanNdvi,
        rainfall: r.nasaTelemetry.rainfallMm,
      })),
    [records]
  );

  const focusedZoneRec = activeRecord.zones[selectedZone];
  const focusedCrop = CROPS[focusedZoneRec.cropId] ?? CROPS.durum_wheat;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Season Scrubber Bar */}
      <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
              <History className="w-3.5 h-3.5" />
              Multi-Season Spatial &amp; Agronomy Archive
            </div>
            <h2 className="text-2xl font-extrabold text-[#111111] mt-0.5">
              Farm History &amp; NASA Environmental Timeline
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border transition cursor-pointer self-start md:self-auto ${
              isPlaying
                ? 'bg-[#111111] text-white border-[#111111]'
                : 'bg-[#EBB40E] text-[#111111] border-[#EBB40E] hover:bg-[#111111] hover:text-white hover:border-[#111111]'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause Time-Lapse' : 'Play Season Time-Lapse'}
          </button>
        </div>

        {/* Interactive Year / Season Toggle Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {records.map((rec, idx) => {
            const active = idx === selectedIdx;
            return (
              <button
                key={rec.id}
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setSelectedIdx(idx);
                }}
                className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                  active
                    ? 'bg-[#111111] text-white border-[#111111] shadow-md'
                    : 'bg-[#F5F4F0] text-[#474747] border-[#DFDDD6] hover:border-[#111111]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono-tech text-base font-extrabold">{rec.year}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      active
                        ? 'bg-[#EBB40E] text-[#111111]'
                        : rec.somDeltaPct >= 0
                          ? 'bg-[#E3F5EB] text-[#005A26]'
                          : 'bg-[#FCE9E4] text-[#812411]'
                    }`}
                  >
                    {rec.somDeltaPct >= 0 ? `+${rec.somDeltaPct}%` : `${rec.somDeltaPct}%`} SOM
                  </span>
                </div>
                <div
                  className={`text-[11px] font-medium mt-1 truncate ${
                    active ? 'text-white/80' : 'text-[#6F6F6F]'
                  }`}
                >
                  {rec.seasonLabel.split('·')[1]?.trim()}
                </div>
                <div
                  className={`font-mono-tech text-[11px] font-bold mt-1.5 ${
                    active ? 'text-[#92D500]' : 'text-[#00873A]'
                  }`}
                >
                  {rec.avgYieldTha} t/ha · NDVI {rec.nasaTelemetry.meanNdvi}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive Historical Map + Selected Season Telemetry & Zone Detail */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Historical Map (7 cols) */}
        <div className="xl:col-span-7 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#00873A]">
                Historical Parcel View · {activeRecord.year}
              </div>
              <h3 className="text-lg font-bold text-[#111111]">{activeRecord.seasonLabel}</h3>
            </div>
            <span className="font-mono-tech text-xs font-bold bg-[#F5F4F0] border border-[#D9D9D9] px-3 py-1 rounded-full">
              {activeRecord.nasaTelemetry.droughtAnomaly}
            </span>
          </div>

          <FarmLeafletMap
            mode="history"
            center={[profile.coordinates.lat, profile.coordinates.lng]}
            boundary={profile.boundary}
            zones={mapZones}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            heightClass="h-[370px] sm:h-[410px]"
          />

          {/* 4-Plot Past Crop Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {ZONE_IDS.map((z) => {
              const hz = activeRecord.zones[z];
              const crop = CROPS[hz.cropId] ?? CROPS.durum_wheat;
              const isSel = selectedZone === z;
              return (
                <button
                  key={z}
                  type="button"
                  onClick={() => setSelectedZone(z)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSel
                      ? 'bg-[#111111] text-white border-[#111111]'
                      : 'bg-[#F5F4F0] border-[#DFDDD6] hover:border-[#111111]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono-tech text-xs font-extrabold">{z}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: crop.color }}
                    />
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{crop.name}</div>
                  <div
                    className={`font-mono-tech text-[11px] mt-0.5 ${
                      isSel ? 'text-[#EBB40E]' : 'text-[#00873A]'
                    }`}
                  >
                    {hz.yieldTha} t/ha
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Season NASA Data + Selected Plot Outcome + Farmer Decisions (5 cols) */}
        <div className="xl:col-span-5 flex flex-col gap-5">
          {/* NASA Historical Climate Telemetry Card */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#00873A]" />
                NASA Historical Climate ({activeRecord.year})
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E3F5EB] text-[#005A26] px-2.5 py-0.5 rounded-full">
                Archived Pass
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-3">
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <CloudRain className="w-3.5 h-3.5 text-[#1696A8]" /> Seasonal Rain
                </div>
                <div className="font-mono-tech text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.nasaTelemetry.rainfallMm} mm
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Thermometer className="w-3.5 h-3.5 text-[#C96A1B]" /> Avg Surface Temp
                </div>
                <div className="font-mono-tech text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.nasaTelemetry.avgSurfaceTempC}°C
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Leaf className="w-3.5 h-3.5 text-[#00873A]" /> Mean NDVI
                </div>
                <div className="font-mono-tech text-lg font-extrabold text-[#00873A] mt-1">
                  {activeRecord.nasaTelemetry.meanNdvi}
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Sprout className="w-3.5 h-3.5 text-[#00873A]" /> Soil Organic Matter
                </div>
                <div className="font-mono-tech text-lg font-extrabold text-[#111111] mt-1">
                  {activeRecord.soilOrganicMatterPct}%{' '}
                  <span
                    className={`text-xs ${
                      activeRecord.somDeltaPct >= 0 ? 'text-[#00873A]' : 'text-[#B91C1C]'
                    }`}
                  >
                    ({activeRecord.somDeltaPct >= 0 ? '+' : ''}
                    {activeRecord.somDeltaPct})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Focused Plot Record */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="px-2.5 py-0.5 rounded-md font-mono-tech text-xs font-extrabold text-white"
                  style={{ backgroundColor: focusedCrop.color }}
                >
                  {selectedZone} · {activeRecord.year}
                </span>
                <h4 className="font-bold text-[#111111]">{focusedCrop.name}</h4>
              </div>
              <span className="font-mono-tech text-sm font-extrabold text-[#00873A]">
                {focusedZoneRec.yieldTha} t/ha
              </span>
            </div>
            <p className="text-xs text-[#474747] leading-relaxed">{focusedZoneRec.notes}</p>
            <div className="flex items-center gap-4 pt-2 border-t border-[#EFECE6] text-xs font-mono-tech text-[#474747]">
              <span>NDVI Avg: {focusedZoneRec.ndviAvg}</span>
              <span>End-of-Season N: {focusedZoneRec.soilNitrogenEnd} kg/ha</span>
            </div>
          </div>

          {/* Farmer Decisions for This Season */}
          <div className="bg-[#00873A] text-white rounded-2xl p-5 flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#92D500]">
                Farmer Field Decisions ({activeRecord.year})
              </h3>
              <span className="font-mono-tech text-xs bg-white/15 px-2.5 py-0.5 rounded-full">
                N Bal: {activeRecord.nitrogenBalanceKgHa > 0 ? '+' : ''}
                {activeRecord.nitrogenBalanceKgHa} kg/ha
              </span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-white/95">
              {activeRecord.farmerDecisions.map((dec) => (
                <li key={dec} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#EBB40E] shrink-0 mt-0.5" />
                  <span>{dec}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Multi-Year Trend Chart + Structured Chronological Records Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Multi-Year Yield & Soil Evolution Chart */}
        <div className="lg:col-span-5 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00873A]" />
              5-Season Yield &amp; Soil Recovery
            </h3>
            <p className="text-xs text-[#6F6F6F] mt-0.5">
              How crop rotation reversed monoculture decline (2022–2026)
            </p>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={trendChartData}
                margin={{ top: 8, right: 8, left: -14, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#111111', fontWeight: 600 }} />
                <YAxis yAxisId="yield" unit=" t" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis
                  yAxisId="som"
                  orientation="right"
                  unit="%"
                  domain={[1.4, 2.8]}
                  tick={{ fontSize: 11, fill: '#00873A' }}
                />
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
                  yAxisId="yield"
                  dataKey="avgYield"
                  name="Estate Yield Index (t/ha)"
                  fill="#EBB40E"
                  radius={[5, 5, 0, 0]}
                  barSize={26}
                />
                <Line
                  yAxisId="som"
                  type="monotone"
                  dataKey="soilOrganicMatter"
                  name="Soil Organic Matter (%)"
                  stroke="#00873A"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#00873A' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Structured Historical Timeline & Records Log */}
        <div className="lg:col-span-7 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#00873A]" />
                Historical Agronomy &amp; NASA Ledger
              </h3>
              <p className="text-xs text-[#6F6F6F] mt-0.5">
                Click any season row to jump directly to its spatial map
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5F4F0] border-y border-[#DFDDD6] text-[#474747] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3 font-bold">Year</th>
                  <th className="py-2.5 px-3 font-bold">S1–S4 Crops</th>
                  <th className="py-2.5 px-3 font-bold">NASA Rain / Temp</th>
                  <th className="py-2.5 px-3 font-bold">Yield</th>
                  <th className="py-2.5 px-3 font-bold">Soil Δ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6]">
                {records.map((rec, idx) => {
                  const active = idx === selectedIdx;
                  return (
                    <tr
                      key={rec.id}
                      onClick={() => {
                        setIsPlaying(false);
                        setSelectedIdx(idx);
                      }}
                      className={`cursor-pointer transition ${
                        active ? 'bg-[#FDF6DC]/75' : 'hover:bg-[#F5F4F0]/70'
                      }`}
                    >
                      <td className="py-3 px-3 font-mono-tech font-extrabold text-[#111111] whitespace-nowrap">
                        {rec.year}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {ZONE_IDS.map((z) => {
                            const c = CROPS[rec.zones[z].cropId] ?? CROPS.durum_wheat;
                            return (
                              <span
                                key={z}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#D9D9D9] bg-white"
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ backgroundColor: c.color }}
                                />
                                {z}: {c.name.split(' ')[0]}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono-tech text-[#474747] whitespace-nowrap">
                        {rec.nasaTelemetry.rainfallMm} mm · {rec.nasaTelemetry.avgSurfaceTempC}°C
                      </td>
                      <td className="py-3 px-3 font-mono-tech font-bold text-[#111111] whitespace-nowrap">
                        {rec.avgYieldTha} t/ha
                      </td>
                      <td className="py-3 px-3 font-mono-tech font-bold whitespace-nowrap">
                        <span
                          className={
                            rec.somDeltaPct >= 0 ? 'text-[#00873A]' : 'text-[#B91C1C]'
                          }
                        >
                          {rec.somDeltaPct >= 0 ? '+' : ''}
                          {rec.somDeltaPct}% SOM
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
