# Everglades Navigator

Marketing site for Everglades Navigator — guided fishing charters and
ecotours in the Florida Everglades. Built with Next.js (App Router),
TypeScript, and Tailwind CSS.

The business hasn't launched yet, so the site is set up to collect trip
requests (contact form, booking form) rather than take live payments.
Payment infrastructure is scaffolded but intentionally not wired up — see
[Payments](#payments-not-live-yet) below.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `src/app/` — pages: home, `/tours`, `/about`, `/gallery`, `/contact`, `/booking`
- `src/app/actions/` — Server Actions for the contact and booking forms
- `src/app/api/checkout/` — reserved Stripe Checkout endpoint (returns 501 until payments are enabled)
- `src/components/` — shared UI (Header, Footer, Logo, forms, photo placeholders)
- `src/lib/tours.ts` — trip catalog (fishing charters, ecotours, combo trips) — edit this to change offerings. Pricing isn't set yet; the site shows "TBD" everywhere until real prices are added.
- `src/lib/stripe.ts` — payment infrastructure placeholder and activation steps

## Adding the real logo

`src/components/Logo.tsx` currently renders a text wordmark with a simple
SVG mark so the site looks finished without a real logo file. Once you have
the logo:

1. Save it as `public/logo.svg` (or `.png`).
2. In `src/components/Logo.tsx`, replace the `<svg>`/text markup with:
   ```tsx
   import Image from "next/image";
   // ...
   <Image src="/logo.svg" alt="Everglades Navigator" width={140} height={32} />
   ```

## Adding photos

`src/components/PhotoPlaceholder.tsx` is used everywhere a real photo will
eventually go (home page, tours, gallery, about). Once you have photos:

1. Add image files to `public/images/`.
2. Replace the relevant `<PhotoPlaceholder ... />` usage with `next/image`,
   e.g. `<Image src="/images/backcountry-fishing.jpg" alt="..." fill />`.

## Editing trip content

Trip names, descriptions, durations, and starting prices all live in
`src/lib/tours.ts`. Editing that file updates the home page, `/tours`, and
the booking form's trip dropdown together.

## Contact & booking forms

Both forms currently just log submissions server-side and show a "we'll
follow up" confirmation message — nothing is emailed or stored yet.

- `src/app/actions/contact.ts` — wire this to an email provider (e.g.
  [Resend](https://resend.com)) using the `CONTACT_EMAIL` env var once ready.
- `src/app/actions/booking.ts` — same idea, plus this is where the future
  handoff to Stripe Checkout happens once payments are enabled.

## Payments (not live yet)

The booking flow is shaped around Stripe but doesn't call it yet:

- `src/lib/stripe.ts` explains the exact steps to turn payments on
  (`npm install stripe`, add API keys, uncomment the client).
- `src/app/api/checkout/route.ts` is the reserved endpoint for creating a
  Stripe Checkout Session — it currently returns a `501` explaining that
  payments aren't live.
- `.env.example` lists the environment variables to set when that day comes.

Until then, the booking form only sends a request — no card details are
ever collected by this site.

## Deployment

This project is set up to deploy on [Vercel](https://vercel.com), connected
to the `conradicle/evergladesnavigator` GitHub repo:

1. Import the repo into Vercel.
2. Point the Cloudflare-registered domain at Vercel: in Vercel's project
   settings → Domains, add the domain, then follow Vercel's instructions to
   create the CNAME/A record in the Cloudflare DNS dashboard.
3. When payments are ready, add the `STRIPE_*` variables from
   `.env.example` to the Vercel project's Environment Variables.
