/**
 * Snook Bite Outlook: every tunable number lives here.
 *
 * How the score works: each factor earns 0..max points. The day view shows
 * each factor as (earned - max/2), so a factor at full adds half its weight
 * and a factor at zero takes half away. The score is 50 plus those deltas,
 * which equals the plain sum of earned points out of 100. Factors with no
 * data (weather beyond day 7, or a failed source) sit at neutral (delta 0).
 * Hard caps apply last.
 */

export const TIME_ZONE = "America/New_York";

/** Days shown in the strip (day 1 = today). */
export const DAYS_SHOWN = 14;

/** Cache lifetime for forecast fetches, in seconds (2 hours). */
export const CACHE_SECONDS = 7200;
/** NWS /points lookups almost never change. */
export const POINTS_CACHE_SECONDS = 86400;

/** NWS asks for a User-Agent with contact info. Set NWS_CONTACT_EMAIL in Vercel. */
export const NWS_APP_NAME = "EvergladesNavigator-SnookOutlook";

export const WEIGHTS = {
  waterTemp: 30,
  tideMovement: 25,
  wind: 15,
  front: 10,
  season: 8,
  light: 7,
  tideRange: 5,
} as const;

export type FactorKey = keyof typeof WEIGHTS;

export const FACTOR_LABELS: Record<FactorKey, string> = {
  waterTemp: "Water temp",
  tideMovement: "Tide",
  wind: "Wind",
  front: "Fronts",
  season: "Season",
  light: "Light",
  tideRange: "Tide range",
};

/** Water temp factor, °F. Full points inside [fullMin, fullMax], linear to 0 at the zero points. */
export const WATER_TEMP = {
  fullMin: 70,
  fullMax: 85,
  zeroLow: 58,
  zeroHigh: 95,
  /** Forecast water temp moves this fraction of the gap toward the 3-day mean air temp each day. */
  relaxPerDay: 0.25,
  /** Running-mean length for forecast air temp, days. */
  airMeanDays: 3,
  /** Ignore observed readings older than this. */
  maxObsAgeHours: 12,
} as const;

export const TIDE = {
  /** Within this many minutes of a high or low counts as slack. */
  slackMinutes: 45,
  /** Flow strength (0..1) assigned during slack. */
  slackStrength: 0.1,
  /**
   * Rate of rise or fall (ft/hour) that earns full flow credit. Flow is
   * actual water movement, so a strong spring tide beats a weak neap tide
   * even when both are at mid-tide. Flamingo's tides run slower, so its
   * bar is lower.
   */
  fullFlowFtPerHour: { flamingo: 0.55, chokoloskee: 0.75 },
  /** Day's tide range under this (ft) caps the tide factor at half. */
  lowRangeFt: 1.0,
  lowRangeCapFraction: 0.5,
  /** Fishing window length (hours) and search step (minutes). */
  windowHours: 2.5,
  windowStepMinutes: 15,
  /** Show a second window only if it scores at least this fraction of the best. */
  secondWindowMinFraction: 0.8,
  /** Window ranking bonus for overlapping sunrise/sunset light (0..1 scale). */
  windowLightBonus: 0.25,
} as const;

export const LIGHT = {
  /** Moving tide within this many minutes of sunrise or sunset. */
  minutesFromSunEvent: 90,
} as const;

/**
 * Wind factor. Points fall from full at `fullBelowKt` to zero at `zeroAtKt`.
 * Wind from a listed sector is multiplied before scoring (worse = bigger).
 * `muddyAboveKt` caps the factor at `muddyMaxPoints` (Flamingo's open bay).
 * Degrees are compass "from" directions; sectors may wrap past 360.
 */
export type WindProfile = {
  fullBelowKt: number;
  zeroAtKt: number;
  sectors: { from: number; to: number; multiplier: number; name: string }[];
  muddyAboveKt?: number;
  muddyMaxPoints?: number;
};

export const WIND: Record<"flamingo" | "chokoloskee", WindProfile> = {
  flamingo: {
    fullBelowKt: 8,
    zeroAtKt: 18,
    sectors: [
      { from: 293, to: 338, multiplier: 1.4, name: "NW" },
      { from: 338, to: 383, multiplier: 1.3, name: "N" },
      { from: 23, to: 68, multiplier: 1.1, name: "NE" },
    ],
    muddyAboveKt: 15,
    muddyMaxPoints: 3,
  },
  chokoloskee: {
    fullBelowKt: 10,
    zeroAtKt: 25,
    sectors: [
      { from: 293, to: 383, multiplier: 1.15, name: "N/NW" },
    ],
  },
};

