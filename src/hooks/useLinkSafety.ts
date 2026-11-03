import { useEffect, useRef, useState } from "react";

import { checkLinkSafety } from "../api";
import type { LinkSafety } from "../types";

export interface LinkSafetyState {
  /** True from the moment typing starts until the debounced check settles. */
  checking: boolean;
  /** Latest verdict, or null when the field is empty / not yet checked. */
  result: LinkSafety | null;
}

const IDLE: LinkSafetyState = { checking: false, result: null };

/**
 * Debounced, race-guarded link verification for a text field.
 *
 * Waits `delay` ms after the user stops typing, then asks the backend to check
 * the URL. Any in-flight or stale response is ignored (tracked by a request id)
 * so only the newest input updates the state — a slow early lookup can never
 * overwrite the verdict for a later one.
 */
export function useLinkSafety(url: string, delay = 500): LinkSafetyState {
  const [state, setState] = useState<LinkSafetyState>(IDLE);
  // Monotonic id; the response only applies if it still matches the latest one.
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = url.trim();
    // Empty field: cancel any pending/stale result and go idle.
    if (!trimmed) {
      requestId.current += 1;
      setState(IDLE);
      return;
    }

    setState((prev) => ({ ...prev, checking: true }));
    const timer = setTimeout(() => {
      const id = ++requestId.current;
      checkLinkSafety(trimmed)
        .then((result) => {
          if (id === requestId.current) setState({ checking: false, result });
        })
        .catch((err: unknown) => {
          if (id !== requestId.current) return;
          // A failed lookup is "unknown", never "dangerous".
          setState({
            checking: false,
            result: {
              url: trimmed,
              safe: true,
              checked: false,
              threat_types: [],
              error: err instanceof Error ? err.message : String(err),
            },
          });
        });
    }, delay);

    return () => clearTimeout(timer);
  }, [url, delay]);

  return state;
}
