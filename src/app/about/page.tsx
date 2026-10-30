import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import { business } from "@/lib/business";

export const metadata: Metadata = {
  title: `${business.captain.name} | Everglades Fishing Guide`,
  description: `${business.captain.name}, a ${business.captain.credential} with ${business.captain.experience}, guides fishing charters and ecotours from ${business.launchPoints.join(" and ")}, ${business.stateCode}.`,
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Image
        src="/logo-full.png"
        alt="Everglades Navigator"
        width={800}
        height={629}
        className="mx-auto w-48 sm:w-56"
        priority
      />

      <p className="mt-10 text-center text-sm font-semibold uppercase tracking-widest text-sunset-700">
        About
      </p>
      <h1 className="mt-2 text-center font-display text-3xl font-semibold text-balance text-swamp-950 sm:text-4xl">
        {business.captain.name}
      </h1>

      <div className="mt-10 flex flex-col gap-8 sm:flex-row sm:items-start">
        <PhotoPlaceholder
          label="Captain photo coming soon"
          variant="sunset"
          className="aspect-square w-full shrink-0 sm:w-64"
        />
        <div className="space-y-4 text-swamp-800">
          <p>
            {business.captain.name} is a {business.captain.credential} with{" "}
            {business.captain.experience}. {business.name} is his small guided
            charter and ecotour operation, running trips from{" "}
            {business.launchPoints.join(" and ")} into{" "}
            {business.serviceArea.slice(0, -1).join(", ")}, and the{" "}
            {business.serviceArea.at(-1)}. Have a question? Reach out through
            the{" "}
            <Link href="/contact" className="font-semibold text-swamp-900 underline">
              contact page
            </Link>
            .
          </p>
          <p>
            Whether it&apos;s a backcountry fishing charter or a slow ecotour
            through mangrove tunnels, he guides every trip personally and keeps
            it to a small group, with routes built around water levels,
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
            Fishing, sightseeing, or a mix of both. Trips are built around
            what you want out of the day.
          </p>
        </div>
      </div>
    </div>
  );
}
