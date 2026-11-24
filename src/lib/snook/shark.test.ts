import { describe, expect, it } from "vitest";
import { SHARK } from "./config";
import { daysToFloodStage, marshNormalsFor, marshState, normalFor, parseRdb, rateAreas } from "./shark";

const rating = (areas: ReturnType<typeof rateAreas>, id: string) => areas.find((a) => a.id === id)!.rating;

describe("marsh state", () => {
  it("reads draining only below flood stage while falling", () => {
    expect(marshState(0.9, -0.1)).toBe("draining");
    expect(marshState(0.9, 0)).toBe("lowSteady");
    expect(marshState(1.3, -0.1)).toBe("floodedFalling");
    expect(marshState(1.3, -0.02)).toBe("floodedSteady");
    expect(marshState(1.3, 0.2)).toBe("rising");
    expect(marshState(-0.1, -0.1)).toBe("nearlyDry");
  });
  it("estimates days to flood stage at the 14-day rate", () => {
    // 0.28 ft above flood stage, falling 0.14 ft per 14 days = 0.01 ft/day
    expect(daysToFloodStage(SHARK.marsh.floodStageFt + 0.28, -0.14)).toBe(28);
    expect(daysToFloodStage(0.5, -0.14)).toBeNull();
    expect(daysToFloodStage(1.5, 0.1)).toBeNull();
    expect(daysToFloodStage(1.19, -0.03)).toBeNull(); // too small a drop to project
    expect(daysToFloodStage(1.19, -0.07)).toBe(42);
  });
});

describe("normal ranges", () => {
  const p = { p10: 1, p25: 2, p75: 4, p90: 5 };
  it("labels readings against past-year percentiles", () => {
    expect(normalFor(0.5, p)).toBe("well below normal");
    expect(normalFor(1.5, p)).toBe("below normal");
    expect(normalFor(3, p)).toBe("normal");
    expect(normalFor(4.5, p)).toBe("above normal");
    expect(normalFor(6, p)).toBe("well above normal");
  });
  it("has an MO-215 normal for every calendar day", () => {
    expect(marshNormalsFor("2026-11-23")?.p50).toBeGreaterThan(1);
    expect(marshNormalsFor("2028-02-29")).not.toBeNull();
    expect(marshNormalsFor("2026-05-15")!.p50).toBeLessThan(marshNormalsFor("2026-10-15")!.p50);
  });
});

describe("area ratings", () => {
  it("rates Rookery Branch High when the marsh drains in the dry season", () => {
    const a = rateAreas({ month: 3, marsh: { ft: 0.8, change14: -0.2, state: "draining" }, coldestWaterF: 72, windKt: 8 });
    expect(rating(a, "rookery")).toBe("High");
    expect(rating(a, "tarponEast")).toBe("High");
    expect(rating(a, "ponce")).toBe("Moderate");
  });
  it("favors the coast in the wet season", () => {
    const a = rateAreas({ month: 7, marsh: { ft: 1.6, change14: 0.3, state: "rising" }, coldestWaterF: 86, windKt: 8 });
    expect(rating(a, "rookery")).toBe("Low");
    expect(a.find((x) => x.id === "ponce")!.points).toBeGreaterThan(0);
  });
  it("marks the open coast Low in a cold, windy spell", () => {
    const a = rateAreas({ month: 1, marsh: null, coldestWaterF: 56, windKt: 18 });
    expect(rating(a, "ponce")).toBe("Low");
    expect(rating(a, "lowerCoastal")).toBe("Low");
    expect(a.find((x) => x.id === "lowerInterior")!.points).toBeGreaterThan(0);
  });
  it("explains every point it gives", () => {
    const a = rateAreas({ month: 3, marsh: { ft: 0.8, change14: -0.2, state: "draining" }, coldestWaterF: 72, windKt: 8 });
    const r = a.find((x) => x.id === "rookery")!;
    expect(r.reasons.length).toBe(3);
    expect(r.points).toBe(4);
  });
});

describe("USGS RDB parsing", () => {
  it("skips comments and the column-width row", () => {
    const rows = parseRdb("# comment\nagency_cd\tsite_no\tvalue\n5s\t15s\t14n\nUSGS\t123\t1.21\n");
    expect(rows).toEqual([{ agency_cd: "USGS", site_no: "123", value: "1.21" }]);
  });
});
