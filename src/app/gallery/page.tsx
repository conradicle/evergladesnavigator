import type { Metadata } from "next";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";

export const metadata: Metadata = {
  title: "Gallery | Everglades Navigator",
  description:
    "Photos from Everglades Navigator's fishing charters and ecotours — coming soon.",
};

const PLACEHOLDER_SLOTS = [
  { label: "Backcountry fishing", variant: "water" as const },
  { label: "Mangrove tunnels", variant: "swamp" as const },
  { label: "Everglades sunset", variant: "sunset" as const },
  { label: "Wading birds", variant: "swamp" as const },
  { label: "Redfish catch", variant: "water" as const },
  { label: "Sawgrass marsh", variant: "sunset" as const },
];

export default function GalleryPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-widest text-sunset-600">
        Gallery
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-swamp-950">
        Trip photos
      </h1>
      <p className="mt-4 max-w-2xl text-swamp-800">
        Real photos from trips will go here as the business gets underway.
        For now, here&apos;s a preview of what this page will hold.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLACEHOLDER_SLOTS.map((slot) => (
          <PhotoPlaceholder
            key={slot.label}
            label={slot.label}
            variant={slot.variant}
            className="aspect-square w-full"
          />
        ))}
      </div>
    </div>
  );
}
