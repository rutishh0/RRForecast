// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import siteGateCheck from "@/api/auth/site-gate-check";
import login from "@/api/auth/login";
import check from "@/api/auth/check";
import logout from "@/api/auth/logout";
import register from "@/api/auth/register";
import changePassword from "@/api/auth/change-password";
import { prisma } from "@/lib/db/prisma";
import { signJwt } from "@/lib/auth/jwt";
import bcrypt from "bcryptjs";

describe("POST /api/auth/site-gate-check", () => {
  beforeEach(() => {
    process.env.SITE_ACCESS_CODE = "RRForecast2026";
  });

  it("returns 200 ok on valid code", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { code: "RRForecast2026" },
    });
    await siteGateCheck(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    expect(JSON.parse(res._getData())).toEqual({ ok: true });
  });

  it("returns 401 on invalid code", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { code: "wrong" },
    });
    await siteGateCheck(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).error).toMatch(/invalid/i);
  });

  it("returns 405 on non-POST", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await siteGateCheck(req as any, res as any);
    expect(res._getStatusCode()).toBe(405);
  });

  it("returns 401 on missing body", async () => {
    const { req, res } = createMocks({ method: "POST", body: {} });
    await siteGateCheck(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    process.env.SITE_ACCESS_CODE = "RRForecast2026";
    process.env.JWT_SECRET = "test-login-secret";
    // Ensure admin user exists with known password
    await prisma.user.upsert({
      where: { username: "admin" },
      update: { passwordHash: await bcrypt.hash("admin123", 10), isActive: true, role: "admin" },
      create: { username: "admin", passwordHash: await bcrypt.hash("admin123", 10), displayName: "Administrator", role: "admin", isActive: true },
    });
  });

  it("returns 200 + token + user on valid creds", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { siteCode: "RRForecast2026", username: "admin", password: "admin123" },
    });
    await login(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.token).toMatch(/^eyJ/);
    expect(data.user).toMatchObject({ username: "admin", role: "admin" });
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("returns 401 on wrong site code", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { siteCode: "wrong", username: "admin", password: "admin123" },
    });
    await login(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).error).toBe("Invalid credentials");
  });

  it("returns 401 on wrong password (same generic message)", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { siteCode: "RRForecast2026", username: "admin", password: "wrong" },
    });
    await login(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).error).toBe("Invalid credentials");
  });

  it("returns 401 on unknown user (same generic message)", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: { siteCode: "RRForecast2026", username: "nobody", password: "x" },
    });
    await login(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).error).toBe("Invalid credentials");
  });

  it("returns 401 on inactive user", async () => {
    await prisma.user.update({ where: { username: "admin" }, data: { isActive: false } });
    const { req, res } = createMocks({
      method: "POST",
      body: { siteCode: "RRForecast2026", username: "admin", password: "admin123" },
    });
    await login(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    // restore for other tests
    await prisma.user.update({ where: { username: "admin" }, data: { isActive: true } });
  });
});

describe("GET /api/auth/check", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-check-secret";
  });

  it("returns authenticated:true with fresh user on valid JWT", async () => {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: user!.id, role: "admin" });
    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    await check(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.authenticated).toBe(true);
    expect(data.user.username).toBe("admin");
    expect(data.user.passwordHash).toBeUndefined();
  });

  it("returns authenticated:false on missing token", async () => {
    const { req, res } = createMocks({ method: "GET" });
    await check(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).authenticated).toBe(false);
  });

  it("returns authenticated:false on invalid token", async () => {
    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: "Bearer not.a.valid.jwt" },
    });
    await check(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).authenticated).toBe(false);
  });

  it("returns authenticated:false when user is deactivated", async () => {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: user!.id, role: "admin" });
    await prisma.user.update({ where: { id: user!.id }, data: { isActive: false } });
    const { req, res } = createMocks({
      method: "GET",
      headers: { authorization: `Bearer ${token}` },
    });
    await check(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
    expect(JSON.parse(res._getData()).authenticated).toBe(false);
    await prisma.user.update({ where: { id: user!.id }, data: { isActive: true } });
  });
});

describe("POST /api/auth/logout", () => {
  beforeEach(() => { process.env.JWT_SECRET = "test-logout-secret"; });

  it("returns 200 ok with valid token", async () => {
    const user = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: user!.id, role: "admin" });
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
    });
    await logout(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
  });
});

describe("POST /api/auth/register (admin only)", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-register-secret";
    // Clean up any prior test users
    await prisma.user.deleteMany({ where: { username: { startsWith: "test-reg-" } } });
  });

  it("returns 403 for non-admin", async () => {
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${signJwt({ sub: 99999, role: "user" })}` },
      body: { username: "test-reg-1", password: "x", displayName: "X" },
    });
    await register(req as any, res as any);
    expect(res._getStatusCode()).toBe(403);
  });

  it("creates user for admin", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${signJwt({ sub: admin!.id, role: "admin" })}` },
      body: { username: "test-reg-1", password: "secret123", displayName: "Test User", role: "user" },
    });
    await register(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);
    expect(JSON.parse(res._getData()).userId).toBeGreaterThan(0);
  });

  it("returns 409 on duplicate username", async () => {
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    const token = signJwt({ sub: admin!.id, role: "admin" });
    const body = { username: "test-reg-dup", password: "x123", displayName: "Dup" };
    const a = createMocks({ method: "POST", headers: { authorization: `Bearer ${token}` }, body });
    await register(a.req as any, a.res as any);
    const b = createMocks({ method: "POST", headers: { authorization: `Bearer ${token}` }, body });
    await register(b.req as any, b.res as any);
    expect(b.res._getStatusCode()).toBe(409);
  });
});

describe("POST /api/auth/change-password", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-cp-secret";
    await prisma.user.upsert({
      where: { username: "test-cp" },
      update: { passwordHash: await bcrypt.hash("oldpw123", 10), isActive: true, role: "user" },
      create: { username: "test-cp", passwordHash: await bcrypt.hash("oldpw123", 10), displayName: "CP", role: "user", isActive: true },
    });
  });

  it("changes password with correct current", async () => {
    const u = await prisma.user.findUnique({ where: { username: "test-cp" } });
    const token = signJwt({ sub: u!.id, role: "user" });
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { currentPassword: "oldpw123", newPassword: "newpw456" },
    });
    await changePassword(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const fresh = await prisma.user.findUnique({ where: { id: u!.id } });
    const ok = await bcrypt.compare("newpw456", fresh!.passwordHash);
    expect(ok).toBe(true);
  });

  it("rejects wrong current password", async () => {
    const u = await prisma.user.findUnique({ where: { username: "test-cp" } });
    const token = signJwt({ sub: u!.id, role: "user" });
    const { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { currentPassword: "wrong", newPassword: "newpw456" },
    });
    await changePassword(req as any, res as any);
    expect(res._getStatusCode()).toBe(401);
  });
});
