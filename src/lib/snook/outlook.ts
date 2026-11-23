import { getMoonIllumination, getTimes } from "suncalc";
import {
  CONFIDENCE,
  DAYS_SHOWN,
  FRONT,
  LOCATIONS,
  WATER_TEMP,
  type BandLabel,
  type LocationConfig,
  type LocationId,
} from "./config";
import { harvestStatus } from "./regulations";
import {
  compassName,
  inSector,
  rescheduleReason,
  scoreDay,
  type Factor,
  type FishingWindow,
  type FrontSituation,
} from "./score";
import {
  fetchObservations,
  fetchTides,
  fetchWaterTemp,
  fetchWeather,
  type HourlyWeather,
  type ObsPoint,
  type TideExtreme,
} from "./sources";
import { hourlyCurve } from "./tides";
import { addDays, dateKeyOf, HOUR, monthOf, noonOf, startOfDay, type DateKey } from "./time";

/** Everything the page needs, as plain serializable data. */
export type LocationDay = {
  id: LocationId;
  name: string;
  score: number;
  band: BandLabel;
  cap: { maxScore: number; reason: string } | null;
  /** Why the trip may need rescheduling (wind cap or strong gusts), or null. */
  reschedule: string | null;
  factors: Factor[];
  windows: FishingWindow[];
  summary: string;
  tides: TideExtreme[];
  curve: { t: number; ft: number }[];
  rangeFt: number | null;
  wind: { meanKt: number; dir: number | null; dirName: string | null; gustKt: number | null } | null;
  skyPct: number | null;
  rainPct: number | null;
  waterF: number | null;
  waterObserved: boolean;
  sunrise: number;
  sunset: number;
};

export type OutlookDay = {
  key: DateKey;
  lead: number;
  confidence: { plusMinus: number | null; label: string };
  moon: string;
  locations: LocationDay[];
  best: LocationId | null;
};

export type Outlook = {
  generatedAt: number;
  today: DateKey;
  days: OutlookDay[];
  unavailable: string[];
  sources: { location: string; tides: string | null; water: string | null; weather: string | null }[];
  weatherIssuedAt: number | null;
  harvest: { open: boolean; changesOn: DateKey | null };
};

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

