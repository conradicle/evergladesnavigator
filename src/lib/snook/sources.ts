import {
  CACHE_SECONDS,
  NWS_APP_NAME,
  POINTS_CACHE_SECONDS,
  WATER_TEMP,
  type LocationConfig,
} from "./config";
import { HOUR, parseNoaaLocal, type DateKey } from "./time";

/**
 * Server-side fetchers for the public forecast feeds. Each one returns null
 * (never throws) when a source is down, so the page can render what it has.
 */

export type TideExtreme = { t: number; ft: number; type: "H" | "L" };
export type HourlyWeather = {
  t: number; // start of hour, UTC ms
  airF: number | null;
  windKt: number | null;
  windDir: number | null;
  gustKt: number | null;
  sky: number | null;
  pop: number | null;
};
export type WaterReading = { f: number; t: number; source: string };
export type ObsPoint = { t: number; airF: number | null; windDir: number | null };

const COOPS = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const NOAA_APP = "everglades_navigator";

function nwsHeaders(): HeadersInit {
  const contact = process.env.NWS_CONTACT_EMAIL;
  return {
    "User-Agent": contact ? `${NWS_APP_NAME} (${contact})` : NWS_APP_NAME,
    Accept: "application/geo+json",
  };
}

async function getJson<T>(url: string, init: RequestInit & { next?: { revalidate: number } }): Promise<T | null> {
  try {
    const res = await fetch(url, { ...init, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function getText(url: string, revalidate: number): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

const yyyymmdd = (k: DateKey) => k.replaceAll("-", "");

/** High/low tide predictions. Tries each configured station in order. */
export async function fetchTides(
  loc: Pick<LocationConfig, "tideStations">,
  from: DateKey,
  to: DateKey,
): Promise<{ extremes: TideExtreme[]; station: string } | null> {
  for (const st of loc.tideStations) {
    const url =
      `${COOPS}?product=predictions&station=${st.id}&begin_date=${yyyymmdd(from)}&end_date=${yyyymmdd(to)}` +
      `&datum=MLLW&interval=hilo&units=english&time_zone=lst_ldt&format=json&application=${NOAA_APP}`;
    const json = await getJson<{ predictions?: { t: string; v: string; type: "H" | "L" }[] }>(url, {
      next: { revalidate: CACHE_SECONDS },
    });
    const preds = json?.predictions;
    if (preds && preds.length > 4) {
      return {
        station: `${st.name} (${st.id})`,
        extremes: preds.map((p) => ({ t: parseNoaaLocal(p.t), ft: Number(p.v), type: p.type })),
      };
    }
  }
  return null;
}

type GridSeries = { uom?: string; values: { validTime: string; value: number | null }[] };

/** Expand NWS "2026-11-23T16:00:00+00:00/PT2H" entries into an hour -> value map. */
function expandSeries(series: GridSeries | undefined, convert: (v: number) => number): Map<number, number> {
  const out = new Map<number, number>();
  if (!series) return out;
  for (const { validTime, value } of series.values) {
    if (value == null) continue;
    const [start, dur] = validTime.split("/");
    const t0 = Date.parse(start);
    const m = /P(?:(\d+)D)?T?(?:(\d+)H)?/.exec(dur);
    const hours = m ? Number(m[1] ?? 0) * 24 + Number(m[2] ?? 0) : 1;
    for (let i = 0; i < Math.max(1, hours); i++) out.set(t0 + i * HOUR, convert(value));
  }
  return out;
}

const cToF = (c: number) => (c * 9) / 5 + 32;
const kmhToKt = (k: number) => k / 1.852;

/** Hourly NWS forecast grid (about 7 days). */
export async function fetchWeather(
  loc: LocationConfig,
): Promise<{ hours: HourlyWeather[]; issuedAt: number | null } | null> {
  const point = await getJson<{ properties?: { forecastGridData?: string } }>(
    `https://api.weather.gov/points/${loc.lat},${loc.lon}`,
    { headers: nwsHeaders(), next: { revalidate: POINTS_CACHE_SECONDS } },
  );
  const gridUrl = point?.properties?.forecastGridData;
  if (!gridUrl) return null;
  const grid = await getJson<{ properties?: Record<string, GridSeries | string> }>(gridUrl, {
    headers: nwsHeaders(),
    next: { revalidate: CACHE_SECONDS },
  });
  const p = grid?.properties;
  if (!p) return null;
  const s = (k: string) => p[k] as GridSeries | undefined;
  const temp = expandSeries(s("temperature"), cToF);
  const wind = expandSeries(s("windSpeed"), kmhToKt);
  const dir = expandSeries(s("windDirection"), (v) => v);
  const gust = expandSeries(s("windGust"), kmhToKt);
  const sky = expandSeries(s("skyCover"), (v) => v);
  const pop = expandSeries(s("probabilityOfPrecipitation"), (v) => v);
  const times = [...temp.keys()].sort((a, b) => a - b);
  if (times.length < 24) return null;
  const hours = times.map((t) => ({
    t,
    airF: temp.get(t) ?? null,
    windKt: wind.get(t) ?? null,
    windDir: dir.get(t) ?? null,
    gustKt: gust.get(t) ?? null,
    sky: sky.get(t) ?? null,
    pop: pop.get(t) ?? null,
  }));
  const updated = typeof p.updateTime === "string" ? Date.parse(p.updateTime) : NaN;
  return { hours, issuedAt: Number.isFinite(updated) ? updated : null };
}

/** Last ~4 days of observed air temp and wind direction, for fronts that already passed. */
export async function fetchObservations(loc: LocationConfig, now: number): Promise<ObsPoint[] | null> {
  // Round the start to the hour so the cached URL is stable within the hour.
  const start = new Date(Math.floor((now - 4 * 24 * HOUR) / HOUR) * HOUR).toISOString().slice(0, 19) + "Z";
  const json = await getJson<{
    features?: { properties: { timestamp: string; temperature?: { value: number | null }; windDirection?: { value: number | null } } }[];
  }>(`https://api.weather.gov/stations/${loc.obsStation}/observations?start=${start}`, {
    headers: nwsHeaders(),
    next: { revalidate: CACHE_SECONDS },
  });
  if (!json?.features?.length) return null;
  return json.features.map(({ properties: o }) => ({
    t: Date.parse(o.timestamp),
    airF: o.temperature?.value != null ? cToF(o.temperature.value) : null,
    windDir: o.windDirection?.value ?? null,
  }));
}

/**
 * Parse an NDBC realtime2 standard met file. Returns WTMP readings (°F),
 * newest first. Missing values are "MM".
 */
function parseNdbc(text: string): { t: number; f: number }[] {
  const lines = text.split("\n");
  const header = lines[0]?.replace(/^#/, "").trim().split(/\s+/) ?? [];
  const wi = header.indexOf("WTMP");
  if (wi < 0) return [];
  const out: { t: number; f: number }[] = [];
  for (const line of lines) {
    if (!line || line.startsWith("#")) continue;
    const c = line.trim().split(/\s+/);
    if (c[wi] === "MM" || c[wi] == null) continue;
    const t = Date.UTC(+c[0], +c[1] - 1, +c[2], +c[3], +c[4]);
    out.push({ t, f: cToF(Number(c[wi])) });
  }
  return out;
}

/**
 * Latest observed water temp and the reading closest to 24h and 48h before it.
 * Picks the nearest NDBC station with a fresh reading, then falls back to
 * CO-OPS (latest only, no history).
 */
export async function fetchWaterTemp(
  loc: LocationConfig,
  now: number,
): Promise<{ latest: WaterReading; ago24: number | null; ago48: number | null } | null> {
  const maxAge = WATER_TEMP.maxObsAgeHours * HOUR;
  for (const st of loc.ndbcStations) {
    const text = await getText(`https://www.ndbc.noaa.gov/data/realtime2/${st.id}.txt`, CACHE_SECONDS);
    if (!text) continue;
    const rows = parseNdbc(text);
    const latest = rows[0];
    if (!latest || now - latest.t > maxAge) continue;
    const near = (target: number) => {
      let best: { t: number; f: number } | null = null;
      for (const r of rows) if (!best || Math.abs(r.t - target) < Math.abs(best.t - target)) best = r;
      return best && Math.abs(best.t - target) < 3 * HOUR ? best.f : null;
    };
    return {
      latest: { f: latest.f, t: latest.t, source: `${st.name} (NDBC ${st.id})` },
      ago24: near(latest.t - 24 * HOUR),
      ago48: near(latest.t - 48 * HOUR),
    };
  }
  for (const st of loc.coopsWaterStations) {
    const json = await getJson<{ data?: { t: string; v: string }[] }>(
      `${COOPS}?product=water_temperature&station=${st.id}&date=latest&units=english&time_zone=lst_ldt&format=json&application=${NOAA_APP}`,
      { next: { revalidate: CACHE_SECONDS } },
    );
    const d = json?.data?.[0];
    if (!d) continue;
    const t = parseNoaaLocal(d.t);
    if (now - t > maxAge) continue;
    return { latest: { f: Number(d.v), t, source: `${st.name} (CO-OPS ${st.id})` }, ago24: null, ago48: null };
  }
  return null;
}
