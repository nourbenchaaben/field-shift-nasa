import React from 'react';

interface BrandMarkProps {
  size?: number;
  showWordmark?: boolean;
  darkText?: boolean;
  subtitle?: string;
}

export const BrandMark: React.FC<BrandMarkProps> = ({
  size = 34,
  showWordmark = true,
  darkText = true,
  subtitle,
}) => {
  return (
    <div className="inline-flex items-center gap-2.5 select-none">
      {/* Geometric interlocking 3-arc crop rotation + satellite node mark inspired by transform-rotations.eu */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        {/* Golden harvest upper-right arc block */}
        <path
          d="M19 2V9.2C14.2 9.2 10.1 11.9 8.1 15.8H11.5C13.2 13.3 15.9 11.7 19 11.7V16H33V2H19Z"
          fill="#EBB40E"
        />
        {/* Prairie lime left-side cycle block */}
        <path
          d="M7.6 19.6C7.6 18.1 7.9 16.7 8.5 15.4H2V23.8H8.2C9.4 26.8 11.8 29.1 14.9 30.3V28C10.9 26.4 7.6 23.4 7.6 19.6Z"
          fill="#92D500"
        />
        {/* Forest green lower-right anchor & inner soil node */}
        <path
          d="M19 28.4C17.4 28.4 16 28.1 14.7 27.6V34H25.2V28.4H19Z"
          fill="#00873A"
        />
        {/* Orbital satellite telemetry dot */}
        <circle cx="26.5" cy="22" r="4.2" fill="#00873A" />
        <circle cx="26.5" cy="22" r="1.7" fill="#FFFEFB" />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span
            className={`text-[1.25rem] font-extrabold tracking-[-0.03em] ${
              darkText ? 'text-[#111111]' : 'text-white'
            }`}
          >
            Tadawol
          </span>
          {subtitle && (
            <span
              className={`text-[10px] font-semibold uppercase tracking-[0.12em] mt-0.5 ${
                darkText ? 'text-[#00873A]' : 'text-[#92D500]'
              }`}
            >
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
