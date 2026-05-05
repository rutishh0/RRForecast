// V5/tests/lib/auth/jwt.test.ts
// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { signJwt, verifyJwt } from "@/lib/auth/jwt";

describe("jwt", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-jwt-roundtrip-fixture";
  });

  it("signs and verifies a token roundtrip", () => {
    const token = signJwt({ sub: 42, role: "admin" });
    const payload = verifyJwt(token);
    expect(payload.sub).toBe(42);
    expect(payload.role).toBe("admin");
  });

  it("includes exp claim 7 days in the future by default", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = signJwt({ sub: 1, role: "user" });
    const payload = verifyJwt(token);
    const after = Math.floor(Date.now() / 1000);
    const expectedMin = before + 7 * 86400;
    const expectedMax = after + 7 * 86400 + 5;
    expect(payload.exp).toBeGreaterThanOrEqual(expectedMin);
    expect(payload.exp).toBeLessThanOrEqual(expectedMax);
  });

  it("rejects tokens with invalid signatures", () => {
    const token = signJwt({ sub: 1, role: "user" });
    const tampered = token.slice(0, -4) + "AAAA";
    expect(() => verifyJwt(tampered)).toThrow();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signJwt({ sub: 1, role: "user" });
    process.env.JWT_SECRET = "different-secret";
    expect(() => verifyJwt(token)).toThrow();
  });

  it("rejects expired tokens", () => {
    const token = signJwt({ sub: 1, role: "user" }, { expiresIn: "0s" });
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => verifyJwt(token)).toThrow(/expired/i);
        resolve();
      }, 50);
    });
  });

  it("throws when JWT_SECRET is unset", () => {
    delete process.env.JWT_SECRET;
    expect(() => signJwt({ sub: 1, role: "user" })).toThrow(/JWT_SECRET/);
  });
});
