import { useEffect, useState } from "react";

/** Urgency level based on remaining time. */
export type Urgency = "normal" | "soon" | "critical" | "expired";

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Human-readable label like "12d 5h 30m" or "Expired". */
  label: string;
  urgency: Urgency;
  isExpired: boolean;
}

interface Options {
  /** Threshold (in days) below which urgency becomes "soon". Default 7. */
  soonDays?: number;
  /** Threshold (in days) below which urgency becomes "critical". Default 3. */
  criticalDays?: number;
  /** Tick interval in ms. Default 1000. */
  interval?: number;
}

function compute(
  target: number,
  soonDays: number,
  criticalDays: number,
): CountdownResult {
  const diff = target - Date.now();

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      label: "Telah berakhir",
      urgency: "expired",
      isExpired: true,
    };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  // Build a concise label.
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0) parts.push(`${hours}j`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}d`);
  const label = parts.join(" ") + " lagi";

  let urgency: Urgency = "normal";
  if (days < 1 && hours < criticalDays * 24) {
    // Less than criticalDays * 24 hours remaining.
    urgency = "critical";
  } else if (days <= criticalDays) {
    urgency = "critical";
  } else if (days <= soonDays) {
    urgency = "soon";
  }

  return { days, hours, minutes, seconds, label, urgency, isExpired: false };
}

/**
 * Reusable countdown hook.
 *
 * @param targetDate - ISO date string or Date object (deadline). Pass `null`
 *   to disable the timer (e.g. "open until filled").
 * @param options - Customize urgency thresholds and tick interval.
 *
 * @example
 * ```tsx
 * const countdown = useCountdown("2026-10-20T23:59:59");
 * if (countdown) {
 *   console.log(countdown.label); // "14h 3j 21m lagi"
 *   console.log(countdown.urgency); // "normal" | "soon" | "critical" | "expired"
 * }
 * ```
 */
export function useCountdown(
  targetDate: string | Date | null,
  options: Options = {},
): CountdownResult | null {
  const { soonDays = 7, criticalDays = 3, interval = 1000 } = options;

  // Convert to timestamp once; stable across renders unless targetDate changes.
  const target = targetDate ? new Date(targetDate).getTime() : null;

  const [result, setResult] = useState<CountdownResult | null>(() =>
    target ? compute(target, soonDays, criticalDays) : null,
  );

  useEffect(() => {
    if (!target) {
      setResult(null);
      return;
    }
    // Immediate recalculation when target changes.
    setResult(compute(target, soonDays, criticalDays));

    const id = setInterval(
      () => setResult(compute(target, soonDays, criticalDays)),
      interval,
    );
    return () => clearInterval(id);
  }, [target, soonDays, criticalDays, interval]);

  return result;
}
