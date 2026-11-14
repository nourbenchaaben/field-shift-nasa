import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  FlaskConical,
  Info,
  Leaf,
  Send,
  ShieldCheck,
  Sliders,
  Sparkles,
  Sprout,
  Sun,
  User,
  X,
} from 'lucide-react';
import { FarmLeafletMap, MapZoneDisplay } from '../components/FarmLeafletMap';
import { useFarm } from '../context/FarmContext';
import { CROPS, ZONE_IDS } from '../data/agronomyData';
import { ClimateScenario } from '../api/tadawolContract';
import { RotationParameters, StrategyPriority, ZoneId } from '../types/farm';

const QUICK_PROMPTS = [
  'Prioritize drought-resistant crops in S2',
  'Boost natural nitrogen in S1 & S3',
  'Switch S4 to processing tomatoes',
  'Break cereal root-rot pest cycle across all plots',
  'Optimize farm for maximum water savings',
];

const PRIORITY_OPTIONS: { id: StrategyPriority; label: string; desc: string }[] = [
  { id: 'balanced', label: 'Balanced Yield & Soil', desc: 'Cereals + Legumes + Oilseed' },
  { id: 'drought-resilient', label: 'Drought Resilience', desc: 'Sorghum, Lentils & Barley' },
  { id: 'soil-regeneration', label: 'Soil Regeneration', desc: 'Max N-Fixation & Cover' },
  { id: 'high-yield', label: 'High-Margin Cash', desc: 'Precision Tomatoes & Grain' },
];

function renderMarkdownBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-[#111111]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={i}>{part}</React.Fragment>;
  });
}

