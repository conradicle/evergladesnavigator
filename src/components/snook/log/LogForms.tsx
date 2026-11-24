"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { addTrip, login, removeTrip, type FormState } from "@/app/snook/log/actions";
import { BAIT_OPTIONS, BANDS, CLARITY_OPTIONS, CURRENT_OPTIONS, LOCATIONS, SHARK_AREAS } from "@/lib/snook/config";
import { BAND_COLORS } from "../format";

// text-base (16px) keeps iPhone Safari from zooming into fields; min-h-12 keeps them easy to tap.
const field = "mt-1 block min-h-12 w-full rounded-xl border border-swamp-800/25 bg-white px-3 py-2 text-base text-ink-900";
const label = "block text-sm font-semibold text-swamp-900";

function Message({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg border border-ink-900/50 bg-sand-200 px-3 py-2 text-sm text-ink-900">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return (
      <p role="status" className="rounded-lg bg-swamp-800 px-3 py-2 text-sm text-sand-100">
        {state.ok}
      </p>
    );
  }
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  return (
    <form action={action} className="mt-4 max-w-sm space-y-3">
      <div>
        <label htmlFor="passcode" className={label}>
          Passcode
        </label>
        <input id="passcode" name="passcode" type="password" autoComplete="current-password" required className={field} />
      </div>
      <Message state={state} />
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-swamp-800 px-6 text-base font-semibold text-sand-100 transition hover:bg-swamp-700 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Checking…" : "Open trip log"}
      </button>
    </form>
  );
}

const choice =
  "flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-swamp-800/20 bg-white px-2 text-sm font-semibold text-ink-900 has-[:checked]:border-swamp-900 has-[:checked]:bg-sand-100 has-[:checked]:ring-2 has-[:checked]:ring-swamp-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-sunset-600";

