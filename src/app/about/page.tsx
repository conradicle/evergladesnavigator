import type { Metadata } from "next";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "About | Everglades Navigator",
  description:
    "About Everglades Navigator and the captain guiding fishing charters and ecotours through the Florida Everglades.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
        About
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-swamp-950">
        Meet your guide
      </h1>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        <PhotoPlaceholder
          label="Captain photo coming soon"
          variant="sunset"
          className="aspect-square w-full sm:w-64"
        />
        <div className="space-y-4 text-swamp-800">
          <p>
            Everglades Navigator is a small guided charter and ecotour
            operation based in the Florida Everglades. Bio and captain
            details are on their way — check back soon, or reach out through
            the{" "}
            <a href="/contact" className="font-semibold text-swamp-900 underline">
              contact page
            </a>{" "}
            with any questions in the meantime.
          </p>
          <p>
            Every trip — whether it&apos;s a backcountry fishing charter or a
            slow ecotour through mangrove tunnels — is guided personally and
            kept to small groups, with routes built around water levels,
            weather, and where the wildlife is that day.
          </p>
        </div>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl border border-swamp-800/10 bg-sand-200/60 p-6">
          <h2 className="font-display text-lg font-semibold text-swamp-950">
            Local waters
          </h2>
          <p className="mt-2 text-sm text-swamp-800">
            Trips run through the backcountry creeks, flats, and sawgrass
            marsh of the Everglades.
          </p>
        </div>
        <div className="rounded-2xl border border-swamp-800/10 bg-sand-200/60 p-6">
          <h2 className="font-display text-lg font-semibold text-swamp-950">
            Small groups
          </h2>
          <p className="mt-2 text-sm text-swamp-800">
            Every trip is capped at a small number of guests for a personal
            pace on the water.
          </p>
        </div>
        <div className="rounded-2xl border border-swamp-800/10 bg-sand-200/60 p-6">
          <h2 className="font-display text-lg font-semibold text-swamp-950">
            Flexible trips
          </h2>
          <p className="mt-2 text-sm text-swamp-800">
            Fishing, sightseeing, or a mix of both — trips are built around
            what you want out of the day.
          </p>
        </div>
      </div>
    </div>
  );
}
