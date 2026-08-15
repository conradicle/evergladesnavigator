import { NextResponse } from "next/server";
import { isPaymentsEnabled } from "@/lib/stripe";

/**
 * Reserved endpoint for creating a Stripe Checkout Session once online
 * payments are live. See lib/stripe.ts for the activation steps.
 */
export async function POST() {
  if (!isPaymentsEnabled()) {
    return NextResponse.json(
      {
        error:
          "Online payments aren't live yet. Use the booking form instead — we'll follow up by email.",
      },
      { status: 501 },
    );
  }

  // const { tripSlug, partySize, date, email } = await request.json();
  // const stripe = getStripeClient();
  // const session = await stripe.checkout.sessions.create({
  //   mode: "payment",
  //   line_items: [
  //     {
  //       price_data: {
  //         currency: "usd",
  //         product_data: { name: trip.name },
  //         unit_amount: toStripeAmount(priceForTrip(tripSlug, partySize)),
  //       },
  //       quantity: 1,
  //     },
  //   ],
  //   customer_email: email,
  //   metadata: { tripSlug, date, partySize: String(partySize) },
  //   success_url: `${origin}/booking/confirmed?session_id={CHECKOUT_SESSION_ID}`,
  //   cancel_url: `${origin}/booking`,
  // });
  // return NextResponse.json({ url: session.url });

  return NextResponse.json({ error: "Not implemented" }, { status: 501 });
}
