import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchVacancies } from "../api";
import { resolveCategory } from "../data/categories";
import type { JobVacancy } from "../types";

const PAGE_SIZE = 9;

interface UseVacanciesArgs {
  /** Raw search-box value. */
  keyword: string;
  /** Active category tab id. */
  category: string;
}

/**
 * Loads a page of vacancies for the current query and appends more on demand.
 *
 * A query-sequence guard drops responses from superseded queries, so a slow
 * stale reply can never overwrite fresher state (rapid tab clicks, typing
 * while a request is in flight, etc.).
 */
export function useVacancies({ keyword, category }: UseVacanciesArgs) {
  const active = resolveCategory(category);
  // Explicit search wins over the tab's built-in keyword.
  const search = keyword.trim() || active.keyword || "";

  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  const querySeq = useRef(0);
  const offset = useRef(0);
  const loadingRef = useRef(false);

  useEffect(() => {
    const seq = ++querySeq.current;
    offset.current = 0;
    loadingRef.current = true;
    setVacancies([]);
    setLoading(true);
    setError(false);
    setHasMore(false);

    fetchVacancies({ keyword: search, limit: PAGE_SIZE, offset: 0 })
      .then((page) => {
        if (seq !== querySeq.current) return;
        offset.current = page.length;
        setVacancies(page);
        setHasMore(page.length === PAGE_SIZE);
      })
      .catch((err: unknown) => {
        if (seq !== querySeq.current) return;
        console.error(err);
        setVacancies([]);
        setError(true);
        setHasMore(false);
      })
      .finally(() => {
        if (seq !== querySeq.current) return;
        loadingRef.current = false;
        setLoading(false);
      });
  }, [search]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    const seq = querySeq.current;
    loadingRef.current = true;
    setLoading(true);

    try {
      const page = await fetchVacancies({
        keyword: search,
        limit: PAGE_SIZE,
        offset: offset.current,
      });
      if (seq !== querySeq.current) return;
      offset.current += page.length;
      setVacancies((prev) => [...prev, ...page]);
      setHasMore(page.length === PAGE_SIZE);
    } catch (err) {
      if (seq !== querySeq.current) return;
      console.error(err);
      setError(true);
      setHasMore(false);
    } finally {
      if (seq === querySeq.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, [search]);

  // Predicate-only tabs filter the already-loaded page on the client.
  const visible = useMemo(
    () => (active.predicate ? vacancies.filter(active.predicate) : vacancies),
    [active, vacancies],
  );

  return { visible, loading, error, hasMore, loadMore, active };
}
