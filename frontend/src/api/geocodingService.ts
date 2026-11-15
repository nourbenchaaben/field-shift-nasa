import { buildLiveGeoQueries, normalizeText, scoreGeoCandidate } from '../utils/fuzzyGeoMatch';

export interface LivePlaceResult {
  id: string;
  name: string;
  subtitle: string;
  countryCode: string;
  countryName: string;
  flag: string;
  stateName?: string;
  localityName?: string;
  lat: number;
  lng: number;
  provider: 'google' | 'osm';
  placeId?: string;
  /** Internal ranking hint (not rendered) */
  placeRank?: number;
}

export interface ParsedCoordMatch {
  lat: number;
  lng: number;
  sourceLabel: string;
  placeName?: string;
}

export interface ResolvedMapLink {
  lat: number;
  lng: number;
  sourceLabel: string;
  placeName?: string;
  stateName?: string;
  countryCode?: string;
  countryName?: string;
  flag?: string;
}

/** Convert any ISO-3166 alpha-2 code (e.g. "TN", "FR") to its flag emoji. */
export function countryCodeToFlag(code?: string): string {
  if (!code || code.length !== 2) return '🌍';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '🌍';
  return String.fromCodePoint(
    0x1f1e6 + upper.charCodeAt(0) - 65,
    0x1f1e6 + upper.charCodeAt(1) - 65
  );
}

const VALID_LAT_LNG = (lat: number, lng: number) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -85 &&
  lat <= 85 &&
  lng >= -180 &&
  lng <= 180;

function dmsToDecimal(deg: string, min: string, sec: string, hemi: string): number {
  const val = Number(deg) + Number(min) / 60 + Number(sec) / 3600;
  return hemi === 'S' || hemi === 'W' ? -val : val;
}

