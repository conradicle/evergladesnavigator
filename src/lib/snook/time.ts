import { TIME_ZONE } from "./config";

/** Calendar date in the Everglades time zone, as "YYYY-MM-DD". */
export type DateKey = string;

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function zonedParts(ms: number) {
  const p: Record<string, number> = {};
  for (const { type, value } of partsFmt.formatToParts(new Date(ms))) {
    if (type !== "literal") p[type] = Number(value);
  }
  return p as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

/** Offset of local Everglades time from UTC at an instant, in minutes (e.g. -300). */
function offsetMinutes(ms: number): number {
  const p = zonedParts(ms);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

/** Local Everglades wall-clock time to a UTC timestamp (ms). */
export function zonedToUtc(y: number, mo: number, d: number, h = 0, mi = 0): number {
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  let ms = guess - offsetMinutes(guess) * 60000;
  // Second pass settles DST edges.
  ms = guess - offsetMinutes(ms) * 60000;
  return ms;
}

/** Parse NOAA "YYYY-MM-DD HH:MM" local (lst_ldt) time. */
export function parseNoaaLocal(t: string): number {
  const [date, time] = t.split(" ");
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  return zonedToUtc(y, mo, d, h, mi);
}

export function dateKeyOf(ms: number): DateKey {
  const p = zonedParts(ms);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function localHour(ms: number): number {
  const p = zonedParts(ms);
  return p.hour + p.minute / 60;
}

export function monthOf(key: DateKey): number {
  return Number(key.slice(5, 7));
}

/** Local midnight (as UTC ms) for a date key. */
export function startOfDay(key: DateKey): number {
  const [y, mo, d] = key.split("-").map(Number);
  return zonedToUtc(y, mo, d);
}

export function addDays(key: DateKey, n: number): DateKey {
  const [y, mo, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d + n));
  return dt.toISOString().slice(0, 10);
}

/** Noon local, handy for sun and moon lookups. */
export function noonOf(key: DateKey): number {
  const [y, mo, d] = key.split("-").map(Number);
  return zonedToUtc(y, mo, d, 12);
}

export const HOUR = 3600_000;
export const MINUTE = 60_000;
export const DAY = 86400_000;
