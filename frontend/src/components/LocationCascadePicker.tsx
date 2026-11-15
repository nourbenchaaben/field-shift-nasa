import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CountryOption, GLOBAL_COUNTRIES } from '../data/countries';
import {
  COUNTRY_LOCATIONS,
  getCountryHierarchy,
  LocalityOption,
  StateOption,
} from '../data/locationsHierarchy';
import {
  extractGoogleMapsUrl,
  hasGoogleMapsApiKey,
  LivePlaceResult,
  parseGoogleMapsOrCoords,
  ResolvedMapLink,
  resolveGoogleMapsLink,
  resolveGooglePlaceDetails,
  searchLivePlaces,
} from '../api/geocodingService';
import {
  detectExplicitCountryCode,
  normalizeText,
  scoreGeoCandidate,
} from '../utils/fuzzyGeoMatch';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Compass,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';

export interface LocationSelection {
  country: CountryOption;
  stateName?: string;
  localityName?: string;
  lat: number;
  lng: number;
  regionLabel: string;
}

interface LocationCascadePickerProps {
  countryCode: string;
  stateName?: string;
  localityName?: string;
  onSelect: (selection: LocationSelection) => void;
  compact?: boolean;
}

type BrowseLevel = 'countries' | 'states' | 'localities';

interface SearchEntry {
  kind: 'country' | 'state' | 'locality' | 'live' | 'coords';
  country: CountryOption;
  state?: StateOption;
  locality?: LocalityOption;
  livePlace?: LivePlaceResult;
  coords?: { lat: number; lng: number };
  flag: string;
  primary: string;
  secondary: string;
  badge?: string;
  normPrimary: string;
  normFull: string;
}

