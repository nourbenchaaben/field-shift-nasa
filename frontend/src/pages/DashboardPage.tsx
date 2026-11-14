import React, { useMemo, useState } from 'react';
import { useFarm } from '../context/FarmContext';
import { FarmLeafletMap } from '../components/FarmLeafletMap';
import { RiskCalendarMatrix } from '../components/RiskCalendarMatrix';
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
  ArrowRight,
  CalendarDays,
  CloudRain,
  Droplets,
  Leaf,
  Mountain,
  Pencil,
  Plus,
  RefreshCw,
  Satellite,
  Sparkles,
  Sun,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const {
    profile,
    activeStrategy,
    beforeAnalysis,
    isFetchingNasa,
    refreshLiveNasaData,
    setIsDataSourcesOpen,
    openAddFarmModal,
    openEditFarmModal,
    navigate,
  } = useFarm();

  const [overlayMode, setOverlayMode] = useState<'crop' | 'moisture' | 'health'>('crop');

  const currentStep = activeStrategy.steps[0];
  const nasa = profile.nasaPower;
  const smap = nasa.phase2Adapters.find((l) => l.id === 'smap');
  const modis = nasa.phase2Adapters.find((l) => l.id === 'modis_landsat');
  const srtm = nasa.phase2Adapters.find((l) => l.id === 'srtm');

  const chartData = useMemo(
    () =>
      nasa.monthly.map((m) => ({
        month: m.month,
        rainMm: m.rainMmMonth,
        tempC: m.tempC,
        moisturePct: m.rootWetnessPct,
        solar: m.solarMj,
      })),
    [nasa.monthly]
  );

  const centerTuple: [number, number] = [profile.coordinates.lat, profile.coordinates.lng];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Status Strip + Clickable Live NASA Data Sources Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
            Real-Time Global Field Overview
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#111111]">
            {profile.farmName} — Current Season Dashboard
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsDataSourcesOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E3F5EB] hover:bg-[#00873A] text-[#005A26] hover:text-white border border-[#A8DEC0] text-xs font-extrabold transition cursor-pointer shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#00873A] animate-pulse" />
            <Satellite className="w-3.5 h-3.5" />
            <span>
              {nasa.source === 'nasa-power-live' ? 'NASA POWER Live' : 'NASA POWER Ready'} •
              SMAP/MODIS/SRTM Ready
            </span>
          </button>

          <button
            type="button"
            onClick={() => openEditFarmModal('location-size')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#D9D9D9] hover:border-[#111111] text-xs font-bold text-[#111111] transition cursor-pointer"
          >
            <Pencil className="w-3.5 h-3.5 text-[#00873A]" />
            Edit Farm
          </button>

          <button
            type="button"
            onClick={openAddFarmModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-xs font-extrabold text-[#111111] transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Farm
          </button>

          <button
            type="button"
            onClick={() => void refreshLiveNasaData()}
            disabled={isFetchingNasa}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#D9D9D9] hover:border-[#111111] text-xs font-bold text-[#111111] transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#00873A] ${isFetchingNasa ? 'animate-spin' : ''}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Plain-Language Farmer Condition KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="surface-card p-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Soil Moisture
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {nasa.moistureStatus}{' '}
              <span className="text-sm font-bold text-[#00873A]">({nasa.rootMoisturePct}%)</span>
            </div>
            <p className="text-xs text-[#6F6F6F] mt-1">
              {smap?.plainSummary ?? nasa.moisturePlainText}
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#E3F5EB] text-[#00873A] flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Local Climate (NASA)
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {nasa.avgTempC}°C{' '}
              <span className="text-sm font-bold text-[#1696A8]">{nasa.annualRainMm} mm/yr</span>
            </div>
            <p className="text-xs text-[#6F6F6F] mt-1">
              {nasa.weatherPlainText} · {nasa.humidityPct}% humidity
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#FDF6DC] text-[#A17800] flex items-center justify-center shrink-0">
            <Sun className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Field Slope &amp; Erosion
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {beforeAnalysis.slopeStatusLabel}
            </div>
            <p className="text-xs text-[#6F6F6F] mt-1">
              {srtm?.metricValue ?? `${profile.slopeDeg}° slope`} · {nasa.elevationM}m elev. (
              {profile.soilType})
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#F5F4F0] text-[#111111] flex items-center justify-center shrink-0">
            <Mountain className="w-5 h-5" />
          </span>
        </div>

        <div className="surface-card p-4 flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#6F6F6F]">
              Crop Health &amp; Cover
            </div>
            <div className="text-2xl font-extrabold text-[#111111] mt-1">
              {modis?.metricValue ?? `NDVI ${nasa.ndviEstimate}`}
            </div>
            <p className="text-xs text-[#6F6F6F] mt-1">
              {beforeAnalysis.soilStatusLabel} · {activeStrategy.expectedOutput.chemicalReductionPct}
              % less fertilizer
            </p>
          </div>
          <span className="w-10 h-10 rounded-xl bg-[#EBF7D6] text-[#4E7A00] flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5" />
          </span>
        </div>
      </div>

      {/* TOP SECTION: Unified Current Field Map + Quick Action Insights */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        <div className="xl:col-span-8 surface-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[#111111]">
                  Unified Current Field Map ({profile.areaHectares} ha)
                </h3>
                <button
                  type="button"
                  onClick={() => openEditFarmModal('location-size')}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-[11px] font-bold text-[#111111] transition cursor-pointer"
                >
                  <Pencil className="w-3 h-3 text-[#00873A]" />
                  Resize / Relocate
                </button>
              </div>
              <p className="text-xs text-[#6F6F6F]">
                Active crop: <strong className="text-[#111111]">{currentStep.cropName}</strong> ·
                Condition:{' '}
                <strong className="text-[#00873A]">Soil Moisture {nasa.moistureStatus}</strong>
              </p>
            </div>

            <div className="inline-flex items-center bg-[#F5F4F0] p-1 rounded-full border border-[#DFDDD6]">
              {(
                [
                  { id: 'crop', label: 'Active Crop' },
                  { id: 'moisture', label: 'Soil Moisture' },
                  { id: 'health', label: 'Crop Health' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setOverlayMode(tab.id)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                    overlayMode === tab.id
                      ? 'bg-[#111111] text-white'
                      : 'text-[#474747] hover:text-[#111111]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <FarmLeafletMap
            mode="dashboard"
            center={centerTuple}
            boundary={profile.boundary}
            heightClass="h-[360px] sm:h-[400px]"
            overlayMode={overlayMode}
            fieldOverlay={{
              cropName: currentStep.cropName,
              cropColor: currentStep.cropColor,
              topBadge: `Moisture: ${nasa.moistureStatus} (${nasa.rootMoisturePct}%)`,
              bottomMetric: `${profile.areaHectares} ha · ${profile.soilType} Soil · ${currentStep.stageLabel}`,
              moisturePct: nasa.rootMoisturePct,
              ndvi: nasa.ndviEstimate,
            }}
          />
        </div>

        {/* Right Side: Plain-Language Field Advisor Card */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          <div className="surface-card p-5 flex-1 flex flex-col justify-between gap-4 bg-[#00873A] text-white border-[#00873A] relative overflow-hidden">
            <div className="absolute inset-0 bg-survey-pattern-light opacity-25 pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-[#92D500] text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Top Recommended Next Step
              </div>
              <h3 className="text-xl font-extrabold text-white leading-snug">
                {activeStrategy.title}
              </h3>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                {activeStrategy.expectedOutput.plainSummary}
              </p>

              <div className="grid grid-cols-2 gap-2.5 pt-2">
                <div className="bg-white/12 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/75">
                    Less Fertilizer
                  </div>
                  <div className="text-lg font-extrabold text-[#EBB40E]">
                    -{activeStrategy.expectedOutput.chemicalReductionPct}%
                  </div>
                </div>
                <div className="bg-white/12 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wider text-white/75">
                    Yield Lift
                  </div>
                  <div className="text-lg font-extrabold text-[#92D500]">
                    +{activeStrategy.expectedOutput.yieldImprovementPct}%
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('rotation-lab')}
                className="w-full btn-pill btn-pill-primary text-xs sm:text-sm"
              >
                Open AI Rotation Lab
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => navigate('calendar')}
                className="w-full btn-pill bg-white/15 hover:bg-white hover:text-[#111111] text-white border border-white/25 text-xs sm:text-sm"
              >
                <CalendarDays className="w-4 h-4" />
                View Seasonal Farm Calendar
              </button>
            </div>
          </div>

          {/* Phase 2 Enrichment Adapters Summary */}
          <div className="surface-card p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-[#111111]">
                Satellite Enrichment Layers
              </span>
              <button
                type="button"
                onClick={() => setIsDataSourcesOpen(true)}
                className="text-[11px] font-bold text-[#00873A] hover:underline cursor-pointer"
              >
                All 30+ Portals →
              </button>
            </div>
            <div className="space-y-2">
              {nasa.phase2Adapters.map((layer) => (
                <div
                  key={layer.id}
                  className="p-2.5 rounded-xl bg-[#F5F4F0] flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#111111] truncate">
                      {layer.metricLabel}
                    </div>
                    <div className="text-[10px] text-[#6F6F6F] truncate">{layer.shortName}</div>
                  </div>
                  <span className="text-[11px] font-mono-tech font-bold text-[#00873A] shrink-0">
                    {layer.metricValue}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EXACT BACKEND 12-MONTH RISK CALENDAR MATRIX (Frost, Heavy Rain, Dry Soil, Bare Field) */}
      <RiskCalendarMatrix
        nasa={nasa}
        countryName={profile.countryName}
        onOpenDataSources={() => setIsDataSourcesOpen(true)}
      />

      {/* BOTTOM SECTION: Easy-to-Read NASA POWER Live Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Graph 1: Monthly Rainfall & Temperature */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#00873A]">
                <CloudRain className="w-3.5 h-3.5" />
                NASA POWER Weather Profile
              </div>
              <h3 className="text-base font-extrabold text-[#111111]">
                Monthly Rainfall &amp; Average Temperature
              </h3>
              <p className="text-xs text-[#6F6F6F]">
                Helps you pick the safest months for planting and watering in {profile.countryName}.
              </p>
            </div>
            <span className="text-[10px] font-mono-tech font-bold px-2.5 py-1 rounded-full bg-[#F5F4F0] text-[#474747]">
              {nasa.source === 'nasa-power-live' ? 'Live NASA' : 'Baseline'}
            </span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#474747' }} unit="mm" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: '#474747' }}
                  unit="°C"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #D9D9D9',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="rainMm"
                  name="Rainfall (mm)"
                  fill="#44BE7E"
                  radius={[6, 6, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tempC"
                  name="Avg Temp (°C)"
                  stroke="#EBB40E"
                  strokeWidth={3}
                  dot={{ r: 3, fill: '#111111' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Root-Zone Soil Moisture */}
        <div className="surface-card p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#1696A8]">
                <Droplets className="w-3.5 h-3.5" />
                NASA POWER Soil Wetness &amp; Sunlight
              </div>
              <h3 className="text-base font-extrabold text-[#111111]">
                Root-Zone Soil Moisture (%) Across the Year
              </h3>
              <p className="text-xs text-[#6F6F6F]">
                Shows when your soil naturally holds plenty of water versus when mulching or drip
                irrigation saves crops.
              </p>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E3F5EB] text-[#005A26]">
              Now: {nasa.rootMoisturePct}%
            </span>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00873A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00873A" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E6DF" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#474747' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#474747' }} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFEFB',
                    borderRadius: '12px',
                    border: '1px solid #D9D9D9',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="moisturePct"
                  name="Root Soil Moisture (%)"
                  stroke="#00873A"
                  strokeWidth={2.8}
                  fill="url(#moistureGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
