import React, { useMemo } from 'react';
import { Bot, Compass, GitBranch, RotateCcw } from 'lucide-react';
import {
  FarmerProfile,
  PlanCustomization,
  ScoredRotationStrategy,
  StrategyChangeRecord,
} from '../types/farm';
import { useFarmLocalDate } from '../utils/farmLocalClock';

interface StrategyChangeRoadmapProps {
  profile: FarmerProfile;
  selectedStrategyId: string | null;
  activeStrategy: ScoredRotationStrategy;
  planCustomization?: PlanCustomization;
  strategyHistory: StrategyChangeRecord[];
}

function formatChangeTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return 'Recorded';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Recorded';
  }
}

function getActionMeta(record: StrategyChangeRecord): {
  label: string;
  sourceLabel: string;
  pillClass: string;
} {
  if (record.actionType === 'reset') {
    return {
      label: 'Baseline Reset',
      sourceLabel: 'Reset',
      pillClass: 'bg-[#F3F2EE] text-[#3A3A3A] border-[#CFCBC2]',
    };
  }
  if (record.actionType === 'custom-plan') {
    return {
      label: 'Custom AI Plan',
      sourceLabel: 'AI Advisor',
      pillClass: 'bg-[#FDF6DC] text-[#6E5100] border-[#EBD58B]',
    };
  }
  if (record.actionType === 'stage-edit') {
    return {
      label: 'AI Plan Edit',
      sourceLabel: 'AI Advisor',
      pillClass: 'bg-[#E4F5F8] text-[#095560] border-[#A8DAE3]',
    };
  }
  if (record.actionType === 'strategy-switch') {
    return {
      label: record.source === 'ai-advisor' ? 'Switched via AI' : 'Switched in Lab',
      sourceLabel: record.source === 'ai-advisor' ? 'AI Advisor' : 'Rotation Lab',
      pillClass: 'bg-[#E3F5EB] text-[#005222] border-[#A9DEC0]',
    };
  }
  return {
    label: 'Initial Plan',
    sourceLabel: record.source === 'ai-advisor' ? 'AI Advisor' : 'Rotation Lab',
    pillClass: 'bg-[#E3F5EB] text-[#005222] border-[#A9DEC0]',
  };
}

