// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { verifyAuth, AuthError } from "@/lib/auth/verify";
import { signJwt } from "@/lib/auth/jwt";

function makeReq(authHeader?: string): any {
  return { headers: { authorization: authHeader }, method: "GET" };
}

describe("verifyAuth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-verifyAuth";
  });

  it("accepts a valid Bearer token, returns userId+role", async () => {
    const token = signJwt({ sub: 42, role: "admin" });
    const r = await verifyAuth(makeReq(`Bearer ${token}`));
    expect(r).toEqual({ userId: 42, role: "admin" });
  });

  it("throws on missing Authorization header", async () => {
    await expect(verifyAuth(makeReq(undefined))).rejects.toThrow(AuthError);
  });

  it("throws when header doesn't start with 'Bearer '", async () => {
    await expect(verifyAuth(makeReq("Basic abc"))).rejects.toThrow(AuthError);
  });

  it("throws on malformed token", async () => {
    await expect(verifyAuth(makeReq("Bearer not.a.jwt"))).rejects.toThrow(AuthError);
  });

  it("throws on tampered signature", async () => {
    const token = signJwt({ sub: 1, role: "user" });
    const tampered = token.slice(0, -4) + "AAAA";
    await expect(verifyAuth(makeReq(`Bearer ${tampered}`))).rejects.toThrow(AuthError);
  });
});
