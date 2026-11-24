import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { CAPS, WEIGHTS } from "./config";
import { csvCell } from "./csv";
import { harvestStatus, isHarvestClosed } from "./regulations";
import {
  bandFor,
  lightPoints,
  rescheduleReason,
  scoreDay,
  waterTempPoints,
  windPoints,
  type DayInputs,
} from "./score";
import type { TideExtreme } from "./sources";
import { tideAt } from "./tides";
import { HOUR, parseNoaaLocal, zonedToUtc } from "./time";

describe("bands", () => {
  it("uses the tuned thresholds", () => {
    expect(bandFor(82)).toBe("Excellent");
    expect(bandFor(81)).toBe("Good");
    expect(bandFor(62)).toBe("Good");
    expect(bandFor(61)).toBe("Fair");
    expect(bandFor(40)).toBe("Fair");
    expect(bandFor(39)).toBe("Tough");
    expect(bandFor(Number.NaN)).toBe("Tough");
  });
});

describe("water temp factor", () => {
  it("gives full credit only from 74 to 82°F", () => {
    expect(waterTempPoints(74)).toBe(WEIGHTS.waterTemp);
    expect(waterTempPoints(82)).toBe(WEIGHTS.waterTemp);
    expect(waterTempPoints(73)).toBeLessThan(WEIGHTS.waterTemp);
  });
  it("tapers to half credit at 68 and 86°F", () => {
    expect(waterTempPoints(68)).toBeCloseTo(WEIGHTS.waterTemp / 2);
    expect(waterTempPoints(86)).toBeCloseTo(WEIGHTS.waterTemp / 2);
    expect(waterTempPoints(71)).toBeCloseTo(WEIGHTS.waterTemp * 0.75);
  });
  it("reaches zero well outside the band", () => {
    expect(waterTempPoints(60)).toBe(0);
    expect(waterTempPoints(92)).toBe(0);
  });
});

describe("wind factor", () => {
  it("starts taking points off at 8 kt at Flamingo and 12 kt at Chokoloskee", () => {
    expect(windPoints("flamingo", 8, 180)).toBe(WEIGHTS.wind);
    expect(windPoints("flamingo", 9, 180)).toBeLessThan(WEIGHTS.wind);
    expect(windPoints("chokoloskee", 12, 180)).toBe(WEIGHTS.wind);
    expect(windPoints("chokoloskee", 13, 180)).toBeLessThan(WEIGHTS.wind);
  });
  it("penalizes north and northwest wind harder at Flamingo", () => {
    expect(windPoints("flamingo", 12, 315)).toBeLessThan(windPoints("flamingo", 12, 135));
  });
  it("starts at 10 kt at Lostmans and penalizes onshore west wind", () => {
    expect(windPoints("lostmans", 10, 120)).toBe(WEIGHTS.wind);
    expect(windPoints("lostmans", 11, 120)).toBeLessThan(WEIGHTS.wind);
    expect(windPoints("lostmans", 14, 270)).toBeLessThan(windPoints("lostmans", 14, 120));
  });
});

describe("reschedule flag", () => {
  it("flags sustained wind over 20 kt", () => {
    expect(rescheduleReason({ meanKt: 21, gustKt: 24 })).toMatch(/sustained wind/);
  });
  it("flags gusts over 25 kt even when sustained wind is moderate", () => {
    expect(rescheduleReason({ meanKt: 14, gustKt: 27 })).toMatch(/gusts to 27/);
  });
  it("stays quiet otherwise", () => {
    expect(rescheduleReason({ meanKt: 20, gustKt: 25 })).toBeNull();
    expect(rescheduleReason(null)).toBeNull();
  });
});

/** Six-hour semidiurnal tide starting at a low at 06:00 local on Nov 23, 2026. */
function syntheticTide(rangeFt = 3): TideExtreme[] {
  const t0 = zonedToUtc(2026, 11, 22, 18);
  return Array.from({ length: 12 }, (_, i) => ({
    t: t0 + i * 6 * HOUR,
    ft: i % 2 === 0 ? 0 : rangeFt,
    type: i % 2 === 0 ? ("L" as const) : ("H" as const),
  }));
}

function inputs(over: Partial<DayInputs> = {}): DayInputs {
  const ex = syntheticTide();
  const dayStart = zonedToUtc(2026, 11, 23);
  return {
    location: "flamingo",
    locationName: "Flamingo",
    month: 11,
    outlookOnly: false,
    sunrise: zonedToUtc(2026, 11, 23, 6, 45),
    sunset: zonedToUtc(2026, 11, 23, 17, 30),
    extremes: ex,
    dayExtremes: ex.filter((e) => e.t >= dayStart && e.t < dayStart + 24 * HOUR),
    moonPhase: 0.5,
    estWaterF: 78,
    waterDrop48F: 0,
    wind: { meanKt: 6, dir: 120 },
    front: "quiet",
    ...over,
  };
}

