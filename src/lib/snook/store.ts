import { Redis } from "@upstash/redis";
import type { BAIT_OPTIONS, BandLabel, CLARITY_OPTIONS, CURRENT_OPTIONS, LocationId, SharkAreaId } from "./config";
import type { Outlook } from "./outlook";
import type { SharkSnapshot } from "./shark";
import { addDays, type DateKey } from "./time";

/**
 * Trip log storage on Upstash Redis (Vercel Marketplace, free tier).
 * The Vercel integration sets KV_REST_API_URL / KV_REST_API_TOKEN; a
 * direct Upstash setup uses UPSTASH_REDIS_REST_URL / _TOKEN. Either works.
 * With neither set, getRedis() returns null and the log says
 * "storage not connected" while the rest of /snook keeps working.
 */
export function getRedis(): Redis | null {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const KEYS = {
  tripIndex: "snook:trips", // sorted set: member = trip id, score = trip date (ms)
  trip: (id: string) => `snook:trip:${id}`,
  snapshot: (date: DateKey) => `snook:snapshot:${date}`,
  shark: (date: DateKey) => `snook:shark:${date}`,
  loginAttempts: (ip: string) => `snook:login:${ip}`,
};

/** Keep daily snapshots about 13 months, enough for a season-over-season look. */
const SNAPSHOT_TTL_SECONDS = 400 * 86400;

/** One location's forecast for one day, as stored with a trip and in snapshots. */
export type ForecastSnapshot = {
  source: "daily snapshot" | "live";
  takenAt: number;
  forDate: DateKey;
  lead: number;
  confidence: string;
  score: number;
  band: BandLabel;
  factors: { key: string; label: string; earned: number | null; delta: number | null }[];
  windows: { start: number; end: number }[];
  waterF: number | null;
  wind: { meanKt: number; dirName: string | null; gustKt: number | null } | null;
  reschedule: string | null;
  cap: string | null;
};

export type Trip = {
  id: string;
  createdAt: number;
  date: DateKey;
  location: LocationId;
  startTime: string;
  endTime: string;
  snook: number;
  bite: BandLabel;
  otherCatch: string;
  notes: string;
  forecast: ForecastSnapshot | null;
  /** Added with the Shark River page (Nov 2026); older trips don't have these. */
  detail?: TripDetail;
  /** Shark River conditions for the trip date, saved when a Shark River area is picked. */
  shark?: SharkSnapshot | null;
};

export type TripDetail = {
  sharkArea: SharkAreaId | null;
  sizes: string;
  current: (typeof CURRENT_OPTIONS)[number] | "";
  bait: (typeof BAIT_OPTIONS)[number] | "";
  clarity: (typeof CLARITY_OPTIONS)[number] | "";
  lures: string;
  blanks: string;
};

type StoredDay = { key: DateKey; lead: number; confidence: string; locations: Record<LocationId, Omit<ForecastSnapshot, "source" | "takenAt" | "forDate" | "lead" | "confidence">> };
export type StoredSnapshot = { takenAt: number; today: DateKey; days: StoredDay[] };

/** Strip an outlook down to what a trip comparison needs. */
export function compactOutlook(o: Outlook): StoredSnapshot {
  return {
    takenAt: o.generatedAt,
    today: o.today,
    days: o.days.map((d) => ({
      key: d.key,
      lead: d.lead,
      confidence: d.confidence.label,
      locations: Object.fromEntries(
        d.locations.map((l) => [
          l.id,
          {
            score: l.score,
            band: l.band,
            factors: l.factors.map((f) => ({ key: f.key, label: f.label, earned: f.earned, delta: f.delta })),
            windows: l.windows.map((w) => ({ start: w.start, end: w.end })),
            waterF: l.waterF,
            wind: l.wind ? { meanKt: l.wind.meanKt, dirName: l.wind.dirName, gustKt: l.wind.gustKt } : null,
            reschedule: l.reschedule,
            cap: l.cap ? `${l.cap.maxScore}: ${l.cap.reason}` : null,
          },
        ]),
      ) as StoredDay["locations"],
    })),
  };
}

export function pickForecast(
  snap: StoredSnapshot,
  date: DateKey,
  location: LocationId,
  source: ForecastSnapshot["source"],
): ForecastSnapshot | null {
  const day = snap.days.find((d) => d.key === date);
  const loc = day?.locations[location];
  if (!day || !loc) return null;
  return { source, takenAt: snap.takenAt, forDate: date, lead: day.lead, confidence: day.confidence, ...loc };
}

export async function saveSnapshot(redis: Redis, o: Outlook): Promise<void> {
  await redis.set(KEYS.snapshot(o.today), compactOutlook(o), { ex: SNAPSHOT_TTL_SECONDS });
}

/**
 * The forecast as it stood before the trip: the snapshot taken that
 * morning if there is one, else the most recent earlier snapshot that
 * covered the date.
 */
export async function findSnapshotForecast(
  redis: Redis,
  date: DateKey,
  location: LocationId,
): Promise<ForecastSnapshot | null> {
  for (let back = 0; back < 14; back++) {
    const snap = await redis.get<StoredSnapshot>(KEYS.snapshot(addDays(date, -back)));
    if (!snap) continue;
    const f = pickForecast(snap, date, location, "daily snapshot");
    if (f) return f;
  }
  return null;
}

export async function saveSharkSnapshot(redis: Redis, snap: SharkSnapshot): Promise<void> {
  await redis.set(KEYS.shark(snap.forDate), snap, { ex: SNAPSHOT_TTL_SECONDS });
}

/** Shark River conditions saved that morning (hydrology for that date only). */
export async function findSharkSnapshot(redis: Redis, date: DateKey): Promise<SharkSnapshot | null> {
  return (await redis.get<SharkSnapshot>(KEYS.shark(date))) ?? null;
}

export async function saveTrip(redis: Redis, trip: Trip): Promise<void> {
  const [y, m, d] = trip.date.split("-").map(Number);
  await redis.set(KEYS.trip(trip.id), trip);
  await redis.zadd(KEYS.tripIndex, { score: Date.UTC(y, m - 1, d), member: trip.id });
}

export async function listTrips(redis: Redis): Promise<Trip[]> {
  const ids = await redis.zrange<string[]>(KEYS.tripIndex, 0, -1, { rev: true });
  if (!ids.length) return [];
  const trips = await redis.mget<(Trip | null)[]>(...ids.map(KEYS.trip));
  return trips.filter((t): t is Trip => !!t);
}

export async function deleteTrip(redis: Redis, id: string): Promise<void> {
  await redis.del(KEYS.trip(id));
  await redis.zrem(KEYS.tripIndex, id);
}

/** Simple login throttle: true if this IP is still under the limit. */
export async function allowLoginAttempt(redis: Redis, ip: string): Promise<boolean> {
  const key = KEYS.loginAttempts(ip);
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 15 * 60);
  return n <= 10;
}
