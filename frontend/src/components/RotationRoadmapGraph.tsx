import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Compass,
  Droplets,
  Leaf,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  FarmerProfile,
  PlanCustomization,
  ScoredRotationStrategy,
  UnifiedSeasonStep,
} from '../types/farm';
import { FarmLocalClock } from '../utils/farmLocalClock';

interface RotationRoadmapGraphProps {
  mode: 'active-only' | 'compare-all';
  profile: FarmerProfile;
  top3Strategies: ScoredRotationStrategy[];
  activeStrategy: ScoredRotationStrategy;
  farmDate: FarmLocalClock;
  planCustomization?: PlanCustomization;
  onSelectStrategy: (strategyId: string) => void;
  onChangeStrategyInLab?: () => void;
  onOpenAiAdvisor?: () => void;
  onResetCustomPlan?: () => void;
  onNavigate?: (page: 'rotation-lab' | 'predictions' | 'calendar') => void;
}

const SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Honest agronomic crop cycle length in months based on real crop family & species.
 * (Cereals ~6 mos, Legumes ~4-5 mos, Oilseeds ~5 mos, Cover Crops ~3 mos.)
 */
function getCropDurationMonths(step: UnifiedSeasonStep): number {
  const n = step.cropName.toLowerCase();
  if (step.cropFamily === 'Cover Crop') {
    if (n.includes('rye') || n.includes('vetch')) return 4;
    return 3;
  }
  if (step.cropFamily === 'Legume') {
    if (n.includes('alfalfa')) return 6;
    if (n.includes('lentil') || n.includes('pea') || n.includes('cowpea')) return 4;
    return 5;
  }
  if (step.cropFamily === 'Oilseed') return 5;
  if (step.cropFamily === 'Vegetable') return 4;
  // Cereals
  if (n.includes('sorghum') || n.includes('millet')) return 4;
  if (n.includes('corn') || n.includes('maize') || n.includes('rice')) return 5;
  return 6;
}

interface TimedStage {
  step: UnifiedSeasonStep;
  months: number;
  startOffset: number;
  windowLabel: string;
  eventTag?: string;
}

function buildTimedStages(
  steps: UnifiedSeasonStep[],
  startMonthIdx: number,
  startYear: number,
  customization?: PlanCustomization,
  maxStages = 6
): { stages: TimedStage[]; totalMonths: number } {
  const shift = customization?.monthShift ?? 0;
  let cursor = shift;
  let totalMonths = 0;

  const stages = steps.slice(0, maxStages).map((step, idx) => {
    const ov = customization?.stageOverrides?.[idx];
    const customSpec = customization?.customStages?.[idx];
    const months = ov?.durationMonths ?? customSpec?.durationMonths ?? getCropDurationMonths(step);
    const sIdx = startMonthIdx + cursor;
    const eIdx = startMonthIdx + cursor + months - 1;
    const normS = ((sIdx % 12) + 12) % 12;
    const normE = ((eIdx % 12) + 12) % 12;
    const sMon = SHORT_MONTHS[normS];
    const sYr = String((startYear + Math.floor(sIdx / 12)) % 100).padStart(2, '0');
    const eMon = SHORT_MONTHS[normE];
    const eYr = String((startYear + Math.floor(eIdx / 12)) % 100).padStart(2, '0');
    const windowLabel = `${sMon} '${sYr} - ${eMon} '${eYr}`;
    const startOffset = cursor;
    cursor += months;
    totalMonths += months;
    return {
      step,
      months,
      startOffset,
      windowLabel,
      eventTag: ov?.eventTag ?? customSpec?.eventTag,
    };
  });
  return { stages, totalMonths };
}

const LANE_THEMES = [
  {
    stroke: '#00873A',
    softBg: '#F2FBF6',
    softBorder: '#A9DEC0',
    badgeBg: '#E3F5EB',
    badgeText: '#005222',
    outcomeBg: 'from-[#007432] to-[#0E4D28]',
    code: 'A',
  },
  {
    stroke: '#0F7B8A',
    softBg: '#F0F9FB',
    softBorder: '#A8DAE3',
    badgeBg: '#E4F5F8',
    badgeText: '#095560',
    outcomeBg: 'from-[#0F7B8A] to-[#0B4A54]',
    code: 'B',
  },
  {
    stroke: '#B88400',
    softBg: '#FDF9EA',
    softBorder: '#E9D38D',
    badgeBg: '#FDF6DC',
    badgeText: '#6E5100',
    outcomeBg: 'from-[#B88400] to-[#6E4D00]',
    code: 'C',
  },
];

