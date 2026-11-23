"use client";

import { useActionState } from "react";
import { addTrip, login, removeTrip, type FormState } from "@/app/snook/log/actions";
import { BANDS, LOCATIONS } from "@/lib/snook/config";
import { BAND_COLORS } from "../format";

const field = "mt-1 w-full rounded-lg border border-swamp-800/25 bg-white px-3 py-2 text-base text-ink-900";
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
        className="rounded-full bg-swamp-800 px-5 py-2 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Open trip log"}
      </button>
    </form>
  );
}

export function TripForm({ today }: { today: string }) {
  const [state, action, pending] = useActionState(addTrip, {});
  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="date" className={label}>
            Date
          </label>
          <input id="date" name="date" type="date" defaultValue={today} max={today} required className={field} />
        </div>
        <fieldset>
          <legend className={label}>Launch point</legend>
          <div className="mt-1 space-y-1">
            {LOCATIONS.map((l, i) => (
              <label key={l.id} className="flex items-center gap-2 text-sm text-ink-900">
                <input type="radio" name="location" value={l.id} defaultChecked={i === 0} className="h-4 w-4" />
                {l.name}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="startTime" className={label}>
            Start
          </label>
          <input id="startTime" name="startTime" type="time" className={field} />
        </div>
        <div>
          <label htmlFor="endTime" className={label}>
            End
          </label>
          <input id="endTime" name="endTime" type="time" className={field} />
        </div>
        <div>
          <label htmlFor="snook" className={label}>
            Snook
          </label>
          <input id="snook" name="snook" type="number" inputMode="numeric" min={0} max={500} required className={field} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>How was the bite?</legend>
        <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...BANDS].reverse().map((b) => (
            <label
              key={b.label}
              className="flex items-center gap-2 rounded-lg border border-swamp-800/20 bg-white px-3 py-2 text-sm text-ink-900 has-[:checked]:border-swamp-900 has-[:checked]:ring-2 has-[:checked]:ring-swamp-900"
            >
              <input type="radio" name="bite" value={b.label} required className="h-4 w-4" />
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
        <textarea id="notes" name="notes" maxLength={2000} rows={3} className={field} placeholder="Where they were, water color, bait…" />
      </div>

      <Message state={state} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-swamp-800 px-5 py-2.5 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save trip"}
      </button>
    </form>
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
      <button type="submit" className="text-xs font-semibold text-swamp-700 underline underline-offset-2 hover:text-ink-900">
        Delete
      </button>
    </form>
  );
}
