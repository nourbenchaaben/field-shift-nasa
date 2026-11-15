import React from 'react';
import { Clock } from 'lucide-react';
import { useFarmLocalClock } from '../utils/farmLocalClock';

interface FarmLocalClockBadgeProps {
  countryCode: string;
  countryFlag: string;
  lng: number;
}

/**
 * Isolated live-ticking farm date & clock badge.
 * Keeps the 1-second timer inside this tiny leaf component so Dashboard charts never re-render every second.
 */
export const FarmLocalClockBadge: React.FC<FarmLocalClockBadgeProps> = ({
  countryCode,
  countryFlag,
  lng,
}) => {
  const farmClock = useFarmLocalClock(countryCode, lng);

  return (
    <div
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#111111] text-white text-xs font-bold shadow-xs"
      title={`Local farm time (${farmClock.timeZone})`}
    >
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EBB40E] opacity-85" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#EBB40E]" />
      </span>
      <Clock className="w-3.5 h-3.5 text-[#EBB40E] shrink-0" />
      <span>
        {countryFlag} {farmClock.fullDate} ·{' '}
        <span className="font-mono-tech text-[#EBB40E]">{farmClock.timeText}</span>{' '}
        <span className="text-white/75 font-semibold">{farmClock.tzShort}</span>
      </span>
    </div>
  );
};
