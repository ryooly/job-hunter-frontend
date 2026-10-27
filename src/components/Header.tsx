import { useEffect, useRef, useState, type FormEvent } from "react";

import {
  LogoIcon,
  SearchIcon,
  HamburgerIcon,
  SunIcon,
  MoonIcon,
  HomeIcon,
  BookmarkIcon,
  SettingsIcon,
  HelpIcon,
  LogoutIcon,
  UserIcon,
} from "./Icons";
import { useTheme } from "../hooks/useTheme";
import type { User } from "../hooks/useAuth";

/** Actions the account menu can trigger beyond auth. */
export type MenuAction = "home" | "saved" | "settings" | "help";

interface HeaderProps {
  /** Current search-box text (controlled by App so tabs can clear it). */
  query: string;
  onQueryChange: (value: string) => void;
  /** Submit a search — an empty string resets to the unfiltered list. */
  onSearch: (keyword: string) => void;
  /** Hide the search band entirely (e.g. on the job detail page). */
  showSearch?: boolean;
  /** Search-box placeholder; switches to a saved-only hint on that page. */
  searchPlaceholder?: string;
  /** Logged-in account, or null when signed out. */
  user: User | null;
  onLogin: () => void;
  onRegister: () => void;
  onLogout: () => void;
  /** Pick a non-auth destination from the account menu. */
  onMenuAction: (action: MenuAction) => void;
}

/** Up to two initials for the avatar placeholder. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Header({
  query,
  onQueryChange,
  onSearch,
  showSearch = true,
  searchPlaceholder = "Semua pekerjaan • Indonesia",
  user,
  onLogin,
  onRegister,
  onLogout,
  onMenuAction,
}: HeaderProps) {
  const [searching, setSearching] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, toggle: toggleTheme } = useTheme();

  // Dismiss the account menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearching(true);
    onSearch(query.trim());
  }

  function handleChange(value: string) {
    onQueryChange(value);
    setSearching(false);
    // Clearing the box returns to the active tab's own filter.
    if (!value.trim()) onSearch("");
  }

  // Every menu entry closes the dropdown before handing control to App.
  const pick = (action: MenuAction) => {
    setMenuOpen(false);
    onMenuAction(action);
  };
  const auth = (fn: () => void) => {
    setMenuOpen(false);
    fn();
  };

  return (
    <header className="site-header">
      <h1 className="visually-hidden">Job Hunter — Job Search</h1>

      <div className="container header-inner">
        <a className="logo" href="/" aria-label="Job Hunter home">
          <LogoIcon width={28} height={28} />
          <span>
            Job<b>Hunter</b>
          </span>
        </a>

        <nav className="desktop-nav" aria-label="Navigasi utama">
          <button
            className="nav-link"
            type="button"
            onClick={() => pick("home")}
          >
            <HomeIcon width={18} height={18} />
            <span>Beranda</span>
          </button>
          <button
            className="nav-link"
            type="button"
            onClick={() => pick("saved")}
          >
            <BookmarkIcon width={18} height={18} />
            <span>Daftar Simpanan</span>
          </button>
          <button
            className="nav-link"
            type="button"
            onClick={() => pick("settings")}
          >
            <SettingsIcon width={18} height={18} />
            <span>Pengaturan</span>
          </button>
          <button
            className="nav-link"
            type="button"
            onClick={() => pick("help")}
          >
            <HelpIcon width={18} height={18} />
            <span>Bantuan</span>
          </button>
        </nav>

        <div className="header-actions">
          <button
            className="icon-btn"
            type="button"
            onClick={toggleTheme}
            aria-label={
              theme === "day" ? "Switch to night mode" : "Switch to day mode"
            }
            title={theme === "day" ? "Day mode" : "Night mode"}
          >
            {theme === "day" ? (
              <SunIcon width={20} height={20} />
            ) : (
              <MoonIcon width={20} height={20} />
            )}
          </button>

          {!user && (
            <div className="desktop-auth">
              <button className="btn-text" type="button" onClick={onRegister}>
                Daftar
              </button>
              <button className="btn-login" type="button" onClick={onLogin}>
                Log In
              </button>
            </div>
          )}

          <div className="user-menu-wrap" ref={menuRef}>
            {user && (
              <button
                className="avatar-btn"
                type="button"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                aria-label={user.name}
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className="menu-avatar menu-avatar-sm" aria-hidden="true">
                  {initials(user.name)}
                </span>
              </button>
            )}
            <button
              className="icon-btn menu-btn"
              type="button"
              aria-label="Menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              <HamburgerIcon width={20} height={20} />
            </button>

            {menuOpen && (
              <div className="user-menu" role="menu">
                {user ? (
                  <div className="menu-profile">
                    <span className="menu-avatar" aria-hidden="true">
                      {initials(user.name)}
                    </span>
                    <div className="menu-profile-id">
                      <span className="menu-profile-name">{user.name}</span>
                      <span className="menu-profile-email">{user.email}</span>
                    </div>
                  </div>
                ) : (
                  <div className="menu-guest">
                    <span className="menu-avatar" aria-hidden="true">
                      <UserIcon width={20} height={20} />
                    </span>
                    <p className="menu-guest-text">
                      Masuk untuk menyimpan lowongan dan mulai melamar.
                    </p>
                    <div className="menu-guest-actions">
                      <button
                        className="btn-outline"
                        type="button"
                        onClick={() => auth(onRegister)}
                      >
                        Daftar
                      </button>
                      <button
                        className="btn-solid"
                        type="button"
                        onClick={() => auth(onLogin)}
                      >
                        Masuk
                      </button>
                    </div>
                  </div>
                )}

                <div className="menu-nav-group">
                  <div className="menu-divider" role="separator" />

                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => pick("home")}
                  >
                    <HomeIcon width={18} height={18} />
                    <span>Beranda</span>
                  </button>
                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => pick("saved")}
                  >
                    <BookmarkIcon width={18} height={18} />
                    <span>Daftar Simpanan</span>
                  </button>

                  <button
                    className="menu-item"
                    type="button"
                    role="menuitem"
                    onClick={() => pick("help")}
                  >
                    <HelpIcon width={18} height={18} />
                    <span>Bantuan</span>
                  </button>
                </div>

                {user && (
                  <>
                    <div className="menu-divider" role="separator" />
                    <button
                      className="menu-item menu-item-danger"
                      type="button"
                      role="menuitem"
                      onClick={() => auth(onLogout)}
                    >
                      <LogoutIcon width={18} height={18} />
                      <span>Keluar</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSearch && (
        <div className="search-section">
          <div className="container">
            <form className="search-form" role="search" onSubmit={handleSubmit}>
              <button
                type="submit"
                className="search-icon"
                aria-label="Search jobs"
              >
                <SearchIcon width={18} height={18} />
              </button>
              <input
                id="job-search"
                type="text"
                className="search-input"
                placeholder={searchPlaceholder}
                aria-label="Search jobs"
                autoComplete="off"
                value={query}
                onChange={(e) => handleChange(e.target.value)}
              />
            </form>
            {searching && query.trim() && (
              <p className="search-hint" role="status">
                Menampilkan hasil untuk “{query.trim()}”. Kosongkan pencarian
                untuk melihat semua kategori.
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
