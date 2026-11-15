export type LanguageCode =
  | 'en'
  | 'ar'
  | 'fr'
  | 'es'
  | 'pt'
  | 'it'
  | 'de'
  | 'nl'
  | 'el'
  | 'tr'
  | 'pl'
  | 'uk'
  | 'ro'
  | 'hi'
  | 'ur'
  | 'zh'
  | 'ja'
  | 'vi'
  | 'id'
  | 'th'
  | 'sw'
  | 'am';

export interface AppLanguageOption {
  code: LanguageCode;
  nativeName: string;
  englishName: string;
  flag: string;
  dir: 'ltr' | 'rtl';
  countryCodes: string[];
  countriesHint: string;
}

/**
 * All 22 native languages covering 100% of the 42 countries supported by Tadawol,
 * including full RTL support for Arabic (ar) and Urdu (ur).
 */
export const ALL_APP_LANGUAGES: AppLanguageOption[] = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    flag: '🇬🇧',
    dir: 'ltr',
    countryCodes: ['US', 'GB', 'CA', 'AU', 'NZ', 'NG', 'GH', 'ZA', 'KE', 'IN', 'PK'],
    countriesHint: 'USA, UK, Canada, Australia, NZ, Nigeria, Ghana, South Africa, Kenya',
  },
  {
    code: 'ar',
    nativeName: 'العربية',
    englishName: 'Arabic',
    flag: '🇹🇳',
    dir: 'rtl',
    countryCodes: ['TN', 'MA', 'DZ', 'EG', 'JO', 'SA', 'LB'],
    countriesHint: 'Tunisia, Morocco, Algeria, Egypt, Jordan, Saudi Arabia, Lebanon',
  },
  {
    code: 'fr',
    nativeName: 'Français',
    englishName: 'French',
    flag: '🇫🇷',
    dir: 'ltr',
    countryCodes: ['FR', 'SN', 'TN', 'MA', 'DZ', 'CA', 'LB'],
    countriesHint: 'France, Senegal, Tunisia, Morocco, Algeria, Canada, Lebanon',
  },
  {
    code: 'es',
    nativeName: 'Español',
    englishName: 'Spanish',
    flag: '🇪🇸',
    dir: 'ltr',
    countryCodes: ['ES', 'MX', 'AR', 'CO', 'PE', 'CL'],
    countriesHint: 'Spain, Mexico, Argentina, Colombia, Peru, Chile',
  },
  {
    code: 'pt',
    nativeName: 'Português',
    englishName: 'Portuguese',
    flag: '🇧🇷',
    dir: 'ltr',
    countryCodes: ['BR', 'PT'],
    countriesHint: 'Brazil, Portugal',
  },
  {
    code: 'it',
    nativeName: 'Italiano',
    englishName: 'Italian',
    flag: '🇮🇹',
    dir: 'ltr',
    countryCodes: ['IT'],
    countriesHint: 'Italy',
  },
  {
    code: 'de',
    nativeName: 'Deutsch',
    englishName: 'German',
    flag: '🇩🇪',
    dir: 'ltr',
    countryCodes: ['DE'],
    countriesHint: 'Germany',
  },
  {
    code: 'nl',
    nativeName: 'Nederlands',
    englishName: 'Dutch',
    flag: '🇳🇱',
    dir: 'ltr',
    countryCodes: ['NL'],
    countriesHint: 'Netherlands',
  },
  {
    code: 'el',
    nativeName: 'Ελληνικά',
    englishName: 'Greek',
    flag: '🇬🇷',
    dir: 'ltr',
    countryCodes: ['GR'],
    countriesHint: 'Greece',
  },
  {
    code: 'tr',
    nativeName: 'Türkçe',
    englishName: 'Turkish',
    flag: '🇹🇷',
    dir: 'ltr',
    countryCodes: ['TR'],
    countriesHint: 'Turkey',
  },
  {
    code: 'pl',
    nativeName: 'Polski',
    englishName: 'Polish',
    flag: '🇵🇱',
    dir: 'ltr',
    countryCodes: ['PL'],
    countriesHint: 'Poland',
  },
  {
    code: 'uk',
    nativeName: 'Українська',
    englishName: 'Ukrainian',
    flag: '🇺🇦',
    dir: 'ltr',
    countryCodes: ['UA'],
    countriesHint: 'Ukraine',
  },
  {
    code: 'ro',
    nativeName: 'Română',
    englishName: 'Romanian',
    flag: '🇷🇴',
    dir: 'ltr',
    countryCodes: ['RO'],
    countriesHint: 'Romania',
  },
  {
    code: 'hi',
    nativeName: 'हिन्दी',
    englishName: 'Hindi',
    flag: '🇮🇳',
    dir: 'ltr',
    countryCodes: ['IN'],
    countriesHint: 'India',
  },
  {
    code: 'ur',
    nativeName: 'اردو',
    englishName: 'Urdu',
    flag: '🇵🇰',
    dir: 'rtl',
    countryCodes: ['PK'],
    countriesHint: 'Pakistan',
  },
  {
    code: 'zh',
    nativeName: '中文',
    englishName: 'Chinese',
    flag: '🇨🇳',
    dir: 'ltr',
    countryCodes: ['CN'],
    countriesHint: 'China',
  },
  {
    code: 'ja',
    nativeName: '日本語',
    englishName: 'Japanese',
    flag: '🇯🇵',
    dir: 'ltr',
    countryCodes: ['JP'],
    countriesHint: 'Japan',
  },
  {
    code: 'vi',
    nativeName: 'Tiếng Việt',
    englishName: 'Vietnamese',
    flag: '🇻🇳',
    dir: 'ltr',
    countryCodes: ['VN'],
    countriesHint: 'Vietnam',
  },
  {
    code: 'id',
    nativeName: 'Bahasa Indonesia',
    englishName: 'Indonesian',
    flag: '🇮🇩',
    dir: 'ltr',
    countryCodes: ['ID'],
    countriesHint: 'Indonesia',
  },
  {
    code: 'th',
    nativeName: 'ไทย',
    englishName: 'Thai',
    flag: '🇹🇭',
    dir: 'ltr',
    countryCodes: ['TH'],
    countriesHint: 'Thailand',
  },
  {
    code: 'sw',
    nativeName: 'Kiswahili',
    englishName: 'Swahili',
    flag: '🇰🇪',
    dir: 'ltr',
    countryCodes: ['KE'],
    countriesHint: 'Kenya',
  },
  {
    code: 'am',
    nativeName: 'አማርኛ',
    englishName: 'Amharic',
    flag: '🇪🇹',
    dir: 'ltr',
    countryCodes: ['ET'],
    countriesHint: 'Ethiopia',
  },
];