function nearestSupportedCountry(lat: number, lng: number, countryCode?: string): CountryOption {
  if (countryCode) {
    const exact = GLOBAL_COUNTRIES.find(
      (c) => c.code.toUpperCase() === countryCode.toUpperCase()
    );
    if (exact) return exact;
  }
  let best = GLOBAL_COUNTRIES[0];
  let bestDist = Infinity;
  for (const c of GLOBAL_COUNTRIES) {
    const d = (c.lat - lat) ** 2 + (c.lng - lng) ** 2;
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

// Precompute flat global search index once for instant zero-lag type-ahead
const GLOBAL_SEARCH_INDEX: SearchEntry[] = (() => {
  const entries: SearchEntry[] = [];
  for (const country of GLOBAL_COUNTRIES) {
    const h = COUNTRY_LOCATIONS[country.code];
    const stateCount = h?.states.length ?? 0;
    const stateWord = (h?.stateLabel ?? 'Region').toLowerCase();
    entries.push({
      kind: 'country',
      country,
      flag: country.flag,
      primary: country.name,
      secondary: `${country.regionHint} · ${stateCount} ${stateWord}s`,
      badge: 'Country',
      normPrimary: normalizeText(country.name),
      normFull: normalizeText(`${country.name} ${country.code} ${country.regionHint}`),
    });

    if (h) {
      for (const state of h.states) {
        entries.push({
          kind: 'state',
          country,
          state,
          flag: country.flag,
          primary: state.name,
          secondary: `${h.stateLabel} · ${country.name}`,
          badge: `${state.localities.length} areas`,
          normPrimary: normalizeText(state.name),
          normFull: normalizeText(`${state.name} ${country.name} ${h.stateLabel}`),
        });
        for (const loc of state.localities) {
          entries.push({
            kind: 'locality',
            country,
            state,
            locality: loc,
            flag: country.flag,
            primary: loc.name,
            secondary: `${state.name}, ${country.name}`,
            badge: h.localityLabel.split('/')[0].trim(),
            normPrimary: normalizeText(loc.name),
            normFull: normalizeText(`${loc.name} ${state.name} ${country.name}`),
          });
        }
      }
    }
  }
  return entries;
})();

function formatCanonicalLabel(
  country: CountryOption,
  stateName: string,
  localityName: string
): string {
  if (localityName && stateName) return `${localityName}, ${stateName}, ${country.name}`;
  if (localityName) return `${localityName}, ${country.name}`;
  if (stateName) return `${stateName}, ${country.name}`;
  return country.name;
}

export const LocationCascadePicker: React.FC<LocationCascadePickerProps> = ({
  countryCode,
  stateName = '',
  localityName = '',
  onSelect,
}) => {
  const selectedCountry = useMemo(
    () => GLOBAL_COUNTRIES.find((c) => c.code === countryCode) ?? GLOBAL_COUNTRIES[0],
    [countryCode]
  );

  const hierarchy = useMemo(
    () => getCountryHierarchy(selectedCountry.code),
    [selectedCountry.code]
  );

  const selectedState = useMemo(
    () =>
      hierarchy.states.find((s) => normalizeText(s.name) === normalizeText(stateName)),
    [hierarchy.states, stateName]
  );

  const canonicalDisplay = useMemo(
    () => formatCanonicalLabel(selectedCountry, stateName, localityName),
    [selectedCountry, stateName, localityName]
  );

  const [query, setQuery] = useState(canonicalDisplay);
  const [isTyping, setIsTyping] = useState(false);
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<BrowseLevel>('countries');
  const [hiIdx, setHiIdx] = useState(0);

  // Live remote street/village geocoding state (Google Places if key set, else OSM Photon/Nominatim)
  const [liveResults, setLiveResults] = useState<LivePlaceResult[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);
  const [resolvingPlace, setResolvingPlace] = useState(false);

  // Google Maps link resolution state (handles maps.app.goo.gl short links & all full Google Maps URLs)
  const [resolvedMapLink, setResolvedMapLink] = useState<ResolvedMapLink | null>(null);
  const [mapLinkStatus, setMapLinkStatus] = useState<string | null>(null);
  const [mapLinkError, setMapLinkError] = useState<string | null>(null);
  const lastAutoPinnedInputRef = useRef<string>('');

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery(canonicalDisplay);
      setIsTyping(false);
    }
  }, [canonicalDisplay, open]);

  // Close when clicking outside
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setIsTyping(false);
        setQuery(canonicalDisplay);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [canonicalDisplay]);

  // Detect pasted Google Maps URL (short or full) or raw/DMS GPS coordinates
  const detectedMapUrl = useMemo(
    () => (isTyping ? extractGoogleMapsUrl(query) : null),
    [isTyping, query]
  );

  const parsedCoords = useMemo(
    () => (isTyping ? parseGoogleMapsOrCoords(query) : null),
    [isTyping, query]
  );

  const isMapLinkOrCoords = Boolean(detectedMapUrl || parsedCoords);

  const applyResolvedMapLocation = (resolved: ResolvedMapLink) => {
    const matched = nearestSupportedCountry(resolved.lat, resolved.lng, resolved.countryCode);
    const stName = resolved.stateName ?? '';
    const locName =
      resolved.placeName || `${resolved.lat.toFixed(4)}°, ${resolved.lng.toFixed(4)}°`;
    const cleanState =
      stName && normalizeText(stName) !== normalizeText(locName) ? stName : '';

    onSelect({
      country: matched,
      stateName: cleanState,
      localityName: locName,
      lat: resolved.lat,
      lng: resolved.lng,
      regionLabel: cleanState ? `${locName}, ${cleanState}` : locName,
    });
    setQuery(formatCanonicalLabel(matched, cleanState, locName));
    setMapLinkStatus(
      `Pinned from ${resolved.sourceLabel} (${resolved.lat.toFixed(5)}°, ${resolved.lng.toFixed(5)}°)`
    );
    setMapLinkError(null);
    setResolvedMapLink(null);
    setIsTyping(false);
    setOpen(false);
  };

  // Resolve Google Maps links (including short maps.app.goo.gl / goo.gl/maps links) cleanly
  useEffect(() => {
    const trimmed = query.trim();
    if (!isTyping || !detectedMapUrl) {
      setResolvedMapLink(null);
      if (!detectedMapUrl) setMapLinkError(null);
      return;
    }

    const controller = new AbortController();
    setResolvingPlace(true);
    setMapLinkError(null);

    void (async () => {
      try {
        const resolved = await resolveGoogleMapsLink(trimmed, controller.signal);
        if (controller.signal.aborted) return;

        if (resolved) {
          setResolvedMapLink(resolved);
          // Auto-pin immediately when a user pastes a Google Maps link!
          if (lastAutoPinnedInputRef.current === trimmed) {
            lastAutoPinnedInputRef.current = '';
            applyResolvedMapLocation(resolved);
          }
        } else {
          setResolvedMapLink(null);
          setMapLinkError(
            'Could not read coordinates from this link. Try copying the full URL from your browser bar or right-clicking the spot on Google Maps to copy its coordinates.'
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setResolvingPlace(false);
        }
      }
    })();

    return () => controller.abort();
  }, [query, isTyping, detectedMapUrl]);

  // Compute instant fuzzy + phonetic local matches first so we get 0ms results AND a clean spelling hint for live search
  const explicitCountryCode = useMemo(
    () => (isTyping && !isMapLinkOrCoords ? detectExplicitCountryCode(query, GLOBAL_COUNTRIES) : null),
    [isTyping, isMapLinkOrCoords, query]
  );

  const instantLocalMatches: SearchEntry[] = useMemo(() => {
    const raw = isTyping ? query.trim() : '';
    if (!raw || isMapLinkOrCoords) return [];

    const scopedCountryCode = level !== 'countries' ? selectedCountry.code : null;
    const scopedStateName =
      level === 'localities' && selectedState ? normalizeText(selectedState.name) : null;

    const scored: { entry: SearchEntry; score: number }[] = [];

    for (const entry of GLOBAL_SEARCH_INDEX) {
      const baseScore = scoreGeoCandidate(raw, {
        primary: entry.primary,
        secondary: entry.state?.name,
        country: entry.country.name,
        countryCode: entry.country.code,
      });
      if (baseScore <= 0) continue;

      let score = baseScore;

      // Strong boost if user explicitly mentioned a country (e.g. "bni khir in tunsiia")
      if (explicitCountryCode) {
        if (entry.country.code === explicitCountryCode) {
          score += entry.kind === 'country' ? 12 : 36;
        } else {
          score -= 24;
        }
      }

      // Contextual boost when drilling inside a chosen country/state, or gentle tie-breaker for current country
      if (
        scopedStateName &&
        entry.state &&
        normalizeText(entry.state.name) === scopedStateName &&
        entry.country.code === scopedCountryCode
      ) {
        score += 34;
      } else if (scopedCountryCode && entry.country.code === scopedCountryCode) {
        score += 20;
      } else if (!explicitCountryCode && entry.country.code === selectedCountry.code) {
        score += 8;
      }

      // Slight tie-breaker for exact country/state matches on short queries
      if (raw.length <= 4) {
        if (entry.kind === 'country') score += 10;
        else if (entry.kind === 'state') score += 5;
      }

      scored.push({ entry, score });
    }

    scored.sort((a, b) => b.score - a.score || a.entry.primary.localeCompare(b.entry.primary));
    return scored.slice(0, 8).map((s) => s.entry);
  }, [isTyping, query, parsedCoords, level, selectedCountry.code, selectedState, explicitCountryCode]);

  // Top corrected local place hint (e.g. "bni khir" -> "Béni Khiar, Tunisia") for live geocoding fallback
  const topLocalHint = useMemo(() => {
    const first = instantLocalMatches[0];
    if (!first || first.kind === 'country') return undefined;
    return `${first.primary}, ${first.country.name}`;
  }, [instantLocalMatches]);

  // Debounced live geocoding for streets, villages, neighborhoods, and rural farms
  useEffect(() => {
    const trimmed = query.trim();
    if (!open || !isTyping || trimmed.length < 3 || isMapLinkOrCoords) {
      setLiveResults([]);
      setIsSearchingLive(false);
      return;
    }

    const controller = new AbortController();
    setIsSearchingLive(true);

    // If browsing inside a chosen country/state, include context bias for super accurate local hits
    const bias =
      level === 'localities' && selectedState
        ? { lat: selectedState.lat, lng: selectedState.lng }
        : { lat: selectedCountry.lat, lng: selectedCountry.lng };

    const queryWithScope =
      level === 'localities' && selectedState && !normalizeText(trimmed).includes(normalizeText(selectedState.name))
        ? `${trimmed}, ${selectedState.name}, ${selectedCountry.name}`
        : level === 'states' && !normalizeText(trimmed).includes(normalizeText(selectedCountry.name))
          ? `${trimmed}, ${selectedCountry.name}`
          : trimmed;

    const timer = window.setTimeout(async () => {
      try {
        const hits = await searchLivePlaces(queryWithScope, {
          bias,
          biasCountryCode: selectedCountry.code,
          explicitCountryCode,
          localHint: topLocalHint,
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setLiveResults(hits);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingLive(false);
        }
      }
    }, 280);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    query,
    open,
    isTyping,
    isMapLinkOrCoords,
    level,
    selectedCountry,
    selectedState,
    explicitCountryCode,
    topLocalHint,
  ]);

  // Combine instant local matches + pasted Google Maps pin + live street/village results
  const suggestions: SearchEntry[] = useMemo(() => {
    const q = isTyping ? normalizeText(query) : '';

    // Resolved Google Maps link (short maps.app.goo.gl or full URL) -> top priority!
    if (resolvedMapLink) {
      const matched = nearestSupportedCountry(
        resolvedMapLink.lat,
        resolvedMapLink.lng,
        resolvedMapLink.countryCode
      );
      const label =
        resolvedMapLink.placeName ||
        `Pin Exact Location (${resolvedMapLink.lat.toFixed(5)}°, ${resolvedMapLink.lng.toFixed(5)}°)`;
      const subParts = [
        resolvedMapLink.stateName,
        resolvedMapLink.countryName || matched.name,
        `${resolvedMapLink.lat.toFixed(5)}°, ${resolvedMapLink.lng.toFixed(5)}°`,
      ].filter(Boolean);
      return [
        {
          kind: 'coords',
          country: matched,
          coords: { lat: resolvedMapLink.lat, lng: resolvedMapLink.lng },
          flag: resolvedMapLink.flag || matched.flag,
          primary: label,
          secondary: subParts.join(' · '),
          badge: resolvedMapLink.sourceLabel,
          normPrimary: '',
          normFull: '',
        },
      ];
    }

    // Direct coordinates or full Google Maps link with coordinates -> top priority!
    if (parsedCoords) {
      const nearest = nearestSupportedCountry(parsedCoords.lat, parsedCoords.lng);
      return [
        {
          kind: 'coords',
          country: nearest,
          coords: { lat: parsedCoords.lat, lng: parsedCoords.lng },
          flag: nearest.flag,
          primary: parsedCoords.placeName
            ? `${parsedCoords.placeName} (${parsedCoords.lat.toFixed(5)}°, ${parsedCoords.lng.toFixed(5)}°)`
            : `Pin Exact Location (${parsedCoords.lat.toFixed(5)}°, ${parsedCoords.lng.toFixed(5)}°)`,
          secondary: `${parsedCoords.sourceLabel} · Near ${nearest.name}`,
          badge: parsedCoords.sourceLabel,
          normPrimary: '',
          normFull: '',
        },
      ];
    }

    // Short Google Maps URL still resolving server-side
    if (detectedMapUrl) {
      return [];
    }

    // MODE A: User is actively typing -> instant fuzzy local index + live street/village results
    if (q) {
      const localTop = instantLocalMatches;

      // Deduplicate live hits against already-shown local hits (by normalized name or close proximity)
      const liveEntries: SearchEntry[] = liveResults
        .filter((r) => {
          const rNorm = normalizeText(r.name);
          return !localTop.some((e) => {
            if (normalizeText(e.primary) === rNorm && e.country.code === r.countryCode) return true;
            const eLat = e.locality?.lat ?? e.state?.lat ?? e.country.lat;
            const eLng = e.locality?.lng ?? e.state?.lng ?? e.country.lng;
            return (
              e.kind === 'locality' &&
              Math.abs(eLat - r.lat) < 0.03 &&
              Math.abs(eLng - r.lng) < 0.03
            );
          });
        })
        .map((r) => {
          const matchedCountry = nearestSupportedCountry(r.lat, r.lng, r.countryCode);
          return {
            kind: 'live',
            country: matchedCountry,
            livePlace: r,
            flag: r.flag || matchedCountry.flag,
            primary: r.name,
            secondary: r.subtitle,
            badge: r.provider === 'google' ? 'Google Maps' : 'Exact Place',
            normPrimary: normalizeText(r.name),
            normFull: normalizeText(`${r.name} ${r.subtitle}`),
          };
        });

      return [...localTop, ...liveEntries];
    }

    // MODE B: Browsing cleanly by drill-down level (Countries -> States -> Delegations)
    if (level === 'localities' && selectedState) {
      return selectedState.localities.map((loc) => ({
        kind: 'locality',
        country: selectedCountry,
        state: selectedState,
        locality: loc,
        flag: selectedCountry.flag,
        primary: loc.name,
        secondary: `${selectedState.name}, ${selectedCountry.name}`,
        badge: hierarchy.localityLabel.split('/')[0].trim(),
        normPrimary: normalizeText(loc.name),
        normFull: normalizeText(loc.name),
      }));
    }

    if (level === 'states') {
      return hierarchy.states.map((st) => ({
        kind: 'state',
        country: selectedCountry,
        state: st,
        flag: selectedCountry.flag,
        primary: st.name,
        secondary:
          st.localities.slice(0, 3).map((l) => l.name).join(', ') +
          (st.localities.length > 3 ? ` +${st.localities.length - 3} more` : ''),
        badge: `${st.localities.length} areas`,
        normPrimary: normalizeText(st.name),
        normFull: normalizeText(st.name),
      }));
    }

    // Default: all countries with flags
    return GLOBAL_COUNTRIES.map((c) => {
      const h = getCountryHierarchy(c.code);
      return {
        kind: 'country',
        country: c,
        flag: c.flag,
        primary: c.name,
        secondary: `${c.regionHint} · ${h.states.length} ${h.stateLabel.toLowerCase()}s`,
        badge: 'Country',
        normPrimary: normalizeText(c.name),
        normFull: normalizeText(c.name),
      };
    });
  }, [
    isTyping,
    query,
    parsedCoords,
    resolvedMapLink,
    detectedMapUrl,
    instantLocalMatches,
    level,
    selectedCountry,
    selectedState,
    hierarchy,
    liveResults,
  ]);

  const handlePick = async (entry: SearchEntry) => {
    setMapLinkStatus(null);
    setMapLinkError(null);

    if (entry.kind === 'coords' && entry.coords) {
      if (resolvedMapLink) {
        applyResolvedMapLocation(resolvedMapLink);
        return;
      }
      setResolvingPlace(true);
      const enriched = await resolveGoogleMapsLink(
        `${entry.coords.lat}, ${entry.coords.lng}`
      );
      setResolvingPlace(false);
      if (enriched) {
        applyResolvedMapLocation({
          ...enriched,
          placeName: parsedCoords?.placeName || enriched.placeName,
          sourceLabel: parsedCoords?.sourceLabel || enriched.sourceLabel,
        });
        return;
      }
      const label = `${entry.coords.lat.toFixed(4)}°, ${entry.coords.lng.toFixed(4)}°`;
      onSelect({
        country: entry.country,
        stateName: '',
        localityName: label,
        lat: entry.coords.lat,
        lng: entry.coords.lng,
        regionLabel: `${label} (${entry.country.name})`,
      });
      setQuery(`${label}, ${entry.country.name}`);
      setIsTyping(false);
      setOpen(false);
      return;
    }

    if (entry.kind === 'live' && entry.livePlace) {
      const lp = entry.livePlace;
      if (lp.provider === 'google' && lp.placeId) {
        setResolvingPlace(true);
        const details = await resolveGooglePlaceDetails(lp.placeId);
        setResolvingPlace(false);
        if (details) {
          const matched = nearestSupportedCountry(
            details.lat,
            details.lng,
            details.countryCode
          );
          const locName = details.localityName || lp.name;
          const stName = details.stateName || '';
          onSelect({
            country: matched,
            stateName: stName,
            localityName: locName,
            lat: details.lat,
            lng: details.lng,
            regionLabel: stName ? `${locName}, ${stName}` : locName,
          });
          setQuery(formatCanonicalLabel(matched, stName, locName));
          setIsTyping(false);
          setOpen(false);
        }
        return;
      }

      const matched = nearestSupportedCountry(lp.lat, lp.lng, lp.countryCode);
      const stName = lp.stateName ?? '';
      const locName = lp.name;
      onSelect({
        country: matched,
        stateName: stName,
        localityName: locName,
        lat: lp.lat,
        lng: lp.lng,
        regionLabel: stName && stName !== locName ? `${locName}, ${stName}` : locName,
      });
      setQuery(formatCanonicalLabel(matched, stName === locName ? '' : stName, locName));
      setIsTyping(false);
      setOpen(false);
      return;
    }

    if (entry.kind === 'country') {
      onSelect({
        country: entry.country,
        stateName: '',
        localityName: '',
        lat: entry.country.lat,
        lng: entry.country.lng,
        regionLabel: entry.country.regionHint,
      });
      setLevel('states');
      setQuery('');
      setIsTyping(false);
      setHiIdx(0);
      setOpen(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }

    if (entry.kind === 'state' && entry.state) {
      onSelect({
        country: entry.country,
        stateName: entry.state.name,
        localityName: '',
        lat: entry.state.lat,
        lng: entry.state.lng,
        regionLabel: entry.state.name,
      });
      if (entry.state.localities.length > 0) {
        setLevel('localities');
        setQuery('');
        setIsTyping(false);
        setHiIdx(0);
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 0);
      } else {
        setQuery(formatCanonicalLabel(entry.country, entry.state.name, ''));
        setIsTyping(false);
        setOpen(false);
      }
      return;
    }

    if (entry.kind === 'locality' && entry.state && entry.locality) {
      onSelect({
        country: entry.country,
        stateName: entry.state.name,
        localityName: entry.locality.name,
        lat: entry.locality.lat,
        lng: entry.locality.lng,
        regionLabel: `${entry.locality.name}, ${entry.state.name}`,
      });
      setQuery(formatCanonicalLabel(entry.country, entry.state.name, entry.locality.name));
      setIsTyping(false);
      setOpen(false);
    }
  };

  const handleOpenInput = () => {
    setOpen(true);
    setHiIdx(0);
    if (selectedState && selectedState.localities.length > 0 && !localityName) {
      setLevel('localities');
    } else {
      setLevel('countries');
    }
    setIsTyping(false);
  };

  const placeholderText =
    open && level === 'localities' && selectedState
      ? `Search ${hierarchy.localityLabel.toLowerCase()} or street in ${selectedState.name}...`
      : open && level === 'states'
        ? `Search ${hierarchy.stateLabel.toLowerCase()} or village in ${selectedCountry.name}...`
        : 'Search country, state, village, street, or paste a Google Maps link...';

  return (
    <div ref={rootRef} className="relative">
      <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
        <label className="text-xs font-extrabold text-[#111111]">
          Farm Location{' '}
          <span className="font-normal text-[#3A3A3A]">
            (Country, {hierarchy.stateLabel}, village, or Google Maps link)
          </span>
        </label>
        <span className="text-[11px] font-bold text-[#007432]">
          {hasGoogleMapsApiKey() ? 'Google Places Active' : 'Live Global Map Search'}
        </span>
      </div>

      {/* ONE UNIFIED SEARCH BAR */}
      <div className="relative flex items-center">
        <span
          className="absolute left-3.5 text-lg leading-none pointer-events-none select-none"
          aria-hidden="true"
        >
          {isSearchingLive || resolvingPlace ? (
            <Loader2 className="w-4 h-4 text-[#007432] animate-spin" />
          ) : isTyping && query ? (
            <Search className="w-4 h-4 text-[#007432]" />
          ) : (
            selectedCountry.flag
          )}
        </span>

        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-label="Search country, state, village, street, or paste Google Maps link"
          value={query}
          onFocus={(e) => {
            handleOpenInput();
            e.currentTarget.select();
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsTyping(true);
            setOpen(true);
            setHiIdx(0);
            setMapLinkStatus(null);
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData('text').trim();
            if (!pasted) return;
            const pastedUrl = extractGoogleMapsUrl(pasted);
            const pastedCoords = parseGoogleMapsOrCoords(pasted);
            if (pastedUrl || pastedCoords) {
              e.preventDefault();
              setQuery(pasted);
              setIsTyping(true);
              setOpen(true);
              setHiIdx(0);
              setMapLinkStatus(null);
              setMapLinkError(null);
              if (pastedUrl) {
                // Mark so the resolver effect auto-pins immediately once expanded
                lastAutoPinnedInputRef.current = pasted;
              } else if (pastedCoords) {
                // Direct GPS or DMS coordinates pasted: resolve town name & auto-pin right away!
                setResolvingPlace(true);
                void (async () => {
                  try {
                    const resolved = await resolveGoogleMapsLink(pasted);
                    if (resolved) {
                      applyResolvedMapLocation(resolved);
                    } else {
                      const matched = nearestSupportedCountry(pastedCoords.lat, pastedCoords.lng);
                      applyResolvedMapLocation({
                        lat: pastedCoords.lat,
                        lng: pastedCoords.lng,
                        sourceLabel: pastedCoords.sourceLabel,
                        countryCode: matched.code,
                        countryName: matched.name,
                        flag: matched.flag,
                      });
                    }
                  } finally {
                    setResolvingPlace(false);
                  }
                })();
              }
            }
          }}
          onKeyDown={(e) => {
            if (!open) {
              if (e.key === 'ArrowDown' || e.key === 'Enter') {
                handleOpenInput();
              }
              return;
            }
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHiIdx((i) => Math.min(i + 1, Math.max(0, suggestions.length - 1)));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHiIdx((i) => Math.max(0, i - 1));
            } else if (e.key === 'Enter' && suggestions[hiIdx]) {
              e.preventDefault();
              void handlePick(suggestions[hiIdx]);
            } else if (e.key === 'Escape') {
              setOpen(false);
              setIsTyping(false);
              setQuery(canonicalDisplay);
            }
          }}
          placeholder={placeholderText}
          className="w-full pl-11 pr-10 py-2.5 bg-white border border-[#C9C6BC] rounded-xl text-sm font-bold text-[#111111] placeholder:font-normal placeholder:text-[#555555] focus:outline-none focus:border-[#00873A] focus:ring-2 focus:ring-[#00873A]/15"
        />

        {(query || open) && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setIsTyping(true);
              setLevel('countries');
              setOpen(true);
              setHiIdx(0);
              inputRef.current?.focus();
            }}
            className="absolute right-3 p-1 rounded-full text-[#555555] hover:text-[#111111] hover:bg-[#F5F4F0] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {mapLinkStatus && !open && (
        <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E3F5EB] border border-[#B8E5CC] text-[11px] font-bold text-[#005222]">
          <Check className="w-3.5 h-3.5 text-[#007432] shrink-0" />
          <span>{mapLinkStatus}</span>
        </div>
      )}

      {/* UNIFIED DRILL-DOWN + LIVE STREET/VILLAGE + GOOGLE MAPS LINK DROPDOWN */}
      {open && (
        <div className="absolute z-[920] mt-1.5 w-full rounded-2xl bg-[#FFFEFB] border border-[#C9C6BC] shadow-[0_18px_38px_rgba(17,17,17,0.18)] overflow-hidden">
          {/* Interactive Breadcrumb Header */}
          <div className="px-3.5 py-2 bg-[#F5F4F0] border-b border-[#E2DFD6] flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap font-bold text-[#2E2E2E]">
              {!isTyping && level !== 'countries' ? (
                <>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLevel(level === 'localities' ? 'states' : 'countries');
                      setHiIdx(0);
                    }}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#CFCBC2] hover:border-[#111111] text-[#111111] cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLevel('countries');
                      setHiIdx(0);
                    }}
                    className="hover:underline text-[#3A3A3A] cursor-pointer"
                  >
                    Countries
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setLevel('states');
                      setHiIdx(0);
                    }}
                    className={`cursor-pointer ${
                      level === 'states'
                        ? 'text-[#007432] font-extrabold'
                        : 'hover:underline text-[#3A3A3A]'
                    }`}
                  >
                    {selectedCountry.flag} {selectedCountry.name}
                  </button>
                  {level === 'localities' && selectedState && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
                      <span className="text-[#007432] font-extrabold">{selectedState.name}</span>
                    </>
                  )}
                </>
              ) : parsedCoords ? (
                <span className="text-[#007432] font-extrabold inline-flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5" />
                  Exact coordinates detected
                </span>
              ) : isTyping && query ? (
                <span className="text-[#007432] font-extrabold inline-flex items-center gap-1.5">
                  <span>
                    Results for &ldquo;{query}&rdquo; ({suggestions.length})
                  </span>
                  {isSearchingLive && (
                    <span className="text-[11px] font-semibold text-[#3A3A3A]">
                      · searching streets &amp; villages...
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-[#2E2E2E] font-extrabold">
                  Browse Countries · or type any village, address, or Google Maps link
                </span>
              )}
            </div>

            {!isTyping && level !== 'countries' && (
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  setQuery(canonicalDisplay);
                }}
                className="text-[11px] font-extrabold text-[#007432] hover:underline cursor-pointer"
              >
                Done
              </button>
            )}
          </div>

          {/* Live Suggestion List */}
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {suggestions.length === 0 ? (
              <li className="px-4 py-4 text-xs text-[#3A3A3A]">
                {resolvingPlace && detectedMapUrl ? (
                  <span className="inline-flex items-center gap-2 font-semibold text-[#007432]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    Expanding Google Maps link and locating exact pin...
                  </span>
                ) : mapLinkError ? (
                  <span className="text-[#8F2819] font-medium">{mapLinkError}</span>
                ) : isSearchingLive ? (
                  `Searching live map locations for "${query}"...`
                ) : (
                  `No matching location found for "${query}". Try a village name, city, or paste a Google Maps link.`
                )}
              </li>
            ) : (
              suggestions.map((entry, idx) => {
                const isHi = idx === hiIdx;
                const isSelected =
                  (entry.kind === 'country' &&
                    entry.country.code === selectedCountry.code &&
                    !stateName) ||
                  (entry.kind === 'state' &&
                    entry.country.code === selectedCountry.code &&
                    entry.state?.name === stateName &&
                    !localityName) ||
                  (entry.kind === 'locality' &&
                    entry.country.code === selectedCountry.code &&
                    entry.state?.name === stateName &&
                    entry.locality?.name === localityName);

                const hasChildren =
                  entry.kind === 'country' ||
                  (entry.kind === 'state' && (entry.state?.localities.length ?? 0) > 0);

                return (
                  <li
                    key={`${entry.kind}-${entry.livePlace?.id ?? ''}-${entry.country.code}-${entry.state?.name ?? ''}-${entry.locality?.name ?? ''}-${idx}`}
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        void handlePick(entry);
                      }}
                      onMouseEnter={() => setHiIdx(idx)}
                      className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                        isHi
                          ? 'bg-[#E3F5EB] text-[#111111]'
                          : isSelected
                            ? 'bg-[#F5F4F0] text-[#111111]'
                            : 'text-[#111111] hover:bg-[#F5F4F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-lg leading-none shrink-0" aria-hidden="true">
                          {entry.flag}
                        </span>
                        <div className="min-w-0">
                          <div className="text-sm font-extrabold text-[#111111] truncate flex items-center gap-1.5">
                            {(entry.kind === 'locality' ||
                              entry.kind === 'live' ||
                              entry.kind === 'coords') && (
                              <MapPin className="w-3.5 h-3.5 text-[#007432] shrink-0" />
                            )}
                            <span className="truncate">{entry.primary}</span>
                          </div>
                          <div className="text-xs text-[#3A3A3A] truncate">{entry.secondary}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {entry.badge && (
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              entry.kind === 'country'
                                ? 'bg-white text-[#2E2E2E] border-[#DFDDD6]'
                                : entry.kind === 'state'
                                  ? 'bg-[#E3F5EB] text-[#005222] border-[#B8E5CC]'
                                  : entry.kind === 'live' || entry.kind === 'coords'
                                    ? 'bg-[#E4F4F7] text-[#0E5E6B] border-[#B5DFE6]'
                                    : 'bg-[#FDF6DC] text-[#6E5100] border-[#EBD58B]'
                            }`}
                          >
                            {entry.badge}
                          </span>
                        )}
                        {isSelected ? (
                          <Check className="w-4 h-4 text-[#007432]" />
                        ) : hasChildren ? (
                          <ChevronRight className="w-4 h-4 text-[#555555]" />
                        ) : null}
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
};