export const StrategyChangeRoadmap: React.FC<StrategyChangeRoadmapProps> = ({
  profile,
  selectedStrategyId,
  activeStrategy,
  planCustomization,
  strategyHistory,
}) => {
  const farmDate = useFarmLocalDate(profile.countryCode, profile.coordinates.lng);

  // If a farm already had a chosen strategy before history tracking started, seed v1 cleanly
  const timelineRecords = useMemo<StrategyChangeRecord[]>(() => {
    if (strategyHistory.length > 0) return strategyHistory;
    if (!selectedStrategyId) return [];
    const hasCustom = Boolean(
      planCustomization &&
        (planCustomization.monthShift !== 0 ||
          Object.keys(planCustomization.stageOverrides ?? {}).length > 0 ||
          Boolean(planCustomization.customStages?.length))
    );
    return [
      {
        id: 'sh-current-seed',
        recordedAt: new Date().toISOString(),
        source: hasCustom ? 'ai-advisor' : 'rotation-lab',
        actionType: hasCustom ? 'custom-plan' : 'initial-selection',
        summary: hasCustom
          ? `Active custom plan: ${activeStrategy.title}`
          : `Active strategy: ${activeStrategy.title}`,
        strategyId: activeStrategy.id,
        strategyTitle: activeStrategy.title,
        tierLabel: activeStrategy.tierLabel,
        focusTag: activeStrategy.focusTag,
        stages: activeStrategy.steps.map((st, idx) => ({
          cropName: st.cropName,
          cropFamily: st.cropFamily,
          cropColor: st.cropColor,
          durationMonths:
            planCustomization?.stageOverrides?.[idx]?.durationMonths ??
            planCustomization?.customStages?.[idx]?.durationMonths,
        })),
        metrics: {
          yieldImprovementPct: activeStrategy.expectedOutput.yieldImprovementPct,
          chemicalReductionPct: activeStrategy.expectedOutput.chemicalReductionPct,
          waterSavingsPct: activeStrategy.expectedOutput.waterSavingsPct,
        },
      },
    ];
  }, [strategyHistory, selectedStrategyId, activeStrategy, planCustomization]);

  const prevCropsLabel =
    profile.previousCrops.length > 0 ? profile.previousCrops.join(', ') : 'Single-crop baseline';

  return (
    <section className="surface-card p-5 sm:p-6 space-y-4 bg-[#FFFEFB]">
      {/* Header (Pure History View - No Action Buttons) */}
      <div className="flex items-start gap-3">
        <div className="flex flex-col gap-1 pt-1 shrink-0" aria-hidden="true">
          <span className="w-1.5 h-5 rounded-full bg-[#00873A]" />
          <span className="w-1.5 h-5 rounded-full bg-[#EBB40E]" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-[#007432]">
              <GitBranch className="w-3.5 h-3.5" />
              Strategy Decision Roadmap ·{' '}
              {timelineRecords.length === 0
                ? 'Ready to Record'
                : `${timelineRecords.length} ${timelineRecords.length === 1 ? 'Version' : 'Revisions'} Recorded`}
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[#111111] leading-tight mt-0.5">
            Strategy Change History Roadmap
          </h3>
          <p className="text-xs sm:text-sm text-[#3A3A3A] mt-0.5">
            Every strategy selection, switch, or confirmed custom adjustment is logged here visually
            so you can trace how your rotation plan evolved up to today.
          </p>
        </div>
      </div>

      {/* Visual Horizontal Strategy Evolution Roadmap */}
      <div className="overflow-x-auto pb-2 pt-1">
        <div className="min-w-[720px] rounded-2xl bg-[#F8F7F2] border border-[#E2DFD6] px-4 py-6 flex items-center gap-0">
          {/* Origin Baseline Node */}
          <div className="w-[158px] shrink-0 rounded-2xl bg-gradient-to-br from-[#111111] via-[#1C2A21] to-[#0B5D2E] text-white px-3.5 py-3.5 shadow-md border-2 border-[#EBB40E]/75">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#EBB40E]">
              Field Baseline
            </div>
            <div className="text-sm font-extrabold mt-1 truncate">{profile.farmName}</div>
            <div className="text-[11px] text-white/85 font-semibold mt-1 line-clamp-2">
              Past: {prevCropsLabel}
            </div>
            <div className="text-[10px] text-[#92D500] font-bold mt-1.5">
              {profile.areaHectares} ha · {profile.soilType}
            </div>
          </div>

          {/* Empty Starter State before any strategy is picked */}
          {timelineRecords.length === 0 ? (
            <>
              <div className="flex flex-col items-center px-2 shrink-0">
                <span className="text-[10px] font-extrabold text-[#555555] mb-1">Next Step</span>
                <svg width="56" height="22" viewBox="0 0 56 22" aria-hidden="true">
                  <line
                    x1="2"
                    y1="11"
                    x2="46"
                    y2="11"
                    stroke="#00873A"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                  />
                  <path d="M 43 5 L 53 11 L 43 17 Z" fill="#00873A" />
                </svg>
              </div>
              <div className="flex-1 rounded-2xl bg-white border-2 border-dashed border-[#B9DEC8] p-4">
                <div className="text-xs font-extrabold uppercase tracking-wider text-[#007432]">
                  No Strategy Changes Recorded Yet
                </div>
                <p className="text-xs sm:text-sm text-[#3A3A3A] mt-1">
                  Once you choose a rotation strategy or confirm custom plan changes, every revision
                  will automatically appear here as a connected roadmap node.
                </p>
              </div>
            </>
          ) : (
            timelineRecords.map((rec, idx) => {
              const isLatest = idx === timelineRecords.length - 1;
              const meta = getActionMeta(rec);
              const isCustom = rec.actionType === 'custom-plan' || rec.actionType === 'stage-edit';

              return (
                <React.Fragment key={rec.id}>
                  {/* Transition Connector + Change Label */}
                  <div className="flex flex-col items-center px-1.5 shrink-0 min-w-[92px]">
                    <span
                      className={`px-2 py-0.5 rounded-full border text-[9.5px] font-extrabold whitespace-nowrap mb-1 ${meta.pillClass}`}
                    >
                      {meta.label}
                    </span>
                    <svg width="68" height="20" viewBox="0 0 68 20" aria-hidden="true">
                      <line
                        x1="2"
                        y1="10"
                        x2="58"
                        y2="10"
                        stroke={isLatest ? '#00873A' : '#738C7C'}
                        strokeWidth={isLatest ? '3' : '2.4'}
                        strokeLinecap="round"
                      />
                      {isLatest && (
                        <line
                          x1="2"
                          y1="10"
                          x2="58"
                          y2="10"
                          stroke="#EBB40E"
                          strokeWidth="2"
                          strokeDasharray="5 10"
                          className="roadmap-arrow-flow"
                        />
                      )}
                      <path
                        d="M 55 4.5 L 65 10 L 55 15.5 Z"
                        fill={isLatest ? '#00873A' : '#738C7C'}
                      />
                    </svg>
                    <span className="text-[9.5px] font-semibold text-[#555555] whitespace-nowrap mt-0.5">
                      {formatChangeTimestamp(rec.recordedAt)}
                    </span>
                  </div>

                  {/* Revision Roadmap Card */}
                  <div
                    className={`relative w-[248px] shrink-0 rounded-2xl p-3.5 text-left border-2 transition-all duration-200 ${
                      isLatest
                        ? 'bg-white border-[#00873A] roadmap-stage-pulse z-20'
                        : 'bg-white border-[#CFCBC2] opacity-95'
                    }`}
                  >
                    {isLatest && (
                      <span className="absolute -top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#111111] text-[#EBB40E] border border-[#EBB40E] text-[9.5px] font-extrabold whitespace-nowrap shadow-xs">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-90" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EBB40E]" />
                        </span>
                        TODAY · {farmDate.shortDate.toUpperCase()} · v{idx + 1}
                      </span>
                    )}

                    <div className="flex items-center justify-between gap-1.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#F5F4F0] text-[#2E2E2E] border border-[#E2DFD6]">
                        {rec.source === 'ai-advisor' ? (
                          <Bot className="w-3 h-3 text-[#007432]" />
                        ) : rec.source === 'reset' ? (
                          <RotateCcw className="w-3 h-3 text-[#6E5100]" />
                        ) : (
                          <Compass className="w-3 h-3 text-[#007432]" />
                        )}
                        v{idx + 1} · {meta.sourceLabel}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          isCustom
                            ? 'bg-[#FDF6DC] text-[#6E5100]'
                            : 'bg-[#E3F5EB] text-[#005222]'
                        }`}
                      >
                        {rec.stages.length} stages
                      </span>
                    </div>

                    <div className="text-sm font-extrabold text-[#111111] mt-2 line-clamp-1">
                      {rec.strategyTitle}
                    </div>
                    <div className="text-[11px] font-semibold text-[#4A4A4A] mt-0.5 line-clamp-1">
                      {rec.summary}
                    </div>

                    {/* Mini Visual Crop Sequence Inside Card */}
                    <div className="mt-2.5 pt-2 border-t border-[#ECEAE2] flex flex-wrap gap-1">
                      {rec.stages.map((st, sIdx) => (
                        <span
                          key={`${rec.id}-st-${sIdx}`}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#F8F7F2] border border-[#E2DFD6] text-[10px] font-bold text-[#111111]"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: st.cropColor || '#00873A' }}
                          />
                          <span className="truncate max-w-[78px]">{st.cropName}</span>
                          {st.durationMonths ? (
                            <span className="text-[#555555] font-semibold">
                              {st.durationMonths}m
                            </span>
                          ) : null}
                        </span>
                      ))}
                    </div>

                    {/* Compact Outcomes */}
                    <div className="mt-2 flex items-center justify-between text-[10px] font-extrabold text-[#007432]">
                      <span>+{rec.metrics.yieldImprovementPct}% yield</span>
                      <span>-{rec.metrics.chemicalReductionPct}% chem</span>
                      <span>-{rec.metrics.waterSavingsPct}% water</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
