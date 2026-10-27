import type { JobVacancy } from "../types";
import { JobCard } from "./JobCard";

interface JobListProps {
  vacancies: JobVacancy[];
  loading: boolean;
  error: boolean;
  hasMore: boolean;
  count: number;
  headline: string;
  saved: (id: number) => boolean;
  onToggleBookmark: (id: number) => void;
  onLoadMore: () => void;
  onFilterChip: (id: string) => void;
}

export function JobList({
  vacancies,
  loading,
  error,
  hasMore,
  count,
  headline,
  saved,
  onToggleBookmark,
  onLoadMore,
  onFilterChip,
}: JobListProps) {
  const showSkeleton = loading && count === 0;
  const showEmpty = !loading && !error && count === 0;

  return (
    <section
      className="job-section"
      aria-label="Job listings"
      aria-busy={loading}
    >
      <div className="container">
        <p className="result-count">{headline}</p>

        <div className="job-grid">
          {vacancies.map((vacancy) => (
            <JobCard
              key={vacancy.id}
              vacancy={vacancy}
              saved={saved(vacancy.id)}
              onToggleBookmark={onToggleBookmark}
              onFilterChip={onFilterChip}
            />
          ))}
        </div>

        {showSkeleton && (
          <div className="skeleton-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        )}

        {showEmpty && (
          <div className="empty-state">
            <p className="empty-emoji">🔍</p>
            <h2>Belum ada lowongan</h2>
            <p>Coba kata kunci lain atau lihat semua lowongan.</p>
          </div>
        )}

        {hasMore && !error && (
          <div className="load-more-wrap">
            <button
              className="btn-solid btn-lg"
              type="button"
              disabled={loading}
              onClick={onLoadMore}
            >
              {loading ? "Loading..." : "Load more jobs"}
            </button>
          </div>
        )}

        {error && (
          <p className="error-banner">
            Gagal memuat data dari server. Pastikan backend berjalan di{" "}
            <code>http://127.0.0.1:8000</code>.
          </p>
        )}
      </div>
    </section>
  );
}