/** Extract any Google Maps / short share URL even if pasted with surrounding text (e.g. mobile share) */
export function extractGoogleMapsUrl(raw: string): string | null {
  const match = raw.match(
    /https?:\/\/(?:maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs|g\.page|maps\.google\.[a-z.]{2,6}|(?:www\.)?google\.[a-z.]{2,6}\/maps|(?:www\.)?openstreetmap\.org|osm\.org)[^\s"<>]*/i
  );
  if (match) return match[0].replace(/[),.;]+$/, '');

  // Also handle URLs pasted without protocol (e.g. "maps.app.goo.gl/abc123" or "google.com/maps/...")
  const bare = raw.match(
    /(?:^|\s)((?:maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.[a-z.]{2,6}|(?:www\.)?google\.[a-z.]{2,6}\/maps)[^\s"<>]*)/i
  );
  if (bare?.[1]) return `https://${bare[1].replace(/[),.;]+$/, '')}`;

  return null;
}

/** Extract a human-readable place name from a full Google Maps URL (/maps/place/Name or ?q=Name) */
export function extractGoogleMapsPlaceName(raw: string): string | undefined {
  const placePath = raw.match(/\/maps\/(?:place|search)\/([^/@?]+)/i);
  if (placePath?.[1]) {
    try {
      const cleaned = decodeURIComponent(placePath[1].replace(/\+/g, ' ')).trim();
      if (cleaned && !/^-?\d+[.,°]/.test(cleaned)) return cleaned;
    } catch {
      // ignore
    }
  }
  const url = extractGoogleMapsUrl(raw);
  if (url) {
    try {
      const u = new URL(url);
      const q = u.searchParams.get('q') || u.searchParams.get('query');
      if (q && !/^(?:loc:)?-?\d+[.,°]/.test(q.trim())) return q.trim();
    } catch {
      // ignore
    }
  }
  return undefined;
}

/**
 * Detect pasted Google Maps links or raw/DMS GPS coordinates directly inside the search bar.
 * Supports:
 *  - https://www.google.com/maps/place/.../@36.8812,10.2118,16z/data=...!3d36.8812!4d10.2118
 *  - https://www.google.com/maps/search/36.4694,+10.7810
 *  - https://www.google.com/maps/dir//36.4694,10.7810
 *  - https://maps.google.com/?q=loc:36.8812,10.2118
 *  - Embed iframes (!2dLNG!3dLAT)
 *  - DMS coordinates: 36°28'09.8"N 10°46'51.6"E
 *  - Decimal coordinates: 36.8812, 10.2118  or  36.8812° N, 10.2118° E
 */
export function parseGoogleMapsOrCoords(raw: string): ParsedCoordMatch | null {
  const input = raw.trim();
  if (!input) return null;

  let decoded = input;
  try {
    decoded = decodeURIComponent(input);
  } catch {
    // keep input
  }

  const placeName = extractGoogleMapsPlaceName(input);

  // 1. Exact Google Maps pin (!3dLAT!4dLNG): use last match when multiple exist
  const d34Matches = [...decoded.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (d34Matches.length > 0) {
    const m = d34Matches[d34Matches.length - 1];
    const lat = Number(m[1]);
    const lng = Number(m[2]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps Pin',
        placeName,
      };
    }
  }

  // 2. Embed iframe (!2dLNG!3dLAT)
  const embedMatch = decoded.match(/!2d(-?\d+(?:\.\d+)?)!3d(-?\d+(?:\.\d+)?)/);
  if (embedMatch) {
    const lat = Number(embedMatch[2]);
    const lng = Number(embedMatch[1]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps Embed',
        placeName,
      };
    }
  }

  // 3. DMS coordinates (standalone OR inside Google Maps URL): 36°28'09.8"N 10°46'51.6"E
  const dms = decoded.match(
    /(\d{1,2})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([NS])[\s+,]+(\d{1,3})°\s*(\d{1,2})['′]\s*(\d{1,2}(?:\.\d+)?)["″]?\s*([EW])/i
  );
  if (dms) {
    const lat = dmsToDecimal(dms[1], dms[2], dms[3], dms[4].toUpperCase());
    const lng = dmsToDecimal(dms[5], dms[6], dms[7], dms[8].toUpperCase());
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps DMS Pin',
        placeName,
      };
    }
  }

  // 4. Query param coordinates: ?q=LAT,LNG, ?q=loc:LAT,LNG, ll=, query=, destination=, center=
  const qMatch = decoded.match(
    /[?&](?:q|ll|sll|query|destination|daddr|center)=(?:loc:)?(-?\d{1,2}(?:\.\d+)?)[,\s+]+(-?\d{1,3}(?:\.\d+)?)/i
  );
  if (qMatch) {
    const lat = Number(qMatch[1]);
    const lng = Number(qMatch[2]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps Link',
        placeName,
      };
    }
  }

  // 5. Path coordinates: /maps/search/LAT,+LNG, /maps/place/LAT,+LNG, /maps/dir/.../LAT,LNG
  const pathMatch = decoded.match(
    /\/maps\/(?:search|place|dir\/[^/]*)\/(-?\d{1,2}\.\d+)[,\s+]+(-?\d{1,3}\.\d+)/i
  );
  if (pathMatch) {
    const lat = Number(pathMatch[1]);
    const lng = Number(pathMatch[2]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps Link',
        placeName,
      };
    }
  }

  // 6. Google Maps viewport (@LAT,LNG)
  const atMatch = decoded.match(/@(-?\d{1,2}(?:\.\d+)?)[,\s+]+(-?\d{1,3}(?:\.\d+)?)/);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lng = Number(atMatch[2]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'Google Maps Link',
        placeName,
      };
    }
  }

  // 7. Decimal coordinates with N/S/E/W: "36.4694° N, 10.7810° E"
  const hemiCoord = decoded.match(
    /^\s*\(?\s*(\d{1,2}(?:\.\d+)?)\s*°?\s*([NS])\s*[,;\s]+\s*(\d{1,3}(?:\.\d+)?)\s*°?\s*([EW])\s*\)?\s*$/i
  );
  if (hemiCoord) {
    const lat = Number(hemiCoord[1]) * (hemiCoord[2].toUpperCase() === 'S' ? -1 : 1);
    const lng = Number(hemiCoord[3]) * (hemiCoord[4].toUpperCase() === 'W' ? -1 : 1);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'GPS Coordinates',
      };
    }
  }

  // 8. Direct GPS coordinates: "36.8812, 10.2118" or "(36.8812, 10.2118)"
  const rawCoord = decoded.match(
    /^\s*\(?\s*(-?\d{1,2}(?:\.\d+)?)\s*[,;\s]+\s*(-?\d{1,3}(?:\.\d+)?)\s*\)?\s*$/
  );
  if (rawCoord) {
    const lat = Number(rawCoord[1]);
    const lng = Number(rawCoord[2]);
    if (VALID_LAT_LNG(lat, lng)) {
      return {
        lat: Number(lat.toFixed(6)),
        lng: Number(lng.toFixed(6)),
        sourceLabel: 'GPS Coordinates',
      };
    }
  }

  return null;
}

