import { useEffect, useMemo, useState } from "react";

import { BottomNav } from "./components/BottomNav";
import { CategoryTabs } from "./components/CategoryTabs";
import { Footer } from "./components/Footer";
import { Header, type MenuAction } from "./components/Header";
import { JobDetail } from "./components/JobDetail";
import { JobList } from "./components/JobList";
import { JobPost } from "./components/JobPost";
import { LoginModal } from "./components/LoginModal";
import { useAuth } from "./hooks/useAuth";
import { useBookmarks } from "./hooks/useBookmarks";
import { useSavedVacancies } from "./hooks/useSavedVacancies";
import { useVacancies } from "./hooks/useVacancies";

/** Deep-link support only: the hash is used exclusively for #job-<id>. */
function useJobId(): number | null {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const match = hash.match(/^#job-(\d+)$/);
  return match ? Number(match[1]) : null;
}

export default function App() {
  const [query, setQuery] = useState(""); // search box text
  const [keyword, setKeyword] = useState(""); // submitted search
  const [category, setCategory] = useState("all");

  // Bottom-bar destinations switch state directly — no URL routing.
  const [view, setView] = useState<"list" | "saved" | "post">("list");
  // The account dialog doubles as login and register.
  const [authModal, setAuthModal] = useState<"login" | "register" | null>(null);

  const auth = useAuth();
  const jobId = useJobId();

  const { visible, loading, error, hasMore, loadMore, active } = useVacancies({
    keyword,
    category,
  });
  const bookmarks = useBookmarks();

  // The Saved page owns its data: every bookmarked job is fetched by id, so a
  // search here only ever filters within the saved set — unsaved jobs can't
  // leak in the way they could when reusing the main list's server results.
  const savedData = useSavedVacancies(bookmarks.ids);
  const savedVacancies = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    if (!term) return savedData.vacancies;
    // Mirror the backend's search, which matches on the job title.
    return savedData.vacancies.filter((v) =>
      v.title.toLowerCase().includes(term),
    );
  }, [savedData.vacancies, keyword]);

  // A free-text search overrides the tab's own filter, so drop the tab
  // highlight — otherwise the active tab and the shown results disagree.
  const handleSearch = (next: string) => {
    setKeyword(next);
    if (next) setCategory("all");
  };

  // Picking a category (tab, dropdown option, or job-card chip) browses that
  // filter, not the previous search.
  const handleSelectCategory = (id: string) => {
    setCategory(id);
    setQuery("");
    setKeyword("");
  };

  // Bottom-nav actions: leave the detail page (if open) and act immediately.
  const leaveDetail = () => {
    if (jobId !== null) window.location.hash = "#";
  };
  const goHome = () => {
    leaveDetail();
    handleSelectCategory("all");
    setView("list");
    window.scrollTo({ top: 0 });
  };
  const goSaved = () => {
    leaveDetail();
    setView("saved");
  };

  // Detail-page chips apply a filter and return to the filtered list.
  const handleFilterChip = (id: string) => {
    leaveDetail();
    handleSelectCategory(id);
  };

  // The posting page is a real view; "create profile" reuses the register
  // dialog, "my profile" only makes sense signed in.
  const handlePostJob = () => {
    leaveDetail();
    setView("post");
  };
  const handleProfile = () => {
    if (auth.user) console.info("Profile page is not wired up yet.");
    else setAuthModal("register");
  };

  // Bottom-bar "Maps": no in-app map view yet, so hand off to Google Maps.
  const handleMaps = () => {
    window.open("https://maps.google.com", "_blank", "noopener,noreferrer");
  };

  // Account-menu destinations. Home and saved navigate; the rest are
  // placeholders until those pages exist.
  const handleMenuAction = (action: MenuAction) => {
    if (action === "home") goHome();
    else if (action === "saved") goSaved();
    else console.info(`Menu item "${action}" is not wired up yet.`);
  };

  // Start every page from the top.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [jobId, view]);

  const headline = keyword
    ? `Hasil untuk "${keyword}" — ${visible.length}`
    : active.predicate
      ? `${active.label} · ${visible.length} lowongan cocok`
      : `${visible.length} lowongan ditampilkan`;

  const savedHeadline = keyword
    ? `Daftar Simpanan · ${savedVacancies.length} hasil untuk "${keyword}"`
    : `Daftar Simpanan · ${savedVacancies.length} lowongan`;

  return (
    <>
      <Header
        query={query}
        onQueryChange={setQuery}
        onSearch={handleSearch}
        showSearch={false}
        user={auth.user}
        onLogin={() => setAuthModal("login")}
        onRegister={() => setAuthModal("register")}
        onLogout={auth.signOut}
        onMenuAction={handleMenuAction}
      />

      <main>
        {/* Key changes per route → remounts the wrapper, replaying the
            page-enter animation on every navigation. */}
        <div className="page" key={jobId !== null ? `job-${jobId}` : view}>
          {jobId !== null ? (
            <JobDetail
              vacancyId={jobId}
              saved={bookmarks.has(jobId)}
              onToggleBookmark={bookmarks.toggle}
              onFilterChip={handleFilterChip}
            />
          ) : view === "post" ? (
            <JobPost onCancel={goHome} />
          ) : view === "saved" ? (
            <JobList
              vacancies={savedVacancies}
              loading={savedData.loading}
              error={savedData.error}
              hasMore={false}
              count={savedVacancies.length}
              headline={savedHeadline}
              saved={bookmarks.has}
              onToggleBookmark={bookmarks.toggle}
              onLoadMore={loadMore}
              onFilterChip={handleSelectCategory}
            />
          ) : (
            <>
              <div className="filter-band">
                <CategoryTabs
                  active={category}
                  onSelect={handleSelectCategory}
                />
              </div>

              <JobList
                vacancies={visible}
                loading={loading}
                error={error}
                hasMore={hasMore}
                count={visible.length}
                headline={headline}
                saved={bookmarks.has}
                onToggleBookmark={bookmarks.toggle}
                onLoadMore={loadMore}
                onFilterChip={handleSelectCategory}
              />
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Home only — the bar hides on detail, saved, and posting pages. */}
      {jobId === null && view === "list" && (
        <BottomNav
          activeView={view}
          onHome={goHome}
          onSearchSubmit={handleSearch}
          onPostJob={handlePostJob}
          onMaps={handleMaps}
          onProfile={handleProfile}
          userName={auth.user?.name ?? null}
        />
      )}

      <LoginModal
        open={authModal !== null}
        mode={authModal ?? "login"}
        onClose={() => setAuthModal(null)}
        onSubmit={(email, name) => auth.signIn(email, name)}
      />
    </>
  );
}