describe("scoreDay", () => {
  it("is deterministic", () => {
    expect(scoreDay(inputs())).toEqual(scoreDay(inputs()));
  });
  it("caps Flamingo at 30 and Chokoloskee at 45 in sustained wind over 20 kt", () => {
    const f = scoreDay(inputs({ wind: { meanKt: 22, dir: 120 }, estWaterF: 78 }));
    expect(f.score).toBeLessThanOrEqual(CAPS.sustainedWind.maxScore.flamingo);
    const c = scoreDay(inputs({ location: "chokoloskee", locationName: "Chokoloskee", wind: { meanKt: 22, dir: 120 } }));
    expect(c.score).toBeLessThanOrEqual(CAPS.sustainedWind.maxScore.chokoloskee);
  });
  it("caps cold water", () => {
    expect(scoreDay(inputs({ estWaterF: 59 })).score).toBeLessThanOrEqual(25);
    expect(scoreDay(inputs({ estWaterF: 56 })).score).toBeLessThanOrEqual(10);
  });
  it("caps a fast water temp drop", () => {
    expect(scoreDay(inputs({ waterDrop48F: -9 })).score).toBeLessThanOrEqual(40);
  });
  it("leaves weather factors neutral on outlook-only days", () => {
    const r = scoreDay(inputs({ outlookOnly: true }));
    for (const k of ["waterTemp", "wind", "front"]) expect(r.factors.find((f) => f.key === k)!.delta).toBeNull();
  });
  it("returns fishing windows inside daylight", () => {
    const i = inputs();
    for (const w of scoreDay(i).windows) {
      expect(w.start).toBeGreaterThanOrEqual(i.sunrise);
      expect(w.end).toBeLessThanOrEqual(i.sunset);
    }
  });
});

describe("tides", () => {
  it("interpolates a half cosine with peak flow at mid-tide", () => {
    const ex = syntheticTide(3);
    const mid = tideAt(ex, ex[1].t + 3 * HOUR, 1)!;
    expect(mid.ft).toBeCloseTo(1.5);
    // Peak rate of a half cosine: range * pi / (2 * hours).
    expect(mid.ftPerHour).toBeCloseTo((3 * Math.PI) / 12);
    expect(mid.rising).toBe(false);
  });
  it("gives full light credit when peak flow lines up with sunrise", () => {
    const ex = syntheticTide(3);
    // Mid-tide (peak flow) at 09:00 and 15:00; sunrise at 08:30 puts a peak within 90 min.
    const pts = lightPoints(ex, zonedToUtc(2026, 11, 23, 8, 30), zonedToUtc(2026, 11, 23, 17, 0));
    expect(pts).toBe(WEIGHTS.light);
    const off = lightPoints(ex, zonedToUtc(2026, 11, 23, 6, 0), zonedToUtc(2026, 11, 23, 17, 50));
    expect(off!).toBeLessThan(WEIGHTS.light);
  });
});

describe("regulations", () => {
  it("knows the Southwest region closures", () => {
    expect(isHarvestClosed("2026-11-30")).toBe(false);
    expect(isHarvestClosed("2026-12-01")).toBe(true);
    expect(isHarvestClosed("2028-02-29")).toBe(true);
    expect(isHarvestClosed("2027-03-01")).toBe(false);
    expect(isHarvestClosed("2027-05-01")).toBe(true);
    expect(isHarvestClosed("2027-09-30")).toBe(true);
    expect(isHarvestClosed("2027-10-01")).toBe(false);
  });
  it("reports the next change", () => {
    expect(harvestStatus("2026-11-23")).toEqual({ open: true, changesOn: "2026-12-01" });
    expect(harvestStatus("2027-01-15")).toEqual({ open: false, changesOn: "2027-03-01" });
  });
});

describe("time zones", () => {
  it("parses NOAA local times across DST", () => {
    expect(new Date(parseNoaaLocal("2026-11-23 00:59")).toISOString()).toBe("2026-11-23T05:59:00.000Z");
    expect(new Date(parseNoaaLocal("2026-07-04 12:00")).toISOString()).toBe("2026-07-04T16:00:00.000Z");
  });
});

describe("csv", () => {
  it("quotes and neutralizes formulas", () => {
    expect(csvCell('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvCell(null)).toBe("");
    expect(csvCell(12)).toBe("12");
    expect(csvCell(-0.03)).toBe("-0.03");
    expect(csvCell("-1+2")).toBe("'-1+2");
  });
});

describe("coming-soon gate", () => {
  const run = (path: string) => proxy(new NextRequest(`https://www.evergladesnavigator.com${path}`));
  it("lets /snook and its API through", () => {
    for (const p of ["/snook", "/snook/log", "/snook/log/export.csv", "/api/snook", "/api/snook/snapshot"]) {
      expect(run(p).headers.get("x-middleware-rewrite"), p).toBeNull();
    }
  });
  it("still gates everything else", () => {
    for (const p of ["/", "/tours", "/snookfoo", "/api/snooker", "/api/checkout"]) {
      expect(run(p).headers.get("x-middleware-rewrite"), p).toContain("/coming-soon");
    }
  });
});
