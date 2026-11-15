import { useEffect, useState } from 'react';

const SINGLE_ZONE_COUNTRIES: Record<string, string> = {
  TN: 'Africa/Tunis',
  MA: 'Africa/Casablanca',
  DZ: 'Africa/Algiers',
  EG: 'Africa/Cairo',
  FR: 'Europe/Paris',
  ES: 'Europe/Madrid',
  IT: 'Europe/Rome',
  DE: 'Europe/Berlin',
  GB: 'Europe/London',
  NL: 'Europe/Amsterdam',
  PT: 'Europe/Lisbon',
  GR: 'Europe/Athens',
  TR: 'Europe/Istanbul',
  PL: 'Europe/Warsaw',
  UA: 'Europe/Kyiv',
  AR: 'America/Argentina/Buenos_Aires',
  CO: 'America/Bogota',
  PE: 'America/Lima',
  CL: 'America/Santiago',
  IN: 'Asia/Kolkata',
  PK: 'Asia/Karachi',
  CN: 'Asia/Shanghai',
  JP: 'Asia/Tokyo',
  VN: 'Asia/Ho_Chi_Minh',
  TH: 'Asia/Bangkok',
  NZ: 'Pacific/Auckland',
  KE: 'Africa/Nairobi',
  ET: 'Africa/Addis_Ababa',
  NG: 'Africa/Lagos',
  GH: 'Africa/Accra',
  ZA: 'Africa/Johannesburg',
  SN: 'Africa/Dakar',
  JO: 'Asia/Amman',
  SA: 'Asia/Riyadh',
  LB: 'Asia/Beirut',
  RO: 'Europe/Bucharest',
};

/**
 * Resolves the real IANA timezone for a farm automatically from its country and longitude.
 */
export function resolveFarmTimezone(countryCode: string, lng: number): string {
  const code = (countryCode || '').toUpperCase();
  if (SINGLE_ZONE_COUNTRIES[code]) return SINGLE_ZONE_COUNTRIES[code];

  if (code === 'US') {
    if (lng < -130) return 'America/Anchorage';
    if (lng < -114) return 'America/Los_Angeles';
    if (lng < -102) return 'America/Denver';
    if (lng < -85) return 'America/Chicago';
    return 'America/New_York';
  }
  if (code === 'CA') {
    if (lng < -114) return 'America/Vancouver';
    if (lng < -102) return 'America/Edmonton';
    if (lng < -89) return 'America/Winnipeg';
    if (lng < -67) return 'America/Toronto';
    return 'America/Halifax';
  }
  if (code === 'MX') {
    if (lng < -112) return 'America/Tijuana';
    if (lng < -105) return 'America/Mazatlan';
    return 'America/Mexico_City';
  }
  if (code === 'BR') {
    if (lng < -60) return 'America/Manaus';
    return 'America/Sao_Paulo';
  }
  if (code === 'AU') {
    if (lng < 129) return 'Australia/Perth';
    if (lng < 141) return 'Australia/Adelaide';
    return 'Australia/Sydney';
  }
  if (code === 'ID') {
    if (lng > 125) return 'Asia/Jayapura';
    if (lng > 114) return 'Asia/Makassar';
    return 'Asia/Jakarta';
  }

  // Fallback to browser timezone if an unknown country appears
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

export interface FarmLocalClock {
  timeZone: string;
  year: number;
  monthIndex: number; // 0..11 in the farm's actual local timezone
  dayOfMonth: number;
  monthShort: string; // e.g. "Nov"
  shortDate: string; // e.g. "Nov 14"
  fullDate: string; // e.g. "Sat, Nov 14, 2026"
  timeText: string; // e.g. "10:25 AM"
  tzShort: string; // e.g. "CET", "CST", "GMT+1"
}

export function computeFarmLocalClock(
  countryCode: string,
  lng: number,
  now: Date = new Date()
): FarmLocalClock {
  const timeZone = resolveFarmTimezone(countryCode, lng);

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    }).formatToParts(now);

    const yearNum = Number(parts.find((p) => p.type === 'year')?.value ?? now.getFullYear());
    const monthNum = Number(parts.find((p) => p.type === 'month')?.value ?? now.getMonth() + 1);
    const dayNum = Number(parts.find((p) => p.type === 'day')?.value ?? now.getDate());
    const monthIndex = Math.max(0, Math.min(11, monthNum - 1));

    const monthShort = new Intl.DateTimeFormat('en-US', {
      timeZone,
      month: 'short',
    }).format(now);

    const fullDate = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now);

    const timeText = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    }).format(now);

    const tzParts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    }).formatToParts(now);
    const tzShort = tzParts.find((p) => p.type === 'timeZoneName')?.value ?? timeZone;

    return {
      timeZone,
      year: yearNum,
      monthIndex,
      dayOfMonth: dayNum,
      monthShort,
      shortDate: `${monthShort} ${dayNum}`,
      fullDate,
      timeText,
      tzShort,
    };
  } catch {
    const monthShort = now.toLocaleDateString('en-US', { month: 'short' });
    return {
      timeZone: 'UTC',
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      dayOfMonth: now.getDate(),
      monthShort,
      shortDate: `${monthShort} ${now.getDate()}`,
      fullDate: now.toDateString(),
      timeText: now.toLocaleTimeString('en-US'),
      tzShort: 'Local',
    };
  }
}

/**
 * Lightweight hook returning the farm's local calendar date (month/day) without ticking every second.
 * Only triggers a state update if the local date changes (so charts never re-render every second).
 */
export function useFarmLocalDate(countryCode: string, lng: number): FarmLocalClock {
  const [clock, setClock] = useState<FarmLocalClock>(() =>
    computeFarmLocalClock(countryCode, lng)
  );

  useEffect(() => {
    setClock(computeFarmLocalClock(countryCode, lng));
    const id = window.setInterval(() => {
      const next = computeFarmLocalClock(countryCode, lng);
      setClock((prev) =>
        prev.shortDate === next.shortDate && prev.monthIndex === next.monthIndex ? prev : next
      );
    }, 60_000);
    return () => window.clearInterval(id);
  }, [countryCode, lng]);

  return clock;
}

/**
 * Live ticking hook returning the exact current date & time (updates every second).
 * Use inside an isolated clock component so parent pages/charts stay completely smooth.
 */
export function useFarmLocalClock(countryCode: string, lng: number): FarmLocalClock {
  const [clock, setClock] = useState<FarmLocalClock>(() =>
    computeFarmLocalClock(countryCode, lng)
  );

  useEffect(() => {
    setClock(computeFarmLocalClock(countryCode, lng));
    const id = window.setInterval(() => {
      setClock(computeFarmLocalClock(countryCode, lng));
    }, 1000);
    return () => window.clearInterval(id);
  }, [countryCode, lng]);

  return clock;
}
