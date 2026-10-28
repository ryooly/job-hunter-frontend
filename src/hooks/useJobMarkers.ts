import { useEffect, useRef, useState } from "react";

import { fetchVacancyLocations } from "../api";
import { geocode } from "../utils/geocode";
import type { BBox } from "../utils/geocode";
import type { VacancyLocation } from "../types";

/** A single placed pin on the map (one per job). */
export interface JobMarker {
  id: number;
  title: string;
  lat: number;
  lng: number;
  /** True when the pin sits on a specific street; false = region-level. */
  precise: boolean;
  /** Human-readable address shown in the popup. */
  address: string;
}

/** A resolved single location, before co-located jobs are spread apart. */
interface ResolvedMarker {
  id: number;
  title: string;
  lat: number;
  lng: number;
  precise: boolean;
  address: string;
  /** Key grouping jobs that resolve to the same point (the address string). */
  groupKey: string;
  /** Area bounds of the geocoded feature, when it is an area. */
  bbox?: BBox;
}

interface UseJobMarkersResult {
  markers: JobMarker[];
  loading: boolean;
  error: boolean;
  /** Total location rows returned, including any that failed to geocode. */
  total: number;
}

/** A vacancy has a specific street only when the field is present and non-blank. */
function hasStreet(loc: VacancyLocation): boolean {
  return loc.street_address !== null && loc.street_address.trim() !== "";
}

/** The API ships a cached district centroid whenever it has been geocoded. */
function hasStoredCoords(loc: VacancyLocation): boolean {
  return loc.latitude !== null && loc.longitude !== null;
}

/**
 * Resolve one location to coordinates WITHOUT blocking the common path:
 * - Region-level jobs use the centroid the API already returns (instant).
 * - Street jobs try a live geocode of the full address, falling back to the
 *   stored centroid (or a throttled region lookup) when it fails.
 * Returns null only if nothing resolves.
 */
async function resolveMarker(
  loc: VacancyLocation,
): Promise<ResolvedMarker | null> {
  const precise = hasStreet(loc);

  // Street jobs: the one case where a live geocode call is warranted.
  if (precise) {
    const street = await geocode(loc.best_address);
    if (street) {
      return {
        id: loc.id,
        title: loc.title,
        lat: street.lat,
        lng: street.lng,
        precise: true,
        address: loc.best_address,
        groupKey: loc.best_address,
        bbox: street.bbox,
      };
    }
  }

  // Region placement: prefer the API's stored centroid (no network round-trip).
  if (hasStoredCoords(loc)) {
    return {
      id: loc.id,
      title: loc.title,
      lat: loc.latitude as number,
      lng: loc.longitude as number,
      precise: false,
      address: loc.region,
      groupKey: loc.region,
    };
  }

  // Last resort for districts the backend hasn't geocoded yet.
  const region = await geocode(loc.region);
  if (region) {
    return {
      id: loc.id,
      title: loc.title,
      lat: region.lat,
      lng: region.lng,
      precise: false,
      address: loc.region,
      groupKey: loc.region,
      bbox: region.bbox,
    };
  }
  return null;
}

/** Area spread when a stored centroid has no geocoder bbox (~2km box). */
function defaultBox(lat: number, lng: number): BBox {
  const d = 0.01;
  return { south: lat - d, north: lat + d, west: lng - d, east: lng + d };
}

/**
 * Distribute a group of same-centroid jobs across the region's real bounds on
 * a deterministic grid (ordered by id), so each has its own coordinate. The
 * marker clusterer then merges these into one numbered bubble when zoomed out
 * and reveals them as separate pins when zoomed in — which only works because
 * they occupy distinct positions.
 */
function layoutGroup(group: ResolvedMarker[]): void {
  const anchor = group[0];
  const box = anchor.bbox ?? defaultBox(anchor.lat, anchor.lng);
  const n = group.length;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const pad = 0.15; // keep pins inside the inner ~70% of the area
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const ordered = [...group].sort((x, y) => x.id - y.id);
  ordered.forEach((m, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const fx = pad + ((col + 0.5) / cols) * (1 - 2 * pad);
    const fy = pad + ((row + 0.5) / rows) * (1 - 2 * pad);
    m.lng = lerp(box.west, box.east, fx);
    m.lat = lerp(box.south, box.north, fy);
  });
}

/** Give every co-located group distinct positions, then strip internals. */
function spreadCoLocated(placed: ResolvedMarker[]): JobMarker[] {
  const groups = new Map<string, ResolvedMarker[]>();
  for (const m of placed) {
    const g = groups.get(m.groupKey);
    if (g) g.push(m);
    else groups.set(m.groupKey, [m]);
  }
  for (const group of groups.values()) {
    if (group.length > 1) layoutGroup(group);
  }
  return placed.map(({ id, title, lat, lng, precise, address }) => ({
    id,
    title,
    lat,
    lng,
    precise,
    address,
  }));
}

/**
 * Loads active vacancy locations and turns them into one marker per job.
 *
 * Coordinates come straight from the API's cached district centroids, so the
 * map paints as soon as the data arrives — live geocoding only runs for
 * street-level addresses or districts the backend hasn't geocoded yet. A
 * sequence guard cancels in-flight work when the effect re-runs or the
 * component unmounts. Jobs sharing a point are spread across that area so the
 * map's clusterer can merge/split them by zoom.
 */
export function useJobMarkers(): UseJobMarkersResult {
  const [markers, setMarkers] = useState<JobMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [total, setTotal] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const run = ++seq.current;
    setLoading(true);
    setError(false);
    setMarkers([]);
    setTotal(0);

    (async () => {
      try {
        const locations = await fetchVacancyLocations();
        if (run !== seq.current) return;
        setTotal(locations.length);

        // Resolve sequentially: markers stay ordered like the API response
        // even when a street job needs a live geocode.
        const placed: ResolvedMarker[] = [];
        for (const loc of locations) {
          const marker = await resolveMarker(loc);
          if (run !== seq.current) return;
          if (marker) placed.push(marker);
        }
        setMarkers(spreadCoLocated(placed));
      } catch (err) {
        if (run !== seq.current) return;
        console.error(err);
        setError(true);
      } finally {
        if (run === seq.current) setLoading(false);
      }
    })();
  }, []);

  return { markers, loading, error, total };
}
