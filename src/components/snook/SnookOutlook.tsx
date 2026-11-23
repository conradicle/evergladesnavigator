"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DAYS_SHOWN, REGULATIONS, RESCHEDULE, WEIGHTS } from "@/lib/snook/config";
import type { LocationDay, Outlook, OutlookDay } from "@/lib/snook/outlook";
import {
  BAND_COLORS,
  NEGATIVE_COLOR,
  POSITIVE_COLOR,
  clientTodayKey,
  dayOfMonth,
  fmtRange,
  fmtTime,
  longDate,
  shortDate,
  shortMonth,
  shortWeekday,
  signed,
} from "./format";

const STALE_FORECAST_MS = 6 * 3600_000;

export default function SnookOutlook({ outlook }: { outlook: Outlook }) {
  const router = useRouter();
  const [selected, setSelected] = useState(outlook.today);

  useEffect(() => {
    // A saved home-screen app has no reload button and can sit open for
    // days. Re-render on the server when it comes back on a new day, and
    // pull fresh data once if the cached forecast looks old.
    const onVisible = () => {
      if (document.visibilityState === "visible" && clientTodayKey() !== outlook.today) router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    let id: ReturnType<typeof setTimeout> | undefined;
    const issued = outlook.weatherIssuedAt;
    if (issued && Date.now() - issued > STALE_FORECAST_MS && !sessionStorage.getItem("snook-refreshed")) {
      sessionStorage.setItem("snook-refreshed", "1");
      id = setTimeout(() => router.refresh(), 1500);
    }
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      clearTimeout(id);
    };
  }, [outlook.today, outlook.weatherIssuedAt, router]);

  const days = outlook.days.slice(0, DAYS_SHOWN);
  const day = days.find((d) => d.key === selected) ?? days[0];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-5 sm:px-6">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image src="/logo-icon.png" alt="" width={36} height={36} className="h-9 w-9" priority />
          <div>
            <h1 className="font-display text-2xl font-semibold leading-tight text-swamp-950">Snook Outlook</h1>
            <p className="text-xs text-swamp-700">
              Flamingo &amp; Chokoloskee
              {outlook.weatherIssuedAt && <> · forecast issued {fmtTime(outlook.weatherIssuedAt)}</>}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="rounded-full border border-swamp-800/20 px-3 py-1.5 text-xs font-semibold text-swamp-800 transition hover:bg-sand-200"
        >
          Refresh
        </button>
      </header>

      {outlook.unavailable.length > 0 && (
        <p className="mt-3 rounded-lg bg-sand-200 px-3 py-2 text-xs text-swamp-800" role="status">
          Some data unavailable right now ({outlook.unavailable.join(", ")}). Scores use what loaded.
        </p>
      )}

      <DayStrip days={days} selected={day?.key} onSelect={setSelected} />

      {day && <DayView day={day} />}

      <Regulations harvest={outlook.harvest} />

      <footer className="mt-8 space-y-2 border-t border-swamp-800/10 pt-4 text-xs text-swamp-700">
        <p className="font-semibold text-swamp-900">Bite outlook estimated from public forecasts. Not a guarantee.</p>
        <p>
          <a href="/snook/log" className="font-semibold text-sunset-700 underline underline-offset-2">
            Trip log
          </a>
        </p>
        <p>
          Sources:{" "}
          {outlook.sources
            .map(
              (s) =>
                `${s.location}: tides ${s.tides ? `NOAA ${s.tides}` : "unavailable"}, water ${s.water ?? "unavailable"}, weather ${s.weather ?? "unavailable"}`,
            )
            .join(". ")}
          . Sun and moon computed locally.
        </p>
      </footer>
    </div>
  );
}

function bestOf(d: OutlookDay): LocationDay {
  return d.locations.reduce((a, b) => (b.score > a.score ? b : a));
}

