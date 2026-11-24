import { getTimes } from "suncalc";
import {
  CACHE_SECONDS,
  SHARK,
  SHARK_AREAS,
  SHARK_RULES,
  type SharkAreaId,
  type SharkRule,
} from "./config";
import type { Outlook } from "./outlook";
import { findWindows, type FishingWindow } from "./score";
import { fetchTides, type TideExtreme } from "./sources";
import MO215 from "./data/mo215-normals.json";
import { addDays, DAY, HOUR, monthOf, noonOf, startOfDay, type DateKey } from "./time";

/**
 * Shark River conditions and area ratings. Hydrology comes from USGS
 * (marsh level at MO-215, river gauges at Rookery Branch and Gunboat
 * Island) and is compared with the same calendar dates in past years.
 * Ratings are plain rules from SHARK_RULES in config.ts.
 */

const USGS = "https://waterservices.usgs.gov/nwis";
const HISTORY_SECONDS = 86400;
const UA = { "User-Agent": "EvergladesNavigator-SnookOutlook" };

export type Normal = "well below normal" | "below normal" | "normal" | "above normal" | "well above normal";
export type Reading = { value: number; t: number; typical: number | null; normal: Normal | null };

export type MarshState = "draining" | "floodedFalling" | "rising" | "nearlyDry" | "floodedSteady" | "lowSteady";

export const MARSH_STATE_LABEL: Record<MarshState, string> = {
  draining: "Below flood stage and falling: prey pushed into the creeks",
  floodedFalling: "Above flood stage but falling: prey pulse building",
  rising: "Rising: prey spreading back out into the marsh",
  nearlyDry: "Nearly dry: prey pulse mostly spent",
  floodedSteady: "Flooded and holding: prey spread through the marsh",
  lowSteady: "Below flood stage, holding steady",
};

export type Marsh = {
  ft: number;
  t: number;
  change: { d3: number | null; d7: number | null; d14: number | null; d30: number | null };
  state: MarshState;
  typicalFt: number | null;
  normal: Normal | null;
  /** Days until the level reaches flood stage at the 14-day rate, if falling toward it. */
  daysToFloodStage: number | null;
};

export type AreaRating = "Low" | "Moderate" | "High";
export type Area = {
  id: SharkAreaId;
  name: string;
  blurb: string;
  points: number;
  rating: AreaRating;
  reasons: string[];
};

export type SharkConditions = {
  generatedAt: number;
  today: DateKey;
  season: "dry" | "wet";
  marsh: Marsh | null;
  rookery: { tempF: Reading | null; salinity: Reading | null; flowCfs: Reading | null } | null;
  gunboat: { netFlowCfs: Reading | null } | null;
  coastWaterF: number | null;
  wind: { meanKt: number; dirName: string | null } | null;
  tides: { station: string; extremes: TideExtreme[]; windows: FishingWindow[]; sunrise: number; sunset: number } | null;
  areas: Area[];
  unavailable: string[];
};

/* ---------- pure helpers (tested) ---------- */

export function normalFor(v: number, p: { p10: number; p25: number; p75: number; p90: number }): Normal {
  if (v < p.p10) return "well below normal";
  if (v < p.p25) return "below normal";
  if (v <= p.p75) return "normal";
  if (v <= p.p90) return "above normal";
  return "well above normal";
}


export function marshState(ft: number, change14: number | null): MarshState {
  const m = SHARK.marsh;
  if (ft < m.nearlyDryFt) return "nearlyDry";
  if (change14 != null && change14 >= m.risingFt14d) return "rising";
  const falling = change14 != null && change14 <= -m.fallingFt14d;
  if (ft <= m.floodStageFt) return falling ? "draining" : "lowSteady";
  return falling ? "floodedFalling" : "floodedSteady";
}

/** Days to reach flood stage at the 14-day rate; null unless above it and falling. */
export function daysToFloodStage(ft: number, change14: number | null): number | null {
  if (change14 == null || change14 > -SHARK.marsh.fallingFt14d || ft <= SHARK.marsh.floodStageFt) return null;
  const perDay = -change14 / 14;
  return Math.round((ft - SHARK.marsh.floodStageFt) / perDay);
}

const fmtFt = (n: number) => `${n >= 0 ? "" : "-"}${Math.abs(n).toFixed(2)} ft`;

export type RatingInputs = {
  month: number;
  marsh: { ft: number; change14: number | null; state: MarshState } | null;
  coldestWaterF: number | null;
  windKt: number | null;
};

