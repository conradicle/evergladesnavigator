/**
 * Payment infrastructure placeholder — no live payments yet.
 *
 * This file is the intended integration point for Stripe. To turn it on:
 *
 *   1. `npm install stripe`
 *   2. Add STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY / STRIPE_WEBHOOK_SECRET
 *      to `.env.local` (see `.env.example`) and to your Vercel project's
 *      environment variables.
 *   3. Uncomment `getStripeClient()` below.
 *   4. In `app/api/checkout/route.ts`, replace the 501 response with a real
 *      `stripe.checkout.sessions.create(...)` call and return its URL.
 *   5. Add a `app/api/webhooks/stripe/route.ts` handler that verifies
 *      `STRIPE_WEBHOOK_SECRET` and marks bookings as paid.
 *
 * import Stripe from "stripe";
 *
 * export function getStripeClient() {
 *   const key = process.env.STRIPE_SECRET_KEY;
 *   if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
 *   return new Stripe(key);
 * }
 */

export function isPaymentsEnabled() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/** Convert a whole-dollar amount to the integer cents Stripe expects. */
export function toStripeAmount(dollars: number) {
  return Math.round(dollars * 100);
}
