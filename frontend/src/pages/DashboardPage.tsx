import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  CloudRain,
  Droplets,
  FlaskConical,
  Leaf,
  Radio,
  Satellite,
  Sprout,
  Thermometer,
  Wind,
} from 'lucide-react';
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { FarmLeafletMap, MapZoneDisplay } from '../components/FarmLeafletMap';
import { useFarm } from '../context/FarmContext';
import { CROPS, generateRealtimeAnalytics, ZONE_IDS } from '../data/agronomyData';
import { ZoneId } from '../types/farm';

export const DashboardPage: React.FC = () => {
  const { profile, strategy, navigate } = useFarm();
  const [overlayMode, setOverlayMode] = useState<'strategy' | 'ndvi' | 'moisture'>('strategy');
  const [selectedZone, setSelectedZone] = useState<ZoneId>('S1');
  const [dataSourceFilter, setDataSourceFilter] = useState<'combined' | 'nasa' | 'local'>('combined');
  const [timeRange, setTimeRange] = useState<'7D' | '30D' | 'Season'>('7D');

  const activeSeason = strategy.seasons[0];

  const analytics = useMemo(
    () => generateRealtimeAnalytics(profile, strategy, timeRange),
    [profile, strategy, timeRange]
  );

  const mapZones = useMemo(() => {
    const out = {} as Record<ZoneId, MapZoneDisplay>;
    ZONE_IDS.forEach((z) => {
      const a = activeSeason.zones[z];
      out[z] = {
        zoneId: z,
        cropId: a.cropId,
        ndvi: a.ndvi,
        soilMoisturePct: a.soilMoisturePct,
        nitrogenKgHa: a.nitrogenKgHa,
        healthScore: a.healthScore,
        yieldTha: a.expectedYieldTha,
      };
    });
    return out;
  }, [activeSeason]);

  const inspectedZone = activeSeason.zones[selectedZone];
  const inspectedCrop = CROPS[inspectedZone.cropId] ?? CROPS.durum_wheat;

  const avgNdvi = Number(
    (ZONE_IDS.reduce((s, z) => s + activeSeason.zones[z].ndvi, 0) / 4).toFixed(2)
  );
  const avgMoisture = Math.round(
    ZONE_IDS.reduce((s, z) => s + activeSeason.zones[z].soilMoisturePct, 0) / 4
  );
  const avgNitrogen = Math.round(
    ZONE_IDS.reduce((s, z) => s + activeSeason.zones[z].nitrogenKgHa, 0) / 4
  );
  const totalForecastRain = Number(
    analytics.timeseries.reduce((s, p) => s + p.nasaPrecipForecastMm, 0).toFixed(1)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top KPI Telemetry Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              NDVI Crop Health
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#E3F5EB] text-[#005A26] px-2 py-0.5 rounded-full">
              <Satellite className="w-3 h-3" /> NASA
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-mono-tech text-3xl font-extrabold text-[#00873A]">{avgNdvi}</div>
            <span className="text-xs font-bold text-[#00873A] bg-[#E3F5EB] px-2 py-0.5 rounded-md">
              Optimal Canopy
            </span>
          </div>
          <div className="mt-2 text-xs text-[#6F6F6F]">
            Mean across S1–S4 · Baseline {profile.nasaBaseline.ndviBaseline}
          </div>
        </div>

        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Root-Zone Moisture
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#F5F4F0] text-[#111111] px-2 py-0.5 rounded-full border border-[#D9D9D9]">
              SMAP + Probes
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-mono-tech text-3xl font-extrabold text-[#111111]">
              {avgMoisture}%
            </div>
            <span className="text-xs font-bold text-[#0A6E8A] bg-[#E0F3F8] px-2 py-0.5 rounded-md">
              -{strategy.summaryMetrics.waterSavingsPct}% Water
            </span>
          </div>
          <div className="mt-2 text-xs text-[#6F6F6F]">
            {profile.irrigationType} · {totalForecastRain} mm expected ({timeRange})
          </div>
        </div>

        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Soil Nitrogen Index
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-[#FDF6DC] text-[#7A5B00] px-2 py-0.5 rounded-full">
              <Radio className="w-3 h-3" /> Local Lab
            </span>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-mono-tech text-3xl font-extrabold text-[#111111]">
              {avgNitrogen}
              <span className="text-sm font-semibold text-[#6F6F6F] ml-1">kg/ha</span>
            </div>
            <span className="text-xs font-bold text-[#00873A]">
              +{strategy.summaryMetrics.nitrogenGainKgHa} bio-N
            </span>
          </div>
          <div className="mt-2 text-xs text-[#6F6F6F]">
            Soil pH {analytics.localWeather.soilPhAvg} · {profile.soilType}
          </div>
        </div>

        <div className="bg-[#00873A] text-white border border-[#00873A] rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-survey-pattern-light opacity-30 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
              Active Rotation Score
            </span>
            <span className="text-[10px] font-bold bg-[#EBB40E] text-[#111111] px-2 py-0.5 rounded-full">
              LIVE STRATEGY
            </span>
          </div>
          <div className="relative z-10 mt-3 flex items-end justify-between">
            <div className="font-mono-tech text-3xl font-extrabold text-white">
              {strategy.summaryMetrics.sustainabilityScore}
              <span className="text-sm text-white/75">/100</span>
            </div>
            <span className="text-xs font-bold text-[#92D500]">
              +{strategy.summaryMetrics.projectedYieldGainPct}% Yield
            </span>
          </div>
          <div className="relative z-10 mt-2 text-xs text-white/85 truncate">
            {strategy.name}
          </div>
        </div>
      </div>

      {/* TOP SECTION — Real-Time Strategy Map + Live Zone Inspector */}
      <section className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
              <Activity className="w-3.5 h-3.5" />
              Real-Time Strategy Map · {activeSeason.shortLabel}
            </div>
            <h2 className="text-xl font-bold text-[#111111] mt-0.5">
              Active Crop Rotation Overlay ({profile.areaHectares} ha)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Map Overlay Mode Switcher */}
            <div className="inline-flex items-center bg-[#F5F4F0] p-1 rounded-full border border-[#D9D9D9]">
              {(
                [
                  { id: 'strategy', label: 'Crop Strategy' },
                  { id: 'ndvi', label: 'NASA NDVI' },
                  { id: 'moisture', label: 'SMAP Moisture' },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setOverlayMode(m.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    overlayMode === m.id
                      ? 'bg-[#111111] text-white'
                      : 'text-[#474747] hover:text-[#111111]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('rotation-lab')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#EBB40E] text-[#111111] text-xs font-bold hover:bg-[#111111] hover:text-white transition cursor-pointer"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Edit in Rotation Lab
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
          {/* Interactive Map (8 cols) */}
          <div className="xl:col-span-8">
            <FarmLeafletMap
              mode="dashboard"
              center={[profile.coordinates.lat, profile.coordinates.lng]}
              boundary={profile.boundary}
              zones={mapZones}
              overlayMode={overlayMode}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              heightClass="h-[380px] sm:h-[430px]"
            />
          </div>

          {/* Live Zone Status & Inspector Card (4 cols) */}
          <div className="xl:col-span-4 bg-[#F5F4F0] border border-[#E2E0D8] rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="space-y-4">
              {/* Quick S1–S4 Selector Tabs */}
              <div className="grid grid-cols-4 gap-1.5">
                {ZONE_IDS.map((z) => {
                  const zCrop = CROPS[activeSeason.zones[z].cropId] ?? CROPS.durum_wheat;
                  const active = selectedZone === z;
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSelectedZone(z)}
                      className={`py-2 px-2 rounded-xl text-center border transition cursor-pointer ${
                        active
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-white text-[#474747] border-[#D9D9D9] hover:border-[#111111]'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: zCrop.color }}
                        />
                        <span className="font-mono-tech text-xs font-extrabold">{z}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Zone Crop Header */}
              <div className="bg-white border border-[#E2E0D8] rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-md font-mono-tech text-xs font-extrabold text-white"
                        style={{ backgroundColor: inspectedCrop.color }}
                      >
                        {selectedZone}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
                        {inspectedCrop.family}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-[#111111] mt-1">
                      {inspectedCrop.name}
                    </h3>
                    <div className="text-xs font-medium text-[#00873A]">
                      {inspectedZone.growthStage}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] font-bold uppercase text-[#6F6F6F]">Health</div>
                    <div className="font-mono-tech text-xl font-extrabold text-[#00873A]">
                      {inspectedZone.healthScore}%
                    </div>
                  </div>
                </div>

                {/* Live Health Progress Bar */}
                <div className="w-full h-2 bg-[#EFECE6] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#00873A] transition-all duration-300"
                    style={{ width: `${inspectedZone.healthScore}%` }}
                  />
                </div>

                {/* Zone Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div className="bg-[#F5F4F0] rounded-lg p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#6F6F6F]">NASA NDVI</div>
                    <div className="font-mono-tech text-sm font-bold text-[#00873A]">
                      {inspectedZone.ndvi.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-[#F5F4F0] rounded-lg p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#6F6F6F]">
                      Soil Moisture
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#111111]">
                      {inspectedZone.soilMoisturePct}%
                    </div>
                  </div>
                  <div className="bg-[#F5F4F0] rounded-lg p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#6F6F6F]">
                      Soil Nitrogen
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#111111]">
                      {inspectedZone.nitrogenKgHa} kg/ha
                    </div>
                  </div>
                  <div className="bg-[#F5F4F0] rounded-lg p-2.5">
                    <div className="text-[10px] uppercase font-bold text-[#6F6F6F]">
                      Est. Yield
                    </div>
                    <div className="font-mono-tech text-sm font-bold text-[#111111]">
                      {inspectedZone.expectedYieldTha} t/ha
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#474747] leading-relaxed border-t border-[#EFECE6] pt-2.5">
                  <strong className="text-[#111111]">Agronomy Note:</strong>{' '}
                  {inspectedZone.rationale}
                </p>
              </div>
            </div>

            {/* All 4 Zones Mini Summary */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F]">
                Estate Plot Summary ({(profile.areaHectares / 4).toFixed(1)} ha / zone)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {ZONE_IDS.map((z) => {
                  const a = activeSeason.zones[z];
                  const c = CROPS[a.cropId] ?? CROPS.durum_wheat;
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setSelectedZone(z)}
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border transition cursor-pointer ${
                        selectedZone === z
                          ? 'bg-white border-[#111111] font-bold'
                          : 'bg-white/60 border-transparent hover:bg-white'
                      }`}
                    >
                      <span className="truncate flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-mono-tech font-bold">{z}</span>
                        <span className="truncate text-[#474747]">{c.name.split(' ')[0]}</span>
                      </span>
                      <span className="font-mono-tech text-[11px] font-semibold text-[#00873A]">
                        {a.ndvi}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM SECTION — Real-Time Analytics & Graphs (NASA Satellite + Local Farm Data) */}
      <section className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
              <Satellite className="w-3.5 h-3.5" />
              Blended Satellite &amp; On-Ground Analytics
            </div>
            <h2 className="text-xl font-bold text-[#111111] mt-0.5">
              NASA Satellite Telemetry vs. Local Farm Sensors
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Source Filter */}
            <div className="inline-flex items-center bg-[#FFFEFB] p-1 rounded-full border border-[#D9D9D9]">
              {(
                [
                  { id: 'combined', label: 'Combined View' },
                  { id: 'nasa', label: 'NASA Satellite' },
                  { id: 'local', label: 'Local Sensors' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setDataSourceFilter(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    dataSourceFilter === f.id
                      ? 'bg-[#00873A] text-white'
                      : 'text-[#474747] hover:text-[#111111]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Range Toggle */}
            <div className="inline-flex items-center bg-[#FFFEFB] p-1 rounded-full border border-[#D9D9D9]">
              {(['7D', '30D', 'Season'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    timeRange === r
                      ? 'bg-[#EBB40E] text-[#111111]'
                      : 'text-[#474747] hover:text-[#111111]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 1: Soil Moisture + Precipitation/Irrigation & Surface Temp + NDVI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chart 1: NASA SMAP Soil Moisture & GPM Precipitation vs. Local Probes & Irrigation Logs */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#00873A]" />
                  Soil Moisture, Precipitation &amp; Irrigation Logs
                </h3>
                <p className="text-xs text-[#6F6F6F] mt-0.5">
                  NASA SMAP moisture (%) &amp; GPM rain forecast (mm) vs. local probe &amp; drip logs
                </p>
              </div>
              <span className="font-mono-tech text-[11px] font-bold bg-[#F5F4F0] border border-[#D9D9D9] px-2.5 py-1 rounded-full">
                {timeRange}
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.timeseries}
                  margin={{ top: 8, right: 10, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#474747' }} />
                  <YAxis
                    yAxisId="left"
                    unit="%"
                    domain={[10, 55]}
                    tick={{ fontSize: 11, fill: '#474747' }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    unit="mm"
                    tick={{ fontSize: 11, fill: '#6F6F6F' }}
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
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'nasa') && (
                    <Bar
                      yAxisId="right"
                      dataKey="nasaPrecipForecastMm"
                      name="NASA Rain Forecast (mm)"
                      fill="#1696A8"
                      fillOpacity={0.35}
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                    />
                  )}
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'local') && (
                    <Bar
                      yAxisId="right"
                      dataKey="localIrrigationMm"
                      name="Local Irrigation Log (mm)"
                      fill="#EBB40E"
                      fillOpacity={0.75}
                      radius={[4, 4, 0, 0]}
                      barSize={14}
                    />
                  )}
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'nasa') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="nasaSmapMoisture"
                      name="NASA SMAP Moisture (%)"
                      stroke="#00873A"
                      strokeWidth={2.8}
                      dot={{ r: 3.5, fill: '#00873A' }}
                    />
                  )}
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'local') && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="localProbeMoisture"
                      name="Local Soil Probe (%)"
                      stroke="#111111"
                      strokeWidth={2.2}
                      strokeDasharray="5 4"
                      dot={{ r: 3, fill: '#111111' }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: NASA MODIS Surface Temp & NDVI Crop Health Index vs. Local Weather Temp */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-[#EBB40E]" />
                  Surface Temperature &amp; NDVI Vegetation Health
                </h3>
                <p className="text-xs text-[#6F6F6F] mt-0.5">
                  NASA MODIS land temp (°C) &amp; NDVI canopy vitality blended with field weather
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#E3F5EB] text-[#005A26] px-2.5 py-1 rounded-full">
                <Leaf className="w-3 h-3" /> NDVI {avgNdvi}
              </span>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={analytics.timeseries}
                  margin={{ top: 8, right: 10, left: -14, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#474747' }} />
                  <YAxis
                    yAxisId="temp"
                    unit="°C"
                    domain={[10, 38]}
                    tick={{ fontSize: 11, fill: '#474747' }}
                  />
                  <YAxis
                    yAxisId="ndvi"
                    orientation="right"
                    domain={[0.4, 0.95]}
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
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'nasa') && (
                    <Area
                      yAxisId="ndvi"
                      type="monotone"
                      dataKey="nasaNdvi"
                      name="NASA NDVI Health Index"
                      stroke="#00873A"
                      fill="#92D500"
                      fillOpacity={0.28}
                      strokeWidth={2.5}
                    />
                  )}
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'nasa') && (
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="nasaModisTemp"
                      name="NASA MODIS Surface (°C)"
                      stroke="#C96A1B"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                    />
                  )}
                  {(dataSourceFilter === 'combined' || dataSourceFilter === 'local') && (
                    <Line
                      yAxisId="temp"
                      type="monotone"
                      dataKey="localAirTemp"
                      name="Local Weather Station (°C)"
                      stroke="#474747"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Row 2: On-Ground Soil Nutrient Levels (N-P-K) + Local Weather Station Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Local Soil N-P-K Bar Chart (8 cols) */}
          <div className="lg:col-span-8 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-[#00873A]" />
                  On-Ground Soil Nutrient Profile (N-P-K by Quadrant)
                </h3>
                <p className="text-xs text-[#6F6F6F] mt-0.5">
                  Local field sensor &amp; soil lab readings (kg/ha) across S1–S4 plots
                </p>
              </div>
              <span className="text-[11px] font-bold bg-[#FDF6DC] text-[#7A5B00] px-2.5 py-1 rounded-full">
                Local Farm Data
              </span>
            </div>

            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.nutrients}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DE" />
                  <XAxis
                    dataKey="zone"
                    tickFormatter={(z) => {
                      const item = analytics.nutrients.find((n) => n.zone === z);
                      return `${z} · ${item?.crop.split(' ')[0] ?? ''}`;
                    }}
                    tick={{ fontSize: 11, fill: '#111111', fontWeight: 600 }}
                  />
                  <YAxis unit=" kg" tick={{ fontSize: 11, fill: '#474747' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFEFB',
                      border: '1px solid #D9D9D9',
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="nitrogen" name="Nitrogen (N)" fill="#00873A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="phosphorus" name="Phosphorus (P)" fill="#EBB40E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="potassium" name="Potassium (K)" fill="#474747" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Local On-Farm Weather Station Live Panel (4 cols) */}
          <div className="lg:col-span-4 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 flex flex-col justify-between gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-[#111111]">Local Weather Station</h3>
                <p className="text-xs text-[#6F6F6F]">On-ground sensor node · Live sync</p>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-[#00873A]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Thermometer className="w-3.5 h-3.5 text-[#C96A1B]" /> Air Temp
                </div>
                <div className="font-mono-tech text-xl font-extrabold text-[#111111] mt-1">
                  {analytics.localWeather.airTempC}°C
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Droplets className="w-3.5 h-3.5 text-[#1696A8]" /> Humidity
                </div>
                <div className="font-mono-tech text-xl font-extrabold text-[#111111] mt-1">
                  {analytics.localWeather.humidityPct}%
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <Wind className="w-3.5 h-3.5 text-[#474747]" /> Wind Speed
                </div>
                <div className="font-mono-tech text-xl font-extrabold text-[#111111] mt-1">
                  {analytics.localWeather.windKmh} <span className="text-xs font-normal">km/h</span>
                </div>
              </div>
              <div className="bg-[#F5F4F0] rounded-xl p-3">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#6F6F6F]">
                  <CloudRain className="w-3.5 h-3.5 text-[#00873A]" /> Daily ET₀
                </div>
                <div className="font-mono-tech text-xl font-extrabold text-[#00873A] mt-1">
                  {analytics.localWeather.et0MmDay} <span className="text-xs font-normal">mm</span>
                </div>
              </div>
            </div>

            <div className="bg-[#E3F5EB] border border-[#00873A]/20 rounded-xl p-3.5 text-xs text-[#005A26] leading-relaxed">
              <strong>Irrigation Trigger Ready:</strong> Expected NASA rainfall ({totalForecastRain}{' '}
              mm) covers 62% of projected ET₀. Drip runtime reduced automatically for S2 &amp; S4.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