export const RotationLabPage: React.FC = () => {
  const {
    profile,
    strategy,
    pendingProposal,
    chatMessages,
    approvalLogs,
    contractSettings,
    contractResponse,
    updateContractSettings,
    proposeFromParameters,
    sendChatMessage,
    approvePendingProposal,
    discardPendingProposal,
    navigate,
  } = useFarm();

  const [seasonStep, setSeasonStep] = useState<number>(0);
  const [selectedZone, setSelectedZone] = useState<ZoneId>('S1');
  const [chatInput, setChatInput] = useState('');
  const [showAuditLog, setShowAuditLog] = useState(false);

  // Tunable local controls synced to pendingProposal (if from params) or committed strategy
  const [draftParams, setDraftParams] = useState<RotationParameters>(strategy.parameters);

  useEffect(() => {
    if (pendingProposal) {
      setDraftParams(pendingProposal.proposedStrategy.parameters);
    } else {
      setDraftParams(strategy.parameters);
    }
  }, [strategy, pendingProposal]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [chatMessages.length]);

  // Strategy displayed on map & roadmap: preview proposed strategy when pending, with explicit diff highlights!
  const displayedStrategy = pendingProposal ? pendingProposal.proposedStrategy : strategy;
  const activeSeason = displayedStrategy.seasons[seasonStep] ?? displayedStrategy.seasons[0];

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

  const handleParamChange = (updates: Partial<RotationParameters>) => {
    const next: RotationParameters = { ...draftParams, ...updates };
    setDraftParams(next);
    proposeFromParameters(next);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  const pillarIcon = (cat: 'nitrogen' | 'pest' | 'water' | 'carbon') => {
    if (cat === 'nitrogen') return Sprout;
    if (cat === 'pest') return Bug;
    if (cat === 'water') return Droplets;
    return Leaf;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#00873A]">
            <FlaskConical className="w-3.5 h-3.5" />
            AI Rotation Lab · Farmer-in-the-Loop Decision Engine
          </div>
          <h2 className="text-2xl font-extrabold text-[#111111] mt-0.5">
            4-Zone Crop Rotation Strategy ({profile.farmName})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAuditLog((v) => !v)}
            className="px-3.5 py-2 rounded-full bg-white border border-[#D9D9D9] text-xs font-bold text-[#474747] hover:border-[#111111] hover:text-[#111111] transition cursor-pointer"
          >
            Approval History ({approvalLogs.length})
          </button>
          <button
            type="button"
            onClick={() => navigate('predictions')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#00873A] text-white text-xs font-bold hover:bg-[#111111] transition cursor-pointer"
          >
            View 5-Year Impact
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Strategy Approval Log */}
      {showAuditLog && (
        <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-4 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#00873A]">
              Farmer-Approved Strategy Log
            </span>
            <button
              type="button"
              onClick={() => setShowAuditLog(false)}
              className="text-xs font-semibold text-[#6F6F6F] hover:text-[#111111] cursor-pointer"
            >
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {approvalLogs.slice(0, 6).map((log) => (
              <div
                key={log.id}
                className="bg-[#F5F4F0] border border-[#E5E3DC] rounded-xl p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111111] truncate">{log.title}</span>
                  <span className="font-mono-tech text-[10px] text-[#6F6F6F] shrink-0">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-[#474747] leading-snug">{log.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* HUMAN-IN-THE-LOOP EXPLICIT APPROVAL BAR (Appears whenever AI or parameter change is pending) */}
      {pendingProposal && (
        <div className="bg-[#111111] text-white border-2 border-[#EBB40E] rounded-2xl p-4 sm:p-5 shadow-lg animate-fade-in">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#EBB40E] text-[#111111] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Awaiting Farmer Approval
                </span>
                <span className="text-sm font-bold text-white">{pendingProposal.title}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                {pendingProposal.zoneDiffs.length > 0 ? (
                  pendingProposal.zoneDiffs.map((d) => (
                    <span
                      key={d.zoneId}
                      className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1 rounded-lg font-medium"
                    >
                      <strong className="font-mono-tech text-[#EBB40E]">{d.zoneId}</strong>
                      <span className="line-through text-white/60">
                        {CROPS[d.fromCropId]?.name}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#92D500]" />
                      <strong className="text-[#92D500]">{CROPS[d.toCropId]?.name}</strong>
                    </span>
                  ))
                ) : (
                  <span className="text-white/85">{pendingProposal.summary}</span>
                )}
              </div>

              {/* Projected Metric Deltas */}
              <div className="flex flex-wrap gap-3 text-[11px] font-mono-tech text-white/80">
                <span>
                  Yield:{' '}
                  <strong className="text-[#92D500]">
                    {pendingProposal.metricDeltas.yieldDeltaPct >= 0 ? '+' : ''}
                    {pendingProposal.metricDeltas.yieldDeltaPct}%
                  </strong>
                </span>
                <span>
                  Water Savings:{' '}
                  <strong className="text-[#EBB40E]">
                    {pendingProposal.metricDeltas.waterSavingsDeltaPct >= 0 ? '+' : ''}
                    {pendingProposal.metricDeltas.waterSavingsDeltaPct}%
                  </strong>
                </span>
                <span>
                  Bio-Nitrogen:{' '}
                  <strong className="text-[#92D500]">
                    {pendingProposal.metricDeltas.nitrogenDeltaKgHa >= 0 ? '+' : ''}
                    {pendingProposal.metricDeltas.nitrogenDeltaKgHa} kg/ha
                  </strong>
                </span>
                <span>
                  Sustainability:{' '}
                  <strong className="text-white">
                    {pendingProposal.metricDeltas.sustainabilityDelta >= 0 ? '+' : ''}
                    {pendingProposal.metricDeltas.sustainabilityDelta} pts
                  </strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={discardPendingProposal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-white/30 text-xs font-bold text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
              <button
                type="button"
                onClick={approvePendingProposal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#EBB40E] text-[#111111] hover:bg-[#92D500] text-xs sm:text-sm font-extrabold transition shadow-md cursor-pointer animate-pulse-harvest"
              >
                <ShieldCheck className="w-4 h-4" />
                Approve Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN 2-COLUMN WORKSPACE: Left 4-Zone Map + Roadmap/Params (8 cols) | Right AI Chatbot (4 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER COLUMN — 4-Zone Map + AI Suggestions & Roadmap Panel */}
        <div className="xl:col-span-8 space-y-6">
          {/* 4-ZONE FARM VISUALIZATION MAP */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#00873A]">
                    Spatial 4-Quadrant Rotation Map
                  </span>
                  {pendingProposal ? (
                    <span className="text-[10px] font-extrabold bg-[#EBB40E] text-[#111111] px-2 py-0.5 rounded-full">
                      PREVIEWING PROPOSAL
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-[#E3F5EB] text-[#005A26] px-2 py-0.5 rounded-full">
                      APPROVED ACTIVE
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-[#111111] mt-0.5">
                  {activeSeason.seasonLabel}
                </h3>
              </div>

              {/* Season Stepper */}
              <div className="inline-flex items-center bg-[#F5F4F0] p-1 rounded-full border border-[#D9D9D9] self-start">
                {displayedStrategy.seasons.map((s, idx) => (
                  <button
                    key={s.shortLabel}
                    type="button"
                    onClick={() => setSeasonStep(idx)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      seasonStep === idx
                        ? 'bg-[#111111] text-white'
                        : 'text-[#474747] hover:text-[#111111]'
                    }`}
                  >
                    S{idx + 1}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive 4-Zone Map */}
            <FarmLeafletMap
              mode="rotation-lab"
              center={[profile.coordinates.lat, profile.coordinates.lng]}
              boundary={profile.boundary}
              zones={mapZones}
              selectedZone={selectedZone}
              onSelectZone={setSelectedZone}
              pendingDiffs={seasonStep === 0 && pendingProposal ? pendingProposal.zoneDiffs : []}
              heightClass="h-[360px] sm:h-[400px]"
            />

            {/* 4-Quadrant Zone Cards (S1, S2, S3, S4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {ZONE_IDS.map((z) => {
                const assignment = activeSeason.zones[z];
                const crop = CROPS[assignment.cropId] ?? CROPS.durum_wheat;
                const diff =
                  seasonStep === 0 && pendingProposal
                    ? pendingProposal.zoneDiffs.find((d) => d.zoneId === z)
                    : undefined;
                const isSel = selectedZone === z;

                return (
                  <button
                    key={z}
                    type="button"
                    onClick={() => setSelectedZone(z)}
                    className={`p-3.5 rounded-xl border text-left transition cursor-pointer relative ${
                      diff
                        ? 'bg-[#FEF9E6] border-2 border-[#EBB40E]'
                        : isSel
                          ? 'bg-[#111111] text-white border-[#111111]'
                          : 'bg-[#F5F4F0] border-[#DFDDD6] hover:border-[#111111]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-mono-tech text-xs font-extrabold px-2 py-0.5 rounded-md ${
                          diff
                            ? 'bg-[#EBB40E] text-[#111111]'
                            : isSel
                              ? 'bg-[#EBB40E] text-[#111111]'
                              : 'bg-white text-[#111111] border border-[#D9D9D9]'
                        }`}
                      >
                        {z}
                      </span>
                      <span
                        className="w-3 h-3 rounded-full border border-black/15"
                        style={{ backgroundColor: crop.color }}
                      />
                    </div>

                    <div
                      className={`text-sm font-extrabold mt-2 ${
                        isSel && !diff ? 'text-white' : 'text-[#111111]'
                      }`}
                    >
                      {crop.name}
                    </div>
                    <div
                      className={`text-[11px] font-medium ${
                        isSel && !diff ? 'text-white/75' : 'text-[#6F6F6F]'
                      }`}
                    >
                      {crop.family} · {crop.droughtTolerance} Drought
                    </div>

                    {diff && (
                      <div className="mt-1.5 text-[10px] font-bold text-[#7A5B00]">
                        Was: {CROPS[diff.fromCropId]?.name}
                      </div>
                    )}

                    <div
                      className={`mt-2.5 pt-2 border-t flex items-center justify-between text-[11px] font-mono-tech ${
                        isSel && !diff
                          ? 'border-white/15 text-[#92D500]'
                          : 'border-[#E2E0D8] text-[#00873A]'
                      }`}
                    >
                      <span>{assignment.expectedYieldTha} t/ha</span>
                      <span>
                        N {crop.nitrogenImpactKgHa > 0 ? `+${crop.nitrogenImpactKgHa}` : crop.nitrogenImpactKgHa}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI SUGGESTIONS & ROADMAP PANEL (Beneath Map) */}
          <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl p-5 sm:p-6 space-y-6">
            {/* Tunable Strategy Parameters */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#00873A]" />
                    Tunable Rotation Strategy Parameters
                  </h3>
                  <p className="text-xs text-[#6F6F6F] mt-0.5">
                    Adjusting any lever generates a live preview — click{' '}
                    <strong>Approve Changes</strong> to commit.
                  </p>
                </div>
                <span className="font-mono-tech text-xs font-bold bg-[#E3F5EB] text-[#005A26] px-3 py-1 rounded-full">
                  Score: {displayedStrategy.summaryMetrics.sustainabilityScore}/100
                </span>
              </div>

              {/* Priority Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {PRIORITY_OPTIONS.map((opt) => {
                  const active = draftParams.priority === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleParamChange({ priority: opt.id })}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        active
                          ? 'bg-[#00873A] text-white border-[#00873A]'
                          : 'bg-[#F5F4F0] text-[#111111] border-[#DFDDD6] hover:border-[#111111]'
                      }`}
                    >
                      <div className="text-xs font-extrabold">{opt.label}</div>
                      <div
                        className={`text-[11px] mt-0.5 ${
                          active ? 'text-white/80' : 'text-[#6F6F6F]'
                        }`}
                      >
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sliders & Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#F5F4F0] border border-[#E5E3DC] rounded-xl p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
                    <span>Water Conservation</span>
                    <span className="font-mono-tech text-[#00873A]">
                      {draftParams.waterConservationPct}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={5}
                    value={draftParams.waterConservationPct}
                    onChange={(e) =>
                      handleParamChange({ waterConservationPct: Number(e.target.value) })
                    }
                    className="w-full accent-[#00873A] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#6F6F6F]">
                    <span>Standard (10%)</span>
                    <span>Strict Dryland (40%)</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#111111]">Rotation Cycle Length</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([2, 3, 4] as const).map((yr) => (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleParamChange({ cycleLengthYears: yr })}
                        className={`py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          draftParams.cycleLengthYears === yr
                            ? 'bg-[#111111] text-white border-[#111111]'
                            : 'bg-white text-[#474747] border-[#D1D1D1] hover:border-[#111111]'
                        }`}
                      >
                        {yr} Years
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#111111]">Low-Input / Organic Mode</div>
                  <button
                    type="button"
                    onClick={() => handleParamChange({ organicFocus: !draftParams.organicFocus })}
                    className={`w-full py-2 px-3 rounded-lg border text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      draftParams.organicFocus
                        ? 'bg-[#EBB40E] text-[#111111] border-[#111111]'
                        : 'bg-white text-[#474747] border-[#D1D1D1]'
                    }`}
                  >
                    <span>
                      {draftParams.organicFocus ? 'Cover Crops & Zero-Urea ON' : 'Standard Inputs'}
                    </span>
                    <Check className={`w-4 h-4 ${draftParams.organicFocus ? 'opacity-100' : 'opacity-25'}`} />
                  </button>
                </div>
              </div>

              {/* Shared Contract Engine Weights & Climate Scenario Controls (contract.json) */}
              <div className="bg-[#FFFEFB] border border-[#DFDDD6] rounded-xl p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#111111]">
                      Multi-Objective Weights &amp; Climate Scenario (Shared Engine Contract)
                    </div>
                    <div className="text-[11px] text-[#6F6F6F]">
                      Synced 1:1 with <code className="font-mono-tech">contract.json</code> fields (
                      <code className="font-mono-tech">weights</code>,{' '}
                      <code className="font-mono-tech">scenario</code>,{' '}
                      <code className="font-mono-tech">slope_deg</code>,{' '}
                      <code className="font-mono-tech">rain_change_pct</code>,{' '}
                      <code className="font-mono-tech">use_gee</code>)
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      updateContractSettings({ use_gee: !contractSettings.use_gee })
                    }
                    className={`px-3 py-1 rounded-full text-[11px] font-bold border transition cursor-pointer ${
                      contractSettings.use_gee
                        ? 'bg-[#00873A] text-white border-[#00873A]'
                        : 'bg-[#F5F4F0] text-[#474747] border-[#D9D9D9]'
                    }`}
                  >
                    use_gee: {contractSettings.use_gee ? 'true (GEE ON)' : 'false'}
                  </button>
                </div>

                {/* 4 Weight Sliders: soil, water, erosion, income */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { key: 'soil', label: 'Soil Weight' },
                      { key: 'water', label: 'Water Weight' },
                      { key: 'erosion', label: 'Erosion Weight' },
                      { key: 'income', label: 'Income Weight' },
                    ] as const
                  ).map((w) => (
                    <div key={w.key} className="bg-[#F5F4F0] rounded-lg p-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#474747]">{w.label}</span>
                        <span className="font-mono-tech text-[#00873A]">
                          {contractSettings.weights[w.key]}/10
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={contractSettings.weights[w.key]}
                        onChange={(e) =>
                          updateContractSettings({
                            weights: {
                              ...contractSettings.weights,
                              [w.key]: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full accent-[#00873A] cursor-pointer"
                      />
                    </div>
                  ))}
                </div>

                {/* Scenario, Slope, Rain Shift */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#474747]">
                      Climate Scenario
                    </label>
                    <select
                      value={contractSettings.scenario}
                      onChange={(e) =>
                        updateContractSettings({
                          scenario: e.target.value as ClimateScenario,
                        })
                      }
                      className="w-full px-2.5 py-2 bg-[#F5F4F0] border border-[#D1D1D1] rounded-lg text-xs font-bold focus:outline-none focus:border-[#00873A]"
                    >
                      <option value="normal">Normal Rainfall</option>
                      <option value="bad_year">Bad-year replay</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-[#474747]">
                      <span>Field Slope</span>
                      <span className="font-mono-tech text-[#111111]">
                        {contractSettings.slope_deg === null
                          ? 'Automatic (SRTM)'
                          : `${contractSettings.slope_deg}°`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={contractSettings.slope_deg ?? 0}
                      onChange={(e) =>
                        updateContractSettings({ slope_deg: Number(e.target.value) })
                      }
                      className="w-full accent-[#111111] cursor-pointer mt-1.5"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-[#474747]">
                      <span>Rain Shift</span>
                      <span className="font-mono-tech text-[#00873A]">
                        {contractSettings.rain_change_pct >= 0 ? '+' : ''}
                        {contractSettings.rain_change_pct}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={-30}
                      max={30}
                      step={5}
                      value={contractSettings.rain_change_pct}
                      onChange={(e) =>
                        updateContractSettings({ rain_change_pct: Number(e.target.value) })
                      }
                      className="w-full accent-[#00873A] cursor-pointer mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step-by-Step Multi-Season Rotation Roadmap Matrix */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <div>
                <h3 className="text-base font-bold text-[#111111]">
                  Step-by-Step 4-Season Rotation Roadmap
                </h3>
                <p className="text-xs text-[#6F6F6F]">
                  Click any season row to visualize that exact stage on the S1–S4 map above
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F5F4F0] border-y border-[#DFDDD6] text-[10px] uppercase tracking-wider text-[#474747]">
                      <th className="py-2.5 px-3 font-bold">Season Step</th>
                      {ZONE_IDS.map((z) => (
                        <th key={z} className="py-2.5 px-3 font-mono-tech font-extrabold text-[#111111]">
                          {z}
                        </th>
                      ))}
                      <th className="py-2.5 px-3 font-bold">Agronomic Goal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFECE6]">
                    {displayedStrategy.seasons.map((step, idx) => {
                      const active = idx === seasonStep;
                      return (
                        <tr
                          key={step.shortLabel}
                          onClick={() => setSeasonStep(idx)}
                          className={`cursor-pointer transition ${
                            active ? 'bg-[#FDF6DC]/80' : 'hover:bg-[#F5F4F0]/60'
                          }`}
                        >
                          <td className="py-3 px-3 font-bold text-[#111111] whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5">
                              <span
                                className={`w-5 h-5 rounded-full text-[10px] font-extrabold flex items-center justify-center ${
                                  active ? 'bg-[#111111] text-[#EBB40E]' : 'bg-[#EFECE6] text-[#474747]'
                                }`}
                              >
                                {idx + 1}
                              </span>
                              {step.shortLabel}
                            </span>
                          </td>
                          {ZONE_IDS.map((z) => {
                            const c = CROPS[step.zones[z].cropId] ?? CROPS.durum_wheat;
                            return (
                              <td key={z} className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
                                  style={{ backgroundColor: c.lightBg, color: c.textColor }}
                                >
                                  <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: c.color }}
                                  />
                                  {c.name}
                                </span>
                              </td>
                            );
                          })}
                          <td className="py-3 px-3 text-[#474747] min-w-[200px]">
                            {step.focusObjective}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Soil Restoration Rationale Pillars */}
            <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
              <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EBB40E]" />
                Soil Restoration Rationale &amp; Agronomic Science
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayedStrategy.restorationPillars.map((pillar) => {
                  const Icon = pillarIcon(pillar.category);
                  return (
                    <div
                      key={pillar.title}
                      className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-white border border-[#D9D9D9] flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#00873A]" />
                          </div>
                          <span className="text-sm font-bold text-[#111111]">{pillar.title}</span>
                        </div>
                        <span className="font-mono-tech text-xs font-extrabold text-[#00873A] bg-[#E3F5EB] px-2.5 py-0.5 rounded-full">
                          {pillar.metric}
                        </span>
                      </div>
                      <p className="text-xs text-[#474747] leading-relaxed">{pillar.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Contract Insights: Sowing Window, Bare Field Clock, Risk Calendar & Agronomist Checklist */}
            <div className="space-y-4 pt-5 border-t border-[#EFECE6]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-bold text-[#111111] flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-[#00873A]" />
                  Field Calendar, Bare-Field Clock &amp; Agronomist Checklist
                </h3>
                <span className="font-mono-tech text-[11px] font-bold bg-[#E3F5EB] text-[#005A26] px-2.5 py-0.5 rounded-full">
                  Confidence {contractResponse.confidence.overall_score}% ·{' '}
                  {contractResponse.region_validated ? 'Region Validated' : 'Unverified'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Sowing Window */}
                <div className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#00873A] flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" /> Optimal Sowing Window
                    </span>
                    <span className="font-mono-tech text-xs font-extrabold bg-[#EBB40E] text-[#111111] px-2 py-0.5 rounded-md">
                      {contractResponse.sowing_window.optimal_start} –{' '}
                      {contractResponse.sowing_window.optimal_end}
                    </span>
                  </div>
                  <p className="text-xs text-[#474747] leading-relaxed">
                    {contractResponse.sowing_window.advisory}
                  </p>
                  <div className="flex flex-wrap gap-2 text-[11px] font-mono-tech text-[#111111]">
                    <span className="bg-white border border-[#D9D9D9] px-2 py-0.5 rounded">
                      Crop: {contractResponse.sowing_window.primary_crop}
                    </span>
                    <span className="bg-white border border-[#D9D9D9] px-2 py-0.5 rounded">
                      Trigger: ≥{contractResponse.sowing_window.soil_moisture_trigger_pct}% SMAP
                    </span>
                  </div>
                </div>

                {/* Bare Field Clock */}
                <div className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-[#111111]">
                      Bare Field Clock
                    </span>
                    <span className="font-mono-tech text-xs font-extrabold bg-[#00873A] text-white px-2 py-0.5 rounded-md">
                      {contractResponse.bare_field_clock.cover_pct}% Covered
                    </span>
                  </div>
                  <p className="text-xs text-[#474747] leading-relaxed">
                    {contractResponse.bare_field_clock.summary}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-mono-tech">
                    <span className="text-[#00873A] font-bold">
                      {contractResponse.bare_field_clock.bare_days_per_year} bare days/yr
                    </span>
                    <span className="text-[#6F6F6F]">
                      vs. {contractResponse.bare_field_clock.baseline_bare_days} baseline
                    </span>
                  </div>
                </div>
              </div>

              {/* 12-Month Risk Calendar Heatmap Strip */}
              <div className="bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#111111]">
                    12-Month Seasonal Risk Calendar ({contractResponse.risk_calendar.scenario})
                  </span>
                  <span className="text-[11px] text-[#6F6F6F]">
                    Peak Risk: <strong className="text-[#111111]">{contractResponse.risk_calendar.peak_risk_months.join(', ')}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                  {contractResponse.risk_calendar.months.map((m) => {
                    const maxRisk = Math.max(m.drought_risk, m.erosion_risk, m.heat_risk);
                    const tone =
                      maxRisk >= 75
                        ? 'bg-[#C8472C] text-white'
                        : maxRisk >= 52
                          ? 'bg-[#EBB40E] text-[#111111]'
                          : 'bg-[#E3F5EB] text-[#005A26]';
                    return (
                      <div
                        key={m.month}
                        title={`${m.month}: ${m.dominant_hazard} (Drought ${m.drought_risk}%, Erosion ${m.erosion_risk}%, Heat ${m.heat_risk}%)`}
                        className={`rounded-lg p-1.5 text-center ${tone}`}
                      >
                        <div className="text-[10px] font-extrabold">{m.month}</div>
                        <div className="font-mono-tech text-[10px] font-bold">{maxRisk}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Agronomist Checklist & Caveats */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
                <div className="md:col-span-7 bg-[#FFFEFB] border border-[#DFDDD6] rounded-xl p-4 space-y-2.5">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#00873A] flex items-center gap-1.5">
                    <ClipboardCheck className="w-3.5 h-3.5" /> Agronomist Action Checklist
                  </div>
                  <div className="space-y-2">
                    {contractResponse.agronomist_checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 text-xs bg-[#F5F4F0] p-2.5 rounded-lg"
                      >
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold shrink-0 ${
                            item.priority === 'High'
                              ? 'bg-[#111111] text-[#EBB40E]'
                              : item.priority === 'Medium'
                                ? 'bg-[#EBB40E]/40 text-[#111111]'
                                : 'bg-white text-[#474747]'
                          }`}
                        >
                          {item.timing.split(' ')[0]}
                        </span>
                        <div>
                          <div className="font-bold text-[#111111]">{item.action}</div>
                          <div className="text-[11px] text-[#6F6F6F]">{item.reason}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-5 bg-[#F5F4F0] border border-[#E2E0D8] rounded-xl p-4 space-y-2">
                  <div className="text-xs font-extrabold uppercase tracking-wider text-[#474747] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-[#00873A]" /> Model Caveats &amp; Notes
                  </div>
                  <ul className="space-y-2 text-[11px] text-[#474747] leading-relaxed">
                    {contractResponse.caveats.map((cav, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#00873A] font-bold">•</span>
                        <span>{cav}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Integrated AI Chatbot with Human-in-the-Loop Approval Workflow (4 cols) */}
        <aside className="xl:col-span-4 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl flex flex-col h-[700px] xl:sticky xl:top-[96px] overflow-hidden shadow-sm">
          {/* Assistant Header */}
          <div className="bg-[#111111] text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">Tadawol AI Agronomist</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-[#92D500]">
                  <span className="w-2 h-2 rounded-full bg-[#92D500]" />
                  <span>Synced to {profile.soilType} · S1–S4</span>
                </div>
              </div>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-1 rounded-full">
              HITL Safe
            </span>
          </div>

          {/* Chat Message Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F4F0]/60">
            {chatMessages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[95%] ${
                      isUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                        isUser
                          ? 'bg-[#00873A] text-white'
                          : 'bg-[#111111] text-[#EBB40E]'
                      }`}
                    >
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div
                      className={`rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                        isUser
                          ? 'bg-[#00873A] text-white rounded-tr-sm'
                          : 'bg-white border border-[#DFDDD6] text-[#2D2D2D] rounded-tl-sm shadow-xs'
                      }`}
                    >
                      <div>{isUser ? msg.content : renderMarkdownBold(msg.content)}</div>
                      <div
                        className={`text-[10px] mt-1.5 ${
                          isUser ? 'text-white/70 text-right' : 'text-[#979797]'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>

                  {/* Embedded Proposal Card with Explicit Approve Changes Button */}
                  {msg.proposalSnapshot && (
                    <div className="w-full pl-9">
                      <div
                        className={`rounded-xl border p-3.5 space-y-2.5 ${
                          msg.proposalStatus === 'pending'
                            ? 'bg-[#FEF9E6] border-2 border-[#EBB40E]'
                            : msg.proposalStatus === 'approved'
                              ? 'bg-[#E3F5EB] border-[#00873A]'
                              : 'bg-[#F1F0EE] border-[#D1D1D1] opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#111111]">
                            {msg.proposalSnapshot.title}
                          </span>
                          {msg.proposalStatus === 'approved' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-[#005A26] bg-white px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Approved
                            </span>
                          )}
                          {msg.proposalStatus === 'discarded' && (
                            <span className="text-[10px] font-bold text-[#6F6F6F]">Dismissed</span>
                          )}
                        </div>

                        {/* Diff List */}
                        <div className="space-y-1">
                          {msg.proposalSnapshot.zoneDiffs.map((d) => (
                            <div
                              key={d.zoneId}
                              className="flex items-center gap-1.5 text-[11px] bg-white/80 px-2.5 py-1 rounded-lg border border-black/5"
                            >
                              <span className="font-mono-tech font-extrabold text-[#111111]">
                                {d.zoneId}
                              </span>
                              <span className="text-[#6F6F6F] line-through">
                                {CROPS[d.fromCropId]?.name}
                              </span>
                              <ArrowRight className="w-3 h-3 text-[#00873A]" />
                              <span className="font-bold text-[#00873A]">
                                {CROPS[d.toCropId]?.name}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Action Buttons (only while pending) */}
                        {msg.proposalStatus === 'pending' &&
                          pendingProposal?.id === msg.proposalId && (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={approvePendingProposal}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-[#00873A] hover:bg-[#111111] text-white text-xs font-extrabold transition cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Approve Changes
                              </button>
                              <button
                                type="button"
                                onClick={discardPendingProposal}
                                className="py-2 px-3 rounded-full bg-white border border-[#D1D1D1] text-[#474747] hover:border-[#111111] text-xs font-bold transition cursor-pointer"
                              >
                                Discard
                              </button>
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="px-3.5 py-2.5 bg-white border-t border-[#EFECE6]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F] mb-1.5">
              Try asking Tadawol AI
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => sendChatMessage(q)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-[11px] font-semibold text-[#111111] transition cursor-pointer"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSendChat}
            className="p-3 bg-[#FFFEFB] border-t border-[#DFDDD6] flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder='e.g. "Prioritize drought-resistant crops in S2"'
              className="flex-1 px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D9D9D9] rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              aria-label="Send message"
              className="w-10 h-10 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-[#111111] flex items-center justify-center transition cursor-pointer disabled:opacity-40 shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
