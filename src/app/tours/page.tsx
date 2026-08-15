import type { Metadata } from "next";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { TRIP_CATEGORY_LABELS, trips, type TripCategory } from "@/lib/tours";

export const metadata: Metadata = {
  title: "Tours | Everglades Navigator",
  description:
    "Fishing charters and ecotours through the Florida Everglades — trip lengths and group sizes.",
};

const SECTIONS: { id: TripCategory; blurb: string; variant: "water" | "swamp" }[] = [
  {
    id: "fishing",
    blurb:
      "Guided light-tackle and fly fishing trips through the backcountry and flats, chasing snook, redfish, and tarpon.",
    variant: "water",
  },
  {
    id: "ecotour",
    blurb:
      "Slow, narrated cruises through mangrove tunnels and sawgrass marsh built for wildlife-watching and photography.",
    variant: "swamp",
  },
  {
    id: "combo",
    blurb: "Trips that blend fishing time with sightseeing for mixed groups.",
    variant: "water",
  },
];

export default function ToursPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
          Trip offerings
        </p>
        <h1 className="font-display text-4xl font-semibold text-swamp-950">
          Fishing charters &amp; ecotours
        </h1>
        <p className="text-swamp-800">
          Pricing is still being finalized and depends on trip length, group
          size, and season — request a booking and we&apos;ll follow up with
          exact details before anything is charged.
        </p>
      </div>

      {SECTIONS.map((section) => {
        const sectionTrips = trips.filter((trip) => trip.category === section.id);
        if (sectionTrips.length === 0) return null;

        return (
          <section key={section.id} id={section.id} className="mt-16 scroll-mt-24">
            <h2 className="font-display text-2xl font-semibold text-swamp-950">
              {TRIP_CATEGORY_LABELS[section.id]}s
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-swamp-800">{section.blurb}</p>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              {sectionTrips.map((trip) => (
                <div
                  key={trip.slug}
                  className="flex flex-col overflow-hidden rounded-2xl border border-swamp-800/10 bg-sand-100"
                >
                  <PhotoPlaceholder
                    label={trip.name}
                    variant={section.variant}
                    className="aspect-[16/9] w-full rounded-none"
                  />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="font-display text-xl font-semibold text-swamp-950">
                        {trip.name}
                      </h3>
                      <span className="whitespace-nowrap text-sm font-semibold text-sunset-600">
                        Pricing: TBD
                      </span>
                    </div>
                    <p className="text-sm text-swamp-700">
                      {trip.duration} · {trip.groupSize}
                    </p>
                    <p className="text-sm text-swamp-800">{trip.description}</p>
                    <ul className="mt-1 space-y-1 text-sm text-swamp-800">
                      {trip.highlights.map((highlight) => (
                        <li key={highlight} className="flex gap-2">
                          <span className="text-sunset-600">•</span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={{ pathname: "/booking", query: { trip: trip.slug } }}
                      className="mt-auto inline-block w-fit rounded-full bg-swamp-800 px-5 py-2 text-sm font-semibold text-sand-100 transition hover:bg-swamp-700"
                    >
                      Request this trip
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