function DayStrip({
  days,
  selected,
  onSelect,
}: {
  days: OutlookDay[];
  selected: string | undefined;
  onSelect: (k: string) => void;
}) {
  return (
    <nav aria-label="Pick a day" className="-mx-4 mt-5 sm:-mx-6">
      <ul className="flex snap-x gap-2 overflow-x-auto px-4 pb-2 sm:px-6">
        {days.map((d, i) => {
          const best = bestOf(d);
          const c = BAND_COLORS[best.band];
          const isSel = d.key === selected;
          const outlookOnly = d.confidence.plusMinus == null;
          const flagged = d.locations.filter((l) => l.reschedule);
          const flagWhere = flagged.length === 1 ? ` at ${flagged[0].name}` : "";
          return (
            <li key={d.key} className="flex snap-start">
              <button
                type="button"
                onClick={() => onSelect(d.key)}
                aria-pressed={isSel}
                aria-label={`${longDate(d.key)}: best score ${best.score}, ${best.band}${outlookOnly ? ", outlook only" : ""}${
                  flagged.length ? `. ${RESCHEDULE.label}${flagWhere}` : ""
                }`}
                className={`flex w-[4.75rem] flex-col items-center overflow-hidden rounded-xl border text-center transition ${
                  isSel ? "border-swamp-900 ring-2 ring-swamp-900" : "border-swamp-800/15 hover:border-swamp-800/40"
                } ${outlookOnly ? "border-dashed" : ""}`}
                style={{ backgroundColor: isSel ? c.tint : "#fffdf7" }}
              >
                <span className="h-1.5 w-full" style={{ backgroundColor: c.swatch }} aria-hidden="true" />
                <span className="mt-1.5 text-[11px] font-semibold uppercase tracking-wide text-swamp-700">
                  {i === 0 ? "Today" : shortWeekday(d.key)}
                </span>
                <span className="text-[11px] text-swamp-700">
                  {shortMonth(d.key)} {dayOfMonth(d.key)}
                </span>
                <span className="mt-0.5 font-display text-2xl font-semibold text-ink-900">{best.score}</span>
                <span className="mb-2 text-[11px] font-semibold text-ink-900">{best.band}</span>
                {flagged.length > 0 && (
                  <span className="mx-1 mb-1.5 mt-auto rounded-md border border-ink-900/60 bg-sand-100 px-1 py-0.5 text-[10px] font-semibold leading-tight text-ink-900">
                    {RESCHEDULE.label}
                    {flagged.length === 1 && (
                      <span className="block font-normal text-swamp-800">{flagged[0].name}</span>
                    )}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function DayView({ day }: { day: OutlookDay }) {
  const outlookOnly = day.confidence.plusMinus == null;
  return (
    <section aria-labelledby="day-heading" className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="day-heading" className="font-display text-xl font-semibold text-swamp-950">
          {longDate(day.key)}
        </h2>
        <p className="text-sm text-swamp-700">
          {outlookOnly ? "Outlook only" : `${day.confidence.label} confidence (±${day.confidence.plusMinus})`} · {day.moon}
        </p>
      </div>
      {outlookOnly && (
        <p className="mt-2 rounded-lg bg-sand-200 px-3 py-2 text-sm text-swamp-800">
          Weather forecasts this far out aren&apos;t reliable, so this day is scored on tide, season, and moon only.
          Water temp, wind, and fronts sit at neutral.
        </p>
      )}
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {day.locations.map((loc) => (
          <LocationPanel key={loc.id} loc={loc} day={day} isBest={day.best === loc.id} />
        ))}
      </div>
    </section>
  );
}

function LocationPanel({ loc, day, isBest }: { loc: LocationDay; day: OutlookDay; isBest: boolean }) {
  const c = BAND_COLORS[loc.band];
  const pm = day.confidence.plusMinus;
  const lo = pm == null ? null : Math.max(0, loc.score - pm);
  const hi = pm == null ? null : Math.min(100, loc.score + pm);

  return (
    <article className="overflow-hidden rounded-2xl border border-swamp-800/10 bg-[#fffdf7]">
      <div className="h-1.5" style={{ backgroundColor: c.swatch }} aria-hidden="true" />
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-lg font-semibold text-swamp-950">{loc.name}</h3>
          {isBest && (
            <span className="rounded-full border border-sunset-600 px-2.5 py-0.5 text-xs font-semibold text-sunset-700">
              Better pick
            </span>
          )}
        </div>

        <div className="mt-2 flex items-end gap-3">
          <span className="font-display text-5xl font-semibold leading-none text-ink-900">{loc.score}</span>
          <div className="pb-1">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.swatch }} aria-hidden="true" />
              {loc.band}
            </p>
            <p className="text-xs text-swamp-700">
              {pm == null ? "Outlook only" : `±${pm} (${lo} to ${hi}) · ${day.confidence.label}`}
            </p>
          </div>
        </div>
        {loc.reschedule && (
          <p className="mt-3 rounded-lg border border-ink-900/60 bg-sand-100 px-3 py-2 text-sm text-ink-900" role="note">
            <span className="font-semibold">{RESCHEDULE.label}</span>
            <span className="text-swamp-800">: {loc.reschedule}.</span>
          </p>
        )}
        {loc.cap && (
          <p className="mt-2 text-xs text-swamp-800">
            Held to {loc.cap.maxScore}: {loc.cap.reason}.
          </p>
        )}

        <div className="mt-4">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-swamp-700">Best windows</h4>
          {loc.windows.length ? (
            <ul className="mt-1 space-y-0.5">
              {loc.windows.map((w) => (
                <li key={w.start} className="text-sm text-ink-900">
                  <span className="font-semibold">{fmtRange(w.start, w.end)}</span>
                  <span className="text-swamp-700">
                    {" "}
                    · {w.rising ? "incoming" : "outgoing"} tide{w.light ? " · low light" : ""}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-sm text-swamp-700">No tide data for this day.</p>
          )}
        </div>

        <TideChart loc={loc} />

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Stat label="Wind">
            {loc.wind
              ? `${loc.wind.dirName ?? "Variable"} ${Math.round(loc.wind.meanKt)} kt${
                  loc.wind.gustKt != null ? `, gusts ${Math.round(loc.wind.gustKt)}` : ""
                }`
              : pmOrNa(pm)}
          </Stat>
          <Stat label="Water">
            {loc.waterF != null ? (
              <>
                {loc.waterF.toFixed(1)}°F{" "}
                <span className="text-swamp-700">{loc.waterObserved ? "latest" : "est."}</span>
              </>
            ) : (
              pmOrNa(pm)
            )}
          </Stat>
          <Stat label="Sunrise">{fmtTime(loc.sunrise)}</Stat>
          <Stat label="Sunset">{fmtTime(loc.sunset)}</Stat>
          {(loc.skyPct != null || loc.rainPct != null) && (
            <Stat label="Sky / rain">
              {loc.skyPct != null ? `${loc.skyPct}% cloud` : "n/a"}
              {loc.rainPct != null ? `, ${loc.rainPct}% rain` : ""}
            </Stat>
          )}
          {loc.rangeFt != null && <Stat label="Tide range">{loc.rangeFt.toFixed(1)} ft</Stat>}
        </dl>

        <Why loc={loc} />
      </div>
    </article>
  );
}

function pmOrNa(pm: number | null) {
  return <span className="text-swamp-700">{pm == null ? "Not forecast yet" : "Unavailable"}</span>;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-swamp-700">{label}</dt>
      <dd className="text-ink-900">{children}</dd>
    </div>
  );
}

function TideChart({ loc }: { loc: LocationDay }) {
  if (loc.curve.length < 2) return null;
  const W = 300;
  const H = 64;
  const pad = 6;
  const t0 = loc.curve[0].t;
  const span = 24 * 3600_000;
  const fts = loc.curve.map((p) => p.ft).concat(loc.tides.map((e) => e.ft));
  const min = Math.min(...fts);
  const max = Math.max(...fts);
  const x = (t: number) => ((t - t0) / span) * W;
  const y = (ft: number) => H - pad - ((ft - min) / (max - min || 1)) * (H - pad * 2);
  // Draw from the extremes too so peaks aren't clipped between hourly points.
  const pts = [...loc.curve.map((p) => ({ t: p.t, ft: p.ft })), ...loc.tides.map((e) => ({ t: e.t, ft: e.ft }))]
    .sort((a, b) => a.t - b.t)
    .map((p) => `${x(p.t).toFixed(1)},${y(p.ft).toFixed(1)}`)
    .join(" ");

  return (
    <div className="mt-3">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-swamp-700">Tides</h4>
      <svg viewBox={`0 0 ${W} ${H + 12}`} className="mt-1 w-full" aria-hidden="true">
        <rect x={0} y={0} width={Math.max(0, x(loc.sunrise))} height={H} fill="#17211a" opacity={0.06} />
        <rect x={x(loc.sunset)} y={0} width={Math.max(0, W - x(loc.sunset))} height={H} fill="#17211a" opacity={0.06} />
        {loc.windows.map((w) => (
          <rect key={w.start} x={x(w.start)} y={0} width={x(w.end) - x(w.start)} height={H} fill={POSITIVE_COLOR} opacity={0.2} />
        ))}
        <polyline points={pts} fill="none" stroke="#1d5560" strokeWidth={2} strokeLinejoin="round" />
        {loc.tides.map((e) => (
          <circle key={e.t} cx={x(e.t)} cy={y(e.ft)} r={3} fill="#1d5560" />
        ))}
        {[6, 12, 18].map((h) => (
          <text key={h} x={(h / 24) * W} y={H + 10} textAnchor="middle" fontSize={9} fill="#2b5c3f">
            {h === 12 ? "noon" : h === 6 ? "6 AM" : "6 PM"}
          </text>
        ))}
      </svg>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-sm text-ink-900">
        {loc.tides.map((e) => (
          <li key={e.t}>
            <span className="font-semibold">{e.type === "H" ? "High" : "Low"}</span> {fmtTime(e.t)}{" "}
            <span className="text-swamp-700">{e.ft.toFixed(1)} ft</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Why({ loc }: { loc: LocationDay }) {
  // One scale for every bar so lengths compare in points.
  const scale = Math.max(...Object.values(WEIGHTS)) / 2;
  return (
    <details className="group mt-4 rounded-xl bg-sand-100 p-3" open>
      <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-swamp-700">
        Why <span className="font-normal normal-case tracking-normal">(points added or taken away, from a base of 50)</span>
      </summary>
      <ul className="mt-2 space-y-1.5">
        {loc.factors.map((f) => {
          const d = f.delta;
          const pct = d == null ? 0 : (Math.abs(d) / scale) * 50;
          return (
            <li key={f.key} className="grid grid-cols-[5.5rem_1fr_2.75rem] items-center gap-2 text-xs">
              <span className="text-swamp-900">{f.label}</span>
              <span className="relative h-2.5 rounded-full bg-sand-300/70" aria-hidden="true">
                <span className="absolute inset-y-0 left-1/2 w-px bg-swamp-900/30" />
                {d != null && d !== 0 && (
                  <span
                    className="absolute inset-y-0 rounded-full"
                    style={{
                      width: `${pct}%`,
                      left: d > 0 ? "50%" : `${50 - pct}%`,
                      backgroundColor: d > 0 ? POSITIVE_COLOR : NEGATIVE_COLOR,
                    }}
                  />
                )}
              </span>
              <span className="text-right tabular-nums text-ink-900">
                {d == null ? <span className="text-swamp-700">n/a</span> : signed(d)}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-sm text-ink-900">{loc.summary}</p>
    </details>
  );
}

function Regulations({ harvest }: { harvest: Outlook["harvest"] }) {
  return (
    <section aria-labelledby="regs-heading" className="mt-8 rounded-2xl border border-swamp-800/15 bg-[#fffdf7] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="regs-heading" className="font-display text-lg font-semibold text-swamp-950">
          Snook regulations
        </h2>
        <span
          className={`rounded-full px-3 py-1 text-sm font-semibold ${
            harvest.open ? "bg-swamp-800 text-sand-100" : "border border-swamp-800 text-swamp-900"
          }`}
        >
          {harvest.open ? "Harvest open" : "Harvest closed: catch and release only"}
        </span>
      </div>
      {harvest.changesOn && (
        <p className="mt-1 text-sm text-swamp-800">
          {harvest.open ? "Harvest closes" : "Harvest reopens"} {shortDate(harvest.changesOn)}.
        </p>
      )}
      <p className="mt-3 text-sm text-swamp-800">
        Flamingo and Chokoloskee are both in FWC&apos;s Southwest snook region, which includes all of Everglades
        National Park.
      </p>
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-ink-900">
        <li>Harvest closed {REGULATIONS.closedSeasons.map((s) => s.label).join(" and ")}</li>
        <li>Slot: {REGULATIONS.slot}</li>
        <li>{REGULATIONS.bag}</li>
        <li>{REGULATIONS.gear}</li>
        <li>{REGULATIONS.permits}</li>
        <li>Catch and release is allowed during closures</li>
      </ul>
      <p className="mt-3 text-xs text-swamp-700">
        <a href={REGULATIONS.url} className="font-semibold text-sunset-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer">
          FWC snook rules
        </a>{" "}
        · Rules last checked {REGULATIONS.lastChecked}
      </p>
    </section>
  );
}
