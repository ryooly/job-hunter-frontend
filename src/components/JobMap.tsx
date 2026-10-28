import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Renderer } from "@googlemaps/markerclusterer";

import { loadGoogleMaps } from "../utils/googleMaps";
import { BANJARNEGARA_CENTER } from "../utils/geocode";
import { useJobMarkers, type JobMarker } from "../hooks/useJobMarkers";

/** Escape text before dropping it into an innerHTML popup string. */
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (ch) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[ch] as string,
  );
}

// Brand navy, kept in sync with --primary in index.css (SVG data URLs cannot
// read CSS variables). Individual jobs are premium teardrop pins — a gradient
// body, white ring and soft drop shadow so they never blend into the basemap,
// with the tip anchored exactly on the coordinate. When several fall together
// at low zoom the clusterer swaps them for a numbered navy bubble. Fill
// encodes precision: dark navy = specific street, mid navy = region-level.
const NAVY = "#0d2340";
const NAVY_MID = "#4f6b96";
const RING = "#ffffff";

/** A single job pin (no number); the white dot marks the head. */
function pinDataUrl(precise: boolean): string;
/** A cluster keeps the SAME teardrop shape, just with the count in its head. */
function pinDataUrl(precise: boolean, count: number): string;
function pinDataUrl(precise: boolean, count?: number): string {
  const top = precise ? "#2a4d80" : "#7f9ac0";
  const bottom = precise ? NAVY : NAVY_MID;
  // The count replaces the white dot when present (cluster bubbles).
  const head =
    count === undefined
      ? `<circle cx='20' cy='18' r='6' fill='${RING}'/>`
      : `<text x='20' y='18.5' fill='${RING}' font-family='Arial, Helvetica, sans-serif' font-size='${count < 10 ? 15 : 12}' font-weight='700' text-anchor='middle' dominant-baseline='central'>${count}</text>`;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 52' width='40' height='52'>` +
    `<defs>` +
    `<linearGradient id='body' x1='0' y1='0' x2='0' y2='1'>` +
    `<stop offset='0' stop-color='${top}'/>` +
    `<stop offset='1' stop-color='${bottom}'/>` +
    `</linearGradient>` +
    `<filter id='shadow' x='-40%' y='-30%' width='180%' height='175%'>` +
    `<feDropShadow dx='0' dy='1.6' stdDeviation='1.5' flood-color='#0a1a2f' flood-opacity='0.5'/>` +
    `</filter>` +
    `</defs>` +
    `<path filter='url(#shadow)' d='M20 2C11.2 2 4 9.2 4 18c0 11.5 16 32 16 32s16-20.5 16-32C36 9.2 28.8 2 20 2z' fill='url(#body)' stroke='${RING}' stroke-width='2.4'/>` +
    head +
    `</svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** A numbered cluster keeps the pin shape — only the head shows the count. */
function pinIcon(precise: boolean, count?: number): google.maps.Icon {
  return {
    url: count === undefined ? pinDataUrl(precise) : pinDataUrl(precise, count),
    scaledSize: new google.maps.Size(40, 52),
    // Anchor the tip on the coordinate so the exact location is unmistakable.
    anchor: new google.maps.Point(20, 50),
  };
}

// Numbered navy pin for a merged cluster; singletons keep their own pin.
const clusterRenderer: Renderer = {
  render({ count, position }) {
    return new google.maps.Marker({
      position,
      title: `${count} lowongan di area ini`,
      icon: pinIcon(false, count),
      zIndex: 1000 + count,
    });
  },
};

function popupHtml(marker: JobMarker): string {
  const level = marker.precise ? "Alamat lengkap" : "Perkiraan area";
  const levelClass = marker.precise ? " is-street" : " is-region";
  return `
    <div class="job-pin-popup">
      <p class="job-pin-popup-level${levelClass}">${level}</p>
      <h3 class="job-pin-popup-title">${escapeHtml(marker.title)}</h3>
      <p class="job-pin-popup-addr">${escapeHtml(marker.address)}</p>
      <a class="job-pin-popup-link" href="#job-${marker.id}">Lihat detail &rarr;</a>
    </div>`;
}

interface JobMapProps {
  /** Return to the previous view (the job list). */
  onBack: () => void;
}

export function JobMap({ onBack }: JobMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  // Owns the current cluster layer so it can be torn down before each repaint.
  const clusterRef = useRef<MarkerClusterer | null>(null);
  // Flipped once the async script load has produced a live map, so the
  // marker effect only runs after the frame actually exists.
  const [mapReady, setMapReady] = useState(false);
  // Non-null when the Google Maps JS API itself failed to load (bad/limited
  // key, network, billing) — surfaced so a blank map is never a silent mystery.
  const [mapError, setMapError] = useState<string | null>(null);

  const { markers, loading, error, total } = useJobMarkers();

  // Load the JS API and create the map, opening on Banjarnegara. Once the
  // job pins resolve we re-frame to them (see the marker effect below).
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new google.maps.Map(containerRef.current, {
          center: BANJARNEGARA_CENTER,
          zoom: 12,
          // Page scroll keeps scrolling the site; ctrl/pinch zooms the map.
          gestureHandling: "cooperative",
          fullscreenControl: false,
          // Hide the Map/Satellite toggle and the Peg Man (Street View) button.
          mapTypeControl: false,
          streetViewControl: false,
          // Declutter: hide Google's own POI and transit markers/labels so
          // only the job pins stand out. Roads and place names stay default.
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
          ],
        });
        infoRef.current = new google.maps.InfoWindow({ maxWidth: 280 });
        setMapReady(true);
      })
      .catch((err: unknown) => {
        console.error(err);
        if (!cancelled) {
          setMapError(
            err instanceof Error ? err.message : "Google Maps gagal dimuat.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Repaint markers whenever the resolved set changes. One shared InfoWindow
  // is reused per click so only ever one card is open.
  useEffect(() => {
    const map = mapRef.current;
    const info = infoRef.current;
    if (!mapReady || !map || !info) return;

    // Tear down the previous cluster layer and any loose pins first.
    if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (markers.length > 0) {
      // One pin per job; the clusterer owns their map attachment from here.
      const pins = markers.map((marker) => {
        const pin = new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          title: marker.title,
          icon: pinIcon(marker.precise),
        });
        pin.addListener("click", () => {
          info.setContent(popupHtml(marker));
          info.open({ anchor: pin, map });
        });
        return pin;
      });
      markersRef.current = pins;

      // Merge nearby pins into a numbered bubble when zoomed out; they split
      // back into individual pins as the user zooms in (maxZoom caps this).
      clusterRef.current = new MarkerClusterer({
        map,
        markers: pins,
        algorithmOptions: { maxZoom: 16 },
        renderer: clusterRenderer,
      });

      // Frame the view onto the pins so they are actually on screen. With the
      // sample data outside Banjarnegara this re-centres to wherever the live
      // jobs are; once vacancies move there it frames Banjarnegara.
      const bounds = new google.maps.LatLngBounds();
      markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
      map.fitBounds(bounds, 60);
      // A single point (or a tight cluster) would zoom to max detail; clamp it.
      const zoom = map.getZoom();
      if (zoom !== undefined && zoom > 14) map.setZoom(14);
    }
  }, [markers, mapReady]);

  const statusText = mapError
    ? "Peta tidak dapat dimuat."
    : loading
      ? "Memetakan lowongan…"
      : error
        ? "Gagal memuat data lowongan."
        : `${markers.length} dari ${total} lowongan ditampilkan`;

  return (
    <section className="map-section" aria-label="Job map">
      <div className="container">
        <div className="map-head">
          <button
            type="button"
            className="map-back"
            onClick={onBack}
            aria-label="Kembali ke daftar"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
          <div className="map-head-text">
            <h2 className="map-title">Peta Lowongan · Banjarnegara</h2>
            <p className="map-status">{statusText}</p>
          </div>
        </div>

        <div className="map-canvas" ref={containerRef}>
          {mapError && (
            <div className="map-error" role="alert">
              <p className="map-error-title">Peta tidak dapat dimuat</p>
              <p className="map-error-msg">{mapError}</p>
              <p className="map-error-hint">
                Pastikan kunci Google Maps valid, dan API “Maps JavaScript”
                serta “Geocoding” diaktifkan dengan tagihan/kuota yang aktif.
              </p>
            </div>
          )}
        </div>

        {!mapError && !loading && !error && markers.length === 0 && (
          <div className="empty-state">
            <p className="empty-emoji">🗺️</p>
            {total > 0 ? (
              <>
                <h2>Alamat belum dapat dipetakan</h2>
                <p>
                  {total} lowongan aktif ditemukan, tetapi alamatnya belum bisa
                  diubah ke koordinat peta.
                </p>
              </>
            ) : (
              <>
                <h2>Belum ada titik di peta</h2>
                <p>Belum ada lowongan aktif untuk dipetakan.</p>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