/** Reverse-geocode exact GPS coordinates into readable village/town, state, and country */
export async function reverseGeocodeCoords(
  lat: number,
  lng: number,
  signal?: AbortSignal
): Promise<{
  localityName?: string;
  stateName?: string;
  countryCode?: string;
  countryName?: string;
  flag?: string;
} | null> {
  try {
    const params = new URLSearchParams({
      lat: lat.toFixed(6),
      lon: lng.toFixed(6),
      format: 'jsonv2',
      addressdetails: '1',
      'accept-language': 'en',
      zoom: '14',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      signal,
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name?: string;
      address?: {
        village?: string;
        town?: string;
        city?: string;
        municipality?: string;
        suburb?: string;
        hamlet?: string;
        neighbourhood?: string;
        state_district?: string;
        county?: string;
        state?: string;
        country?: string;
        country_code?: string;
      };
    };
    const a = data.address ?? {};
    const cc = (a.country_code || '').toUpperCase();
    const locality =
      a.village ||
      a.town ||
      a.municipality ||
      a.suburb ||
      a.hamlet ||
      a.city ||
      a.neighbourhood ||
      data.name ||
      undefined;
    const state = a.state || a.county || a.state_district || undefined;
    return {
      localityName: locality,
      stateName: state,
      countryCode: cc || undefined,
      countryName: a.country || undefined,
      flag: countryCodeToFlag(cc),
    };
  } catch {
    return null;
  }
}

/**
 * Full end-to-end Google Maps link resolver:
 *  - Handles short share links (maps.app.goo.gl/..., goo.gl/maps/..., g.co/kgs/...) via server redirect expansion
 *  - Handles full Google Maps URLs (place, search, dir, embed, ?q=, @lat,lng, !3d!4d, DMS)
 *  - Handles named Google Maps URLs without coordinates (/maps/place/Beni+Khiar) by geocoding the name
 *  - Reverse-geocodes resolved coordinates so the farm gets both exact GPS & readable town/state/country
 */
export async function resolveGoogleMapsLink(
  rawInput: string,
  signal?: AbortSignal
): Promise<ResolvedMapLink | null> {
  const direct = parseGoogleMapsOrCoords(rawInput);
  let lat = direct?.lat;
  let lng = direct?.lng;
  let placeName = direct?.placeName;
  let sourceLabel = direct?.sourceLabel ?? 'Google Maps Link';

  const url = extractGoogleMapsUrl(rawInput);

  // Expand short links (maps.app.goo.gl, goo.gl/maps) or coordinate-less Google Maps links server-side
  if (url && (lat === undefined || lng === undefined)) {
    try {
      const resp = await fetch(`/api/resolve-map-link?url=${encodeURIComponent(url)}`, {
        signal,
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          ok?: boolean;
          resolvedUrl?: string;
          lat?: number;
          lng?: number;
          placeName?: string;
        };
        if (data.ok) {
          if (typeof data.lat === 'number' && typeof data.lng === 'number' && VALID_LAT_LNG(data.lat, data.lng)) {
            lat = Number(data.lat.toFixed(6));
            lng = Number(data.lng.toFixed(6));
            sourceLabel = 'Google Maps Link';
          }
          if (data.placeName && !placeName) {
            placeName = data.placeName;
          }
          // Double-check resolvedUrl client-side too
          if ((lat === undefined || lng === undefined) && data.resolvedUrl) {
            const parsedExpanded = parseGoogleMapsOrCoords(data.resolvedUrl);
            if (parsedExpanded) {
              lat = parsedExpanded.lat;
              lng = parsedExpanded.lng;
              placeName = placeName || parsedExpanded.placeName;
            }
          }
        }
      }
    } catch {
      // Fallback below
    }
  }

  // If link only had a place name (e.g. https://www.google.com/maps/place/Béni+Khiar), geocode that name!
  if ((lat === undefined || lng === undefined) && placeName) {
    const hits = await searchLivePlaces(placeName, { signal });
    if (hits.length > 0) {
      const top = hits[0];
      return {
        lat: top.lat,
        lng: top.lng,
        sourceLabel: 'Google Maps Place',
        placeName: top.name || placeName,
        stateName: top.stateName,
        countryCode: top.countryCode,
        countryName: top.countryName,
        flag: top.flag,
      };
    }
    return null;
  }

  if (lat === undefined || lng === undefined) return null;

  // Enrich coordinates with real town/state/country via reverse geocoding
  const rev = await reverseGeocodeCoords(lat, lng, signal);
  return {
    lat,
    lng,
    sourceLabel,
    placeName: placeName || rev?.localityName,
    stateName: rev?.stateName,
    countryCode: rev?.countryCode,
    countryName: rev?.countryName,
    flag: rev?.flag,
  };
}

// =========================================================================
// Optional Official Google Maps Places Autocomplete (activated if VITE_GOOGLE_MAPS_API_KEY is set)
// =========================================================================
interface GoogleMapsGlobal {
  maps?: {
    places?: {
      AutocompleteService: new () => {
        getPlacePredictions: (
          req: { input: string },
          cb: (
            predictions:
              | {
                  place_id: string;
                  description: string;
                  structured_formatting?: { main_text?: string; secondary_text?: string };
                }[]
              | null,
            status: string
          ) => void
        ) => void;
      };
      PlacesService: new (node: HTMLElement) => {
        getDetails: (
          req: { placeId: string; fields: string[] },
          cb: (
            place: {
              name?: string;
              geometry?: { location?: { lat: () => number; lng: () => number } };
              address_components?: {
                long_name: string;
                short_name: string;
                types: string[];
              }[];
            } | null,
            status: string
          ) => void
        ) => void;
      };
    };
  };
}

let googleSdkPromise: Promise<boolean> | null = null;

export function hasGoogleMapsApiKey(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim());
}

