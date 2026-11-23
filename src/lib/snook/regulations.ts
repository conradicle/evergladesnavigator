import { REGULATIONS } from "./config";
import { addDays, type DateKey } from "./time";

const md = (m: number, d: number) => m * 100 + d;

/** Is snook harvest closed on this date (FWC Southwest region)? */
export function isHarvestClosed(key: DateKey): boolean {
  const m = Number(key.slice(5, 7));
  const d = Number(key.slice(8, 10));
  const today = md(m, d);
  return REGULATIONS.closedSeasons.some(({ start, end }) => {
    const s = md(start[0], start[1]);
    const e = md(end[0], end[1]);
    return s <= e ? today >= s && today <= e : today >= s || today <= e;
  });
}

/** Status for today plus the next date it flips. */
export function harvestStatus(today: DateKey): { open: boolean; changesOn: DateKey | null } {
  const open = !isHarvestClosed(today);
  for (let i = 1; i <= 366; i++) {
    const k = addDays(today, i);
    if (!isHarvestClosed(k) !== open) return { open, changesOn: k };
  }
  return { open, changesOn: null };
}