/**
 * Primary native language mapping for EVERY ONE of all 42 covered countries.
 */
export const COUNTRY_DEFAULT_LANGUAGE: Record<string, LanguageCode> = {
  TN: 'ar',
  MA: 'ar',
  DZ: 'ar',
  EG: 'ar',
  JO: 'ar',
  SA: 'ar',
  LB: 'ar',
  FR: 'fr',
  SN: 'fr',
  ES: 'es',
  MX: 'es',
  AR: 'es',
  CO: 'es',
  PE: 'es',
  CL: 'es',
  PT: 'pt',
  BR: 'pt',
  IT: 'it',
  DE: 'de',
  NL: 'nl',
  GR: 'el',
  TR: 'tr',
  PL: 'pl',
  UA: 'uk',
  RO: 'ro',
  IN: 'hi',
  PK: 'ur',
  CN: 'zh',
  JP: 'ja',
  VN: 'vi',
  ID: 'id',
  TH: 'th',
  KE: 'sw',
  ET: 'am',
  US: 'en',
  GB: 'en',
  CA: 'en',
  AU: 'en',
  NZ: 'en',
  NG: 'en',
  GH: 'en',
  ZA: 'en',
};

export function getLanguageByCode(code?: string): AppLanguageOption {
  if (code) {
    const found = ALL_APP_LANGUAGES.find((l) => l.code === code.toLowerCase());
    if (found) return found;
  }
  return ALL_APP_LANGUAGES[0];
}

export function getDefaultLanguageForCountry(countryCode: string): AppLanguageOption {
  const code = COUNTRY_DEFAULT_LANGUAGE[countryCode.toUpperCase()] ?? 'en';
  return getLanguageByCode(code);
}
