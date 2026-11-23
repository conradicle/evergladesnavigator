import {
  BANDS,
  CAPS,
  FACTOR_LABELS,
  FRONT,
  LIGHT,
  SEASON_POINTS,
  TIDE,
  WATER_TEMP,
  WEIGHTS,
  WIND,
  type BandLabel,
  type FactorKey,
  type LocationId,
} from "./config";
import type { TideExtreme } from "./sources";
import { dayRange, meanFlow, tideAt } from "./tides";
import { HOUR, MINUTE } from "./time";

/**
 * Deterministic scoring. Same inputs, same score. No network, no clock.
 * Every number comes from config.ts.
 */

export type FrontSituation = "dayBefore" | "frontDay" | "after1" | "after2" | "after3" | "quiet";

export type DayInputs = {
  location: LocationId;
  locationName: string;
  month: number; // 1-12
  /** True for days 8-14: score tide, season, and moon only. */
  outlookOnly: boolean;
  sunrise: number;
  sunset: number;
  /** All extremes around the day (needs neighbors on both sides). */
  extremes: TideExtreme[] | null;
  /** Extremes falling inside the local day. */
  dayExtremes: TideExtreme[];
  moonPhase: number; // suncalc 0..1, 0 new, 0.5 full
  estWaterF: number | null;
  waterDrop48F: number | null; // negative = cooling
  /** Daylight wind summary. */
  wind: { meanKt: number; dir: number | null } | null;
  front: FrontSituation | null;
};

export type Factor = {
  key: FactorKey;
  label: string;
  max: number;
  earned: number | null;
  /** earned - max/2: what the factor added (+) or took away (-). Null = no data. */
  delta: number | null;
};

export type FishingWindow = { start: number; end: number; flow: number; rising: boolean; light: boolean };

export type ScoreResult = {
  score: number;
  raw: number;
  band: BandLabel;
  cap: { maxScore: number; reason: string } | null;
  factors: Factor[];
  windows: FishingWindow[];
  rangeFt: number | null;
  summary: string;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function bandFor(score: number): BandLabel {
  return (BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1]).label;
}

/** Is a compass direction inside a sector (sector may run past 360)? */
export function inSector(dir: number, from: number, to: number): boolean {
  const d = ((dir % 360) + 360) % 360;
  return (d >= from && d < to) || (d + 360 >= from && d + 360 < to);
}

export function compassName(dir: number): string {
  const names = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return names[Math.round((((dir % 360) + 360) % 360) / 22.5) % 16];
}

export function waterTempPoints(f: number): number {
  const w = WATER_TEMP;
  let frac: number;
  if (f >= w.fullMin && f <= w.fullMax) frac = 1;
  else if (f < w.fullMin) frac = clamp01((f - w.zeroLow) / (w.fullMin - w.zeroLow));
  else frac = clamp01((w.zeroHigh - f) / (w.zeroHigh - w.fullMax));
  return WEIGHTS.waterTemp * frac;
}

export function windPoints(location: LocationId, meanKt: number, dir: number | null): number {
  const p = WIND[location];
  let mult = 1;
  if (dir != null) for (const s of p.sectors) if (inSector(dir, s.from, s.to)) mult = Math.max(mult, s.multiplier);
  const excess = Math.max(0, meanKt - p.fullBelowKt) * mult;
  let pts = WEIGHTS.wind * clamp01(1 - excess / (p.zeroAtKt - p.fullBelowKt));
  if (p.muddyAboveKt != null && p.muddyMaxPoints != null && meanKt > p.muddyAboveKt) {
    pts = Math.min(pts, p.muddyMaxPoints);
  }
  return pts;
}

export function frontPoints(s: FrontSituation): number {
  switch (s) {
    case "dayBefore":
      return FRONT.pointsDayBefore;
    case "frontDay":
      return FRONT.pointsFrontDay;
    case "after1":
      return FRONT.pointsDaysAfter[0];
    case "after2":
      return FRONT.pointsDaysAfter[1];
    case "after3":
      return FRONT.pointsDaysAfter[2];
    default:
      return FRONT.pointsQuiet;
  }
}

