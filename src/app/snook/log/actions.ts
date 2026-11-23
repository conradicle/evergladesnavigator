"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLoggedIn, LOG_COOKIE, LOG_COOKIE_MAX_AGE, passcodeMatches, sessionToken } from "@/lib/snook/auth";
import { BANDS, LOCATIONS, type BandLabel, type LocationId } from "@/lib/snook/config";
import { buildOutlook } from "@/lib/snook/outlook";
import {
  allowLoginAttempt,
  compactOutlook,
  deleteTrip,
  findSnapshotForecast,
  getRedis,
  pickForecast,
  saveTrip,
  type Trip,
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
  if (!LOCATIONS.some((l) => l.id === location)) return { error: "Pick Flamingo or Chokoloskee." };
  if ((startTime && !TIME_RE.test(startTime)) || (endTime && !TIME_RE.test(endTime))) return { error: "Times look off." };
  const snook = Number(snookRaw);
  if (snookRaw === "" || !Number.isInteger(snook) || snook < 0 || snook > 500) return { error: "Enter how many snook (0 is fine)." };
  if (!BAND_LABELS.includes(bite)) return { error: "Pick how the bite was." };

  // The forecast as it stood before the trip; fall back to today's live outlook.
  let forecast = await findSnapshotForecast(redis, date, location);
  if (!forecast && date >= today) {
    const live = await buildOutlook();
    forecast = pickForecast(compactOutlook(live), date, location, "live");
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
  };
  await saveTrip(redis, trip);
  revalidatePath("/snook/log");
  return {
    ok: forecast
      ? `Saved. The forecast for that day was ${forecast.score} (${forecast.band}).`
      : "Saved. No forecast was on file for that date.",
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
