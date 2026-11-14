import React, { useEffect, useRef, useState } from 'react';
import { Bot, Maximize2, Minimize2, Send, Sparkles, User } from 'lucide-react';
import { useFarm } from '../context/FarmContext';

const FARMER_QUICK_PROMPTS = [
  'How do I cut chemical fertilizer costs?',
  'Is my soil moisture good for sowing?',
  'Compare my Top 3 rotation strategies',
  'How do I prevent soil erosion on my slope?',
  'What does my NASA weather data mean?',
];

function renderBoldText(text: string) {
  return text.split('\n').map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-2' : ''}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i} className="font-bold text-[#111111]">
              {part.slice(2, -2)}
            </strong>
          ) : (
            <React.Fragment key={i}>{part}</React.Fragment>
          )
        )}
      </p>
    );
  });
}

export const SplitAiChatbot: React.FC = () => {
  const {
    profile,
    activeStrategy,
    chatMessages,
    isChatOpen,
    setIsChatOpen,
    sendChatMessage,
  } = useFarm();

  const [input, setInput] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isChatOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatMessages.length, isChatOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendChatMessage(input);
    setInput('');
  };

  // MINIMIZED STATE: Compact floating bar/button so the main page expands to 100% full width
  if (!isChatOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsChatOpen(true)}
          className="group inline-flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full bg-[#111111] text-white border-2 border-[#EBB40E] shadow-[0_14px_32px_rgba(17,17,17,0.28)] hover:bg-[#00873A] hover:border-[#92D500] transition cursor-pointer"
          aria-label="Expand AI Advisor Chatbot"
        >
          <span className="w-9 h-9 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </span>
          <div className="text-left leading-tight">
            <div className="text-xs font-extrabold">Tadawol AI Advisor</div>
            <div className="text-[10px] text-[#92D500] font-semibold">
              Ask about crops, soil &amp; NASA data
            </div>
          </div>
          <Maximize2 className="w-4 h-4 text-[#EBB40E] group-hover:scale-110 transition-transform" />
        </button>
      </div>
    );
  }

  // EXPANDED STATE: Dedicated side-by-side split column that shares screen width with main page
  return (
    <aside
      aria-label="Tadawol AI Advisor Split Panel"
      className="fixed inset-0 z-50 lg:static lg:z-20 w-full lg:w-[360px] xl:w-[395px] shrink-0 bg-[#FFFEFB] lg:border-l border-[#DFDDD6] flex flex-col h-screen lg:sticky lg:top-0 shadow-2xl lg:shadow-none animate-fade-in"
    >
      {/* Header with Minimize Button */}
      <div className="h-[74px] px-4 bg-[#111111] text-white flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center shrink-0">
            <Bot className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-white truncate">Tadawol AI Advisor</div>
            <div className="text-[11px] text-[#92D500] flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#92D500] shrink-0" />
              <span className="truncate">
                {profile.countryFlag} {profile.countryName} · {profile.soilType}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsChatOpen(false)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-[#EBB40E] hover:text-[#111111] text-xs font-bold transition cursor-pointer shrink-0"
          title="Minimize chatbot and expand workspace"
        >
          <Minimize2 className="w-3.5 h-3.5" />
          <span>Minimize</span>
        </button>
      </div>

      {/* Live Farm Context Ribbon */}
      <div className="px-4 py-2.5 bg-[#F5F4F0] border-b border-[#E2E0D8] flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        <span className="inline-flex items-center gap-1 font-bold text-[#00873A]">
          <Sparkles className="w-3.5 h-3.5" />
          Moisture: {profile.nasaPower.moistureStatus} ({profile.nasaPower.rootMoisturePct}%)
        </span>
        <span className="font-mono-tech font-semibold text-[#474747] truncate max-w-[175px]">
          {activeStrategy.tierLabel}
        </span>
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
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed ${
                  isUser
                    ? 'bg-[#00873A] text-white rounded-tr-sm'
                    : 'bg-white border border-[#DFDDD6] text-[#2D2D2D] rounded-tl-sm shadow-xs'
                }`}
              >
                {isUser ? <p>{msg.content}</p> : renderBoldText(msg.content)}
                <div
                  className={`text-[10px] mt-1.5 ${
                    isUser ? 'text-white/70 text-right' : 'text-[#979797]'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Plain-Language Quick Prompt Chips */}
      <div className="px-3.5 py-2.5 bg-white border-t border-[#EFECE6]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#6F6F6F] mb-1.5">
          Quick Questions
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {FARMER_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendChatMessage(prompt)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-[11px] font-semibold text-[#111111] transition cursor-pointer"
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
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about rainfall, soil, frost, or rotations..."
          className="flex-1 px-3.5 py-2.5 bg-[#F5F4F0] border border-[#D9D9D9] rounded-full text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#00873A]"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Send message"
          className="w-10 h-10 rounded-full bg-[#EBB40E] hover:bg-[#111111] hover:text-white text-[#111111] flex items-center justify-center transition cursor-pointer disabled:opacity-40 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
