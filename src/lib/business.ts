/**
 * Single source of truth for business details used in page copy, metadata,
 * the sitemap, and the LocalBusiness structured data. Update details here.
 */

// TODO: Confirm FWC Charter Captain license before claiming it anywhere.
// TODO: Confirm Everglades National Park Commercial Use Authorization (CUA)
//       before claiming it anywhere.

export const business = {
  name: "Everglades Navigator",
  url: "https://www.evergladesnavigator.com",
  description:
    "Guided fishing charters and ecotours in Everglades National Park, Florida Bay, and the Ten Thousand Islands, launching from Flamingo and Chokoloskee, Florida.",

  captain: {
    name: "Captain Adam Gelber",
    // TODO: Confirm whether the license is OUPV (six-pack) or Master.
    credential: "USCG Licensed Captain",
    experience: "four decades fishing the Everglades",
  },

  launchPoints: ["Flamingo", "Chokoloskee"],
  state: "Florida",
  stateCode: "FL",
  serviceArea: [
    "Everglades National Park",
    "Florida Bay",
    "Ten Thousand Islands",
  ],
  hours: "By appointment",

  // TODO: Add phone and email. Each stays hidden on the site and out of the
  // structured data until it's filled in.
  phone: "" as string,
  email: "" as string,
} as const;

/** "Flamingo & Chokoloskee" */
export const launchPointsLabel = business.launchPoints.join(" & ");
