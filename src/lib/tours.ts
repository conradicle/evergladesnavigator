export type TripCategory = "fishing" | "ecotour" | "combo";

export interface Trip {
  slug: string;
  category: TripCategory;
  name: string;
  duration: string;
  groupSize: string;
  description: string;
  highlights: string[];
  priceFrom: number;
}

export const TRIP_CATEGORY_LABELS: Record<TripCategory, string> = {
  fishing: "Fishing Charter",
  ecotour: "Ecotour",
  combo: "Combo Trip",
};

export const trips: Trip[] = [
  {
    slug: "backcountry-fishing-charter",
    category: "fishing",
    name: "Backcountry Fishing Charter",
    duration: "4 hours",
    groupSize: "Up to 4 anglers",
    description:
      "A guided flats and backcountry fishing trip through the Everglades' mangrove creeks, chasing snook, redfish, and tarpon with light tackle.",
    highlights: [
      "Rods, tackle, and bait included",
      "Light-tackle and fly options",
      "All skill levels welcome",
    ],
    priceFrom: 450,
  },
  {
    slug: "full-day-fishing-charter",
    category: "fishing",
    name: "Full-Day Fishing Charter",
    duration: "8 hours",
    groupSize: "Up to 4 anglers",
    description:
      "An extended charter that covers more water, more species, and more time on the fish — ideal for serious anglers who want the full Everglades experience.",
    highlights: [
      "Covers backcountry and open-water spots",
      "Lunch break on the water",
      "Best for experienced anglers",
    ],
    priceFrom: 750,
  },
  {
    slug: "everglades-wildlife-ecotour",
    category: "ecotour",
    name: "Everglades Wildlife Ecotour",
    duration: "2.5 hours",
    groupSize: "Up to 6 guests",
    description:
      "A slow, guided cruise through mangrove tunnels and open sawgrass marsh, spotting alligators, wading birds, and the everyday wildlife of the Everglades.",
    highlights: [
      "Family-friendly, all ages welcome",
      "Narrated by a local guide",
      "Great for photography",
    ],
    priceFrom: 220,
  },
  {
    slug: "sunset-ecotour",
    category: "ecotour",
    name: "Sunset Ecotour",
    duration: "2 hours",
    groupSize: "Up to 6 guests",
    description:
      "An evening cruise timed to the Everglades sunset, when wading birds return to roost and the light over the sawgrass turns gold.",
    highlights: [
      "Best light for photos",
      "Cooler evening temperatures",
      "Great for couples and small groups",
    ],
    priceFrom: 240,
  },
  {
    slug: "fish-and-explore-combo",
    category: "combo",
    name: "Fish & Explore Combo",
    duration: "6 hours",
    groupSize: "Up to 4 guests",
    description:
      "Half fishing trip, half wildlife tour — cast a line in the backcountry, then cruise through mangrove tunnels to see the Everglades' wildlife up close.",
    highlights: [
      "Best of both trip types",
      "Flexible pacing on the water",
      "Good fit for mixed groups",
    ],
    priceFrom: 600,
  },
];

export function getTripBySlug(slug: string) {
  return trips.find((trip) => trip.slug === slug);
}
