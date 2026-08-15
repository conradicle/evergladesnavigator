"use server";

import { getTripBySlug } from "@/lib/tours";
import { estimateTripPrice } from "@/lib/pricing";
import { isPaymentsEnabled } from "@/lib/stripe";

export interface BookingState {
  status: "idle" | "success" | "error";
  message?: string;
  estimate?: number;
}

export async function submitBookingRequest(
  _prevState: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const tripSlug = String(formData.get("trip") ?? "");
  const date = String(formData.get("date") ?? "").trim();
  const partySize = Number(formData.get("partySize") ?? 0);
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  const trip = getTripBySlug(tripSlug);
  if (!trip) {
    return { status: "error", message: "Please choose a trip." };
  }
  if (!date) {
    return { status: "error", message: "Please choose a preferred date." };
  }
  if (!Number.isFinite(partySize) || partySize < 1) {
    return { status: "error", message: "Party size must be at least 1." };
  }
  if (!name || !email) {
    return { status: "error", message: "Please enter your name and email." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Please enter a valid email address." };
  }

  const estimate = estimateTripPrice(tripSlug, partySize);

  // Online payments aren't live yet (see lib/stripe.ts). Once
  // STRIPE_SECRET_KEY is set, this is where the booking would be handed off
  // to POST /api/checkout to create a Stripe Checkout Session and redirect
  // the guest there instead of returning an "inquiry received" message.
  if (isPaymentsEnabled()) {
    // TODO: create a Stripe Checkout Session via /api/checkout and redirect.
  }

  console.log("[booking] new request", {
    trip: trip.slug,
    date,
    partySize,
    name,
    email,
    phone,
    notes,
    estimate,
  });

  return {
    status: "success",
    message:
      "Thanks — your trip request has been received. We'll follow up by email to confirm availability and pricing.",
    estimate: estimate ?? undefined,
  };
}