export function rateAreas(i: RatingInputs): Area[] {
  const fired: { rule: SharkRule; why: string }[] = [];
  const dry = SHARK.dryMonths.includes(i.month);
  if (dry) {
    fired.push({ rule: "drySeason", why: "Dry season (Nov to Apr): snook feed upriver on prey leaving the marsh" });
    if (SHARK.peakUpriverMonths.includes(i.month)) {
      fired.push({ rule: "peakUpriver", why: "March and April are the peak months for snook in the upper river" });
    }
  } else {
    fired.push({ rule: "wetSeason", why: "Wet season (May to Oct): snook gather toward the coast and passes to spawn" });
  }
  if (i.marsh) {
    const { ft, change14, state } = i.marsh;
    const ch = change14 == null ? "" : ` (${change14 <= 0 ? "down" : "up"} ${Math.abs(change14).toFixed(2)} ft in 14 days)`;
    if (state === "draining") {
      fired.push({ rule: "marshDraining", why: `Marsh at ${fmtFt(ft)}, below flood stage and falling${ch}: prey concentrated in the creeks` });
    } else if (state === "floodedFalling") {
      fired.push({ rule: "marshFallingFlooded", why: `Marsh at ${fmtFt(ft)} and falling toward flood stage${ch}: prey starting to move` });
    } else if (state === "rising") {
      fired.push({ rule: "marshRising", why: `Marsh rising${ch}: prey spreading back into the marsh` });
    } else if (state === "nearlyDry") {
      fired.push({ rule: "marshNearlyDry", why: `Marsh nearly dry at ${fmtFt(ft)}: most of the prey pulse is spent` });
    }
  }
  if (i.coldestWaterF != null && i.coldestWaterF < SHARK.coldWaterF) {
    fired.push({
      rule: "cold",
      why: `Cold water (${i.coldestWaterF.toFixed(0)}°F): snook leave open, shallow water for deeper, sheltered water`,
    });
  }
  if (i.windKt != null && i.windKt >= SHARK.windyKt) {
    fired.push({ rule: "windy", why: `Wind around ${Math.round(i.windKt)} kt: rough, muddy water at the open coast` });
  }

  return SHARK_AREAS.map((a) => {
    let points = 0;
    const reasons: string[] = [];
    for (const f of fired) {
      const p = SHARK_RULES[f.rule][a.id];
      if (!p) continue;
      points += p;
      reasons.push(`${p > 0 ? "+" : ""}${p} ${f.why}`);
    }
    const rating: AreaRating = points >= SHARK.cutoffs.high ? "High" : points <= SHARK.cutoffs.low ? "Low" : "Moderate";
    return { ...a, points, rating, reasons };
  });
}

/** Parse a USGS RDB (tab-separated) body into rows keyed by header name. */
export function parseRdb(text: string): Record<string, string>[] {
  const lines = text.split("\n").filter((l) => l && !l.startsWith("#"));
  if (lines.length < 3) return [];
  const head = lines[0].split("\t");
  return lines.slice(2).map((l) => {
    const cells = l.split("\t");
    return Object.fromEntries(head.map((h, i) => [h, cells[i] ?? ""]));
  });
}

/**
 * MO-215 normal range for a calendar date, from data/mo215-normals.json
 * (2013-2025 daily record, +-7 days around each date). Precomputed because
 * the full USGS record takes ~10 s to download. Regenerate yearly if wanted.
 */
export function marshNormalsFor(today: DateKey): { p10: number; p25: number; p50: number; p75: number; p90: number } | null {
  const row = (MO215.normals as Record<string, number[]>)[today.slice(5)];
  if (!row || row.length !== 5) return null;
  const [p10, p25, p50, p75, p90] = row;
  return { p10, p25, p50, p75, p90 };
}

/* ---------- fetchers (never throw) ---------- */

async function getText(url: string, revalidate: number): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: UA, next: { revalidate }, signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

type Latest = { value: number; t: number };