export const FRONT = {
  /** Daily mean air temp drop (°F) vs. the day before that counts as a front... */
  tempDropF: 5,
  /** ...when the day's prevailing wind comes from this sector (N/NW/NE, wraps past 360). */
  northSector: { from: 290, to: 430 },
  /** Points (out of WEIGHTS.front) by situation. */
  pointsDayBefore: 10,
  pointsFrontDay: 3,
  /** Index 0 = 1 day after, 1 = 2 days after, 2 = 3 days after. */
  pointsDaysAfter: [0, 2, 4],
  pointsQuiet: 6,
} as const;

/** Season points by month (Jan..Dec), out of WEIGHTS.season. */
export const SEASON_POINTS = [1, 2, 5, 7, 8, 8, 7, 7, 8, 8, 6, 3] as const;

/**
 * Hard caps, applied after the factor sum.
 * NOTE: the original spec was cut off at "Sustained wind over 20". The wind
 * caps below are placeholders: over 20 kt daytime sustained wind caps the
 * score at `maxScore` for each location. Tune these.
 */
export const CAPS = {
  waterBelow: [
    { belowF: 57, maxScore: 10, reason: "water below 57°F" },
    { belowF: 60, maxScore: 25, reason: "water below 60°F" },
  ],
  waterDrop48h: { dropF: 8, maxScore: 40, reason: "water dropped 8°F+ in 48 hours" },
  sustainedWind: {
    overKt: 20,
    maxScore: { flamingo: 30, chokoloskee: 45 },
    reason: "sustained wind over 20 kt",
  },
} as const;

/** Lead-time tiers. Day 1 = today. */
export const CONFIDENCE = [
  { throughDay: 3, plusMinus: 5, label: "High" },
  { throughDay: 7, plusMinus: 12, label: "Medium" },
  { throughDay: 14, plusMinus: null, label: "Outlook only" },
] as const;

export const BANDS = [
  { min: 75, label: "Excellent" },
  { min: 55, label: "Good" },
  { min: 30, label: "Fair" },
  { min: 0, label: "Tough" },
] as const;

export type BandLabel = (typeof BANDS)[number]["label"];

/** Launch points and their data sources, nearest first. */
export type LocationId = "flamingo" | "chokoloskee";

export type LocationConfig = {
  id: LocationId;
  name: string;
  lat: number;
  lon: number;
  tideStations: { id: string; name: string }[];
  /** NDBC stations with water temp (WTMP), nearest first. */
  ndbcStations: { id: string; name: string }[];
  /** CO-OPS stations with water_temperature, used if no NDBC station is fresh. */
  coopsWaterStations: { id: string; name: string }[];
  /** NWS observation station for detecting fronts that already passed. */
  obsStation: string;
};

export const LOCATIONS: LocationConfig[] = [
  {
    id: "flamingo",
    name: "Flamingo",
    lat: 25.14,
    lon: -80.92,
    tideStations: [{ id: "8723644", name: "Flamingo" }],
    ndbcStations: [
      { id: "MUKF1", name: "Murray Key" },
      { id: "BKYF1", name: "Buoy Key" },
    ],
    coopsWaterStations: [
      { id: "8723970", name: "Vaca Key" },
      { id: "8724580", name: "Key West" },
    ],
    obsStation: "KMTH",
  },
  {
    id: "chokoloskee",
    name: "Chokoloskee",
    lat: 25.81,
    lon: -81.36,
    tideStations: [
      { id: "8724919", name: "Chokoloskee" },
      { id: "8724948", name: "Everglades City" },
    ],
    ndbcStations: [
      { id: "WPLF1", name: "Watson Place" },
      { id: "CNBF1", name: "Cannon Bay" },
      { id: "LMRF1", name: "Lostmans River" },
    ],
    coopsWaterStations: [
      // Naples (8725110) is not reporting water temp as of Nov 2026.
      { id: "8725520", name: "Fort Myers" },
    ],
    obsStation: "KAPF",
  },
];

/** FWC Southwest snook region (includes all of Everglades National Park). */
export const REGULATIONS = {
  /** [startMonth, startDay, endMonth, endDay] inclusive, months 1-12. */
  closedSeasons: [
    { start: [12, 1], end: [2, 29], label: "Dec 1 through end of February" },
    { start: [5, 1], end: [9, 30], label: "May 1 through Sep 30" },
  ],
  slot: "28 to 33 inches total length",
  bag: "One fish per person per day",
  gear: "Hook and line only",
  permits: "Snook permit plus saltwater fishing license required",
  url: "https://myfwc.com/fishing/saltwater/recreational/snook/",
  lastChecked: "Nov 23, 2026",
} as const;
