export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6" aria-busy="true">
      <p className="font-display text-2xl font-semibold text-swamp-950">Snook Outlook</p>
      <p className="mt-1 text-sm text-swamp-700">Pulling tides and forecasts…</p>
      <div className="mt-5 flex gap-2 overflow-hidden">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-28 w-20 shrink-0 animate-pulse rounded-xl bg-sand-200" />
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="h-80 animate-pulse rounded-2xl bg-sand-200" />
        <div className="h-80 animate-pulse rounded-2xl bg-sand-200" />
      </div>
    </div>
  );
}
