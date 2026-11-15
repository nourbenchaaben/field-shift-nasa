import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';
import { PendingPlanProposal } from '../types/farm';

const FARMER_QUICK_PROMPTS = [
  'Build a custom 5-stage plan with Wheat, Chickpeas, Tomatoes, Oats & Clover',
  'Add a 5th stage with Summer Cover Crop',
  'Swap Stage 2 to Artichokes for 5 months',
  'Heavy rain delayed my sowing by 1 month',
  'Dry spell and low water this month',
  'How do I cut chemical fertilizer costs?',
];

function renderInlineBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} className="font-bold text-[#111111]">
        {part.slice(2, -2)}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function renderBoldText(text: string) {
  const rawLines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const trimmed = rawLines[i].trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    // Gracefully convert any Markdown pipe table into clean compact stage cards (never raw pipes!)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith('|')) {
        tableLines.push(rawLines[i].trim());
        i += 1;
      }
      const parsedRows = tableLines
        .filter((l) => !/^\|[\s:|-]+\|$/.test(l))
        .map((l) =>
          l
            .slice(1, -1)
            .split('|')
            .map((cell) => cell.trim())
        );
      if (parsedRows.length > 1) {
        const headers = parsedRows[0];
        const bodyRows = parsedRows.slice(1);
        blocks.push(
          <div key={`tbl-${i}`} className="mt-2 space-y-1.5">
            {bodyRows.map((cells, rIdx) => (
              <div
                key={rIdx}
                className="rounded-lg bg-[#F8F7F2] border border-[#E5E2D9] px-2.5 py-2 text-[11.5px] leading-snug"
              >
                <div className="font-extrabold text-[#111111]">
                  {cells.slice(0, Math.min(3, cells.length)).join(' · ')}
                </div>
                {cells.slice(3).map((val, cIdx) =>
                  val ? (
                    <div key={cIdx} className="text-[#3A3A3A] mt-0.5">
                      <span className="font-bold text-[#007432]">
                        {headers[cIdx + 3] || 'Note'}:
                      </span>{' '}
                      {renderInlineBold(val)}
                    </div>
                  ) : null
                )}
              </div>
            ))}
          </div>
        );
      }
      continue;
    }

    // Markdown heading (### Title)
    const headingMatch = trimmed.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      blocks.push(
        <p key={`h-${i}`} className={`${blocks.length > 0 ? 'mt-2.5' : ''} font-extrabold text-[#111111]`}>
          {renderInlineBold(headingMatch[1])}
        </p>
      );
      i += 1;
      continue;
    }

    // Bullet item (- or * or •)
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      blocks.push(
        <div key={`b-${i}`} className={`${blocks.length > 0 ? 'mt-1' : ''} flex items-start gap-1.5`}>
          <span className="text-[#00873A] font-extrabold mt-0.5 shrink-0">•</span>
          <span>{renderInlineBold(bulletMatch[1])}</span>
        </div>
      );
      i += 1;
      continue;
    }

    // Standard paragraph
    blocks.push(
      <p key={`p-${i}`} className={blocks.length > 0 ? 'mt-2' : ''}>
        {renderInlineBold(trimmed)}
      </p>
    );
    i += 1;
  }

  return blocks;
}

interface ProposalCardProps {
  messageId: string;
  proposal: PendingPlanProposal;
  onConfirm: (messageId: string) => void;
  onCancel: (messageId: string) => void;
}

