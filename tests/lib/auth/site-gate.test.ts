// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { verifySiteCode } from "@/lib/auth/site-gate";

describe("verifySiteCode", () => {
  beforeEach(() => {
    process.env.SITE_ACCESS_CODE = "RRForecast2026";
  });

  it("returns true for the exact match", () => {
    expect(verifySiteCode("RRForecast2026")).toBe(true);
  });

  it("returns false for a wrong code", () => {
    expect(verifySiteCode("wrong-code")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(verifySiteCode("")).toBe(false);
  });

  it("returns false for partial match", () => {
    expect(verifySiteCode("RRForecast")).toBe(false);
  });

  it("throws when SITE_ACCESS_CODE env is unset (fail-closed)", () => {
    delete process.env.SITE_ACCESS_CODE;
    expect(() => verifySiteCode("anything")).toThrow(/SITE_ACCESS_CODE/);
  });
});
