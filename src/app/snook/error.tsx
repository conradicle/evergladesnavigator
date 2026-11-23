"use client";

export default function SnookError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16 text-center">
      <p className="font-display text-2xl font-semibold text-swamp-950">Snook Outlook</p>
      <p className="mt-3 text-swamp-800">
        The forecast feeds didn&apos;t load this time. They usually come back within a few minutes.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="mt-6 rounded-full bg-swamp-800 px-5 py-2 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700"
      >
        Try again
      </button>
    </div>
  );
}
