import { useEffect, useMemo, useState } from "react";

import { fetchVacancy } from "../api";
import type { JobVacancy } from "../types";

/**
 * Loads every bookmarked vacancy by id, independently of the main list.
 *
 * The Saved page needs the complete saved set (not just the current server
 * page) so its search can be scoped to saved items only — a job that was
 * never bookmarked can never leak into the results. Ids that fail to fetch
 * (deleted, inactive) are dropped silently.
 */
export function useSavedVacancies(ids: Set<string>) {
  const [vacancies, setVacancies] = useState<JobVacancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Join the ids so the effect reruns on content change, not Set identity.
  const key = useMemo(() => [...ids].sort().join(","), [ids]);

  useEffect(() => {
    if (ids.size === 0) {
      setVacancies([]);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    Promise.all(
      [...ids].map((id) =>
        fetchVacancy(Number(id)).catch((err: unknown) => {
          console.error(`Failed to load saved job ${id}:`, err);
          return null;
        }),
      ),
    )
      .then((list) => {
        if (cancelled) return;
        setVacancies(list.filter((v): v is JobVacancy => v !== null));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        console.error(err);
        setError(true);
        setVacancies([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // `key` captures id-set content; `ids` is intentionally not a dep.
  }, [key]);

  return { vacancies, loading, error };
}