export const RotationRoadmapGraph: React.FC<RotationRoadmapGraphProps> = ({
  mode,
  profile,
  top3Strategies,
  activeStrategy,
  farmDate,
  planCustomization,
  onSelectStrategy,
  onChangeStrategyInLab,
  onOpenAiAdvisor,
  onResetCustomPlan,
  onNavigate,
}) => {
  const liveStageIdx = 0;
  const [inspectedStageIdx, setInspectedStageIdx] = useState<number>(liveStageIdx);
  const [hoveredLaneId, setHoveredLaneId] = useState<string | null>(null);

  const hasCustomEdits = Boolean(
    planCustomization &&
      (planCustomization.monthShift !== 0 ||
        Object.keys(planCustomization.stageOverrides ?? {}).length > 0 ||
        Boolean(planCustomization.customStages && planCustomization.customStages.length > 0) ||
        Boolean(planCustomization.customStrategyTitle))
  );

  const activeTimed = useMemo(
    () =>
      buildTimedStages(
        activeStrategy.steps,
        farmDate.monthIndex,
        farmDate.year,
        planCustomization,
        6
      ),
    [activeStrategy.steps, farmDate.monthIndex, farmDate.year, planCustomization]
  );

  const allTimed = useMemo(
    () =>
      top3Strategies.slice(0, 3).map((strat, idx) => ({
        strat,
        theme: LANE_THEMES[idx] ?? LANE_THEMES[0],
        ...buildTimedStages(strat.steps, farmDate.monthIndex, farmDate.year, undefined, 4),
      })),
    [top3Strategies, farmDate.monthIndex, farmDate.year]
  );

  // =========================================================================
  // MODE 1: DASHBOARD - CLEAN SINGLE-PATH ROADMAP FOR YOUR CHOSEN STRATEGY
  // =========================================================================
  if (mode === 'active-only') {
    const safeInspectedIdx = Math.min(inspectedStageIdx, Math.max(0, activeTimed.stages.length - 1));
    const inspected = activeTimed.stages[safeInspectedIdx] ?? activeTimed.stages[0];

    return (
      <section className="surface-card p-5 sm:p-6 space-y-4 bg-[#FFFEFB]">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex flex-col gap-1 pt-1 shrink-0" aria-hidden="true">
              <span className="w-1.5 h-5 rounded-full bg-[#00873A]" />
              <span className="w-1.5 h-5 rounded-full bg-[#EBB40E]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-widest text-[#3A3A3A]">
                  Your Active Crop Rotation Roadmap · {activeTimed.stages.length} Stages · {activeTimed.totalMonths}-Month Cycle
                </span>
                {hasCustomEdits && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDF6DC] text-[#6E5100] border border-[#EBD58B] text-[10px] font-extrabold">
                    {planCustomization?.customStages?.length ? 'Custom AI Strategy' : 'AI Custom Adjusted'}
                    {planCustomization?.monthShift
                      ? ` (${planCustomization.monthShift > 0 ? `+${planCustomization.monthShift}` : planCustomization.monthShift} mo)`
                      : ''}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-extrabold text-[#111111] leading-tight mt-0.5">
                {activeStrategy.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#3A3A3A] mt-0.5">
                Your <strong className="text-[#007432]">current stage is pulsating</strong>. Click any upcoming stage to see what to plant, or tell the AI Advisor about any field event to adapt your plan.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {hasCustomEdits && onResetCustomPlan && (
              <button
                type="button"
                onClick={onResetCustomPlan}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full bg-[#F5F4F0] hover:bg-[#111111] text-[#3A3A3A] hover:text-white border border-[#CFCBC2] text-xs font-bold transition cursor-pointer"
                title="Reset custom AI adjustments back to original plan"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Edits
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (onChangeStrategyInLab) {
                  onChangeStrategyInLab();
                } else {
                  onNavigate?.('rotation-lab');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white border border-[#CFCBC2] hover:border-[#111111] text-[#111111] text-xs font-extrabold transition cursor-pointer"
            >
              Change Strategy in Rotation Lab
              <ArrowRight className="w-3.5 h-3.5 text-[#007432]" />
            </button>
            <button
              type="button"
              onClick={() => onOpenAiAdvisor?.()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#111111] hover:bg-[#007432] text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
            >
              <Bot className="w-3.5 h-3.5 text-[#EBB40E]" />
              Chat with AI Advisor for Custom Changes
            </button>
          </div>
        </div>

        {/* Clean Single-Track Horizontal Roadmap with Proportional Stage Lengths */}
        <div className="overflow-x-auto pb-3 pt-2">
          <div className="min-w-[880px] rounded-2xl bg-[#F8F7F2] border border-[#E2DFD6] px-4 py-6 flex items-center gap-0">
            {/* Start Node */}
            <div className="w-[132px] shrink-0 rounded-2xl bg-gradient-to-br from-[#00873A] via-[#0B5D2E] to-[#111111] text-white px-3 py-3 text-center shadow-md border-2 border-[#EBB40E]/80">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#EBB40E]">
                Today
              </div>
              <div className="text-sm font-extrabold mt-0.5">
                {farmDate.shortDate}, {farmDate.year}
              </div>
              <div className="text-[10px] text-white/85 font-semibold mt-0.5 truncate">
                {profile.countryFlag} {profile.areaHectares} ha
              </div>
            </div>

            {/* Stage Tiles + Animated Flow Arrows */}
            {activeTimed.stages.map((item, idx) => {
              const isLive = idx === liveStageIdx;
              const isSelected = idx === inspectedStageIdx;
              return (
                <React.Fragment key={`active-stage-${item.step.stepNumber}`}>
                  {/* Animated directional connector arrow */}
                  <svg
                    width="34"
                    height="24"
                    viewBox="0 0 34 24"
                    className="shrink-0"
                    aria-hidden="true"
                  >
                    <line
                      x1="2"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="#00873A"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <line
                      x1="2"
                      y1="12"
                      x2="26"
                      y2="12"
                      stroke="#EBB40E"
                      strokeWidth="2.2"
                      strokeDasharray="5 10"
                      className="roadmap-arrow-flow"
                    />
                    <path d="M 23 6 L 32 12 L 23 18 Z" fill="#00873A" />
                  </svg>

                  {/* Proportional Stage Tile (flexGrow = honest months duration) */}
                  <button
                    type="button"
                    onClick={() => setInspectedStageIdx(idx)}
                    style={{ flexGrow: item.months, flexBasis: `${item.months * 26}px` }}
                    className={`relative rounded-2xl px-3 py-3 text-left border-2 transition-all duration-200 cursor-pointer min-w-[132px] ${
                      isLive
                        ? 'bg-white border-[#00873A] roadmap-stage-pulse z-20'
                        : isSelected
                          ? 'bg-[#F2FBF6] border-[#00873A] shadow-md -translate-y-0.5 z-10'
                          : 'bg-white border-[#B9DEC8] hover:border-[#00873A] hover:shadow-sm'
                    }`}
                  >
                    {isLive && (
                      <span className="absolute -top-3 left-3 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#111111] text-[#EBB40E] border border-[#EBB40E] text-[9.5px] font-extrabold whitespace-nowrap shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-90" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EBB40E]" />
                        </span>
                        NOW · STAGE 1
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#E3F5EB] text-[#005222]">
                        Stage {item.step.stepNumber}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold text-[#4A4A4A]">
                        <Clock className="w-3 h-3 text-[#007432]" />
                        {item.months} mos
                      </span>
                    </div>

                    <div className="text-sm font-extrabold text-[#111111] mt-1.5 truncate">
                      {item.step.cropName}
                    </div>
                    <div className="text-[11px] font-bold text-[#4A4A4A] mt-0.5 truncate">
                      {item.windowLabel}
                    </div>
                    {item.eventTag && (
                      <div className="mt-1 inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FDF6DC] text-[#7A5600] border border-[#EBD58B] text-[9.5px] font-extrabold truncate max-w-full">
                        {item.eventTag}
                      </div>
                    )}
                  </button>
                </React.Fragment>
              );
            })}

            {/* Final Arrow to Real Outcome */}
            <svg
              width="34"
              height="24"
              viewBox="0 0 34 24"
              className="shrink-0"
              aria-hidden="true"
            >
              <line
                x1="2"
                y1="12"
                x2="26"
                y2="12"
                stroke="#00873A"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <line
                x1="2"
                y1="12"
                x2="26"
                y2="12"
                stroke="#EBB40E"
                strokeWidth="2.2"
                strokeDasharray="5 10"
                className="roadmap-arrow-flow"
              />
              <path d="M 23 6 L 32 12 L 23 18 Z" fill="#00873A" />
            </svg>

            {/* Real Outcome Node for THIS Chosen Strategy */}
            <button
              type="button"
              onClick={() => onNavigate?.('predictions')}
              className="w-[162px] shrink-0 rounded-2xl bg-gradient-to-br from-[#007432] via-[#1C8E46] to-[#C69200] text-white px-3 py-3 text-left shadow-md hover:scale-[1.02] transition-transform cursor-pointer"
              title="Open 5-Year Future Predictions"
            >
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFF7D1]">
                Expected Outcome
              </div>
              <div className="text-sm font-extrabold mt-0.5 leading-snug">
                +{activeStrategy.expectedOutput.yieldImprovementPct}% Yield · -{activeStrategy.expectedOutput.chemicalReductionPct}% Chem
              </div>
              <div className="text-[10px] text-white/90 font-bold mt-0.5">
                +{activeStrategy.expectedOutput.soilFertilityGainPct}% Soil · +{activeStrategy.expectedOutput.waterSavingsPct}% Water
              </div>
            </button>
          </div>
        </div>

        {/* Clean Plain-Farmer Action Strip for the Inspected / Current Stage */}
        {inspected && (
          <div className="rounded-2xl bg-[#F5F4F0] border border-[#DFDDD6] px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-[#007432] text-white flex items-center justify-center shrink-0 mt-0.5">
                {inspectedStageIdx === liveStageIdx ? (
                  <Sparkles className="w-4 h-4 text-[#EBB40E]" />
                ) : (
                  <Compass className="w-4 h-4" />
                )}
              </span>
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-extrabold text-[#111111]">
                    Stage {inspected.step.stepNumber}: {inspected.step.cropName} ({inspected.windowLabel} · {inspected.months} months)
                  </span>
                  {inspectedStageIdx === liveStageIdx && (
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#E3F5EB] text-[#005222]">
                      Active Now
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#2E2E2E] leading-relaxed">
                  <strong>What to do:</strong> {inspected.step.whatToDo}
                </p>
                <p className="text-xs text-[#3A3A3A] leading-relaxed">
                  <strong>Why it helps:</strong> {inspected.step.soilImprovementNote}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#D4D0C4] text-[11px] font-extrabold text-[#007432]">
                <Droplets className="w-3.5 h-3.5" />
                {inspected.step.moistureRetentionPct}% moisture
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#D4D0C4] text-[11px] font-extrabold text-[#8F6900]">
                <ShieldCheck className="w-3.5 h-3.5" />
                -{inspected.step.chemicalReductionPct}% chem
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#D4D0C4] text-[11px] font-extrabold text-[#3F6300]">
                <Leaf className="w-3.5 h-3.5" />
                Soil {inspected.step.soilRichnessScore}/100
              </span>
              <button
                type="button"
                onClick={() => onNavigate?.('calendar')}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#111111] hover:bg-[#007432] text-white text-[11px] font-extrabold transition cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#EBB40E]" />
                Tasks
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  // =========================================================================
  // MODE 2: AI ROTATION LAB (BEFORE CHOOSING) - DIVERGING 4-PATH COMPARISON
  // Starts at Today on the left -> 3 tailored paths + 4th Blank Custom AI branch -> distinct outcomes
  // =========================================================================
  const customBranchHovered = hoveredLaneId === 'custom-ai-path';

  return (
    <section className="surface-card p-5 sm:p-6 space-y-4 bg-[#FFFEFB]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1 pt-1 shrink-0" aria-hidden="true">
            <span className="w-1.5 h-5 rounded-full bg-[#00873A]" />
            <span className="w-1.5 h-5 rounded-full bg-[#EBB40E]" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-[#3A3A3A]">
              Compare All Trajectories Before You Choose
            </div>
            <h3 className="text-xl font-extrabold text-[#111111] leading-tight mt-0.5">
              Same Starting Field, 3 Tailored Paths + Your Custom AI Trajectory
            </h3>
            <p className="text-xs sm:text-sm text-[#3A3A3A] mt-0.5">
              Tile widths show real crop lengths in months. Click any of the 3 starting paths to
              simulate it, or click the blank Custom AI branch to design your own trajectory with
              Tadawol AI.
            </p>
          </div>
        </div>
      </div>

      {/* Diverging 4-Path Comparison Canvas */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[980px] rounded-2xl bg-[#F8F7F2] border border-[#E2DFD6] p-4 sm:p-5 flex items-stretch gap-0">
          {/* Shared Left Start Pillar ("Your Farm Today") */}
          <div className="w-[138px] shrink-0 flex flex-col justify-center">
            <div className="rounded-2xl bg-gradient-to-br from-[#00873A] via-[#0B5D2E] to-[#111111] text-white px-3 py-5 text-center shadow-lg border-2 border-[#EBB40E]/85">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#111111]/60 text-[#EBB40E] text-[9.5px] font-extrabold mb-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-90" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EBB40E]" />
                </span>
                START NOW
              </span>
              <div className="text-sm font-extrabold">
                {farmDate.shortDate}, {farmDate.year}
              </div>
              <div className="text-[11px] text-white/90 font-semibold mt-1">
                {profile.countryFlag} {profile.areaHectares} ha
              </div>
              <div className="text-[10px] text-white/75 font-medium mt-0.5">
                {profile.soilType} · {profile.slopeDeg}° slope
              </div>
            </div>
          </div>

          {/* Diverging SVG Fan from Start -> 4 Independent Lanes (3 Tailored + 1 Blank Custom AI Branch) */}
          <svg
            width="54"
            viewBox="0 0 54 456"
            preserveAspectRatio="none"
            className="shrink-0 self-stretch"
            aria-hidden="true"
          >
            {allTimed.map(({ strat, theme }, laneIdx) => {
              const targetY = laneIdx === 0 ? 58 : laneIdx === 1 ? 171 : 284;
              const isFocus =
                hoveredLaneId === strat.id || (!hoveredLaneId && strat.id === activeStrategy.id);
              const d = `M 2 228 C 28 228, 28 ${targetY}, 50 ${targetY}`;
              return (
                <React.Fragment key={`fan-${strat.id}`}>
                  <path
                    d={d}
                    fill="none"
                    stroke={theme.stroke}
                    strokeWidth={isFocus ? 3.2 : 2}
                    strokeOpacity={isFocus ? 1 : 0.45}
                    strokeLinecap="round"
                  />
                  {isFocus && (
                    <path
                      d={d}
                      fill="none"
                      stroke="#EBB40E"
                      strokeWidth={2}
                      strokeDasharray="6 14"
                      className="roadmap-arrow-flow"
                    />
                  )}
                  <circle cx={50} cy={targetY} r={3.5} fill={theme.stroke} />
                </React.Fragment>
              );
            })}

            {/* 4th Branch: Dashed Violet Custom AI Trajectory Curve */}
            {(() => {
              const dCustom = 'M 2 228 C 28 228, 28 398, 50 398';
              return (
                <React.Fragment key="fan-custom-ai">
                  <path
                    d={dCustom}
                    fill="none"
                    stroke="#6D28D9"
                    strokeWidth={customBranchHovered ? 3.2 : 2.2}
                    strokeOpacity={customBranchHovered ? 1 : 0.72}
                    strokeDasharray="6 5"
                    strokeLinecap="round"
                  />
                  {customBranchHovered && (
                    <path
                      d={dCustom}
                      fill="none"
                      stroke="#EBB40E"
                      strokeWidth={2}
                      strokeDasharray="6 14"
                      className="roadmap-arrow-flow"
                    />
                  )}
                  <circle cx={50} cy={398} r={3.8} fill="#6D28D9" />
                </React.Fragment>
              );
            })()}
          </svg>

          {/* 3 Independent Horizontal Paths + 4th Blank Custom AI Trajectory Branch */}
          <div className="flex-1 flex flex-col justify-between gap-3.5">
            {allTimed.map(({ strat, theme, stages, totalMonths }) => {
              const isHighlighted =
                hoveredLaneId === strat.id || (!hoveredLaneId && strat.id === activeStrategy.id);

              return (
                <div
                  key={`compare-lane-${strat.id}`}
                  onMouseEnter={() => setHoveredLaneId(strat.id)}
                  onMouseLeave={() => setHoveredLaneId(null)}
                  onClick={() => onSelectStrategy(strat.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectStrategy(strat.id);
                    }
                  }}
                  style={{
                    borderColor: isHighlighted ? theme.stroke : '#E2DFD6',
                    backgroundColor: isHighlighted ? theme.softBg : '#FFFFFF',
                  }}
                  className={`rounded-2xl border-2 p-3 transition-all duration-200 cursor-pointer ${
                    isHighlighted ? 'shadow-md' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Lane Title Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-extrabold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                      >
                        Path {theme.code} · Option {strat.rank}
                      </span>
                      <span className="text-xs font-extrabold text-[#111111]">{strat.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-extrabold">
                      <span className="inline-flex items-center gap-1 text-[#4A4A4A]">
                        <Clock className="w-3.5 h-3.5" style={{ color: theme.stroke }} />
                        {totalMonths} months total
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#111111] text-[#EBB40E] text-[10px]">
                        {strat.matchScore}% match
                      </span>
                    </div>
                  </div>

                  {/* Proportional Stage Tiles -> Separate Real Outcome Box */}
                  <div className="flex items-center gap-0">
                    {stages.map((item, idx) => (
                      <React.Fragment key={`cmp-${strat.id}-${idx}`}>
                        {idx > 0 && (
                          <svg
                            width="22"
                            height="18"
                            viewBox="0 0 22 18"
                            className="shrink-0"
                            aria-hidden="true"
                          >
                            <line
                              x1="1"
                              y1="9"
                              x2="15"
                              y2="9"
                              stroke={theme.stroke}
                              strokeWidth={isHighlighted ? 2.6 : 1.8}
                              strokeOpacity={isHighlighted ? 1 : 0.55}
                            />
                            <path
                              d="M 13 4.5 L 20 9 L 13 13.5 Z"
                              fill={theme.stroke}
                              fillOpacity={isHighlighted ? 1 : 0.6}
                            />
                          </svg>
                        )}
                        <div
                          style={{
                            flexGrow: item.months,
                            flexBasis: `${item.months * 22}px`,
                            borderColor: isHighlighted ? theme.stroke : theme.softBorder,
                          }}
                          className={`rounded-xl bg-white border px-2.5 py-2 min-w-[104px] transition ${
                            idx === 0 && isHighlighted ? 'ring-2 ring-[#EBB40E]/70' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
                            <span style={{ color: theme.badgeText }} className="font-extrabold">
                              {theme.code}
                              {item.step.stepNumber}
                            </span>
                            <span className="text-[#555555]">{item.months}m</span>
                          </div>
                          <div className="text-xs font-extrabold text-[#111111] truncate mt-0.5">
                            {item.step.cropName}
                          </div>
                          <div className="text-[10px] font-semibold text-[#555555] truncate">
                            {item.step.cropFamily}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}

                    {/* Connector Arrow to THIS Path's Unique Outcome */}
                    <svg
                      width="26"
                      height="18"
                      viewBox="0 0 26 18"
                      className="shrink-0"
                      aria-hidden="true"
                    >
                      <line
                        x1="1"
                        y1="9"
                        x2="19"
                        y2="9"
                        stroke={theme.stroke}
                        strokeWidth={isHighlighted ? 3 : 2}
                      />
                      <path d="M 17 4 L 25 9 L 17 14 Z" fill={theme.stroke} />
                    </svg>

                    {/* Unique Outcome Box Specific to THIS Strategy */}
                    <div
                      className={`w-[205px] shrink-0 rounded-xl bg-gradient-to-br ${theme.outcomeBg} text-white px-3 py-2 shadow-sm`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FFF3BF] truncate">
                          {strat.focusTag}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#EBB40E] shrink-0" />
                      </div>
                      <div className="text-xs font-extrabold mt-0.5">
                        +{strat.expectedOutput.yieldImprovementPct}% Yield · -{strat.expectedOutput.chemicalReductionPct}% Chem
                      </div>
                      <div className="text-[10px] text-white/90 font-semibold mt-0.5">
                        +{strat.expectedOutput.waterSavingsPct}% Water · +{strat.expectedOutput.soilFertilityGainPct}% Soil · {strat.expectedOutput.bareDaysPerYear}d bare
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 4TH BRANCH: BLANK CUSTOM AI TRAJECTORY (Click to Fill With AI Advisor) */}
            <div
              onMouseEnter={() => setHoveredLaneId('custom-ai-path')}
              onMouseLeave={() => setHoveredLaneId(null)}
              onClick={() => onOpenAiAdvisor?.()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpenAiAdvisor?.();
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-3 transition-all duration-200 cursor-pointer ${
                customBranchHovered
                  ? 'border-[#6D28D9] bg-[#F5F0FF] shadow-md'
                  : 'border-[#B9A4E8] bg-[#FAF8FF] hover:border-[#6D28D9]'
              }`}
            >
              {/* Custom Branch Title Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#EDE9FE] text-[#5B21B6]">
                    <Bot className="w-3 h-3" />
                    Path D · Custom AI Branch
                  </span>
                  <span className="text-xs font-extrabold text-[#111111]">
                    Design Your Own Custom Trajectory with AI Advisor
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold">
                  <span className="text-[#5B21B6]">2 to 6 custom stages</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#6D28D9] text-white text-[10px]">
                    Fill Blank Plan →
                  </span>
                </div>
              </div>

              {/* Blank Customizable Stage Slots -> Custom AI Finished Trajectory Box */}
              <div className="flex items-center gap-0">
                {[
                  { code: 'D1', title: 'Your Crop 1', sub: 'Choose crop & months' },
                  { code: 'D2', title: 'Your Crop 2', sub: 'Legume / cash crop' },
                  { code: 'D3', title: 'Your Crop 3', sub: 'Cover / rotation fit' },
                  { code: 'D4+', title: '+ More Stages', sub: 'Optional 4 to 6 stages' },
                ].map((slot, sIdx) => (
                  <React.Fragment key={slot.code}>
                    {sIdx > 0 && (
                      <svg
                        width="22"
                        height="18"
                        viewBox="0 0 22 18"
                        className="shrink-0"
                        aria-hidden="true"
                      >
                        <line
                          x1="1"
                          y1="9"
                          x2="15"
                          y2="9"
                          stroke="#6D28D9"
                          strokeWidth={customBranchHovered ? 2.4 : 1.8}
                          strokeDasharray="4 3"
                          strokeOpacity={customBranchHovered ? 1 : 0.65}
                        />
                        <path
                          d="M 13 4.5 L 20 9 L 13 13.5 Z"
                          fill="#6D28D9"
                          fillOpacity={customBranchHovered ? 1 : 0.7}
                        />
                      </svg>
                    )}
                    <div
                      className={`flex-1 rounded-xl bg-white/85 border border-dashed px-2.5 py-2 min-w-[104px] transition ${
                        customBranchHovered ? 'border-[#6D28D9]' : 'border-[#C4B5FD]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold text-[#6D28D9]">
                        <span>{slot.code}</span>
                        <span className="text-[#7C3AED]/80">?m</span>
                      </div>
                      <div className="text-xs font-extrabold text-[#2E2E2E] truncate mt-0.5">
                        {slot.title}
                      </div>
                      <div className="text-[10px] font-semibold text-[#6B5B95] truncate">
                        {slot.sub}
                      </div>
                    </div>
                  </React.Fragment>
                ))}

                {/* Dashed Arrow into Finished Custom Trajectory Destination */}
                <svg
                  width="26"
                  height="18"
                  viewBox="0 0 26 18"
                  className="shrink-0"
                  aria-hidden="true"
                >
                  <line
                    x1="1"
                    y1="9"
                    x2="19"
                    y2="9"
                    stroke="#6D28D9"
                    strokeWidth={customBranchHovered ? 3 : 2.2}
                    strokeDasharray="4 3"
                  />
                  <path d="M 17 4 L 25 9 L 17 14 Z" fill="#6D28D9" />
                </svg>

                {/* Finished Custom Trajectory Outcome Card */}
                <div className="w-[205px] shrink-0 rounded-xl bg-gradient-to-br from-[#111111] via-[#3B1775] to-[#007432] text-white px-3 py-2 shadow-sm border border-[#EBB40E]/45">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#EBB40E] truncate">
                      Custom AI Trajectory
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#EBB40E] shrink-0" />
                  </div>
                  <div className="text-xs font-extrabold mt-0.5">
                    Tailored Yield, Water &amp; Soil
                  </div>
                  <div className="text-[10px] text-white/90 font-semibold mt-0.5">
                    Click to open AI Advisor &amp; build
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
