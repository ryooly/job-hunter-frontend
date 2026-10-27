import { useCallback, useEffect, useState } from "react";

export type Theme = "day" | "night";

const STORAGE_KEY = "jobhunter-theme";

function getInitialTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "day" || saved === "night") return saved;
  // Fall back to the OS preference on first visit.
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "night"
    : "day";
}

/** Day/night theme: reflects the choice on <html data-theme> and persists it. */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((prev) => (prev === "day" ? "night" : "day")),
    [],
  );

  return { theme, toggle };
}