/** Vector mean of compass directions, so 350° and 10° average to 0°, not 180°. */
function meanDir(dirs: number[]): number | null {
  if (!dirs.length) return null;
  let x = 0;
  let y = 0;
  for (const d of dirs) {
    x += Math.cos((d * Math.PI) / 180);
    y += Math.sin((d * Math.PI) / 180);
  }
  if (Math.hypot(x, y) / dirs.length < 0.2) return null; // too variable to call
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function moonName(phase: number): string {
  if (phase < 0.03 || phase > 0.97) return "New moon";
  if (phase < 0.22) return "Waxing crescent";
  if (phase < 0.28) return "First quarter";
  if (phase < 0.47) return "Waxing gibbous";
  if (phase < 0.53) return "Full moon";
  if (phase < 0.72) return "Waning gibbous";
  if (phase < 0.78) return "Last quarter";
  return "Waning crescent";
}

type Daily = { meanAirF: number | null; dir: number | null };

/** Daily mean air temp and prevailing wind, from observations (past) and forecast (future). */
function dailySeries(now: number, obs: ObsPoint[] | null, fc: HourlyWeather[] | null) {
  const byDay = new Map<DateKey, { air: number[]; dir: number[] }>();
  const add = (t: number, air: number | null, dir: number | null) => {
    const k = dateKeyOf(t);
    const e = byDay.get(k) ?? { air: [], dir: [] };
    if (air != null) e.air.push(air);
    if (dir != null) e.dir.push(dir);
    byDay.set(k, e);
  };
  for (const o of obs ?? []) if (o.t < now) add(o.t, o.airF, o.windDir);
  for (const h of fc ?? []) if (h.t >= now - HOUR) add(h.t, h.airF, h.windDir);
  const out = new Map<DateKey, Daily>();
  for (const [k, e] of byDay) {
    out.set(k, { meanAirF: e.air.length >= 12 ? mean(e.air) : null, dir: meanDir(e.dir) });
  }
  return out;
}

function isFrontDay(daily: Map<DateKey, Daily>, k: DateKey): boolean {
  const today = daily.get(k);
  const prev = daily.get(addDays(k, -1));
  if (today?.meanAirF == null || prev?.meanAirF == null || today.dir == null) return false;
  return (
    prev.meanAirF - today.meanAirF >= FRONT.tempDropF &&
    inSector(today.dir, FRONT.northSector.from, FRONT.northSector.to)
  );
}

function frontSituation(daily: Map<DateKey, Daily>, k: DateKey): FrontSituation {
  for (let n = 1; n <= 3; n++) {
    if (isFrontDay(daily, addDays(k, -n))) return `after${n}` as FrontSituation;
  }
  if (isFrontDay(daily, k)) return "frontDay";
  if (isFrontDay(daily, addDays(k, 1))) return "dayBefore";
  return "quiet";
}

async function buildLocation(loc: LocationConfig, now: number, today: DateKey, unavailable: string[]) {
  const [tides, weather, obs, water] = await Promise.all([
    fetchTides(loc, addDays(today, -1), addDays(today, DAYS_SHOWN + 1)),
    fetchWeather(loc),
    fetchObservations(loc, now),
    fetchWaterTemp(loc, now),
  ]);
  if (!tides) unavailable.push(`${loc.name} tides`);
  if (!weather) unavailable.push(`${loc.name} weather forecast`);
  if (!water) unavailable.push(`${loc.name} water temp`);
  if (!obs) unavailable.push(`${loc.name} recent weather (front history)`);

  const daily = dailySeries(now, obs, weather?.hours ?? null);
  const weatherDays = CONFIDENCE[1].throughDay; // days 1-7 use weather

  // Forecast water temp: start at the latest reading, relax toward the running mean air temp.
  const waterEst: (number | null)[] = [];
  let t = water?.latest.f ?? null;
  for (let i = 0; i < weatherDays; i++) {
    if (t == null) {
      waterEst.push(null);
      continue;
    }
    if (i > 0) {
      const airs: number[] = [];
      for (let j = i - WATER_TEMP.airMeanDays + 1; j <= i; j++) {
        const a = daily.get(addDays(today, j))?.meanAirF;
        if (a != null) airs.push(a);
      }
      const airMean = daily.get(addDays(today, i))?.meanAirF != null ? mean(airs) : null;
      t = airMean == null ? null : t + WATER_TEMP.relaxPerDay * (airMean - t);
    }
    waterEst.push(t);
  }

  const days = [];
  for (let i = 0; i < DAYS_SHOWN; i++) {
    const key = addDays(today, i);
    const lead = i + 1;
    const outlookOnly = lead > weatherDays;
    const noon = noonOf(key);
    const sun = getTimes(new Date(noon), loc.lat, loc.lon);
    // Always defined at 25°N; the fallbacks only satisfy the types.
    const sunrise = sun.sunrise?.getTime() ?? noon - 5.5 * HOUR;
    const sunset = sun.sunset?.getTime() ?? noon + 5.5 * HOUR;
    const moonPhase = getMoonIllumination(new Date(noon)).phase;
    const dayStart = startOfDay(key);
    const dayEnd = startOfDay(addDays(key, 1));
    const dayExtremes = tides?.extremes.filter((e) => e.t >= dayStart && e.t < dayEnd) ?? [];

    const daylight = (weather?.hours ?? []).filter((h) => h.t >= sunrise - HOUR / 2 && h.t <= sunset);
    const kts = daylight.map((h) => h.windKt).filter((v): v is number => v != null);
    const wind =
      !outlookOnly && kts.length >= 3
        ? (() => {
            const dir = meanDir(daylight.map((h) => h.windDir).filter((v): v is number => v != null));
            const gusts = daylight.map((h) => h.gustKt).filter((v): v is number => v != null);
            return {
              meanKt: mean(kts)!,
              dir,
              dirName: dir == null ? null : compassName(dir),
              gustKt: gusts.length ? Math.max(...gusts) : null,
            };
          })()
        : null;

    const estWaterF = outlookOnly ? null : waterEst[i];
    let waterDrop48F: number | null = null;
    if (estWaterF != null) {
      if (i === 0 && water?.ago48 != null) waterDrop48F = estWaterF - water.ago48;
      else if (i === 1 && water?.ago24 != null) waterDrop48F = estWaterF - water.ago24;
      else if (i >= 2 && waterEst[i - 2] != null) waterDrop48F = estWaterF - waterEst[i - 2]!;
    }

    const hasWeather = !!weather && daily.get(key)?.meanAirF != null;
    const front = outlookOnly || !hasWeather ? null : frontSituation(daily, key);

    const result = scoreDay({
      location: loc.id,
      locationName: loc.name,
      month: monthOf(key),
      outlookOnly,
      sunrise,
      sunset,
      extremes: tides?.extremes ?? null,
      dayExtremes,
      moonPhase,
      estWaterF,
      waterDrop48F,
      wind: wind ? { meanKt: wind.meanKt, dir: wind.dir } : null,
      front,
    });

    const sky = mean(daylight.map((h) => h.sky).filter((v): v is number => v != null));
    const rain = daylight.map((h) => h.pop).filter((v): v is number => v != null);

    const day: LocationDay = {
      id: loc.id,
      name: loc.name,
      score: result.score,
      band: result.band,
      cap: result.cap,
      reschedule: rescheduleReason(wind),
      factors: result.factors,
      windows: result.windows,
      summary: result.summary,
      tides: dayExtremes,
      curve: tides ? hourlyCurve(tides.extremes, dayStart, dayEnd) : [],
      rangeFt: result.rangeFt,
      wind,
      skyPct: outlookOnly || sky == null ? null : Math.round(sky),
      rainPct: outlookOnly || !rain.length ? null : Math.round(Math.max(...rain)),
      waterF: estWaterF == null ? null : Math.round(estWaterF * 10) / 10,
      waterObserved: i === 0 && estWaterF != null,
      sunrise,
      sunset,
    };
    days.push({ day, moonPhase });
  }

  return {
    days,
    issuedAt: weather?.issuedAt ?? null,
    source: {
      location: loc.name,
      tides: tides?.station ?? null,
      water: water?.latest.source ?? null,
      weather: weather ? "National Weather Service" : null,
    },
  };
}

export async function buildOutlook(now = Date.now()): Promise<Outlook> {
  const today = dateKeyOf(now);
  const unavailable: string[] = [];
  const perLoc = await Promise.all(LOCATIONS.map((loc) => buildLocation(loc, now, today, unavailable)));

  const days: OutlookDay[] = [];
  for (let i = 0; i < DAYS_SHOWN; i++) {
    const lead = i + 1;
    const tier = CONFIDENCE.find((c) => lead <= c.throughDay)!;
    const locations = perLoc.map((p) => p.days[i].day);
    const [a, b] = locations;
    const best = a.score === b.score ? null : a.score > b.score ? a.id : b.id;
    days.push({
      key: addDays(today, i),
      lead,
      confidence: { plusMinus: tier.plusMinus, label: tier.label },
      moon: moonName(perLoc[0].days[i].moonPhase),
      locations,
      best,
    });
  }

  const issued = perLoc.map((p) => p.issuedAt).filter((v): v is number => v != null);
  return {
    generatedAt: now,
    today,
    days,
    unavailable,
    sources: perLoc.map((p) => p.source),
    weatherIssuedAt: issued.length ? Math.min(...issued) : null,
    harvest: harvestStatus(today),
  };
}
