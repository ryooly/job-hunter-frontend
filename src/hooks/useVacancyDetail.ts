import { useEffect, useState } from "react";

import { fetchVacancy } from "../api";
import type { JobVacancy } from "../types";

/**
 * Fetches a single vacancy by id for the detail page.
 * An `alive` flag prevents a slow response from setting state after the
 * component unmounted or the id changed.
 */
export function useVacancyDetail(id: number) {
  const [vacancy, setVacancy] = useState<JobVacancy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(false);
    setVacancy(null);

    fetchVacancy(id)
      .then((data) => {
        if (alive) setVacancy(data);
      })
      .catch(() => {
        if (alive) setError(true);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id]);

  return { vacancy, loading, error };
}
