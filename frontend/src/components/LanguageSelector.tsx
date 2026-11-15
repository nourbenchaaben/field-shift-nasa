import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ALL_APP_LANGUAGES, AppLanguageOption } from '../data/languages';
import { Check, ChevronDown, Globe, Loader2, Search } from 'lucide-react';

interface LanguageSelectorProps {
  compact?: boolean;
  align?: 'left' | 'right';
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  compact = false,
  align = 'right',
}) => {
  const { language, setLanguage, isTranslating } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_APP_LANGUAGES;
    return ALL_APP_LANGUAGES.filter(
      (l) =>
        l.nativeName.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.countriesHint.toLowerCase().includes(q)
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

  const handleSelect = (lang: AppLanguageOption) => {
    setLanguage(lang.code);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative inline-block notranslate" translate="no">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery('');
        }}
        title={`Language: ${language.englishName} (${language.nativeName})`}
        aria-label="Choose language"
        className={`inline-flex items-center justify-between gap-1.5 border transition cursor-pointer ${
          compact
            ? 'px-3 py-1.5 rounded-full bg-[#FFFEFB] border-[#CFCBC2] hover:border-[#111111] text-xs font-extrabold text-[#111111]'
            : 'w-full px-3.5 py-2.5 rounded-xl bg-[#F5F4F0] border-[#D1D1D1] hover:border-[#00873A] text-sm font-bold text-[#111111]'
        }`}
      >
        <span className="inline-flex items-center gap-1.5 truncate">
          {isTranslating ? (
            <Loader2 className="w-3.5 h-3.5 text-[#00873A] animate-spin shrink-0" />
          ) : (
            <Globe className="w-3.5 h-3.5 text-[#007432] shrink-0" />
          )}
          <span className="text-sm leading-none">{language.flag}</span>
          <span className="font-extrabold">
            {compact ? language.code.toUpperCase() : language.nativeName}
          </span>
          {!compact && language.nativeName !== language.englishName && (
            <span className="text-xs font-medium text-[#555555] truncate">
              · {language.englishName}
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
          className={`absolute z-[130] mt-1.5 w-72 bg-[#FFFEFB] border border-[#DFDDD6] rounded-2xl shadow-xl overflow-hidden text-left ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          dir="ltr"
        >
          <div className="p-2 border-b border-[#ECEAE2] bg-[#F5F4F0]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#555555] absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search language or country..."
                className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white border border-[#D6D3C9] text-xs font-semibold text-[#111111] focus:outline-none focus:border-[#00873A]"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-[#F1EFE8]">
            {filtered.length === 0 ? (
              <div className="p-3 text-center text-xs text-[#555555]">
                No matching language
              </div>
            ) : (
              filtered.map((lang) => {
                const isActive = lang.code === language.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => handleSelect(lang)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 transition cursor-pointer ${
                      isActive
                        ? 'bg-[#E3F5EB] text-[#005222]'
                        : 'hover:bg-[#F5F4F0] text-[#111111]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base shrink-0">{lang.flag}</span>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold truncate flex items-center gap-1.5">
                          <span>{lang.nativeName}</span>
                          {lang.nativeName !== lang.englishName && (
                            <span className="text-[10px] font-semibold text-[#555555]">
                              ({lang.englishName})
                            </span>
                          )}
                          {lang.dir === 'rtl' && (
                            <span className="px-1.5 py-0.2 rounded bg-[#EFECE4] text-[#3A3A3A] text-[9px] font-extrabold">
                              RTL
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-[#555555] truncate">
                          {lang.countriesHint}
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