function loadGooglePlacesSdk(): Promise<boolean> {
  if (googleSdkPromise) return googleSdkPromise;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || typeof window === 'undefined') {
    googleSdkPromise = Promise.resolve(false);
    return googleSdkPromise;
  }

  const g = (window as unknown as { google?: GoogleMapsGlobal }).google;
  if (g?.maps?.places) {
    googleSdkPromise = Promise.resolve(true);
    return googleSdkPromise;
  }

  googleSdkPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return googleSdkPromise;
}

async function searchGooglePlaces(query: string): Promise<LivePlaceResult[]> {
  const ready = await loadGooglePlacesSdk();
  if (!ready) return [];
  const g = (window as unknown as { google?: GoogleMapsGlobal }).google;
  if (!g?.maps?.places) return [];

  const service = new g.maps.places.AutocompleteService();
  return new Promise<LivePlaceResult[]>((resolve) => {
    service.getPlacePredictions({ input: query }, (predictions, status) => {
      if (status !== 'OK' || !predictions) {
        resolve([]);
        return;
      }
      resolve(
        predictions.slice(0, 6).map((p) => ({
          id: `g-${p.place_id}`,
          placeId: p.place_id,
          name: p.structured_formatting?.main_text || p.description,
          subtitle: p.structured_formatting?.secondary_text || 'Google Maps Place',
          countryCode: '',
          countryName: '',
          flag: '📍',
          lat: 0,
          lng: 0,
          provider: 'google',
        }))
      );
    });
  });
}

