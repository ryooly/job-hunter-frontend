/**
 * Loads the Google Maps JavaScript API on demand.
 *
 * The script is injected once and every caller awaits the same promise, so
 * the map view and the geocoder share a single load. The key comes from
 * VITE_GOOGLE_MAPS_API_KEY (see frontend/.env); a failed or unkeyed load
 * rejects, and the rejected promise is cleared so a later retry can run.
 */

let loadPromise: Promise<void> | null = null;

declare global {
  interface Window {
    google?: typeof google;
  }
}

export function loadGoogleMaps(): Promise<void> {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
    if (!key) {
      reject(
        new Error("Google Maps key missing: set VITE_GOOGLE_MAPS_API_KEY"),
      );
      return;
    }
    // Already on the page (hot reload / second caller) — nothing to do.
    if (window.google?.maps) {
      resolve();
      return;
    }

    const callback = "__jobHunterMapsInit__";
    (window as unknown as Record<string, () => void>)[callback] = () =>
      resolve();

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      libraries: "geocoding",
      loading: "async",
      callback,
    });
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.onerror = () =>
      reject(new Error("Failed to load the Google Maps JavaScript API"));
    document.head.appendChild(script);
  });

  // Allow a retry after a failed load (e.g. transient network error).
  loadPromise.catch(() => {
    loadPromise = null;
  });

  return loadPromise;
}
