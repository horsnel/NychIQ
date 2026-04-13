'use client';

import { useState, useEffect, useRef } from 'react';
import { getApiBase } from '@/lib/api';

/* ── Country code → region code mapping ── */
const COUNTRY_REGION_MAP: Record<string, string> = {
  NG: 'NG', GH: 'GH', KE: 'KE', ZA: 'ZA', TZ: 'TZ', EG: 'EG',
  US: 'US', GB: 'GB', IN: 'IN', CA: 'CA', DE: 'DE', FR: 'FR',
  BR: 'BR', AU: 'AU', JP: 'JP',
};

/* ── All valid region codes ── */
const VALID_REGIONS = new Set(Object.values(COUNTRY_REGION_MAP));

const STORAGE_KEY = 'nychiq_detected_region';

interface GeolocationResult {
  detectedRegion: string | null;
  countryName: string | null;
  isDetecting: boolean;
  error: string | null;
}

/** Read cached region from localStorage (synchronous, for initial state) */
function readCachedRegion(): { region: string | null; name: string | null } {
  if (typeof window === 'undefined') return { region: null, name: null };
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return { region: null, name: null };
    const parsed = JSON.parse(cached) as { region: string; name: string; ts: number };
    if (parsed.region && parsed.name && VALID_REGIONS.has(parsed.region)) {
      const age = Date.now() - parsed.ts;
      if (age < 24 * 60 * 60 * 1000) {
        return { region: parsed.region, name: parsed.name };
      }
    }
  } catch {
    // Corrupted cache, ignore
  }
  return { region: null, name: null };
}

/** Fetch country from IP API through Worker proxy */
async function fetchIPGeo(): Promise<{ region: string; name: string } | null> {
  try {
    const res = await fetch(`${getApiBase()}/geolocation`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    const code = data.countryCode as string | undefined;
    const name = (data.country || data.country_name) as string | undefined;
    if (code && COUNTRY_REGION_MAP[code]) {
      return { region: COUNTRY_REGION_MAP[code], name: name || code };
    }
    return null;
  } catch {
    return null;
  }
}

export function useGeolocation(): GeolocationResult {
  // Initialize from cache synchronously (no effect needed for cache read)
  const [cached, setCached] = useState<{ region: string; name: string } | null>(() => {
    const { region, name } = readCachedRegion();
    return region && name ? { region, name } : null;
  });

  // If we have a cache hit, we don't need to detect
  const isDetecting = cached === null;
  const [fetched, setFetched] = useState<{ region: string; name: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  // Only run async fetch if no cache was available
  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    // If we already have cached data, skip fetch
    if (cached) return;

    let cancelled = false;

    fetchIPGeo().then((result) => {
      if (cancelled) return;
      if (result) {
        setFetched(result);
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ region: result.region, name: result.name, ts: Date.now() })
          );
        } catch {
          // Storage full or unavailable, ignore
        }
      } else {
        setError('Location detection unavailable');
      }
    });

    return () => { cancelled = true; };
  }, [cached]);

  const detectedRegion = cached?.region ?? fetched?.region ?? null;
  const countryName = cached?.name ?? fetched?.name ?? null;

  return { detectedRegion, countryName, isDetecting, error };
}
