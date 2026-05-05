// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { withAuth } from "@/lib/auth/with-auth";
import { signJwt } from "@/lib/auth/jwt";

describe("withAuth", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-with-auth-secret";
  });

  it("calls handler with userId+role on valid Bearer token", async () => {
    const handler = vi.fn(async (_req, res, ctx) => {
      res.status(200).json({ ctx });
    });
    const wrapped = withAuth(handler);

    const token = signJwt({ sub: 7, role: "manager" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });

    await wrapped(req as any, res as any);

    expect(res._getStatusCode()).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
    expect(JSON.parse(res._getData())).toEqual({ ctx: { userId: 7, role: "manager" } });
  });

  it("returns 401 on missing token", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler);
    const { req, res } = createMocks({ method: "GET" });
    await wrapped(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 403 when adminOnly is set and role isn't admin", async () => {
    const handler = vi.fn();
    const wrapped = withAuth(handler, { adminOnly: true });
    const token = signJwt({ sub: 1, role: "user" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await wrapped(req as any, res as any);
    expect(res._getStatusCode()).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls handler when adminOnly is set and role is admin", async () => {
    const handler = vi.fn(async (_req, res) => res.status(200).json({ ok: true }));
    const wrapped = withAuth(handler, { adminOnly: true });
    const token = signJwt({ sub: 1, role: "admin" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await wrapped(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("returns 500 on handler error if response not yet sent", async () => {
    const handler = vi.fn(async () => { throw new Error("boom"); });
    const wrapped = withAuth(handler);
    const token = signJwt({ sub: 1, role: "admin" });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await wrapped(req as any, res as any);
    expect(res._getStatusCode()).toBe(500);
    expect(JSON.parse(res._getData()).error).toBe("boom");
  });
});
