/**
 * Google-Maps-style typo-tolerant, accent-insensitive, phonetic & Arabic/French/English
 * transliteration matcher for global agricultural location search.
 *
 * Examples that resolve cleanly:
 *  - "bni khir" / "bni khir in tunsiia"  -> Béni Khiar, Nabeul, Tunisia
 *  - "bni khaled"                        -> Béni Khalled, Nabeul, Tunisia
 *  - "klibia"                            -> Kélibia, Nabeul, Tunisia
 *  - "hamamet"                           -> Hammamet, Nabeul, Tunisia
 *  - "manzel tmim"                       -> Menzel Temime, Nabeul, Tunisia
 *  - "dar chaben"                        -> Dar Chaabane El Fehri, Nabeul, Tunisia
 *  - "qairawan" / "kairowan"             -> Kairouan, Tunisia
 *  - "morroco" / "maroco"                -> Morocco
 */

const STOP_WORDS = new Set([
  'in',
  'at',
  'near',
  'of',
  'on',
  'the',
  'de',
  'du',
  'des',
  'au',
  'aux',
  'a',
  'en',
]);

/** Common phonetic & typo corrections for live web geocoders (Photon / Nominatim / Open-Meteo) */
const WORD_NORMALIZATIONS: Record<string, string> = {
  // North African / Maghreb & Middle East transliterations
  bni: 'beni',
  bn: 'ben',
  mnzl: 'menzel',
  manzel: 'menzel',
  menzl: 'menzel',
  sdi: 'sidi',
  hamamet: 'hammamet',
  klibia: 'kelibia',
  nabel: 'nabeul',
  qairawan: 'kairouan',
  kairowan: 'kairouan',
  kairouen: 'kairouan',
  susa: 'sousse',
  sousa: 'sousse',
  soussa: 'sousse',
  sfaqes: 'sfax',
  sfaks: 'sfax',
  bizert: 'bizerte',
  bzrt: 'bizerte',
  monastire: 'monastir',
  mistir: 'monastir',
  gabs: 'gabes',
  mednin: 'medenine',
  mednine: 'medenine',
  tatouine: 'tataouine',
  jerba: 'djerba',
  jenduba: 'jendouba',
  siliena: 'siliana',
  zaghwan: 'zaghouan',
  mornague: 'mornag',
  solimane: 'soliman',
  slimane: 'soliman',
  grumbalia: 'grombalia',
  korbaa: 'korba',
  tmim: 'temime',
  temim: 'temime',
  khir: 'khiar',
  khaled: 'khalled',
  chaben: 'chaabane',
  chaaben: 'chaabane',
  chotrna: 'chotrana',
  raoud: 'raoued',
  sukra: 'soukra',
  goulette: 'la goulette',
  // Common country spelling variations & typos
  tunsiia: 'tunisia',
  tunsia: 'tunisia',
  tunisa: 'tunisia',
  tunisie: 'tunisia',
  tounes: 'tunisia',
  tunes: 'tunisia',
  morroco: 'morocco',
  moroco: 'morocco',
  maroco: 'morocco',
  maroc: 'morocco',
  maghrib: 'morocco',
  algerie: 'algeria',
  algria: 'algeria',
  dzair: 'algeria',
  egypte: 'egypt',
  misr: 'egypt',
  masr: 'egypt',
  espagne: 'spain',
  espana: 'spain',
  italie: 'italy',
  italia: 'italy',
  allemagne: 'germany',
  deutschland: 'germany',
  turquie: 'turkey',
  turkiye: 'turkey',
  bresil: 'brazil',
  brasil: 'brazil',
  inde: 'india',
  mexique: 'mexico',
  argentine: 'argentina',
};

