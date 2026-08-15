import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Coming Soon | Everglades Navigator",
  description:
    "Everglades Navigator — guided fishing charters and ecotours in the Florida Everglades. Site launching soon.",
};

export default function ComingSoonPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-24 text-center">
      <Image
        src="/logo-full.png"
        alt="Everglades Navigator"
        width={2233}
        height={1732}
        className="w-56 sm:w-64"
        priority
      />
      <p className="mt-10 text-sm font-semibold uppercase tracking-widest text-sunset-600">
        Site coming soon
      </p>
      <h1 className="mt-2 max-w-xl font-display text-3xl font-semibold text-swamp-950 sm:text-4xl">
        Guided fishing charters &amp; ecotours in the Florida Everglades
      </h1>
      <p className="mt-4 max-w-md text-swamp-800">
        We&apos;re getting things ready. Check back soon.
      </p>
    </div>
  );
}
