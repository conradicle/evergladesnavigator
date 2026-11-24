# Everglades Navigator

Marketing site for Everglades Navigator — guided fishing charters and
ecotours in the Florida Everglades. Built with Next.js (App Router),
TypeScript, and Tailwind CSS.

The business hasn't launched yet, so the site is set up to collect trip
requests (contact form, booking form) rather than take live payments.
Payment infrastructure is scaffolded but intentionally not wired up — see
[Payments](#payments-not-live-yet) below.

**The live site currently shows a "coming soon" gate** (`src/proxy.ts`
rewrites every request to `src/app/coming-soon/page.tsx`). All the real
pages, forms, and routes below still exist and work — they're just not
publicly reachable yet. Delete `src/proxy.ts` to make the full site live
again.

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

## Logo

`public/logo-icon.png` (circular mark, used in the header/footer next to
the text wordmark via `src/components/Logo.tsx`) and `public/logo-full.png`
(the full icon + wordmark lockup, not currently used on the site but
available for other purposes — social profiles, print, etc.) were extracted
from the original logo artwork, both with transparent backgrounds. Replace
either file directly (keep the same filename) to swap in an updated logo.

## Snook Outlook (private tool at /snook)

An unlisted snook bite outlook for Captain Adam: 14 day cards, Flamingo,
Chokoloskee, and Lostmans side by side, best fishing windows, and a "why" breakdown.
It's exempt from the coming-soon gate (`src/proxy.ts`), noindexed, left out
of the sitemap, and disallowed in `robots.txt`. `/snook-prediction` and
`/snook-forecast` redirect to it. It can be saved to a phone home screen
(manifest at `/snook/manifest.webmanifest`, icons in `public/snook/`).

- `src/lib/snook/config.ts`: every weight, threshold, cap, station ID, and
  the regulations text. Tune the score here.
- `src/lib/snook/sources.ts`: NOAA CO-OPS tides, NWS forecast grid and
  observations, NDBC / CO-OPS water temp. Free, server-side, cached 2 hours.
- `src/lib/snook/score.ts`: the deterministic scoring and summary sentence.
- `src/lib/snook/outlook.ts`: pulls it all together for the page.
- `/api/snook` returns the same data as JSON, handy for checking scores.

**Trip log (`/snook/log`)**: passcode-gated (`SNOOK_LOG_PASSCODE`). Logs a
trip (date, spot, times, snook count, how the bite was, notes) and attaches
the forecast for that day as it stood that morning, then shows predicted vs
actual and exports CSV. Stored in Upstash Redis (`src/lib/snook/store.ts`).
A Vercel Cron job (`vercel.json`) calls `/api/snook/snapshot` at 11:00 UTC
daily to save that morning's forecast; it needs `CRON_SECRET`. Without the
database the log shows "Storage not connected" and the outlook still works.

**Shark River (`/snook/shark-river`)**: Low / Moderate / High ratings for six
areas from Rookery Branch to Ponce de Leon Bay, plus live marsh level at
MO-215 (with 3/7/14/30-day change), Rookery Branch water temp, salinity, and
flow, Gunboat Island net flow, and tides at the river mouth, each compared
with the normal range for the date. Rules and thresholds are `SHARK` and
`SHARK_RULES` in `config.ts`, built on the FIU marsh-drawdown pattern
(Massie et al. 2025). Data comes from USGS Water Services
(`src/lib/snook/shark.ts`). MO-215 normals are precomputed in
`src/lib/snook/data/mo215-normals.json` (2013-2025 record) because the full
history is slow to download. The trip log's optional "More detail" fields
(Shark River area, sizes, current, bait, clarity, lures, blank spots) save
with that day's Shark River conditions, and the daily cron saves those too.

Tests: `npm test` (vitest) covers scoring, caps, the reschedule flag,
regulations, time zones, CSV escaping, Shark River ratings, and the
coming-soon gate.

Environment variables are listed in `.env.example`.

## Adding photos

`src/components/PhotoPlaceholder.tsx` is used everywhere a real photo will
eventually go (home page, tours, gallery, about). Once you have photos:

1. Add image files to `public/images/`.
2. Replace the relevant `<PhotoPlaceholder ... />` usage with `next/image`,
   e.g. `<Image src="/images/backcountry-fishing.jpg" alt="..." fill />`.

## Editing trip content

Trip names, descriptions, durations, and group sizes all live in
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
