import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { trips } from "@/lib/tours";

const FEATURED_CATEGORIES = [
  {
    category: "fishing" as const,
    title: "Fishing Charters",
    description:
      "Guided backcountry and flats fishing trips chasing snook, redfish, and tarpon through the Everglades' mangrove creeks.",
    href: "/tours#fishing",
    variant: "water" as const,
  },
  {
    category: "ecotour" as const,
    title: "Ecotours",
    description:
      "Slow, scenic cruises through mangrove tunnels and sawgrass marsh to see alligators, wading birds, and everyday Everglades wildlife.",
    href: "/tours#ecotour",
    variant: "swamp" as const,
  },
];

const HIGHLIGHTS = [
  {
    title: "Local knowledge",
    description:
      "Trips are guided personally, with routes chosen around water levels, weather, and where the wildlife and fish are that day.",
  },
  {
    title: "Small groups",
    description:
      "Every trip is capped at a small number of guests, so it stays personal instead of feeling like a tour bus on water.",
  },
  {
    title: "Flexible trip types",
    description:
      "Pure fishing, pure sightseeing, or a combination of both — trips are built around what you want to see and do.",
  },
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16 sm:py-24 lg:flex-row lg:items-center">
        <div className="flex-1 space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
            Coming soon to the Florida Everglades
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-swamp-950 sm:text-5xl">
            Guided fishing charters &amp; ecotours through the Everglades
          </h1>
          <p className="max-w-xl text-lg text-swamp-800">
            Everglades Navigator takes small groups deep into the backcountry —
            to fish the flats and mangrove creeks, or to cruise quietly through
            sawgrass marsh and spot the wildlife that calls it home.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/booking"
              className="rounded-full bg-swamp-800 px-6 py-3 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700"
            >
              Book a Trip
            </Link>
            <Link
              href="/tours"
              className="rounded-full border border-swamp-800 px-6 py-3 text-sm font-semibold text-swamp-900 transition hover:bg-swamp-800 hover:text-sand-100"
            >
              View Tours
            </Link>
          </div>
        </div>
        <PhotoPlaceholder
          label="Photo coming soon"
          variant="water"
          className="aspect-[4/3] w-full flex-1 lg:aspect-square"
        />
      </section>

      <section className="bg-sand-200/70 py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-swamp-950 sm:text-3xl">
            Two ways to experience the Everglades
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {FEATURED_CATEGORIES.map((item) => (
              <Link
                key={item.category}
                href={item.href}
                className="group flex flex-col overflow-hidden rounded-2xl border border-swamp-800/10 bg-sand-100 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <PhotoPlaceholder
                  label={item.title}
                  variant={item.variant}
                  className="aspect-[16/9] w-full rounded-none"
                />
                <div className="space-y-2 p-6">
                  <h3 className="font-display text-xl font-semibold text-swamp-950">
                    {item.title}
                  </h3>
                  <p className="text-sm text-swamp-800">{item.description}</p>
                  <span className="inline-block text-sm font-semibold text-sunset-600 group-hover:underline">
                    See trip options →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold text-swamp-950 sm:text-3xl">
          Why book with Everglades Navigator
        </h2>
        <div className="mt-8 grid gap-8 sm:grid-cols-3">
          {HIGHLIGHTS.map((item) => (
            <div key={item.title} className="space-y-2">
              <h3 className="font-display text-lg font-semibold text-swamp-900">
                {item.title}
              </h3>
              <p className="text-sm text-swamp-800">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <h2 className="font-display text-2xl font-semibold text-swamp-950 sm:text-3xl">
          Upcoming trip offerings
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {trips.slice(0, 3).map((trip) => (
            <div
              key={trip.slug}
              className="rounded-2xl border border-swamp-800/10 bg-sand-100 p-5"
            >
              <h3 className="font-display text-lg font-semibold text-swamp-950">
                {trip.name}
              </h3>
              <p className="mt-1 text-sm text-swamp-800">{trip.duration}</p>
              <p className="mt-3 text-sm text-swamp-800">{trip.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link
            href="/tours"
            className="text-sm font-semibold text-swamp-900 underline underline-offset-4 hover:text-sunset-600"
          >
            See all trips
          </Link>
        </div>
      </section>

      <section className="bg-swamp-950 py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-sand-100 sm:text-3xl">
              Ready to plan your trip?
            </h2>
            <p className="mt-2 max-w-xl text-sand-300">
              Online booking is on its way. In the meantime, send a request and
              we&apos;ll follow up to confirm dates and availability.
            </p>
          </div>
          <Link
            href="/booking"
            className="whitespace-nowrap rounded-full bg-sunset-500 px-6 py-3 text-sm font-semibold text-swamp-950 transition hover:bg-sunset-600"
          >
            Request a Booking
          </Link>
        </div>
      </section>
    </div>
  );
}
