import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { PlanCustomization, ScoredRotationStrategy } from '../types/farm';

interface ConfirmStrategyChangeModalProps {
  isOpen: boolean;
  activeStrategy: ScoredRotationStrategy;
  planCustomization?: PlanCustomization;
  onCancel: () => void;
  onConfirmChange: () => void;
  onOpenAiAdvisorInstead?: () => void;
}

export const ConfirmStrategyChangeModal: React.FC<ConfirmStrategyChangeModalProps> = ({
  isOpen,
  activeStrategy,
  planCustomization,
  onCancel,
  onConfirmChange,
  onOpenAiAdvisorInstead,
}) => {
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isOpen) {
      setConfirmStep(1);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const hasCustomEdits = Boolean(
    planCustomization &&
      (planCustomization.monthShift !== 0 ||
        Object.keys(planCustomization.stageOverrides ?? {}).length > 0)
  );

  return (
    <div
      className="fixed inset-0 z-[1200] bg-black/55 backdrop-blur-[2px] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-strategy-change-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-[#FFFEFB] border border-[#DFDDD6] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Progress Header */}
        <div className="px-5 py-4 bg-[#111111] text-white flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                confirmStep === 1
                  ? 'bg-[#EBB40E] text-[#111111]'
                  : 'bg-[#D64527] text-white'
              }`}
            >
              {confirmStep === 1 ? (
                <AlertTriangle className="w-4.5 h-4.5" />
              ) : (
                <ShieldAlert className="w-4.5 h-4.5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#EBB40E]">
                Double Confirmation · Step {confirmStep} of 2
              </div>
              <h3
                id="confirm-strategy-change-title"
                className="text-sm sm:text-base font-extrabold text-white leading-tight"
              >
                {confirmStep === 1
                  ? 'Change Your Rotation Strategy?'
                  : 'Final Confirmation Required'}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Close confirmation dialog"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator Bar */}
        <div className="grid grid-cols-2 h-1.5 bg-[#EFECE4]">
          <div className="bg-[#EBB40E]" />
          <div className={confirmStep === 2 ? 'bg-[#D64527] transition-colors' : 'bg-transparent'} />
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current Active Plan Summary */}
          <div className="p-3.5 rounded-xl bg-[#F5F4F0] border border-[#DFDDD6]">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A]">
              Currently Active Plan
            </div>
            <div className="text-sm font-extrabold text-[#111111] mt-0.5">
              {activeStrategy.title}
            </div>
            <div className="text-xs text-[#3A3A3A] mt-0.5">
              {activeStrategy.tierLabel} · Match Score {activeStrategy.matchScore}%
            </div>
          </div>

          {confirmStep === 1 ? (
            <div className="space-y-3">
              <p className="text-xs sm:text-sm text-[#2D2D2D] leading-relaxed">
                Leaving your active strategy will open <strong className="text-[#111111]">AI Rotation Lab</strong> so you can pick a different crop rotation path. Until you select a new plan, your Dashboard roadmap will stay hidden.
              </p>

              {hasCustomEdits && (
                <div className="p-3 rounded-xl bg-[#FDF6DC] border border-[#EBD58B] text-xs text-[#6E5100] font-semibold leading-relaxed">
                  <strong>Note:</strong> You currently have custom AI Advisor adjustments on this plan. Switching strategies will clear those custom edits.
                </div>
              )}

              {onOpenAiAdvisorInstead && (
                <button
                  type="button"
                  onClick={() => {
                    onCancel();
                    onOpenAiAdvisorInstead();
                  }}
                  className="w-full p-3 rounded-xl bg-[#E3F5EB]/70 hover:bg-[#E3F5EB] border border-[#A8DEC0] text-left flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Bot className="w-4 h-4 text-[#007432] shrink-0" />
                    <span className="text-xs font-bold text-[#005222]">
                      Only need a small change? Adjust via AI Advisor instead
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#007432] shrink-0" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-[#FDECEA] border border-[#F5C2BA] space-y-2">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#9A2512]">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                Confirm Replacement
              </div>
              <p className="text-xs sm:text-sm text-[#5C190E] leading-relaxed">
                Are you completely sure you want to unset <strong>{activeStrategy.title}</strong> and pick a new rotation strategy? Your Farm Calendar and Roadmap will switch to whichever plan you choose next.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 pt-1">
            {confirmStep === 1 ? (
              <>
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 rounded-full bg-[#F5F4F0] hover:bg-[#E5E3DB] text-[#111111] text-xs font-extrabold transition cursor-pointer"
                >
                  Keep Current Plan
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmStep(2)}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#111111] hover:bg-[#2A2A2A] text-white text-xs font-extrabold transition cursor-pointer"
                >
                  Continue to Confirm
                  <ArrowRight className="w-3.5 h-3.5 text-[#EBB40E]" />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmStep(1)}
                  className="px-4 py-2.5 rounded-full bg-[#F5F4F0] hover:bg-[#E5E3DB] text-[#111111] text-xs font-extrabold transition cursor-pointer"
                >
                  Back, Keep Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmChange();
                  }}
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full bg-[#D64527] hover:bg-[#B23318] text-white text-xs font-extrabold transition cursor-pointer shadow-xs"
                >
                  Yes, Change Strategy Now
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
