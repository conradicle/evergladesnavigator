import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { DeleteTripButton, LoginForm, TripForm } from "@/components/snook/log/LogForms";
import { BAND_COLORS, shortDate } from "@/components/snook/format";
import { isLoggedIn, passcodeConfigured } from "@/lib/snook/auth";
import { BANDS, LOCATIONS, type BandLabel } from "@/lib/snook/config";
import { getRedis, listTrips, type Trip } from "@/lib/snook/store";
import { todayKey } from "@/lib/snook/time";
import { logout } from "./actions";

export const metadata: Metadata = {
  title: "Trip Log | Snook Outlook",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

const BAND_ORDER = [...BANDS].reverse().map((b) => b.label) as BandLabel[];

function comparison(t: Trip): string {
  if (!t.forecast) return "No forecast on file";
  const diff = BAND_ORDER.indexOf(t.bite) - BAND_ORDER.indexOf(t.forecast.band);
  if (diff === 0) return "Matched";
  const n = Math.abs(diff);
  return `${diff > 0 ? "Better" : "Worse"} than forecast by ${n} band${n > 1 ? "s" : ""}`;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 pt-5 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-swamp-950">Trip Log</h1>
        <Link href="/snook" className="text-sm font-semibold text-sunset-700 underline underline-offset-2">
          Back to outlook
        </Link>
      </div>
      {children}
    </div>
  );
}

export default async function TripLogPage() {
  // Per request: storage and passcode come from runtime env vars, and the
  // sign-in cookie decides what shows. Never prerender this page.
  await connection();
  const redis = getRedis();
  if (!redis) {
    return (
      <Shell>
        <div role="status" className="mt-5 rounded-2xl border border-swamp-800/20 bg-[#fffdf7] p-5">
          <p className="font-display text-lg font-semibold text-swamp-950">Storage not connected</p>
          <p className="mt-2 text-sm text-swamp-800">
            The trip log saves to an Upstash Redis database, and this site isn&apos;t connected to one yet. Connect
            Upstash for Redis to this project in Vercel (Storage tab), then redeploy. The bite outlook works without it.
          </p>
        </div>
      </Shell>
    );
  }
  if (!passcodeConfigured()) {
    return (
      <Shell>
        <div role="status" className="mt-5 rounded-2xl border border-swamp-800/20 bg-[#fffdf7] p-5">
          <p className="font-display text-lg font-semibold text-swamp-950">Passcode not set</p>
          <p className="mt-2 text-sm text-swamp-800">
            Add a SNOOK_LOG_PASSCODE environment variable in Vercel, then redeploy.
          </p>
        </div>
      </Shell>
    );
  }
  if (!(await isLoggedIn())) {
    return (
      <Shell>
        <p className="mt-3 text-sm text-swamp-800">Enter the passcode to log trips and see past results.</p>
        <LoginForm />
      </Shell>
    );
  }

  let trips: Trip[] = [];
  let loadError = false;
  try {
    trips = await listTrips(redis);
  } catch {
    loadError = true;
  }
  const withForecast = trips.filter((t) => t.forecast);
  const matched = withForecast.filter((t) => comparison(t) === "Matched").length;
  const withinOne = withForecast.filter((t) => {
    const d = BAND_ORDER.indexOf(t.bite) - BAND_ORDER.indexOf(t.forecast!.band);
    return Math.abs(d) <= 1;
  }).length;

  return (
    <Shell>
      <section aria-labelledby="new-trip" className="mt-5 rounded-2xl border border-swamp-800/10 bg-[#fffdf7] p-4 sm:p-5">
        <h2 id="new-trip" className="font-display text-lg font-semibold text-swamp-950">
          Log a trip
        </h2>
        <p className="mb-4 mt-1 text-xs text-swamp-700">
          Saving attaches the forecast for that day and spot, as it stood that morning.
        </p>
        <TripForm today={todayKey()} />
      </section>

      <section aria-labelledby="past-trips" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="past-trips" className="font-display text-lg font-semibold text-swamp-950">
            Past trips
          </h2>
          {trips.length > 0 && (
            <a href="/snook/log/export.csv" className="text-sm font-semibold text-sunset-700 underline underline-offset-2">
              Download CSV
            </a>
          )}
        </div>
        {loadError && <p className="mt-2 text-sm text-swamp-800">Couldn&apos;t load trips right now. Try again shortly.</p>}
        {withForecast.length > 0 && (
          <p className="mt-1 text-sm text-swamp-800">
            {withForecast.length} trip{withForecast.length > 1 ? "s" : ""} with a forecast: {matched} matched the
            forecast label, {withinOne} within one label.
          </p>
        )}
        {trips.length === 0 && !loadError ? (
          <p className="mt-2 text-sm text-swamp-700">No trips logged yet.</p>
        ) : (
          <div className="-mx-4 mt-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-swamp-800/20 text-xs uppercase tracking-wide text-swamp-700">
                  <th scope="col" className="py-2 pr-3 font-semibold">Date</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Spot</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Predicted</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Actual</th>
                  <th scope="col" className="py-2 pr-3 font-semibold">Notes</th>
                  <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {trips.map((t) => (
                  <tr key={t.id} className="border-b border-swamp-800/10 align-top">
                    <td className="py-2 pr-3 whitespace-nowrap text-ink-900">{shortDate(t.date)}</td>
                    <td className="py-2 pr-3 text-ink-900">{LOCATIONS.find((l) => l.id === t.location)?.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">
                      {t.forecast ? (
                        <BandText score={t.forecast.score} band={t.forecast.band} />
                      ) : (
                        <span className="text-swamp-700">None</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <BandText band={t.bite} />
                      <span className="block text-xs text-swamp-800">
                        {t.snook} snook · {comparison(t)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-swamp-800">
                      {[t.otherCatch, t.notes].filter(Boolean).join(". ")}
                    </td>
                    <td className="py-2">
                      <DeleteTripButton id={t.id} label={shortDate(t.date)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <form action={logout} className="mt-8">
        <button type="submit" className="text-xs font-semibold text-swamp-700 underline underline-offset-2">
          Sign out of trip log
        </button>
      </form>
    </Shell>
  );
}

function BandText({ band, score }: { band: BandLabel; score?: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-ink-900">
      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: BAND_COLORS[band].swatch }} aria-hidden="true" />
      {score != null && <span className="font-semibold">{score}</span>}
      {band}
    </span>
  );
}