export async function resolveGooglePlaceDetails(
  placeId: string
): Promise<{
  lat: number;
  lng: number;
  countryCode: string;
  countryName: string;
  stateName?: string;
  localityName?: string;
} | null> {
  const ready = await loadGooglePlacesSdk();
  if (!ready) return null;
  const g = (window as unknown as { google?: GoogleMapsGlobal }).google;
  if (!g?.maps?.places) return null;

  const dummy = document.createElement('div');
  const svc = new g.maps.places.PlacesService(dummy);

  return new Promise((resolve) => {
    svc.getDetails(
      { placeId, fields: ['geometry', 'address_components', 'name'] },
      (place, status) => {
        if (status !== 'OK' || !place?.geometry?.location) {
          resolve(null);
          return;
        }
        const comps = place.address_components ?? [];
        const find = (t: string) => comps.find((c) => c.types.includes(t));
        const country = find('country');
        const state = find('administrative_area_level_1');
        const locality =
          find('locality') || find('administrative_area_level_2') || find('sublocality');
        resolve({
          lat: Number(place.geometry.location.lat().toFixed(6)),
          lng: Number(place.geometry.location.lng().toFixed(6)),
          countryCode: country?.short_name?.toUpperCase() || '',
          countryName: country?.long_name || '',
          stateName: state?.long_name,
          localityName: locality?.long_name || place.name,
        });
      }
    );
  });
}

// =========================================================================
// Live Global Geocoding (Photon + Open-Meteo GeoNames + Nominatim Fallback)
// with typo/transliteration normalization, settlement priority & deduplication
// =========================================================================
interface PhotonFeature {
  properties: {
    osm_id?: number;
    osm_key?: string;
    osm_value?: string;
    type?: string;
    name?: string;
    street?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
  };
  geometry: {
    coordinates: [number, number]; // [lng, lat]
  };
}

const SETTLEMENT_TYPES = new Set([
  'city',
  'town',
  'village',
  'municipality',
  'locality',
  'district',
  'suburb',
  'hamlet',
  'county',
  'state',
  'administrative',
  'quarter',
  'neighbourhood',
]);

function isMostlyLatin(str: string): boolean {
  const letters = str.replace(/[^A-Za-z\u00C0-\u024F\u0600-\u06FF]/g, '');
  if (!letters) return true;
  const latin = str.replace(/[^A-Za-z\u00C0-\u024F]/g, '').length;
  return latin >= letters.length * 0.5;
}

function photonSettlementRank(p: PhotonFeature['properties']): number {
  const t = (p.type || p.osm_value || '').toLowerCase();
  const key = (p.osm_key || '').toLowerCase();
  if (t === 'city' || t === 'town' || t === 'village' || t === 'municipality') return 35;
  if (SETTLEMENT_TYPES.has(t) || key === 'place' || key === 'boundary') return 26;
  if (key === 'highway' || t === 'street' || t === 'house') return 4;
  return 12;
}

async function searchPhoton(
  query: string,
  bias?: { lat: number; lng: number },
  signal?: AbortSignal
): Promise<LivePlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    lang: 'en',
    limit: '8',
  });
  if (bias) {
    params.set('lat', bias.lat.toFixed(4));
    params.set('lon', bias.lng.toFixed(4));
  }

  const res = await fetch(`https://photon.komoot.io/api/?${params.toString()}`, { signal });
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
  const data = (await res.json()) as { features?: PhotonFeature[] };
  const features = data.features ?? [];

  const results: LivePlaceResult[] = [];
  for (const f of features) {
    const p = f.properties;
    const [lng, lat] = f.geometry.coordinates;
    const name = p.name || p.street || p.city || p.county || p.state || '';
    if (!name) continue;

    const cc = (p.countrycode || '').toUpperCase();
    const state = p.state || p.county || '';
    const country = p.country || '';
    const subParts = [
      p.city && p.city !== name ? p.city : '',
      state && state !== name ? state : '',
      country,
    ].filter(Boolean);
    const subtitle = subParts.join(', ');

    results.push({
      id: `osm-${p.osm_id ?? results.length}-${lat.toFixed(4)}`,
      name,
      subtitle: subtitle || 'Exact Map Location',
      countryCode: cc,
      countryName: country,
      flag: countryCodeToFlag(cc),
      stateName: state || undefined,
      localityName: name,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      provider: 'osm',
      placeRank: photonSettlementRank(p) + (isMostlyLatin(name) ? 10 : 0),
    });
  }

  return results;
}

interface OpenMeteoGeoRow {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country_code?: string;
  country?: string;
  admin1?: string;
  admin2?: string;
  population?: number;
}

