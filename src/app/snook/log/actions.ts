"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLoggedIn, LOG_COOKIE, LOG_COOKIE_MAX_AGE, passcodeMatches, sessionToken } from "@/lib/snook/auth";
import {
  BAIT_OPTIONS,
  BANDS,
  CLARITY_OPTIONS,
  CURRENT_OPTIONS,
  LOCATIONS,
  SHARK_AREAS,
  type BandLabel,
  type LocationId,
  type SharkAreaId,
} from "@/lib/snook/config";
import { buildOutlook, type Outlook } from "@/lib/snook/outlook";
import { buildSharkConditions, compactShark } from "@/lib/snook/shark";
import {
  allowLoginAttempt,
  compactOutlook,
  deleteTrip,
  findSharkSnapshot,
  findSnapshotForecast,
  getRedis,
  pickForecast,
  saveTrip,
  type Trip,
  type TripDetail,
} from "@/lib/snook/store";
import { addDays, dateKeyOf } from "@/lib/snook/time";

export type FormState = { ok?: string; error?: string };

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const redis = getRedis();
  if (!redis) return { error: "Storage isn't connected yet." };
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!(await allowLoginAttempt(redis, ip))) return { error: "Too many tries. Wait 15 minutes and try again." };
  const attempt = String(fd.get("passcode") ?? "");
  if (!passcodeMatches(attempt)) return { error: "That passcode didn't match." };
  (await cookies()).set(LOG_COOKIE, sessionToken(process.env.SNOOK_LOG_PASSCODE!), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/snook",
    maxAge: LOG_COOKIE_MAX_AGE,
  });
  redirect("/snook/log");
}

export async function logout(): Promise<void> {
  (await cookies()).delete({ name: LOG_COOKIE, path: "/snook" });
  redirect("/snook/log");
}

const BAND_LABELS = BANDS.map((b) => b.label) as string[];
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export async function addTrip(_prev: FormState, fd: FormData): Promise<FormState> {
  const redis = getRedis();
  if (!redis) return { error: "Storage isn't connected yet." };
  if (!(await isLoggedIn())) return { error: "Your sign-in expired. Reload and enter the passcode again." };

  const today = dateKeyOf(Date.now());
  const date = String(fd.get("date") ?? "");
  const location = String(fd.get("location") ?? "") as LocationId;
  const startTime = String(fd.get("startTime") ?? "");
  const endTime = String(fd.get("endTime") ?? "");
  const snookRaw = String(fd.get("snook") ?? "").trim();
  const bite = String(fd.get("bite") ?? "") as BandLabel;
  const otherCatch = String(fd.get("otherCatch") ?? "").trim().slice(0, 200);
  const notes = String(fd.get("notes") ?? "").trim().slice(0, 2000);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date > addDays(today, 1)) return { error: "Pick the trip date (today or earlier)." };
  if (!LOCATIONS.some((l) => l.id === location)) return { error: "Pick Flamingo, Chokoloskee, or Lostmans." };
  if ((startTime && !TIME_RE.test(startTime)) || (endTime && !TIME_RE.test(endTime))) return { error: "Times look off." };
  const snook = Number(snookRaw);
  if (snookRaw === "" || !Number.isInteger(snook) || snook < 0 || snook > 500) return { error: "Enter how many snook (0 is fine)." };
  if (!BAND_LABELS.includes(bite)) return { error: "Pick how the bite was." };

  const pick = <T extends string>(name: string, options: readonly T[]): T | "" => {
    const v = String(fd.get(name) ?? "");
    return (options as readonly string[]).includes(v) ? (v as T) : "";
  };
  const text = (name: string, max: number) => String(fd.get(name) ?? "").trim().slice(0, max);
  const areaRaw = String(fd.get("sharkArea") ?? "");
  const sharkArea = SHARK_AREAS.some((a) => a.id === areaRaw) ? (areaRaw as SharkAreaId) : null;
  const detail: TripDetail = {
    sharkArea,
    sizes: text("sizes", 100),
    current: pick("current", CURRENT_OPTIONS),
    bait: pick("bait", BAIT_OPTIONS),
    clarity: pick("clarity", CLARITY_OPTIONS),
    lures: text("lures", 200),
    blanks: text("blanks", 300),
  };

  // The forecast as it stood before the trip; fall back to today's live outlook.
  let live: Outlook | null = null;
  let forecast = await findSnapshotForecast(redis, date, location);
  if (!forecast && date >= today) {
    live = await buildOutlook();
    forecast = pickForecast(compactOutlook(live), date, location, "live");
  }

  // Shark River conditions for that date: the morning snapshot, or live if the trip is today.
  let shark = sharkArea ? await findSharkSnapshot(redis, date) : null;
  if (sharkArea && !shark && date >= today) {
    live ??= await buildOutlook();
    shark = compactShark(await buildSharkConditions(live), "live");
  }

  const trip: Trip = {
    id: randomUUID(),
    createdAt: Date.now(),
    date,
    location,
    startTime,
    endTime,
    snook,
    bite,
    otherCatch,
    notes,
    forecast,
    detail,
    shark,
  };
  await saveTrip(redis, trip);
  revalidatePath("/snook/log");
  const areaRating = sharkArea ? shark?.areas[sharkArea]?.rating : undefined;
  const areaName = SHARK_AREAS.find((a) => a.id === sharkArea)?.name;
  return {
    ok:
      (forecast
        ? `Saved. The forecast for that day was ${forecast.score} (${forecast.band}).`
        : "Saved. No forecast was on file for that date.") +
      (areaName ? (areaRating ? ` ${areaName} was rated ${areaRating}.` : ` No Shark River rating was on file for that date.`) : ""),
  };
}

export async function removeTrip(fd: FormData): Promise<void> {
  const redis = getRedis();
  if (!redis || !(await isLoggedIn())) return;
  const id = String(fd.get("id") ?? "");
  if (!/^[0-9a-f-]{36}$/.test(id)) return;
  await deleteTrip(redis, id);
  revalidatePath("/snook/log");
}
