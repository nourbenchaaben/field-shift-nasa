import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ALL_FARM_CURRENCIES,
  CurrencyOption,
  getCurrencyByCode,
} from '../data/regionalMarketData';
import { Check, ChevronDown, Search } from 'lucide-react';

interface CurrencySelectorProps {
  value: string;
  fallbackCountryCode?: string;
  onChange: (currency: CurrencyOption) => void;
  compact?: boolean;
  align?: 'left' | 'right';
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  value,
  fallbackCountryCode = 'US',
  onChange,
  compact = false,
  align = 'left',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => getCurrencyByCode(value, fallbackCountryCode),
    [value, fallbackCountryCode]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_FARM_CURRENCIES;
    return ALL_FARM_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.countriesHint.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
        className={`inline-flex items-center justify-between gap-2 border transition cursor-pointer ${
          compact
            ? 'px-3 py-1.5 rounded-full bg-[#EFECE4] border-[#DDD9CF] hover:border-[#111111] text-xs font-extrabold text-[#111111]'
            : 'w-full px-3.5 py-2.5 rounded-xl bg-[#F5F4F0] border-[#D1D1D1] hover:border-[#00873A] text-sm font-bold text-[#111111]'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-extrabold">{selected.code}</span>
          {!compact && (
            <span className="text-xs font-medium text-[#555555] truncate">
              · {selected.name}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#555555] shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          className={`absolute z-[120] mt-1.5 w-72 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl shadow-xl overflow-hidden ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          <div className="p-2 border-b border-[#ECEAE2] bg-[#F5F4F0]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#555555] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search currency or country..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-[#D6D3C9] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#00873A]"
              />
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-[#F1EFE8]">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#555555]">
                No matching currency
              </div>
            ) : (
              filtered.map((curr) => {
                const isActive = curr.code === selected.code;
                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => {
                      onChange(curr);
                      setOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#E3F5EB] text-[#005222]'
                        : 'hover:bg-[#F5F4F0] text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{curr.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate">
                          {curr.code} · {curr.name}
                        </div>
                        <div className="text-[10px] text-[#555555] truncate">
                          {curr.countriesHint}
                        </div>
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-[#00873A] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
