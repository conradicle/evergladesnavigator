"use client";

import { useActionState, useState } from "react";
import { submitBookingRequest, type BookingState } from "@/app/actions/booking";
import { trips } from "@/lib/tours";

const initialState: BookingState = { status: "idle" };

export default function BookingForm({ initialTrip }: { initialTrip?: string }) {
  const [state, formAction, pending] = useActionState(
    submitBookingRequest,
    initialState,
  );
  const [tripSlug, setTripSlug] = useState(initialTrip ?? trips[0].slug);
  const [partySize, setPartySize] = useState(2);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="trip" className="block text-sm font-medium text-swamp-900">
          Trip
        </label>
        <select
          id="trip"
          name="trip"
          value={tripSlug}
          onChange={(e) => setTripSlug(e.target.value)}
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        >
          {trips.map((trip) => (
            <option key={trip.slug} value={trip.slug}>
              {trip.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-swamp-900">
            Preferred date
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
          />
        </div>
        <div>
          <label htmlFor="partySize" className="block text-sm font-medium text-swamp-900">
            Party size
          </label>
          <input
            id="partySize"
            name="partySize"
            type="number"
            min={1}
            max={8}
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value) || 1)}
            required
            className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-swamp-900">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-swamp-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
          />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-swamp-900">
          Phone <span className="text-swamp-700">(optional)</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-swamp-900">
          Notes <span className="text-swamp-700">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          placeholder="Anything we should know — experience level, timing preferences, etc."
          className="mt-1 w-full rounded-lg border border-swamp-800/20 bg-sand-100 px-4 py-2 text-swamp-950 outline-none focus:border-swamp-700"
        />
      </div>

      <p className="text-sm text-swamp-800">
        Pricing: <span className="font-semibold text-swamp-950">TBD</span> —
        confirmed by email, nothing is charged yet.
      </p>

      {state.status === "error" && (
        <p className="text-sm font-medium text-red-700">{state.message}</p>
      )}
      {state.status === "success" && (
        <div className="rounded-lg border border-swamp-700/30 bg-sand-200/60 p-4 text-sm text-swamp-900">
          <p className="font-medium">{state.message}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sunset-500 px-6 py-3 text-sm font-semibold text-swamp-950 transition hover:bg-sunset-600 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Request Booking"}
      </button>
      <p className="text-xs text-swamp-700">
        No payment is collected here — online checkout is coming soon.
      </p>
    </form>
  );
}
