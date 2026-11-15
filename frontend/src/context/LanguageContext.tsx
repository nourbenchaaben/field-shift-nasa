import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ALL_APP_LANGUAGES,
  AppLanguageOption,
  getLanguageByCode,
  LanguageCode,
} from '../data/languages';
import { CORE_PHRASE_DICT } from '../data/corePhraseDictionaries';

const STORAGE_KEY = 'tadawol_language';
const CACHE_PREFIX = 'tadawol_tr_v1_';

interface LanguageContextValue {
  language: AppLanguageOption;
  languageCode: LanguageCode;
  isRtl: boolean;
  isTranslating: boolean;
  setLanguage: (code: LanguageCode) => void;
  t: (englishText: string) => string;
  allLanguages: AppLanguageOption[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function loadInitialLanguageCode(): LanguageCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ALL_APP_LANGUAGES.some((l) => l.code === saved)) {
      return saved as LanguageCode;
    }
  } catch {
    // Ignore storage errors
  }
  return 'en';
}

function loadLangCache(code: LanguageCode): Record<string, string> {
  const dict = { ...(CORE_PHRASE_DICT[code] ?? {}) };
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${code}`);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, string>;
      if (parsed && typeof parsed === 'object') {
        Object.assign(dict, parsed);
      }
    }
  } catch {
    // Ignore corrupted cache
  }
  return dict;
}

function persistLangCache(code: LanguageCode, cache: Record<string, string>) {
  try {
    // Cap persisted keys per language to avoid filling localStorage
    const entries = Object.entries(cache);
    const trimmed =
      entries.length > 900 ? Object.fromEntries(entries.slice(entries.length - 900)) : cache;
    localStorage.setItem(`${CACHE_PREFIX}${code}`, JSON.stringify(trimmed));
  } catch {
    // Ignore quota errors
  }
}

const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'CODE',
  'PRE',
  'TEXTAREA',
  'INPUT',
  'SVG',
  'CANVAS',
  'IFRAME',
]);

function shouldSkipElement(el: Element | null): boolean {
  let curr: Element | null = el;
  while (curr) {
    if (SKIP_TAGS.has(curr.tagName)) return true;
    if (
      curr.classList.contains('notranslate') ||
      curr.classList.contains('leaflet-container') ||
      curr.classList.contains('recharts-wrapper') ||
      curr.getAttribute('translate') === 'no'
    ) {
      return true;
    }
    curr = curr.parentElement;
  }
  return false;
}

function isTranslatableText(raw: string): boolean {
  const trimmed = raw.trim();
  if (trimmed.length < 2) return false;
  if (trimmed.length > 420) return false;
  // Must contain at least two ASCII letters (source strings are English)
  if (!/[A-Za-z]{2,}/.test(trimmed)) return false;
  // Skip brand name alone, URLs, emails, pure currency/unit codes
  if (trimmed === 'Tadawol' || trimmed === 'NASA POWER') return false;
  if (/^https?:\/\//i.test(trimmed)) return false;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  if (/^[A-Z0-9\s.,:+/%()$-]{2,14}$/.test(trimmed) && !/[a-z]/.test(trimmed)) return false;
  return true;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [languageCode, setLanguageCode] = useState<LanguageCode>(() => loadInitialLanguageCode());
  const [isTranslating, setIsTranslating] = useState<boolean>(false);

  const language = useMemo(() => getLanguageByCode(languageCode), [languageCode]);

  // React-safe per-Text-node tracking: original English & last applied translation
  const originalTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const appliedTextMapRef = useRef<WeakMap<Text, string>>(new WeakMap());
  const trackedNodesRef = useRef<Set<Text>>(new Set());
  const cacheByLangRef = useRef<Partial<Record<LanguageCode, Record<string, string>>>>({});
  const inFlightSetRef = useRef<Set<string>>(new Set());
  const activeLangRef = useRef<LanguageCode>(languageCode);
  activeLangRef.current = languageCode;

  const getCache = useCallback((code: LanguageCode): Record<string, string> => {
    if (!cacheByLangRef.current[code]) {
      cacheByLangRef.current[code] = loadLangCache(code);
    }
    return cacheByLangRef.current[code]!;
  }, []);

  const setLanguage = useCallback((code: LanguageCode) => {
    setLanguageCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      // Ignore storage failures
    }
  }, []);

  const t = useCallback(
    (englishText: string): string => {
      if (languageCode === 'en') return englishText;
      const trimmed = englishText.trim();
      const cache = getCache(languageCode);
      return cache[trimmed] ?? englishText;
    },
    [languageCode, getCache]
  );

  // Sync <html lang="..." dir="...">
  useEffect(() => {
    document.documentElement.lang = language.code;
    document.documentElement.dir = language.dir;
  }, [language.code, language.dir]);

  // Automatic React-safe whole-page translator for all 21 non-English languages
  useEffect(() => {
    const originalMap = originalTextMapRef.current;
    const appliedMap = appliedTextMapRef.current;
    const trackedNodes = trackedNodesRef.current;

    // Switching back to English: restore all tracked Text nodes immediately
    if (languageCode === 'en') {
      trackedNodes.forEach((node) => {
        if (!node.isConnected) {
          trackedNodes.delete(node);
          return;
        }
        const orig = originalMap.get(node);
        if (orig !== undefined && node.nodeValue !== orig) {
          node.nodeValue = orig;
        }
        appliedMap.delete(node);
      });
      setIsTranslating(false);
      return;
    }

    const currentLangOption = getLanguageByCode(languageCode);
    const cache = getCache(languageCode);
    let cancelled = false;
    let scanTimer: number | null = null;
    let activeRequests = 0;

    const applyTranslationToNode = (node: Text, origFull: string, translatedTrimmed: string) => {
      const lead = origFull.match(/^\s*/)?.[0] ?? '';
      const trail = origFull.match(/\s*$/)?.[0] ?? '';
      const nextVal = `${lead}${translatedTrimmed}${trail}`;
      appliedMap.set(node, nextVal);
      if (node.nodeValue !== nextVal) {
        node.nodeValue = nextVal;
      }
    };

    const scanAndTranslate = () => {
      if (cancelled || activeLangRef.current !== languageCode) return;
      const root = document.getElementById('root');
      if (!root) return;

      const missingByText = new Map<string, Text[]>();

      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const textNode = current as Text;
        current = walker.nextNode();

        if (shouldSkipElement(textNode.parentElement)) continue;
        const currentVal = textNode.nodeValue ?? '';
        const lastApplied = appliedMap.get(textNode);

        // Determine canonical English source text
        let origFull: string;
        if (lastApplied !== undefined && currentVal === lastApplied) {
          // Unchanged since we last translated it; reuse stored English source
          origFull = originalMap.get(textNode) ?? currentVal;
        } else {
          // Fresh text rendered by React! Record as canonical English source
          origFull = currentVal;
          originalMap.set(textNode, origFull);
          trackedNodes.add(textNode);
        }

        if (!isTranslatableText(origFull)) continue;
        const key = origFull.trim();

        if (cache[key]) {
          applyTranslationToNode(textNode, origFull, cache[key]);
        } else {
          const inflightKey = `${languageCode}::${key}`;
          if (!inFlightSetRef.current.has(inflightKey)) {
            const arr = missingByText.get(key) ?? [];
            arr.push(textNode);
            missingByText.set(key, arr);
          }
        }
      }

      const uniqueMissing = Array.from(missingByText.keys());
      if (uniqueMissing.length === 0) return;

      // Batch into chunks of up to 40 strings for snappy parallel translation
      const CHUNK_SIZE = 40;
      const chunks: string[][] = [];
      for (let i = 0; i < uniqueMissing.length; i += CHUNK_SIZE) {
        chunks.push(uniqueMissing.slice(i, i + CHUNK_SIZE));
      }

      chunks.forEach((chunk) => {
        chunk.forEach((txt) => inFlightSetRef.current.add(`${languageCode}::${txt}`));
        activeRequests += 1;
        setIsTranslating(true);

        fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            targetLang: currentLangOption.code,
            targetLangName: `${currentLangOption.englishName} (${currentLangOption.nativeName})`,
            texts: chunk,
          }),
        })
          .then((r) => r.json())
          .then((data: { ok?: boolean; translations?: string[] }) => {
            if (cancelled || activeLangRef.current !== languageCode) return;
            if (data?.ok && Array.isArray(data.translations) && data.translations.length === chunk.length) {
              let updated = false;
              chunk.forEach((origKey, idx) => {
                const tr = data.translations![idx];
                if (typeof tr === 'string' && tr.trim()) {
                  cache[origKey] = tr.trim();
                  updated = true;
                  const nodes = missingByText.get(origKey) ?? [];
                  nodes.forEach((node) => {
                    if (!node.isConnected) return;
                    const storedOrig = originalMap.get(node);
                    if (storedOrig && storedOrig.trim() === origKey) {
                      applyTranslationToNode(node, storedOrig, tr.trim());
                    }
                  });
                }
              });
              if (updated) {
                persistLangCache(languageCode, cache);
              }
            }
          })
          .catch(() => {
            // Keep instant dictionary translations gracefully
          })
          .finally(() => {
            chunk.forEach((txt) => inFlightSetRef.current.delete(`${languageCode}::${txt}`));
            activeRequests = Math.max(0, activeRequests - 1);
            if (!cancelled && activeRequests === 0) {
              setIsTranslating(false);
            }
          });
      });
    };

    const scheduleScan = (delay = 90) => {
      if (scanTimer !== null) window.clearTimeout(scanTimer);
      scanTimer = window.setTimeout(() => {
        scanTimer = null;
        scanAndTranslate();
      }, delay);
    };

    // Initial scan immediately when switching languages
    scanAndTranslate();

    // Watch for route switches, modals, tabs, and dynamic NASA/AI updates
    const root = document.getElementById('root');
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList' && (m.addedNodes.length > 0)) {
          scheduleScan(120);
          return;
        }
        if (m.type === 'characterData') {
          const tn = m.target as Text;
          if (tn.nodeValue !== appliedMap.get(tn)) {
            scheduleScan(120);
            return;
          }
        }
      }
    });

    if (root) {
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      if (scanTimer !== null) window.clearTimeout(scanTimer);
      setIsTranslating(false);
    };
  }, [languageCode, getCache]);

  const value: LanguageContextValue = {
    language,
    languageCode,
    isRtl: language.dir === 'rtl',
    isTranslating,
    setLanguage,
    t,
    allLanguages: ALL_APP_LANGUAGES,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
}