/** Fast, zero-key GeoNames-backed settlement search (clean English town/village labels) */
async function searchOpenMeteoGeo(
  query: string,
  signal?: AbortSignal
): Promise<LivePlaceResult[]> {
  // Open-Meteo works best on place name without country suffix
  const params = new URLSearchParams({
    name: query,
    count: '6',
    language: 'en',
    format: 'json',
  });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`, {
    signal,
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: OpenMeteoGeoRow[] };
  const rows = data.results ?? [];

  return rows.map((r) => {
    const cc = (r.country_code || '').toUpperCase();
    const stateClean = (r.admin1 || '').replace(/\s+Governorate$/i, '').trim();
    const country = r.country || '';
    const subtitle = [stateClean && stateClean !== r.name ? stateClean : '', country]
      .filter(Boolean)
      .join(', ');
    return {
      id: `om-${r.id}`,
      name: r.name,
      subtitle: subtitle || 'Settlement',
      countryCode: cc,
      countryName: country,
      flag: countryCodeToFlag(cc),
      stateName: stateClean || undefined,
      localityName: r.name,
      lat: Number(r.latitude.toFixed(6)),
      lng: Number(r.longitude.toFixed(6)),
      provider: 'osm',
      placeRank: 44 + (r.population && r.population > 5000 ? 6 : 0),
    };
  });
}

interface NominatimRow {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  class?: string;
  type?: string;
  address?: {
    village?: string;
    town?: string;
    city?: string;
    suburb?: string;
    state_district?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

async function searchNominatim(query: string, signal?: AbortSignal): Promise<LivePlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'jsonv2',
    addressdetails: '1',
    'accept-language': 'en',
    limit: '6',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    signal,
  });
  if (!res.ok) return [];
  const rows = (await res.json()) as NominatimRow[];

  return rows.map((r) => {
    const addr = r.address ?? {};
    const cc = (addr.country_code || '').toUpperCase();
    const name =
      r.name || addr.village || addr.town || addr.suburb || addr.city || r.display_name.split(',')[0];
    const state = addr.state || addr.county || '';
    const country = addr.country || '';
    const subtitle = [addr.state_district, state, country]
      .filter((x) => x && x !== name)
      .join(', ');
    const isPlace = r.class === 'place' || r.class === 'boundary';
    return {
      id: `nom-${r.place_id}`,
      name,
      subtitle: subtitle || r.display_name,
      countryCode: cc,
      countryName: country,
      flag: countryCodeToFlag(cc),
      stateName: state || undefined,
      localityName: name,
      lat: Number(Number(r.lat).toFixed(6)),
      lng: Number(Number(r.lon).toFixed(6)),
      provider: 'osm',
      placeRank: (isPlace ? 34 : 10) + (isMostlyLatin(name) ? 10 : 0),
    };
  });
}

/** In-memory cache to avoid redundant network requests while typing / backspacing */
const liveCache = new Map<string, LivePlaceResult[]>();

/** Deduplicate near-identical pins (e.g. Arabic + Latin duplicate of Béni Khiar within ~4 km) and rank cleanly */
function rankAndDedupeLiveResults(
  rawQuery: string,
  items: LivePlaceResult[],
  options?: { explicitCountryCode?: string | null; biasCountryCode?: string }
): LivePlaceResult[] {
  const scored = items.map((item) => {
    const fuzzyScore = scoreGeoCandidate(rawQuery, {
      primary: item.name,
      secondary: item.stateName,
      country: item.countryName,
      countryCode: item.countryCode,
    });
    const countryBonus =
      options?.explicitCountryCode && item.countryCode === options.explicitCountryCode
        ? 45
        : options?.biasCountryCode && item.countryCode === options.biasCountryCode
          ? 14
          : 0;
    const latinBonus = isMostlyLatin(item.name) ? 10 : 0;
    const total = fuzzyScore + (item.placeRank ?? 15) + countryBonus + latinBonus;
    return { item, fuzzyScore, total };
  });

  scored.sort((a, b) => b.total - a.total);
  const hasStrongMatch = scored.some((s) => s.fuzzyScore >= 90);

  const kept: LivePlaceResult[] = [];
  for (const { item, fuzzyScore } of scored) {
    // Drop weak unrelated foreign streets/places when a strong match already exists
    if (hasStrongMatch && fuzzyScore < 55) continue;

    // If the user explicitly asked for a country (e.g. "bni khir in tunsiia"), avoid unrelated foreign streets
    if (
      options?.explicitCountryCode &&
      item.countryCode &&
      item.countryCode !== options.explicitCountryCode &&
      kept.some((k) => k.countryCode === options.explicitCountryCode)
    ) {
      continue;
    }

    // Deduplicate same place returned by multiple providers or in Arabic + Latin within ~4.5 km
    const isNearDuplicate = kept.some((existing) => {
      const sameNormName = normalizeText(existing.name) === normalizeText(item.name);
      const dLat = Math.abs(existing.lat - item.lat);
      const dLng = Math.abs(existing.lng - item.lng);
      const closeBy = dLat < 0.04 && dLng < 0.04;
      if (closeBy && (sameNormName || !isMostlyLatin(item.name) || existing.countryCode === item.countryCode)) {
        return true;
      }
      return false;
    });

    if (!isNearDuplicate) {
      kept.push(item);
    }
    if (kept.length >= 6) break;
  }

  return kept;
}

/**
 * Unified live place search:
 *  - Uses official Google Maps Places Autocomplete automatically if VITE_GOOGLE_MAPS_API_KEY is set.
 *  - Otherwise runs typo/transliteration normalization + parallel Open-Meteo GeoNames & OSM Photon
 *    (with Nominatim fallback), prioritizing real settlements and deduplicating Arabic/Latin repeats.
 */
export async function searchLivePlaces(
  query: string,
  options?: {
    bias?: { lat: number; lng: number };
    biasCountryCode?: string;
    explicitCountryCode?: string | null;
    localHint?: string;
    signal?: AbortSignal;
  }
): Promise<LivePlaceResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const cacheKey = `${q.toLowerCase()}|${options?.explicitCountryCode ?? ''}|${options?.biasCountryCode ?? ''}|${options?.localHint ?? ''}`;
  const cached = liveCache.get(cacheKey);
  if (cached) return cached;

  if (hasGoogleMapsApiKey()) {
    const googleHits = await searchGooglePlaces(q);
    if (googleHits.length > 0) {
      liveCache.set(cacheKey, googleHits);
      return googleHits;
    }
  }

  const expandedQueries = buildLiveGeoQueries(q, options?.localHint);
  const primaryQuery = expandedQueries[0] || q;
  // Strip country word for Open-Meteo GeoNames (which expects just the place name)
  const placeOnlyQuery = options?.explicitCountryCode
    ? primaryQuery.replace(/\b(tunisia|morocco|algeria|egypt|france|spain|italy|germany|usa|india|brazil|turkey|kenya)\b/gi, '').trim() || primaryQuery
    : primaryQuery;

  const combined: LivePlaceResult[] = [];

  const tasks: Promise<LivePlaceResult[]>[] = [
    searchPhoton(primaryQuery, options?.bias, options?.signal).catch(() => []),
    searchOpenMeteoGeo(placeOnlyQuery, options?.signal).catch(() => []),
  ];

  // If query was rewritten (e.g. "bni khir" -> "beni khiar"), also query raw or localHint cleanly
  if (expandedQueries.length > 1) {
    tasks.push(searchPhoton(expandedQueries[1], options?.bias, options?.signal).catch(() => []));
  }

  const settled = await Promise.all(tasks);
  if (options?.signal?.aborted) return [];

  for (const batch of settled) {
    combined.push(...batch);
  }

  // Fallback to Nominatim if both Photon and Open-Meteo returned nothing
  if (combined.length === 0) {
    try {
      const nomHits = await searchNominatim(primaryQuery, options?.signal);
      combined.push(...nomHits);
    } catch {
      // ignore
    }
  }

  const ranked = rankAndDedupeLiveResults(q, combined, {
    explicitCountryCode: options?.explicitCountryCode,
    biasCountryCode: options?.biasCountryCode,
  });

  if (liveCache.size > 120) liveCache.clear();
  liveCache.set(cacheKey, ranked);
  return ranked;
}
