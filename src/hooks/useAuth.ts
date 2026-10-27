import { useCallback, useState } from "react";

const STORAGE_KEY = "jh-user";

export interface User {
  email: string;
  name: string;
}

/** Derive a friendly display name from an email's local part. */
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local
    .replace(/[._-]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function readStored(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<User>;
    if (typeof parsed.email === "string" && parsed.email) {
      return {
        email: parsed.email,
        name: parsed.name || nameFromEmail(parsed.email),
      };
    }
  } catch {
    // Corrupt storage is treated as signed out.
  }
  return null;
}

/**
 * Local (demo) account state persisted to localStorage. Real authentication
 * is not wired to the backend yet, so signing in just records the email —
 * register and login share the same path, differing only by the display name.
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(readStored);

  const signIn = useCallback((email: string, name?: string) => {
    const next: User = {
      email,
      name: name?.trim() || nameFromEmail(email),
    };
    setUser(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return { user, signIn, signOut };
}
