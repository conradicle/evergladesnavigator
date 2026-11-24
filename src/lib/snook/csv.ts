import { FACTOR_LABELS, LOCATIONS, SHARK_AREAS, type FactorKey } from "./config";
import type { Trip } from "./store";

/**
 * Quote a CSV cell. Cells that start with = + - @ (or tab/CR) are prefixed
 * with ' so a spreadsheet won't run them as formulas.
 */
export function csvCell(v: string | number | null | undefined): string {
  if (v == null) return "";
  // Real numbers (like a negative marsh change) can't carry a formula; leave them numeric.
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const FACTOR_KEYS = Object.keys(FACTOR_LABELS) as FactorKey[];

export function tripsToCsv(trips: Trip[]): string {
  const header = [
    "date",
    "location",
    "start",
    "end",
    "snook_caught",
    "actual_bite",
    "predicted_score",
    "predicted_band",
    "confidence",
    "forecast_source",
    "forecast_taken_at_utc",
    "water_f",
    "wind_kt",
    "wind_dir",
    "gust_kt",
    "reschedule_flag",
    ...FACTOR_KEYS.map((k) => `factor_${k}`),
    "other_catch",
    "notes",
    "shark_area",
    "shark_area_rating",
    "shark_area_points",
    "shark_source",
    "marsh_mo215_ft",
    "marsh_change_14d_ft",
    "marsh_state",
    "rookery_water_f",
    "rookery_salinity_ppt",
    "gunboat_net_flow_cfs",
    "snook_sizes",
    "current",
    "bait",
    "clarity",
    "lures",
    "blank_spots",
  ];
  const rows = trips.map((t) => {
    const f = t.forecast;
    const d = t.detail;
    const s = t.shark;
    const area = SHARK_AREAS.find((a) => a.id === d?.sharkArea);
    const areaRating = area ? s?.areas[area.id] : undefined;
    const factor = (k: FactorKey) => {
      const e = f?.factors.find((x) => x.key === k)?.earned;
      return e == null ? "" : e.toFixed(1);
    };
    return [
      t.date,
      LOCATIONS.find((l) => l.id === t.location)?.name ?? t.location,
      t.startTime,
      t.endTime,
      t.snook,
      t.bite,
      f?.score ?? "",
      f?.band ?? "",
      f?.confidence ?? "",
      f?.source ?? "",
      f ? new Date(f.takenAt).toISOString() : "",
      f?.waterF ?? "",
      f?.wind ? Math.round(f.wind.meanKt) : "",
      f?.wind?.dirName ?? "",
      f?.wind?.gustKt != null ? Math.round(f.wind.gustKt) : "",
      f?.reschedule ?? "",
      ...FACTOR_KEYS.map(factor),
      t.otherCatch,
      t.notes,
      area?.name ?? "",
      areaRating?.rating ?? "",
      areaRating?.points ?? "",
      s?.source ?? "",
      s?.marshFt ?? "",
      s?.marshChange14 ?? "",
      s?.marshState ?? "",
      s?.rookeryTempF ?? "",
      s?.rookerySalinity ?? "",
      s?.gunboatNetCfs ?? "",
      d?.sizes ?? "",
      d?.current ?? "",
      d?.bait ?? "",
      d?.clarity ?? "",
      d?.lures ?? "",
      d?.blanks ?? "",
    ];
  });
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
