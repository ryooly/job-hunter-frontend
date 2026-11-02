import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import type { Renderer } from "@googlemaps/markerclusterer";

import { loadGoogleMaps } from "../utils/googleMaps";
import { BANJARNEGARA_CENTER } from "../utils/geocode";
import { initials } from "../utils/format";
import { PinIcon } from "./Icons";
import { useJobMarkers } from "../hooks/useJobMarkers";

// Brand navy, kept in sync with --primary in index.css (SVG data URLs cannot
// read CSS variables). Individual jobs are premium numbered teardrop pins — a
// gradient body, white ring and soft drop shadow so they never blend into the
// basemap, with the tip anchored exactly on the coordinate and the job's number
// in the head (matching its row in the list below the map). When several fall
// together at low zoom the clusterer swaps them for a bubble showing the count.
// Fill encodes precision: dark navy = specific street, mid navy = region-level.
const NAVY = "#0d2340";
const NAVY_MID = "#4f6b96";
const RING = "#ffffff";

// How many jobs the list shows before the "view all" toggle expands it.
const VISIBLE_LIMIT = 5;

// Zoom used to reveal a focused marker; one level above the clusterer's
// maxZoom (16) so a co-located pin always breaks free of its cluster bubble.
const FOCUS_ZOOM = 17;

/** Teardrop pin with a number in its head — the job's index, or a cluster's count. */
function pinDataUrl(precise: boolean, number: number): string {
  const top = precise ? "#2a4d80" : "#7f9ac0";
  const bottom = precise ? NAVY : NAVY_MID;
  const head = `<text x='20' y='18.5' fill='${RING}' font-family='Arial, Helvetica, sans-serif' font-size='${number < 10 ? 15 : 12}' font-weight='700' text-anchor='middle' dominant-baseline='central'>${number}</text>`;
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

/** Teardrop pin carrying a number in its head (job index or cluster count). */
function pinIcon(precise: boolean, number: number): google.maps.Icon {
  return {
    url: pinDataUrl(precise, number),
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

interface JobMapProps {
  /** Return to the previous view (the job list). */
  onBack: () => void;
  /** When set, centre and flash this job's marker (opened from its detail page). */
  focusId?: number | null;
}

export function JobMap({ onBack, focusId = null }: JobMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
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
  // The list starts collapsed to VISIBLE_LIMIT rows; this flips it open.
  const [showAll, setShowAll] = useState(false);

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

  // Repaint markers whenever the resolved set changes. Each pin carries its
  // number and, on click, deep-links straight to that job's detail page.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;

    // Tear down the previous cluster layer and any loose pins first.
    if (clusterRef.current) {
      clusterRef.current.setMap(null);
      clusterRef.current = null;
    }
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    if (markers.length > 0) {
      // One pin per job; the clusterer owns their map attachment from here.
      const pins = markers.map((marker, i) => {
        const pin = new google.maps.Marker({
          position: { lat: marker.lat, lng: marker.lng },
          // Native hover tooltip shows the same number as the matching list row.
          title: `${i + 1}. ${marker.title}`,
          icon: pinIcon(marker.precise, i + 1),
        });
        // Clicking a pin jumps straight to that job's detail page.
        pin.addListener("click", () => {
          window.location.hash = `#job-${marker.id}`;
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

  // When arriving from a job's detail page, reveal its marker: expand the list
  // if the row sits past the cap, then centre and bounce the matching pin. The
  // pins are created in order in the repaint effect above, so markersRef holds
  // the same indices as `markers`.
  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map || focusId == null || markers.length === 0) return;
    const idx = markers.findIndex((m) => m.id === focusId);
    if (idx < 0) return;
    if (idx >= VISIBLE_LIMIT) setShowAll(true);
    const target = markers[idx];
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(FOCUS_ZOOM);
    const pin = markersRef.current[idx];
    if (!pin) return;
    pin.setAnimation(google.maps.Animation.BOUNCE);
    const t = window.setTimeout(() => pin.setAnimation(null), 2400);
    return () => window.clearTimeout(t);
  }, [focusId, markers, mapReady]);

  // Flash the matching numbered row once it is on screen (it may render only
  // after the effect above expands the collapsed list).
  useEffect(() => {
    if (focusId == null) return;
    const idx = markers.findIndex((m) => m.id === focusId);
    if (idx < 0 || (!showAll && idx >= VISIBLE_LIMIT)) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-job-id="${focusId}"]`,
    );
    if (!el) return;
    el.classList.add("is-focus");
    const t = window.setTimeout(() => el.classList.remove("is-focus"), 2400);
    return () => window.clearTimeout(t);
  }, [focusId, markers, showAll]);

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

        {!mapError && markers.length > 0 && (
          <div className="map-job-list-wrap">
            <h3 className="map-job-list-title">
              Lowongan di peta
              <span className="map-job-list-count">{markers.length}</span>
            </h3>
            <ul className="map-job-list" ref={listRef}>
              {markers.map((marker, i) =>
                // Cap the visible rows; the rest stay reachable via the toggle
                // below so a long list never pushes the map off screen.
                !showAll && i >= VISIBLE_LIMIT ? null : (
                  <li key={marker.id} data-job-id={marker.id}>
                    {/* Same #job-<id> deep link the pins use: App turns the hash
                        into the JobDetail view on click. */}
                    <a
                      className="map-job-item"
                      href={`#job-${marker.id}`}
                      title={marker.address}
                    >
                      <span className="map-job-avatar">
                        <span className="map-job-avatar-media">
                          {marker.companyLogoUrl ? (
                            <img
                              src={marker.companyLogoUrl}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            initials(marker.companyName ?? "Perusahaan")
                          )}
                        </span>
                        {/* Number matches the pin's head so the row and its
                            marker on the map reference each other. */}
                        <span
                          className={`map-job-badge${marker.precise ? " is-street" : " is-region"}`}
                        >
                          {i + 1}
                        </span>
                      </span>
                      <span className="map-job-item-text">
                        <span className="map-job-item-title">{marker.title}</span>
                        {/* Publisher byline — a faint, small line under the title. */}
                        <span className="map-job-item-company">
                          {marker.companyName ?? "Perusahaan"}
                        </span>
                        <span className="map-job-item-addr">
                          {/* Location gets its own left icon, mirroring the
                              company logo. */}
                          <PinIcon width={12} height={12} />
                          <span>{marker.address}</span>
                        </span>
                      </span>
                    </a>
                  </li>
                ),
              )}
            </ul>
            {markers.length > VISIBLE_LIMIT && (
              <button
                type="button"
                className="map-job-more"
                onClick={() => setShowAll((prev) => !prev)}
                aria-expanded={showAll}
              >
                {showAll
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua ${markers.length} lowongan`}
              </button>
            )}
          </div>
        )}

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
