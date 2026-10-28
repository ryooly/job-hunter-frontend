import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

/**
 * True while the page is being scrolled down (past a small top threshold).
 * Scrolling back up — or simply stopping — reveals the bar again, so the
 * hidden state is cleared by a short idle timer after the last scroll event.
 */
function useScrolledDown(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let idle: number | undefined;

    const onScroll = () => {
      const y = window.scrollY;
      window.clearTimeout(idle);
      if (y > lastY && y > 96) {
        setHidden(true);
      } else if (y <= lastY) {
        setHidden(false);
      }
      // Scrolling stopped → always reveal the bar.
      idle = window.setTimeout(() => setHidden(false), 320);
      lastY = y;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.clearTimeout(idle);
    };
  }, []);

  return hidden;
}

interface BottomNavProps {
  /** Highlight the tab matching the current App view. */
  activeView: "list" | "saved" | "post" | "map";
  onHome: () => void;
  /** Submit a search keyword from the expanded search bar ("" resets). */
  onSearchSubmit: (keyword: string) => void;
  /** Center "+" button — open the job-posting page. */
  onPostJob: () => void;
  onMaps: () => void;
  onProfile: () => void;
  /** Logged-in name for the in-bar avatar, or null when signed out. */
  userName: string | null;
}

/** Up to two initials for the avatar, mirroring the header menu. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Mobile-first floating pill navigation (Kalibrr app style): Home and Search
 * on the left, a central "+" for posting a vacancy, then Maps and Profile.
 * The profile lives inside the bar itself — the avatar at the far right —
 * instead of a separate account section.
 *
 * The Search button morphs the pill into a full-width search bar (the
 * magnifier leads on the left); pressing the magnifier again folds it back
 * into the pill. The search view stays open until it is toggled again.
 *
 * Hiding on scroll runs as a flowing two-phase motion: the white shell and
 * the side wings fold into the center "+", and as they settle the "+" glides
 * down and out of frame. Showing plays the same motion in reverse.
 */
export function BottomNav({
  activeView,
  onHome,
  onSearchSubmit,
  onPostJob,
  onMaps,
  onProfile,
  userName,
}: BottomNavProps) {
  const hidden = useScrolledDown();
  const [searchOpen, setSearchOpen] = useState(false);
  const [term, setTerm] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the field once the morph starts; release focus when it folds back.
  useEffect(() => {
    if (searchOpen) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 200);
      return () => window.clearTimeout(timer);
    }
    inputRef.current?.blur();
  }, [searchOpen]);

  const toggleSearch = () => setSearchOpen((open) => !open);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearchSubmit(term.trim());
  };

  const clearSearch = () => {
    setTerm("");
    onSearchSubmit("");
    inputRef.current?.focus();
  };

  return (
    <nav
      className={`bottom-nav${hidden && !searchOpen ? " bottom-nav-hidden" : ""}${
        searchOpen ? " bottom-nav-search" : ""
      }`}
      aria-label="Navigasi bawah"
    >
      <div className="bottom-nav-shell">
        <div className="bottom-nav-pill">
          {/* Left wing — folds into (and unfolds from) the center "+". */}
          <div className="bottom-nav-wing bottom-nav-wing-left">
            <button
              className={`bottom-nav-item${activeView === "list" ? " active" : ""}`}
              type="button"
              onClick={onHome}
              aria-label="Home"
            >
              <svg
                viewBox="0 0 24 24"
                width={22}
                height={22}
                aria-hidden="true"
              >
                <path
                  d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  fill="currentColor"
                />
              </svg>
            </button>

            {/* Toggle: morphs the pill into the search bar and back. */}
            <button
              className="bottom-nav-item"
              type="button"
              onClick={toggleSearch}
              aria-label="Search"
              aria-expanded={searchOpen}
            >
              <svg
                viewBox="0 0 24 24"
                width={22}
                height={22}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          </div>

          {/* Right wing — mirrors the left toward the center. */}
          <div className="bottom-nav-wing bottom-nav-wing-right">
            <button
              className={`bottom-nav-item${activeView === "map" ? " active" : ""}`}
              type="button"
              onClick={onMaps}
              aria-label="Maps"
            >
              <svg
                viewBox="0 0 24 24"
                width={22}
                height={22}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 3 3 5.5v15L9 18l6 3 6-2.5v-15L15 6 9 3z" />
                <path d="M9 3v15M15 6v15" />
              </svg>
            </button>

            <button
              className="bottom-nav-item bottom-nav-profile"
              type="button"
              onClick={onProfile}
              aria-label="Profile"
            >
              {userName ? (
                <span className="bottom-nav-avatar" aria-hidden="true">
                  {initials(userName)}
                </span>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width={22}
                  height={22}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Center button — drops down to "receive" the wings when hiding. */}
        <button
          className={`bottom-nav-add${activeView === "post" ? " active" : ""}`}
          type="button"
          onClick={onPostJob}
          aria-label="Add job vacancy"
        >
          <svg
            viewBox="0 0 24 24"
            width={22}
            height={22}
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>

      {/* Expanded search view — overlays the pill (outside the shell so the
          collapsed pill cannot hide it); the magnifier on the left folds
          the bar back into the pill. */}
      <form
        className="bottom-nav-searchbar"
        role="search"
        onSubmit={submitSearch}
      >
        <button
          className="bottom-nav-search-toggle"
          type="button"
          onClick={toggleSearch}
          aria-label="Close search"
        >
          <svg
            viewBox="0 0 24 24"
            width={20}
            height={20}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>

        <input
          ref={inputRef}
          className="bottom-nav-search-input"
          type="search"
          placeholder="Cari pekerjaan…"
          aria-label="Search jobs"
          autoComplete="off"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />

        {term && (
          <button
            className="bottom-nav-search-clear"
            type="button"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </form>
    </nav>
  );
}
