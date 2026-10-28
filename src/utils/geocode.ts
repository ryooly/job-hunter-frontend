/**
 * Geocoding for the map, backed by OpenStreetMap's Nominatim search API.
 *
 * We deliberately use Nominatim (not the Google Geocoder) even though the
 * visible map is Google Maps: Nominatim needs no API key and no separate
 * "Geocoding API" enablement, so pins place reliably on any key. The output
 * is plain WGS84 lat/lng, which Google Maps consumes directly.
 *
 * Rules:
 *  1. Nominatim's fair-use policy allows ~1 request/second, so live lookups
 *     run through a throttled queue and every query string is memoised.
 *  2. The map focuses on Banjarnegara, so results are biased into its bounds
 *     first; if nothing matches there we retry nationally so listings from
 *     other regions (Jakarta, etc.) still resolve.
 */

export interface Coords {
  lat: number;
  lng: number;
}

/** Geographic bounding box of a geocoded feature (degrees). */
export interface BBox {
  south: number;
  west: number;
  north: number;
  east: number;
}

/** A resolved location: a point plus, when available, its outline bounds. */
export interface GeocodeResult extends Coords {
  /** Present for area features (districts, cities) — used to spread pins. */
  bbox?: BBox;
}

/** Center of Banjarnegara town (Kabupaten Banjarnegara, Jawa Tengah). */
export const BANJARNEGARA_CENTER: Coords = { lat: -7.4054, lng: 109.6791 };

/** Rough bounding box around the regency: minLon,minLat,maxLon,maxLat. */
const BANJARNEGARA_VIEWBOX = "109.45,-7.62,109.95,-7.20";

const ENDPOINT = "https://nominatim.openstreetmap.org/search";

// query -> resolved location (or null when the last lookup found nothing).
const cache = new Map<string, GeocodeResult | null>();

// Serialize live calls so we never exceed Nominatim's 1 req/second budget.
let queue: Promise<unknown> = Promise.resolve();
const MIN_INTERVAL_MS = 1100;
let lastCallAt = 0;

async function rawSearch(
  query: string,
  viewbox?: string,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    format: "jsonv2",
    q: query,
    limit: "1",
    countrycode: "id",
    "accept-language": "id",
  });
  if (viewbox) {
    params.set("viewbox", viewbox);
    params.set("bounded", "1");
  }

  const res = await fetch(`${ENDPOINT}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;

  const rows: unknown = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const first = rows[0] as {
    lat?: string;
    lon?: string;
    boundingbox?: string[];
  };
  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  // Nominatim reports area outlines as [south, north, west, east]; keep them
  // so callers can spread several pins across one big district instead of
  // stacking every job on the same centroid point.
  let bbox: BBox | undefined;
  if (Array.isArray(first.boundingbox) && first.boundingbox.length === 4) {
    const [south, north, west, east] = first.boundingbox.map(Number);
    if ([south, north, west, east].every(Number.isFinite)) {
      bbox = { south, west, north, east };
    }
  }
  return bbox ? { lat, lng, bbox } : { lat, lng };
}

/** Run `fn` only after at least MIN_INTERVAL_MS has elapsed since the last call. */
function throttle<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastCallAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCallAt = Date.now();
    return fn();
  });
  // Keep the chain alive even when a call rejects, so later lookups still run.
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/**
 * Resolve an address string to coordinates. Prefers a location inside
 * Banjarnegara, then falls back to a nationwide search. Results (including
 * misses) are cached per query so repeated districts cost a single lookup.
 */
export async function geocode(query: string): Promise<GeocodeResult | null> {
  const key = query.trim().toLowerCase();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const coords = await throttle(async () => {
    return (
      (await rawSearch(query, BANJARNEGARA_VIEWBOX)) ?? (await rawSearch(query))
    );
  });

  cache.set(key, coords);
  return coords;
}