/** Latest instantaneous value per "site:param". */
async function fetchLatest(): Promise<Map<string, Latest> | null> {
  const s = SHARK.stations;
  const url =
    `${USGS}/iv/?format=json&sites=${s.marsh.id},${s.rookery.id},${s.gunboat.id}` +
    `&parameterCd=00010,00060,00480,62611,72137&period=P3D&siteStatus=all`;
  const text = await getText(url, Math.min(CACHE_SECONDS, 3600));
  if (!text) return null;
  try {
    const json = JSON.parse(text) as {
      value: {
        timeSeries: {
          sourceInfo: { siteCode: { value: string }[] };
          variable: { variableCode: { value: string }[]; noDataValue: number };
          values: { value: { value: string; dateTime: string }[] }[];
        }[];
      };
    };
    const out = new Map<string, Latest>();
    for (const ts of json.value.timeSeries) {
      const key = `${ts.sourceInfo.siteCode[0].value}:${ts.variable.variableCode[0].value}`;
      const vals = ts.values.flatMap((v) => v.value).filter((v) => {
        const n = Number(v.value);
        return Number.isFinite(n) && n !== ts.variable.noDataValue;
      });
      const last = vals.at(-1);
      if (!last) continue;
      const prev = out.get(key);
      const t = Date.parse(last.dateTime);
      if (!prev || t > prev.t) out.set(key, { value: Number(last.value), t });
    }
    return out;
  } catch {
    return null;
  }
}

/** MO-215 daily maximum water level, last 45 days (for 3/7/14/30-day change). */
async function fetchMarshRecent(): Promise<{ date: DateKey; v: number }[] | null> {
  const url = `${USGS}/dv/?format=rdb&sites=${SHARK.stations.marsh.id}&parameterCd=62611&statCd=00001&period=P45D`;
  const text = await getText(url, Math.min(CACHE_SECONDS, 3600));
  if (!text) return null;
  const rows = parseRdb(text);
  const col = rows[0] && Object.keys(rows[0]).find((k) => k.endsWith("_62611_00001"));
  if (!col) return null;
  const out = rows
    .filter((r) => r[col] !== "")
    .map((r) => ({ date: r.datetime, v: Number(r[col]) }))
    .filter((r) => /^\d{4}-\d{2}-\d{2}$/.test(r.date) && Number.isFinite(r.v));
  return out.length ? out : null;
}

type Pct = { p10: number; p25: number; p50: number; p75: number; p90: number };

/** USGS daily statistics (percentiles by calendar day) for today's month and day. */
async function fetchDailyStats(today: DateKey): Promise<Map<string, Pct> | null> {
  const s = SHARK.stations;
  const url =
    `${USGS}/stat/?format=rdb&sites=${s.rookery.id},${s.gunboat.id}&parameterCd=00010,00060,00480,72137` +
    `&statReportType=daily&statTypeCd=p10,p25,p50,p75,p90`;
  const text = await getText(url, HISTORY_SECONDS);
  if (!text) return null;
  const [, m, d] = today.split("-").map(Number);
  const out = new Map<string, Pct>();
  for (const r of parseRdb(text)) {
    if (Number(r.month_nu) !== m || Number(r.day_nu) !== d) continue;
    const p = { p10: +r.p10_va, p25: +r.p25_va, p50: +r.p50_va, p75: +r.p75_va, p90: +r.p90_va };
    if (Object.values(p).every(Number.isFinite)) out.set(`${r.site_no}:${r.parameter_cd}`, p);
  }
  return out;
}

/* ---------- build ---------- */

const cToF = (c: number) => (c * 9) / 5 + 32;

function reading(latest: Latest | undefined, pct: Pct | undefined, convert = (n: number) => n): Reading | null {
  if (!latest) return null;
  const value = convert(latest.value);
  if (!pct) return { value, t: latest.t, typical: null, normal: null };
  const p = {
    p10: convert(pct.p10),
    p25: convert(pct.p25),
    p50: convert(pct.p50),
    p75: convert(pct.p75),
    p90: convert(pct.p90),
  };
  return { value, t: latest.t, typical: p.p50, normal: normalFor(value, p) };
}

function buildMarsh(history: { date: DateKey; v: number }[] | null, latest: Latest | undefined, today: DateKey): Marsh | null {
  const byDate = new Map((history ?? []).map((h) => [h.date, h.v]));
  const nowFt = latest?.value ?? byDate.get(addDays(today, -1));
  if (nowFt == null) return null;
  const ago = (n: number) => {
    const v = byDate.get(addDays(today, -n)) ?? byDate.get(addDays(today, -n - 1));
    return v == null ? null : Math.round((nowFt - v) * 100) / 100;
  };
  const change = { d3: ago(3), d7: ago(7), d14: ago(14), d30: ago(30) };
  const normals = marshNormalsFor(today);
  return {
    ft: nowFt,
    t: latest?.t ?? startOfDay(today),
    change,
    state: marshState(nowFt, change.d14),
    typicalFt: normals?.p50 ?? null,
    normal: normals ? normalFor(nowFt, normals) : null,
    daysToFloodStage: daysToFloodStage(nowFt, change.d14),
  };
}