/** 1 at new/full moon (spring tides), 0 at quarter moons (neaps). */
export function springness(phase: number): number {
  return Math.abs(Math.cos(2 * Math.PI * phase));
}

/** Fraction of [start, end] within LIGHT.minutesFromSunEvent of sunrise or sunset. */
function lightOverlap(start: number, end: number, sunrise: number, sunset: number): number {
  const r = LIGHT.minutesFromSunEvent * MINUTE;
  const overlap = (a: number, b: number) => Math.max(0, Math.min(end, b) - Math.max(start, a));
  return (overlap(sunrise - r, sunrise + r) + overlap(sunset - r, sunset + r)) / (end - start);
}

export function findWindows(ex: TideExtreme[], sunrise: number, sunset: number, fullRate: number): FishingWindow[] {
  const len = TIDE.windowHours * HOUR;
  const cands: (FishingWindow & { q: number })[] = [];
  for (let s = sunrise; s + len <= sunset; s += TIDE.windowStepMinutes * MINUTE) {
    const flow = meanFlow(ex, s, s + len, fullRate);
    const lightFrac = lightOverlap(s, s + len, sunrise, sunset);
    const mid = tideAt(ex, s + len / 2, fullRate);
    cands.push({
      start: s,
      end: s + len,
      flow,
      rising: mid?.rising ?? true,
      light: lightFrac > 0.3,
      q: flow + TIDE.windowLightBonus * lightFrac,
    });
  }
  if (!cands.length) return [];
  cands.sort((a, b) => b.q - a.q);
  const best = cands[0];
  const second = cands.find(
    (c) => (c.end <= best.start || c.start >= best.end) && c.q >= best.q * TIDE.secondWindowMinFraction,
  );
  return [best, second]
    .filter((w): w is FishingWindow & { q: number } => !!w)
    .sort((a, b) => a.start - b.start)
    .map(({ start, end, flow, rising, light }) => ({ start, end, flow, rising, light }));
}

export function scoreDay(i: DayInputs): ScoreResult {
  const earned: Record<FactorKey, number | null> = {
    waterTemp: null,
    tideMovement: null,
    wind: null,
    front: null,
    season: SEASON_POINTS[i.month - 1],
    light: null,
    tideRange: WEIGHTS.tideRange * springness(i.moonPhase),
  };

  let windows: FishingWindow[] = [];
  const fullRate = TIDE.fullFlowFtPerHour[i.location];
  const rangeFt = dayRange(i.dayExtremes);
  if (i.extremes) {
    windows = findWindows(i.extremes, i.sunrise, i.sunset, fullRate);
    if (windows.length) {
      // Score the tide on the best window (highest flow), not the earliest.
      const bestFlow = Math.max(...windows.map((w) => w.flow));
      let pts = WEIGHTS.tideMovement * bestFlow;
      if (rangeFt != null && rangeFt < TIDE.lowRangeFt) {
        pts = Math.min(pts, WEIGHTS.tideMovement * TIDE.lowRangeCapFraction);
      }
      earned.tideMovement = pts;
    }
    const r = LIGHT.minutesFromSunEvent * MINUTE;
    const dawn = meanFlow(i.extremes, i.sunrise - r, i.sunrise + r, fullRate);
    const dusk = meanFlow(i.extremes, i.sunset - r, i.sunset + r, fullRate);
    earned.light = WEIGHTS.light * Math.max(dawn, dusk);
  }

  if (!i.outlookOnly) {
    if (i.estWaterF != null) earned.waterTemp = waterTempPoints(i.estWaterF);
    if (i.wind) earned.wind = windPoints(i.location, i.wind.meanKt, i.wind.dir);
    if (i.front) earned.front = frontPoints(i.front);
  }

  const factors: Factor[] = (Object.keys(WEIGHTS) as FactorKey[]).map((key) => {
    const max = WEIGHTS[key];
    // A bad upstream number becomes "no data" rather than NaN in the score.
    const v = earned[key];
    const e = v != null && Number.isFinite(v) ? v : null;
    return { key, label: FACTOR_LABELS[key], max, earned: e, delta: e == null ? null : e - max / 2 };
  });

  const raw = 50 + factors.reduce((s, f) => s + (f.delta ?? 0), 0);

  // Hard caps: keep the tightest one that applies.
  const caps: { maxScore: number; reason: string }[] = [];
  if (!i.outlookOnly) {
    if (i.estWaterF != null) {
      const c = CAPS.waterBelow.find((c) => i.estWaterF! < c.belowF);
      if (c) caps.push(c);
    }
    if (i.waterDrop48F != null && i.waterDrop48F <= -CAPS.waterDrop48h.dropF) caps.push(CAPS.waterDrop48h);
    if (i.wind && i.wind.meanKt > CAPS.sustainedWind.overKt) {
      caps.push({ maxScore: CAPS.sustainedWind.maxScore[i.location], reason: CAPS.sustainedWind.reason });
    }
  }
  const tightest = caps.sort((a, b) => a.maxScore - b.maxScore)[0];
  const rawRounded = Math.round(Math.max(0, Math.min(100, raw)));
  const cap = tightest && tightest.maxScore < rawRounded ? tightest : null;
  const score = cap ? cap.maxScore : rawRounded;
  const band = bandFor(score);

  return {
    score,
    raw: rawRounded,
    band,
    cap,
    factors,
    windows,
    rangeFt,
    summary: summarize(i, band, factors, cap),
  };
}