export function TripForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addTrip, {});
  const formRef = useRef<HTMLFormElement>(null);
  const [snook, setSnook] = useState("");
  const [, startTransition] = useTransition();

  // Clear the form only after a successful save; on an error keep what he typed.
  // (A plain form action would reset the fields either way.)
  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting a controlled field to match the form reset
    setSnook("");
    formRef.current?.querySelector("[role=status]")?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [state]);

  const bump = (d: number) => setSnook((s) => String(Math.min(500, Math.max(0, (Number(s) || 0) + d))));

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => action(fd));
      }}
      className="space-y-5"
    >
      <div>
        <label htmlFor="date" className={label}>
          Date
        </label>
        <input id="date" name="date" type="date" defaultValue={today} max={today} required className={field} />
      </div>

      <fieldset>
        <legend className={label}>Spot</legend>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {LOCATIONS.map((l, i) => (
            <label key={l.id} className={choice}>
              <input type="radio" name="location" value={l.id} defaultChecked={i === 0} className="sr-only" />
              {l.name}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="startTime" className={label}>
            Start <span className="font-normal text-swamp-700">(optional)</span>
          </label>
          <input id="startTime" name="startTime" type="time" className={field} />
        </div>
        <div>
          <label htmlFor="endTime" className={label}>
            End <span className="font-normal text-swamp-700">(optional)</span>
          </label>
          <input id="endTime" name="endTime" type="time" className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="snook" className={label}>
          Snook caught
        </label>
        <div className="mt-1 flex items-stretch gap-2">
          <button
            type="button"
            onClick={() => bump(-1)}
            aria-label="One fewer snook"
            className="h-12 w-14 shrink-0 rounded-xl border border-swamp-800/25 bg-white text-2xl font-semibold text-ink-900 active:bg-sand-200"
          >
            −
          </button>
          <input
            id="snook"
            name="snook"
            type="number"
            inputMode="numeric"
            min={0}
            max={500}
            required
            value={snook}
            onChange={(e) => setSnook(e.target.value)}
            placeholder="0"
            className="h-12 w-full min-w-0 rounded-xl border border-swamp-800/25 bg-white px-3 text-center text-xl font-semibold text-ink-900"
          />
          <button
            type="button"
            onClick={() => bump(1)}
            aria-label="One more snook"
            className="h-12 w-14 shrink-0 rounded-xl border border-swamp-800/25 bg-white text-2xl font-semibold text-ink-900 active:bg-sand-200"
          >
            +
          </button>
        </div>
      </div>

      <fieldset>
        <legend className={label}>How was the bite?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...BANDS].reverse().map((b) => (
            <label
              key={b.label}
              className={choice}
            >
              <input type="radio" name="bite" value={b.label} required className="sr-only" />
              <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: BAND_COLORS[b.label].swatch }} aria-hidden="true" />
              {b.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="otherCatch" className={label}>
          Other catch <span className="font-normal text-swamp-700">(optional)</span>
        </label>
        <input id="otherCatch" name="otherCatch" maxLength={200} className={field} placeholder="Redfish x3, trout x6" />
      </div>
      <div>
        <label htmlFor="notes" className={label}>
          Notes <span className="font-normal text-swamp-700">(optional)</span>
        </label>
        <textarea id="notes" name="notes" maxLength={2000} rows={3} className={field} placeholder="Anything else worth remembering" />
      </div>

      <details className="group rounded-xl border border-swamp-800/15 bg-white/60">
        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 text-sm font-semibold text-swamp-900">
          <span>
            More detail <span className="font-normal text-swamp-700">(optional, helps tune the ratings)</span>
          </span>
          <span aria-hidden="true" className="text-lg transition group-open:rotate-180">
            ▾
          </span>
        </summary>
        <div className="space-y-4 px-3 pb-4 pt-1">
          <div>
            <label htmlFor="sharkArea" className={label}>
              Shark River area
            </label>
            <select id="sharkArea" name="sharkArea" defaultValue="" className={field}>
              <option value="">Not the Shark River</option>
              {SHARK_AREAS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="sizes" className={label}>
              Snook sizes
            </label>
            <input id="sizes" name="sizes" maxLength={100} className={field} placeholder={'24", 27", 31"'} />
          </div>
          <ChipGroup name="current" title="Current" options={CURRENT_OPTIONS} />
          <ChipGroup name="bait" title="Bait around" options={BAIT_OPTIONS} />
          <ChipGroup name="clarity" title="Water" options={CLARITY_OPTIONS} />
          <div>
            <label htmlFor="lures" className={label}>
              Lures or bait used
            </label>
            <input id="lures" name="lures" maxLength={200} className={field} placeholder="Pilchards, paddle tail" />
          </div>
          <div>
            <label htmlFor="blanks" className={label}>
              Spots fished with no snook
            </label>
            <input id="blanks" name="blanks" maxLength={300} className={field} placeholder="Mouth of Gunboat Creek, west shore of Tarpon Bay" />
          </div>
        </div>
      </details>

      <Message state={state} />
      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-swamp-800 px-6 text-base font-semibold text-sand-100 transition hover:bg-swamp-700 active:bg-swamp-700 disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Saving…" : "Save trip"}
      </button>
    </form>
  );
}

/** Tap-to-pick chips; leaving all unpicked skips the field. */
function ChipGroup({ name, title, options }: { name: string; title: string; options: readonly string[] }) {
  return (
    <fieldset>
      <legend className={label}>{title}</legend>
      <div className="mt-1 flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={`${choice} min-h-11 px-4 font-normal`}>
            <input type="radio" name={name} value={o} className="sr-only" />
            {o[0].toUpperCase() + o.slice(1)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function DeleteTripButton({ id, label: what }: { id: string; label: string }) {
  return (
    <form
      action={removeTrip}
      onSubmit={(e) => {
        if (!confirm(`Delete the trip on ${what}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="inline-flex h-10 items-center rounded-full border border-swamp-800/20 px-4 text-sm font-semibold text-swamp-800 hover:bg-sand-200 active:bg-sand-200"
      >
        Delete
      </button>
    </form>
  );
}
