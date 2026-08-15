import { getTripBySlug } from "@/lib/tours";

const PRICE_PER_EXTRA_GUEST = 40;
const BASE_GROUP_SIZE = 2;

/**
 * Rough estimate only — final pricing is confirmed by hand until online
 * payments are live. Kept in dollars; convert to cents at the Stripe
 * integration boundary (see lib/stripe.ts).
 */
export function estimateTripPrice(tripSlug: string, partySize: number) {
  const trip = getTripBySlug(tripSlug);
  if (!trip) return null;

  const extraGuests = Math.max(0, partySize - BASE_GROUP_SIZE);
  return trip.priceFrom + extraGuests * PRICE_PER_EXTRA_GUEST;
}