const POSITIVE: Record<FactorKey, (i: DayInputs) => string> = {
  waterTemp: (i) => `water near ${Math.round(i.estWaterF ?? 0)}°F is in the comfort zone`,
  tideMovement: () => "the tide is moving well in the best window",
  wind: () => "wind stays light",
  front: (i) => (i.front === "dayBefore" ? "fish often feed ahead of the coming front" : "the weather is settled"),
  season: () => "it is prime season",
  light: () => "moving water lines up with first or last light",
  tideRange: () => "spring tides add extra flow",
};

const NEGATIVE: Record<FactorKey, (i: DayInputs) => string> = {
  waterTemp: (i) =>
    (i.estWaterF ?? 0) < WATER_TEMP.fullMin
      ? `water around ${Math.round(i.estWaterF ?? 0)}°F is cool for snook`
      : `water around ${Math.round(i.estWaterF ?? 0)}°F is hot for snook`,
  tideMovement: () => "tide movement is weak",
  wind: (i) =>
    i.wind?.dir != null
      ? `${compassName(i.wind.dir)} wind around ${Math.round(i.wind.meanKt)} kt works against it`
      : `wind around ${Math.round(i.wind?.meanKt ?? 0)} kt works against it`,
  front: (i) => (i.front === "frontDay" ? "a front is moving through" : "fish are still settling after a front"),
  season: () => "it is the slow winter season",
  light: () => "the tide is slack around sunrise and sunset",
  tideRange: () => "neap tides mean less flow",
};

function summarize(
  i: DayInputs,
  band: BandLabel,
  factors: Factor[],
  cap: { maxScore: number; reason: string } | null,
): string {
  const known = factors.filter((f) => f.delta != null && Math.abs(f.delta) >= 1);
  const pos = known.filter((f) => f.delta! > 0).sort((a, b) => b.delta! - a.delta!);
  const neg = known.filter((f) => f.delta! < 0).sort((a, b) => a.delta! - b.delta!);
  const lead = `${band} outlook for ${i.locationName}`;

  if (cap) {
    const despite = pos[0] ? `, even though ${POSITIVE[pos[0].key](i)}` : "";
    return `${lead}: the score is held to ${cap.maxScore} because of ${cap.reason}${despite}.`;
  }
  const good = pos.slice(0, 2).map((f) => POSITIVE[f.key](i));
  const bad = neg[0] ? NEGATIVE[neg[0].key](i) : null;
  if (!good.length && bad) return `${lead}: ${bad}.`;
  if (!good.length) return `${lead}: nothing stands out either way.`;
  return `${lead}: ${good.join(" and ")}${bad ? `, but ${bad}` : ""}.`;
}