export async function buildSharkConditions(outlook: Outlook, now = Date.now()): Promise<SharkConditions> {
  const today = outlook.today;
  const s = SHARK.stations;
  const unavailable: string[] = [];

  const [latest, history, stats, tideRes] = await Promise.all([
    fetchLatest(),
    fetchMarshRecent(),
    fetchDailyStats(today),
    fetchTides({ tideStations: [SHARK.tideStation] }, addDays(today, -1), addDays(today, 1)),
  ]);
  if (!latest) unavailable.push("USGS live gauges");
  if (!history) unavailable.push("MO-215 recent levels");
  if (!stats) unavailable.push("USGS normal ranges");
  if (!tideRes) unavailable.push("Shark River tides");

  const L = (site: string, p: string) => latest?.get(`${site}:${p}`);
  const P = (site: string, p: string) => stats?.get(`${site}:${p}`);

  const marsh = buildMarsh(history, L(s.marsh.id, "62611"), today);
  if (!marsh) unavailable.push("MO-215 marsh level");

  const rookery = latest
    ? {
        tempF: reading(L(s.rookery.id, "00010"), P(s.rookery.id, "00010"), cToF),
        salinity: reading(L(s.rookery.id, "00480"), P(s.rookery.id, "00480")),
        flowCfs: reading(L(s.rookery.id, "00060"), P(s.rookery.id, "00060")),
      }
    : null;
  const gunboat = latest ? { netFlowCfs: reading(L(s.gunboat.id, "72137"), P(s.gunboat.id, "72137")) } : null;

  const flamingo = outlook.days[0]?.locations.find((l) => l.id === "flamingo");
  const coastWaterF = flamingo?.waterF ?? null;
  const wind = flamingo?.wind ? { meanKt: flamingo.wind.meanKt, dirName: flamingo.wind.dirName } : null;

  const temps = [rookery?.tempF?.value, coastWaterF].filter((v): v is number => v != null);
  const areas = rateAreas({
    month: monthOf(today),
    marsh: marsh ? { ft: marsh.ft, change14: marsh.change.d14, state: marsh.state } : null,
    coldestWaterF: temps.length ? Math.min(...temps) : null,
    windKt: wind?.meanKt ?? null,
  });

  let tides: SharkConditions["tides"] = null;
  if (tideRes) {
    const noon = noonOf(today);
    const sun = getTimes(new Date(noon), SHARK.lat, SHARK.lon);
    const sunrise = sun.sunrise?.getTime() ?? noon - 5.5 * HOUR;
    const sunset = sun.sunset?.getTime() ?? noon + 5.5 * HOUR;
    const start = startOfDay(today);
    tides = {
      station: tideRes.station,
      extremes: tideRes.extremes.filter((e) => e.t >= start && e.t < start + DAY),
      windows: findWindows(tideRes.extremes, sunrise, sunset, SHARK.fullFlowFtPerHour),
      sunrise,
      sunset,
    };
  }

  return {
    generatedAt: now,
    today,
    season: SHARK.dryMonths.includes(monthOf(today)) ? "dry" : "wet",
    marsh,
    rookery,
    gunboat,
    coastWaterF,
    wind,
    tides,
    areas,
    unavailable,
  };
}

/* ---------- snapshots for the trip log ---------- */

export type SharkSnapshot = {
  takenAt: number;
  forDate: DateKey;
  source: "daily snapshot" | "live";
  areas: Partial<Record<SharkAreaId, { rating: AreaRating; points: number }>>;
  marshFt: number | null;
  marshChange14: number | null;
  marshState: MarshState | null;
  rookeryTempF: number | null;
  rookerySalinity: number | null;
  gunboatNetCfs: number | null;
};

export function compactShark(c: SharkConditions, source: SharkSnapshot["source"]): SharkSnapshot {
  return {
    takenAt: c.generatedAt,
    forDate: c.today,
    source,
    areas: Object.fromEntries(c.areas.map((a) => [a.id, { rating: a.rating, points: a.points }])),
    marshFt: c.marsh?.ft ?? null,
    marshChange14: c.marsh?.change.d14 ?? null,
    marshState: c.marsh?.state ?? null,
    rookeryTempF: c.rookery?.tempF ? Math.round(c.rookery.tempF.value * 10) / 10 : null,
    rookerySalinity: c.rookery?.salinity?.value ?? null,
    gunboatNetCfs: c.gunboat?.netFlowCfs?.value ?? null,
  };
}