const ProposalConfirmCard: React.FC<ProposalCardProps> = ({
  messageId,
  proposal,
  onConfirm,
  onCancel,
}) => {
  const [confirmStep, setConfirmStep] = useState<1 | 2>(1);

  if (proposal.status === 'applied') {
    return (
      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E3F5EB] border border-[#A9DEC0] text-[#005222] text-[11px] font-extrabold">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#00873A] shrink-0" />
        <span>Confirmed &amp; Applied: {proposal.summary}</span>
      </div>
    );
  }

  if (proposal.status === 'cancelled') {
    return (
      <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F3F2EE] border border-[#D8D5CC] text-[#555555] text-[11px] font-bold">
        <X className="w-3.5 h-3.5 shrink-0" />
        <span>Proposed change cancelled (plan unchanged)</span>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-xl border-2 border-[#EBB40E] bg-[#FFFDF4] p-3 space-y-2.5">
      <div className="flex items-start gap-2">
        {proposal.requiresDoubleConfirm ? (
          <AlertTriangle className="w-4 h-4 text-[#9B6B00] shrink-0 mt-0.5" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#007432] shrink-0 mt-0.5" />
        )}
        <div className="min-w-0">
          <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-[#7A5600]">
            {proposal.requiresDoubleConfirm
              ? 'Confirmation Required · Strategy / Custom Plan Change'
              : 'Confirm Plan Update'}
          </div>
          <div className="text-xs font-extrabold text-[#111111] mt-0.5">{proposal.summary}</div>
        </div>
      </div>

      {proposal.details.length > 0 && (
        <ul className="space-y-1 text-[11px] text-[#2D2D2D] pl-1">
          {proposal.details.map((d, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="text-[#00873A] font-extrabold">•</span>
              <span>{d}</span>
            </li>
          ))}
        </ul>
      )}

      {proposal.previewStages && proposal.previewStages.length > 0 && (
        <div className="pt-1 border-t border-[#EFE5BF]">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#555555] mb-1.5">
            Preview ({proposal.previewStages.length} Stages):
          </div>
          <div className="flex flex-wrap gap-1">
            {proposal.previewStages.map((st, idx) => (
              <span
                key={`${st.cropName}-${idx}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#D8D5CC] text-[10.5px] font-bold text-[#111111]"
              >
                <span className="text-[#007432] font-extrabold">{idx + 1}.</span>
                <span>{st.cropName}</span>
                {st.durationMonths ? (
                  <span className="text-[#555555] font-semibold">({st.durationMonths}m)</span>
                ) : null}
              </span>
            ))}
          </div>
        </div>
      )}

      {proposal.requiresDoubleConfirm && confirmStep === 2 ? (
        <div className="pt-1.5 border-t border-[#EFE5BF] space-y-2">
          <div className="text-[11px] font-bold text-[#9B1C1C]">
            Step 2 of 2: Are you sure you want to update your active Roadmap &amp; Calendar with this plan?
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onConfirm(messageId)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] text-white text-[11px] font-extrabold transition cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Yes, Apply This Plan
            </button>
            <button
              type="button"
              onClick={() => setConfirmStep(1)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F3F2EE] border border-[#CFCBC2] text-[#2D2D2D] text-[11px] font-bold transition cursor-pointer"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              if (proposal.requiresDoubleConfirm) {
                setConfirmStep(2);
              } else {
                onConfirm(messageId);
              }
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#00873A] hover:bg-[#006B2E] text-white text-[11px] font-extrabold transition cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {proposal.requiresDoubleConfirm ? 'Confirm Strategy Change (1/2)' : 'Confirm & Apply'}
          </button>
          <button
            type="button"
            onClick={() => onCancel(messageId)}
            className="px-3 py-1.5 rounded-full bg-white hover:bg-[#F3F2EE] border border-[#CFCBC2] text-[#2D2D2D] text-[11px] font-bold transition cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export const SplitAiChatbot: React.FC = () => {
  const {
    profile,
    activeStrategy,
    planCustomization,
    resetPlanCustomization,
    chatMessages,
    isChatThinking,
    aiProviderLabel,
    isChatOpen,
    setIsChatOpen,
    sendChatMessage,
    confirmPlanProposal,
    cancelPlanProposal,
  } = useFarm();

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const hasCustomEdits = Boolean(
    planCustomization &&
      (planCustomization.monthShift !== 0 ||
        Object.keys(planCustomization.stageOverrides ?? {}).length > 0 ||
        Boolean(planCustomization.customStages && planCustomization.customStages.length > 0) ||
        Boolean(planCustomization.customStrategyTitle))
  );

  useEffect(() => {
    if (isChatOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatMessages.length, isChatThinking, isChatOpen]);

  useEffect(() => {
    if (isChatOpen) {
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  // MINIMIZED STATE: Compact circular logo-style bot orb that smoothly expands into the full pill on hover
  if (!isChatOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="group inline-flex items-center p-1.5 hover:pr-4 focus-visible:pr-4 rounded-full bg-[#111111] text-white border-2 border-[#EBB40E] shadow-[0_14px_32px_rgba(17,17,17,0.32)] hover:bg-[#00873A] hover:border-[#92D500] transition-all duration-300 ease-out cursor-pointer"
          aria-label="Expand AI Advisor Chatbot"
        >
          {/* Circular Tadawol-logo-styled 4-color ring with Bot icon inside */}
          <span className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 100 100"
              fill="none"
              className="w-12 h-12 transition-transform duration-500 ease-out group-hover:rotate-90"
              aria-hidden="true"
            >
              <g strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M 27 25 A 36 36 0 0 1 72 22" stroke="#00873A" />
                <path d="M 65 13 L 75 23 L 62 28" stroke="#00873A" />
                <path d="M 76 31 A 36 36 0 0 1 77 73" stroke="#EBB40E" />
                <path d="M 86 66 L 76 76 L 70 63" stroke="#EBB40E" />
                <path d="M 69 78 A 36 36 0 0 1 28 76" stroke="#92D500" />
                <path d="M 34 86 L 24 75 L 38 71" stroke="#92D500" />
                <path d="M 23 68 A 36 36 0 0 1 23 30" stroke="#44BE7E" />
                <path d="M 14 37 L 24 27 L 30 40" stroke="#44BE7E" />
              </g>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="w-7 h-7 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center shadow-xs">
                <Bot className="w-4 h-4" />
              </span>
            </span>
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-[#92D500] ring-2 ring-[#111111] group-hover:ring-[#00873A]" />
          </span>

          {/* Pill text smoothly revealed on hover / keyboard focus */}
          <span className="max-w-0 opacity-0 overflow-hidden whitespace-nowrap group-hover:max-w-[230px] group-hover:opacity-100 group-hover:ml-2.5 group-focus-visible:max-w-[230px] group-focus-visible:opacity-100 group-focus-visible:ml-2.5 transition-all duration-300 ease-out inline-flex items-center gap-2.5">
            <span className="text-left">
              <span className="block text-xs font-extrabold leading-tight">Tadawol AI Advisor</span>
              <span className="block text-[11px] text-white/85">
                {profile.countryFlag} {profile.countryName} · Expand
              </span>
            </span>
            <Maximize2 className="w-4 h-4 text-[#EBB40E] shrink-0" />
          </span>
        </button>
      </div>
    );
  }

  // EXPANDED RESPONSIVE SPLIT-SCREEN / SLIDE-OVER PANEL
  return (
    <>
      {/* Mobile / tablet backdrop when panel slides over content */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[1px] z-30 lg:hidden"
        onClick={() => setIsChatOpen(false)}
        aria-hidden="true"
      />

      <aside
        className="fixed top-0 right-0 bottom-0 z-40 w-[min(100vw,410px)] lg:sticky lg:top-0 lg:z-20 lg:w-[370px] xl:w-[410px] shrink-0 h-[100dvh] bg-[#FFFEFB] border-l border-[#DFDDD6] flex flex-col shadow-[-10px_0_30px_rgba(17,17,17,0.14)] lg:shadow-[-6px_0_24px_rgba(17,17,17,0.05)]"
        aria-label="Tadawol Split-Screen AI Advisor"
      >
        {/* Header */}
        <div className="h-[74px] px-4 bg-[#111111] text-white flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white truncate">Tadawol AI Advisor</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#00873A]/30 border border-[#92D500]/40 text-[10px] font-extrabold text-[#92D500] shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#92D500] animate-pulse" />
                  Online
                </span>
              </div>
              <div className="text-[11px] text-[#D7DFCE] flex items-center gap-1.5 truncate mt-0.5">
                <span className="truncate">
                  {profile.countryFlag} {profile.countryName} · {profile.soilType}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-[#EBB40E] hover:text-[#111111] text-white flex items-center justify-center transition cursor-pointer shrink-0"
            title="Minimize chatbot and expand workspace"
            aria-label="Minimize chatbot"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Farm Context & Custom Plan Status Ribbon */}
        <div className="px-4 py-2.5 bg-[#F5F4F0] border-b border-[#DFDDD6] flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <span className="inline-flex items-center gap-1 font-extrabold text-[#007432]">
            <Sparkles className="w-3.5 h-3.5" />
            Moisture: {profile.nasaPower.moistureStatus} ({profile.nasaPower.rootMoisturePct}%)
          </span>
          {hasCustomEdits ? (
            <button
              type="button"
              onClick={resetPlanCustomization}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FDF6DC] hover:bg-[#111111] text-[#6E5100] hover:text-white border border-[#EBD58B] text-[11px] font-extrabold transition cursor-pointer"
              title="Reset custom AI edits back to the original Rotation Lab plan"
            >
              <RotateCcw className="w-3 h-3" />
              Custom Plan · Reset
            </button>
          ) : (
            <span className="font-mono-tech font-bold text-[#2E2E2E] truncate max-w-[175px]">
              {activeStrategy.tierLabel}
            </span>
          )}
        </div>

        {/* Scrollable Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F5F4F0]/50">
          {chatMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    isUser ? 'bg-[#00873A] text-white' : 'bg-[#111111] text-[#EBB40E]'
                  }`}
                >
                  {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>

                <div
                  className={`max-w-[87%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                    isUser
                      ? 'bg-[#00873A] text-white rounded-tr-sm'
                      : 'bg-white border border-[#DFDDD6] text-[#2D2D2D] rounded-tl-sm shadow-xs'
                  }`}
                >
                  {!msg.pendingProposal && msg.planChangeSummary && (
                    <div className="mb-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E3F5EB] border border-[#A9DEC0] text-[#005222] text-[11px] font-extrabold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#00873A] shrink-0" />
                      <span>Plan Adjusted: {msg.planChangeSummary}</span>
                    </div>
                  )}
                  {isUser ? <p>{msg.content}</p> : renderBoldText(msg.content)}

                  {msg.pendingProposal && (
                    <ProposalConfirmCard
                      messageId={msg.id}
                      proposal={msg.pendingProposal}
                      onConfirm={confirmPlanProposal}
                      onCancel={cancelPlanProposal}
                    />
                  )}

                  <div
                    className={`text-[11px] mt-1.5 ${
                      isUser ? 'text-white/80 text-right' : 'text-[#555555]'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Animated AI Thinking Bubble */}
          {isChatThinking && (
            <div className="flex items-start gap-2 animate-fade-in">
              <div className="w-7 h-7 rounded-full bg-[#111111] text-[#EBB40E] flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white border border-[#DFDDD6] px-4 py-3 shadow-xs flex items-center gap-2.5">
                <div className="flex items-center gap-1" aria-hidden="true">
                  <span
                    className="w-2 h-2 rounded-full bg-[#00873A] animate-bounce"
                    style={{ animationDelay: '0ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#44BE7E] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-2 h-2 rounded-full bg-[#EBB40E] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
                <span className="text-xs font-bold text-[#3A3A3A]">
                  Thinking ({aiProviderLabel})...
                </span>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Field Event & Custom Plan Quick Chips */}
        <div className="px-3.5 py-2.5 bg-white border-t border-[#E8E5DC]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#3A3A3A] mb-1.5">
            Customize Your Plan or Report an Event
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {FARMER_QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendChatMessage(prompt)}
                className="shrink-0 px-3 py-1.5 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#CFCBC2] text-xs font-bold text-[#111111] transition cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Free-Text Input Box + Send Button */}
        <form
          onSubmit={handleSubmit}
          className="p-3 bg-[#FFFEFB] border-t border-[#DFDDD6] flex items-center gap-2 shrink-0"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your farm or customize any crop & stage..."
            className="flex-1 min-w-0 px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D9D9D9] rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isChatThinking}
            aria-label="Send message"
            className="w-10 h-10 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-[#111111] flex items-center justify-center transition cursor-pointer disabled:opacity-40 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </aside>
    </>
  );
};
