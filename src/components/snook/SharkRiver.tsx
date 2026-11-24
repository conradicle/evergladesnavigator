import Link from "next/link";
import { SHARK } from "@/lib/snook/config";
import { MARSH_STATE_LABEL, type AreaRating, type Reading, type SharkConditions } from "@/lib/snook/shark";
import { fmtRange, fmtTime, longDate } from "./format";

/** Blue (low) to orange (high), always shown with the word. */
export const RATING_COLORS: Record<AreaRating, { swatch: string; tint: string }> = {
  Low: { swatch: "#2f5f8a", tint: "#e3ecf4" },
  Moderate: { swatch: "#c9b98f", tint: "#f4efe2" },
  High: { swatch: "#d9692a", tint: "#fbe7da" },
};

const signedFt = (n: number | null) => (n == null ? "n/a" : `${n > 0 ? "+" : n < 0 ? "-" : ""}${Math.abs(n).toFixed(2)} ft`);

export default function SharkRiver({ c }: { c: SharkConditions }) {
  return (
    <div className="mx-auto max-w-6xl px-4 pb-10 pt-5 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold leading-tight text-swamp-950">Shark River</h1>
          <p className="text-xs text-swamp-700">
            Snook area ratings for {longDate(c.today)} · {c.season === "dry" ? "dry season" : "wet season"}
          </p>
        </div>
        <Link href="/snook" className="text-sm font-semibold text-sunset-700 underline underline-offset-2">
          Back to outlook
        </Link>
      </header>

      {c.unavailable.length > 0 && (
        <p className="mt-3 rounded-lg bg-sand-200 px-3 py-2 text-xs text-swamp-800" role="status">
          Some data unavailable right now ({c.unavailable.join(", ")}). Ratings use what loaded.
        </p>
      )}

      <section aria-labelledby="areas-heading" className="mt-5">
        <h2 id="areas-heading" className="text-xs font-semibold uppercase tracking-wide text-swamp-700">
          Areas, upriver to the coast
        </h2>
        <ol className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {c.areas.map((a) => {
            const col = RATING_COLORS[a.rating];
            return (
              <li key={a.id} className="overflow-hidden rounded-2xl border border-swamp-800/10 bg-[#fffdf7]">
                <div className="h-1.5" style={{ backgroundColor: col.swatch }} aria-hidden="true" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-base font-semibold text-swamp-950">{a.name}</h3>
                    <span
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-ink-900/20 px-2.5 py-0.5 text-sm font-semibold text-ink-900"
                      style={{ backgroundColor: col.tint }}
                    >
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: col.swatch }} aria-hidden="true" />
                      {a.rating}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-swamp-700">{a.blurb}</p>
                  {a.reasons.length ? (
                    <ul className="mt-2 space-y-1 text-sm text-ink-900">
                      {a.reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-swamp-800">Nothing today pushes this area up or down.</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <MarshPanel c={c} />
        <RiverPanel c={c} />
        <TidePanel c={c} />
      </div>

      <details className="mt-6 rounded-2xl border border-swamp-800/15 bg-[#fffdf7] p-4 sm:p-5">
        <summary className="cursor-pointer font-display text-lg font-semibold text-swamp-950">How the ratings work</summary>
        <div className="mt-3 space-y-2 text-sm text-ink-900">
          <p>
            Each area starts at 0 and gains or loses points from the conditions listed on its card. {SHARK.cutoffs.high} or more
            is High, {SHARK.cutoffs.low} or less is Low, anything between is Moderate. These are starting rules, meant to
            be adjusted as the trip log fills in.
          </p>
          <p>
            The main pattern comes from FIU&apos;s snook tracking and sampling in the Shark River (Massie et al. 2025): in
            the dry season, once the marsh at MO-215 drops below flood stage (0.98 ft), marsh fish get pushed into the
            creeks and snook feed upriver, with the most snook in the upper river in March and April. In the wet season
            they move toward the coast and passes to spawn. Years with long high water weaken the pulse.
          </p>
          <p>
            <a
              href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12638890/"
              className="font-semibold text-sunset-700 underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read the FIU study
            </a>
          </p>
        </div>
      </details>

      <footer className="mt-8 space-y-2 border-t border-swamp-800/10 pt-4 text-xs text-swamp-700">
        <p className="font-semibold text-swamp-900">Area ratings estimated from public data. Not a guarantee.</p>
        <p>
          Sources: USGS gauges ({SHARK.stations.marsh.name}, {SHARK.stations.rookery.name}, {SHARK.stations.gunboat.name}
          ), with normal ranges from past years on the same dates. Tides from NOAA {c.tides?.station ?? "Shark River entrance"}.
          Wind and coastal water temp from the Flamingo outlook. Recent USGS readings are provisional.
        </p>
        <p>
          <Link href="/snook/log" className="font-semibold text-sunset-700 underline underline-offset-2">
            Trip log
          </Link>
        </p>
      </footer>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-swamp-800/10 bg-[#fffdf7] p-4 sm:p-5">
      <h2 className="font-display text-lg font-semibold text-swamp-950">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-swamp-800/10 py-1.5 last:border-0">
      <dt className="text-sm text-swamp-800">{label}</dt>
      <dd className="text-right text-sm text-ink-900">{children}</dd>
    </div>
  );
}

function MarshPanel({ c }: { c: SharkConditions }) {
  const m = c.marsh;
  return (
    <Panel title="Marsh (MO-215)">
      {!m ? (
        <p className="mt-2 text-sm text-swamp-700">Marsh level unavailable right now.</p>
      ) : (
        <>
          <p className="mt-2 font-display text-4xl font-semibold leading-none text-ink-900">
            {m.ft.toFixed(2)} <span className="text-lg">ft</span>
          </p>
          <p className="mt-1 text-sm font-semibold text-ink-900">{MARSH_STATE_LABEL[m.state]}</p>
          <dl className="mt-3">
            <Row label="Flood stage">{SHARK.marsh.floodStageFt.toFixed(2)} ft</Row>
            <Row label="Change, 3 / 7 days">
              {signedFt(m.change.d3)} / {signedFt(m.change.d7)}
            </Row>
            <Row label="Change, 14 / 30 days">
              {signedFt(m.change.d14)} / {signedFt(m.change.d30)}
            </Row>
            <Row label="Typical for this date">
              {m.typicalFt != null ? `${m.typicalFt.toFixed(2)} ft` : "n/a"}
              {m.normal && <span className="block text-xs text-swamp-700">Now {m.normal}</span>}
            </Row>
            {m.daysToFloodStage != null && (
              <Row label="Reaches flood stage">About {m.daysToFloodStage} days at this rate</Row>
            )}
          </dl>
          <p className="mt-2 text-xs text-swamp-700">Feet above NAVD88. Updated {fmtTime(m.t)}.</p>
        </>
      )}
    </Panel>
  );
}

function ReadingRow({ label, r, unit, digits = 1 }: { label: string; r: Reading | null | undefined; unit: string; digits?: number }) {
  return (
    <Row label={label}>
      {r ? (
        <>
          {r.value.toFixed(digits)}
          {unit}
          {r.normal && (
            <span className="block text-xs text-swamp-700">
              {r.normal}
              {r.typical != null && ` (typical ${r.typical.toFixed(digits)}${unit})`}
            </span>
          )}
        </>
      ) : (
        <span className="text-swamp-700">Unavailable</span>
      )}
    </Row>
  );
}

function RiverPanel({ c }: { c: SharkConditions }) {
  const net = c.gunboat?.netFlowCfs;
  return (
    <Panel title="River">
      <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-swamp-700">Rookery Branch</h3>
      <dl>
        <ReadingRow label="Water temp" r={c.rookery?.tempF} unit="°F" />
        <ReadingRow label="Salinity" r={c.rookery?.salinity} unit=" ppt" />
        <ReadingRow label="Flow" r={c.rookery?.flowCfs} unit=" cfs" digits={0} />
      </dl>
      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-swamp-700">Gunboat Island (lower river)</h3>
      <dl>
        <ReadingRow label="Net flow, tides removed" r={net} unit=" cfs" digits={0} />
      </dl>
      {net && (
        <p className="mt-1 text-xs text-swamp-700">
          {net.value >= 0 ? "Positive means net flow out toward the Gulf." : "Negative means net flow upriver from the Gulf."}
        </p>
      )}
      <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-swamp-700">Coast (Flamingo outlook)</h3>
      <dl>
        <Row label="Water temp">{c.coastWaterF != null ? `${c.coastWaterF.toFixed(1)}°F` : "Unavailable"}</Row>
        <Row label="Wind today">
          {c.wind ? `${c.wind.dirName ?? "Variable"} ${Math.round(c.wind.meanKt)} kt` : "Not forecast now"}
        </Row>
      </dl>
    </Panel>
  );
}

function TidePanel({ c }: { c: SharkConditions }) {
  const t = c.tides;
  return (
    <Panel title="Tides at the river mouth">
      {!t ? (
        <p className="mt-2 text-sm text-swamp-700">Tide predictions unavailable right now.</p>
      ) : (
        <>
          <h3 className="mt-2 text-xs font-semibold uppercase tracking-wide text-swamp-700">Best moving water</h3>
          {t.windows.length ? (
            <ul className="mt-1 space-y-0.5 text-sm text-ink-900">
              {t.windows.map((w) => (
                <li key={w.start}>
                  <span className="font-semibold">{fmtRange(w.start, w.end)}</span>
                  <span className="text-swamp-700"> · {w.rising ? "incoming" : "outgoing"}{w.light ? " · low light" : ""}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-swamp-700">No daylight windows.</p>
          )}
          <h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-swamp-700">Highs and lows</h3>
          <ul className="mt-1 space-y-0.5 text-sm text-ink-900">
            {t.extremes.map((e) => (
              <li key={e.t}>
                <span className="font-semibold">{e.type === "H" ? "High" : "Low"}</span> {fmtTime(e.t)}{" "}
                <span className="text-swamp-700">{e.ft.toFixed(1)} ft</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-swamp-700">
            Sunrise {fmtTime(t.sunrise)} · Sunset {fmtTime(t.sunset)}. Tides upriver run later than at the mouth.
          </p>
        </>
      )}
    </Panel>
  );
}