/** Strip diacritics/accents and punctuation into clean lowercase ASCII words */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’`\-_/.,;:()]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Tokenize a user query while dropping natural filler words ("in", "near", "at") when other tokens exist */
export function tokenizeQuery(input: string): string[] {
  const tokens = normalizeText(input).split(' ').filter(Boolean);
  if (tokens.length <= 1) return tokens;
  const filtered = tokens.filter((t) => !STOP_WORDS.has(t));
  return filtered.length > 0 ? filtered : tokens;
}

/** Phonetic folding for Arabic/French/English/Spanish geographic names */
export function phoneticFold(input: string): string {
  const words = normalizeText(input)
    .split(' ')
    .filter(Boolean)
    .map((w) => WORD_NORMALIZATIONS[w] ?? w);

  return words
    .join(' ')
    .replace(/ph/g, 'f')
    .replace(/qu/g, 'k')
    .replace(/q/g, 'k')
    .replace(/ou/g, 'u')
    .replace(/ch/g, 'sh')
    .replace(/gh/g, 'g')
    .replace(/th/g, 't')
    .replace(/dh/g, 'd')
    .replace(/ae|ai|ay|ei|ey/g, 'e')
    .replace(/ie/g, 'i')
    // Collapse repeated letters ("hammamet" -> "hamamet", "khalled" -> "khaled")
    .replace(/([a-z])\1+/g, '$1');
}

/**
 * Consonant skeleton: preserves the leading char of each word and strips interior vowels.
 * "bni khir" -> "bn khr" === "Béni Khiar" -> "bn khr"
 * "klibia"   -> "klb"    === "Kélibia"    -> "klb"
 * "manzel tmim" -> "mnzl tmm" === "Menzel Temime" -> "mnzl tmm"
 */
export function consonantSkeleton(input: string): string {
  const folded = phoneticFold(input);
  return folded
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      if (w.length <= 2) return w;
      const head = w[0];
      const rest = w.slice(1).replace(/[aeiouy]/g, '');
      return head + rest;
    })
    .join(' ');
}

/** Optimal String Alignment (Damerau-Levenshtein) distance: treats adjacent swaps as 1 edit */
export function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  if (Math.abs(m - n) > 4) return Math.abs(m - n);

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array<number>(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + 1);
      }
      dp[i][j] = val;
    }
  }
  return dp[m][n];
}

/** Score how strongly a single query token matches a single target token (0..100) */
function scoreSingleToken(qTok: string, tTok: string): number {
  if (!qTok || !tTok) return 0;
  if (tTok === qTok) return 100;
  if (tTok.startsWith(qTok)) return 92;

  const qPhon = phoneticFold(qTok);
  const tPhon = phoneticFold(tTok);
  if (tPhon === qPhon) return 90;
  if (tPhon.startsWith(qPhon) && qPhon.length >= 2) return 84;

  // Substring match for meaningful tokens
  if (qTok.length >= 3 && tTok.includes(qTok)) return 80;
  if (qPhon.length >= 3 && tPhon.includes(qPhon)) return 76;

  // Consonant skeleton match (e.g. "khir" -> "khr" === "khiar" -> "khr", "klibia" -> "klb")
  const qSkel = consonantSkeleton(qTok);
  const tSkel = consonantSkeleton(tTok);
  if (qSkel.length >= 2 && tSkel === qSkel) {
    // Guard against wildly different lengths
    const dist = damerauLevenshtein(qPhon, tPhon);
    if (dist <= Math.max(2, Math.floor(Math.max(qPhon.length, tPhon.length) * 0.45))) {
      return 86;
    }
  }
  if (qSkel.length >= 3 && tSkel.startsWith(qSkel)) {
    return 75;
  }

  // Typo tolerance via Damerau-Levenshtein (e.g. "tunsiia" <-> "tunisia", "hamamet" <-> "hammamet")
  const maxLen = Math.max(qPhon.length, tPhon.length);
  if (qPhon.length >= 3 && maxLen >= 4) {
    const dist = damerauLevenshtein(qPhon, tPhon);
    const maxAllowed = maxLen <= 5 ? 1 : maxLen <= 9 ? 2 : 3;
    if (dist <= maxAllowed) {
      const sim = 1 - dist / maxLen;
      if (sim >= 0.65) {
        return Math.round(62 + sim * 22);
      }
    }

    // Prefix fuzzy match: user is mid-typing a longer place name (e.g. "bni khi" -> "beni khiar")
    if (qPhon.length >= 4 && tPhon.length > qPhon.length) {
      const tPrefix = tPhon.slice(0, qPhon.length);
      const pDist = damerauLevenshtein(qPhon, tPrefix);
      if (pDist <= 1) {
        return 74;
      }
    }
  }

  return 0;
}

export interface GeoCandidateFields {
  /** Primary display name (e.g. "Béni Khiar", "Ariana", "Tunisia") */
  primary: string;
  /** Secondary context (e.g. state name "Nabeul") */
  secondary?: string;
  /** Country name (e.g. "Tunisia") */
  country?: string;
  /** ISO country code (e.g. "TN") */
  countryCode?: string;
}

/**
 * Score a candidate place against a raw user query (0 = no match, up to 150 = exact full match).
 * Supports multi-word queries ("bni khir", "bni khir in tunsiia"), phonetic transliterations,
 * accents, and typos.
 */
export function scoreGeoCandidate(rawQuery: string, fields: GeoCandidateFields): number {
  const qNorm = normalizeText(rawQuery);
  if (!qNorm) return 0;

  const pNorm = normalizeText(fields.primary);
  const sNorm = normalizeText(fields.secondary ?? '');
  const cNorm = normalizeText(fields.country ?? '');
  const codeNorm = (fields.countryCode ?? '').toLowerCase();

  // Fast-path exact / prefix checks on primary field
  if (pNorm === qNorm) return 145;
  if (pNorm.startsWith(qNorm)) return 132;

  // Full phrase phonetic / consonant-skeleton match on primary name (e.g. "bni khir" === "Béni Khiar")
  const qPhonFull = phoneticFold(qNorm);
  const pPhonFull = phoneticFold(pNorm);
  if (pPhonFull === qPhonFull) return 136;
  if (pPhonFull.startsWith(qPhonFull) && qPhonFull.length >= 3) return 124;

  const qSkelFull = consonantSkeleton(qNorm);
  const pSkelFull = consonantSkeleton(pNorm);
  if (qSkelFull.length >= 4 && pSkelFull === qSkelFull) {
    const dist = damerauLevenshtein(qPhonFull, pPhonFull);
    if (dist <= Math.max(2, Math.floor(Math.max(qPhonFull.length, pPhonFull.length) * 0.4))) {
      return 128;
    }
  }

  // Joined no-space match (handles "benikhiar" -> "Béni Khiar", "sidibouzid" -> "Sidi Bouzid")
  const qCompact = qPhonFull.replace(/\s+/g, '');
  const pCompact = pPhonFull.replace(/\s+/g, '');
  if (qCompact.length >= 4) {
    if (pCompact === qCompact) return 130;
    if (pCompact.startsWith(qCompact)) return 116;
    const compactDist = damerauLevenshtein(qCompact, pCompact);
    const maxCompactLen = Math.max(qCompact.length, pCompact.length);
    if (compactDist <= 2 && 1 - compactDist / maxCompactLen >= 0.72) {
      return 112;
    }
  }

  // Multi-token scoring across primary + secondary + country + countryCode
  const qTokens = tokenizeQuery(rawQuery);
  if (qTokens.length === 0) return 0;

  const pTokens = pNorm.split(' ').filter(Boolean);
  const sTokens = sNorm ? sNorm.split(' ').filter(Boolean) : [];
  const cTokens = cNorm ? cNorm.split(' ').filter(Boolean) : [];

  let totalScore = 0;
  let primaryHits = 0;
  let secondaryHits = 0;
  let countryHits = 0;

  for (const qt of qTokens) {
    let bestP = 0;
    for (const pt of pTokens) {
      bestP = Math.max(bestP, scoreSingleToken(qt, pt));
    }

    let bestS = 0;
    for (const st of sTokens) {
      bestS = Math.max(bestS, scoreSingleToken(qt, st));
    }

    let bestC = 0;
    for (const ct of cTokens) {
      bestC = Math.max(bestC, scoreSingleToken(qt, ct));
    }
    if (qt === codeNorm && qt.length === 2) {
      bestC = Math.max(bestC, 95);
    }

    const bestOverall = Math.max(bestP, bestS, bestC);
    if (bestOverall < 62) {
      // Every query token must meaningfully match at least one field
      return 0;
    }

    if (bestP >= bestS && bestP >= bestC) {
      primaryHits += 1;
      totalScore += bestP * 1.15;
    } else if (bestS >= bestC) {
      secondaryHits += 1;
      totalScore += bestS * 0.88;
    } else {
      countryHits += 1;
      totalScore += bestC * 0.78;
    }
  }

  const avgScore = totalScore / qTokens.length;

  // Strongly prefer matches where the primary name itself was matched (not only the country name)
  if (primaryHits > 0 && countryHits > 0) {
    return Math.round(avgScore + 18); // e.g. "bni khir in tunsiia" -> exact place + country!
  }
  if (primaryHits > 0 && secondaryHits > 0) {
    return Math.round(avgScore + 14); // e.g. "bni khir nabeul"
  }
  if (primaryHits === qTokens.length) {
    // Bonus when token count closely matches primary name word count
    const coverageBonus = pTokens.length === qTokens.length ? 12 : 6;
    return Math.round(avgScore + coverageBonus);
  }

  return Math.round(avgScore);
}

/**
 * Normalize & expand a raw user query for external live geocoders (Photon / Nominatim / Open-Meteo)
 * so typos and North African transliterations like "bni khir in tunsiia" become "beni khiar tunisia".
 */
export function buildLiveGeoQueries(rawQuery: string, topLocalHint?: string): string[] {
  const cleanedTokens = tokenizeQuery(rawQuery);
  const rawClean = rawQuery.trim();
  const normalizedWords = cleanedTokens.map((w) => WORD_NORMALIZATIONS[w] ?? w);
  const normalizedPhrase = normalizedWords.join(' ').trim();

  const queries: string[] = [];
  const addUnique = (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length >= 2 && !queries.some((x) => x.toLowerCase() === trimmed.toLowerCase())) {
      queries.push(trimmed);
    }
  };

  // Prefer the transliteration-corrected phrase first when it differs from raw input
  if (normalizedPhrase && normalizedPhrase.toLowerCase() !== rawClean.toLowerCase()) {
    addUnique(normalizedPhrase);
  }
  addUnique(rawClean);

  // If our instant fuzzy engine found a very high-confidence local place correction (e.g. "Béni Khiar, Tunisia"),
  // include it as a fallback live query ONLY if the user typed extra words (e.g. "bni khir plage")
  if (topLocalHint && topLocalHint.trim()) {
    addUnique(topLocalHint);
  }

  return queries.slice(0, 2);
}

/** Detect if the user explicitly typed a country name/typo inside the query (e.g. "tunsiia" -> "TN") */
export function detectExplicitCountryCode(
  rawQuery: string,
  countries: Array<{ code: string; name: string }>
): string | null {
  const tokens = tokenizeQuery(rawQuery);
  if (tokens.length === 0) return null;

  for (const token of tokens) {
    const corrected = WORD_NORMALIZATIONS[token] ?? token;
    for (const c of countries) {
      const cNorm = normalizeText(c.name);
      if (corrected === cNorm || token === c.code.toLowerCase()) {
        return c.code;
      }
      if (corrected.length >= 5 && cNorm.length >= 5) {
        const dist = damerauLevenshtein(corrected, cNorm);
        if (dist <= 1) return c.code;
      }
    }
  }
  return null;
}
