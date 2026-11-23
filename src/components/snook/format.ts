import { TIME_ZONE, type BandLabel } from "@/lib/snook/config";

/**
 * Formatting built from Intl parts (not toLocaleString) so the server and
 * the phone render identical strings and hydration never mismatches.
 */

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

function parts(fmt: Intl.DateTimeFormat, ms: number) {
  const p: Record<string, string> = {};
  for (const { type, value } of fmt.formatToParts(new Date(ms))) p[type] = value;
  return p;
}

/** "7:15 AM" */
export function fmtTime(ms: number): string {
  const p = parts(timeFmt, ms);
  return `${p.hour}:${p.minute} ${p.dayPeriod.toUpperCase()}`;
}

/** "7:15 to 9:45 AM", or "11:30 AM to 2:00 PM" */
export function fmtRange(a: number, b: number): string {
  const pa = parts(timeFmt, a);
  const pb = parts(timeFmt, b);
  const end = `${pb.hour}:${pb.minute} ${pb.dayPeriod.toUpperCase()}`;
  return pa.dayPeriod === pb.dayPeriod
    ? `${pa.hour}:${pa.minute} to ${end}`
    : `${pa.hour}:${pa.minute} ${pa.dayPeriod.toUpperCase()} to ${end}`;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Date keys are plain calendar dates, so weekday math in UTC is exact. */
function keyParts(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return { y, m, d, wd: new Date(Date.UTC(y, m - 1, d)).getUTCDay() };
}

export const shortWeekday = (key: string) => WEEKDAYS[keyParts(key).wd];
export const dayOfMonth = (key: string) => keyParts(key).d;
export const shortMonth = (key: string) => MONTHS[keyParts(key).m - 1];
export function longDate(key: string): string {
  const { m, d, wd } = keyParts(key);
  return `${WEEKDAYS_LONG[wd]}, ${MONTHS_LONG[m - 1]} ${d}`;
}
export function shortDate(key: string): string {
  const { m, d } = keyParts(key);
  return `${MONTHS[m - 1]} ${d}`;
}

/** Today's date key on the phone, in Everglades time. */
export function clientTodayKey(): string {
  const p = parts(
    new Intl.DateTimeFormat("en-US", { timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }),
    Date.now(),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * Blue (poor) to orange (great). Never red/green. Always shown with the
 * text label, never as the only signal.
 */
export const BAND_COLORS: Record<BandLabel, { swatch: string; tint: string }> = {
  Tough: { swatch: "#2f5f8a", tint: "#e3ecf4" },
  Fair: { swatch: "#8db4d6", tint: "#eef4f9" },
  Good: { swatch: "#f0b25e", tint: "#fbf0dc" },
  Excellent: { swatch: "#d9692a", tint: "#f8e3d3" },
};

export const POSITIVE_COLOR = "#d9692a";
export const NEGATIVE_COLOR = "#2f5f8a";

export function signed(n: number): string {
  const r = Math.round(n * 10) / 10;
  if (r === 0) return "0";
  return r > 0 ? `+${r}` : `−${Math.abs(r)}`;
}
