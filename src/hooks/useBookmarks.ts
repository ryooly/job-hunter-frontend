import { useCallback, useState } from "react";

const STORAGE_KEY = "jh-bookmarks";

function readStored(): Set<string> {
  try {
    return new Set(
      (JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]).map(
        String,
      ),
    );
  } catch {
    return new Set();
  }
}

/** Bookmark ids persisted to localStorage. */
export function useBookmarks() {
  const [saved, setSaved] = useState<Set<string>>(readStored);

  const toggle = useCallback((id: number) => {
    setSaved((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const has = useCallback((id: number) => saved.has(String(id)), [saved]);

  // Expose the raw id set so the Saved page can load the full bookmarked list
  // independently of the main list's server search.
  return { has, toggle, size: saved.size, ids: saved };
}
