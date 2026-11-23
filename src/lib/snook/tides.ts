import { TIDE } from "./config";
import type { TideExtreme } from "./sources";
import { HOUR, MINUTE } from "./time";

/**
 * Tide curve from high/low predictions. The subordinate stations only give
 * extremes, so height between them follows a half cosine. Flow strength is
 * the actual rate of rise or fall (ft/hour) divided by a full-credit rate
 * from config, capped at 1. It peaks at mid-tide and is near 0 at slack.
 */

export type TideState = { ft: number; ftPerHour: number; strength: number; rising: boolean };

function bracket(ex: TideExtreme[], t: number): [TideExtreme, TideExtreme] | null {
  // Extremes are sorted; a linear scan is fine for a few dozen points.
  for (let i = 0; i < ex.length - 1; i++) {
    if (ex[i].t <= t && t < ex[i + 1].t) return [ex[i], ex[i + 1]];
  }
  return null;
}

export function tideAt(ex: TideExtreme[], t: number, fullFtPerHour: number): TideState | null {
  const b = bracket(ex, t);
  if (!b) return null;
  const [a, c] = b;
  const span = c.t - a.t;
  const phase = (Math.PI * (t - a.t)) / span;
  const ft = a.ft + ((c.ft - a.ft) * (1 - Math.cos(phase))) / 2;
  // d/dt of the half cosine, in ft/hour.
  const ftPerHour = (Math.abs(c.ft - a.ft) * Math.PI * Math.sin(phase)) / (2 * (span / HOUR));
  const nearSlack = Math.min(t - a.t, c.t - t) < TIDE.slackMinutes * MINUTE;
  const strength = nearSlack ? TIDE.slackStrength : Math.min(1, ftPerHour / fullFtPerHour);
  return { ft, ftPerHour, strength, rising: c.ft > a.ft };
}

/** Mean flow strength over [start, end], sampled every 10 minutes. */
export function meanFlow(ex: TideExtreme[], start: number, end: number, fullFtPerHour: number): number {
  let sum = 0;
  let n = 0;
  for (let t = start; t <= end; t += 10 * MINUTE) {
    const s = tideAt(ex, t, fullFtPerHour);
    if (s) {
      sum += s.strength;
      n++;
    }
  }
  return n ? sum / n : 0;
}

/** Hourly heights for a sparkline: every hour from start to end inclusive. */
export function hourlyCurve(ex: TideExtreme[], start: number, end: number): { t: number; ft: number }[] {
  const out: { t: number; ft: number }[] = [];
  for (let t = start; t <= end; t += HOUR) {
    const s = tideAt(ex, t, 1);
    if (s) out.push({ t, ft: Math.round(s.ft * 100) / 100 });
  }
  return out;
}

/** Largest high minus smallest low among the day's extremes. */
export function dayRange(dayExtremes: TideExtreme[]): number | null {
  const highs = dayExtremes.filter((e) => e.type === "H").map((e) => e.ft);
  const lows = dayExtremes.filter((e) => e.type === "L").map((e) => e.ft);
  if (!highs.length || !lows.length) return null;
  return Math.max(...highs) - Math.min(...lows);
}
