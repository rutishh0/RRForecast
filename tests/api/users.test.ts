// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import usersIndex from "@/api/users/index";
import usersMe from "@/api/users/me";
import usersId from "@/api/users/[id]";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

let adminId: number, adminToken: string;

describe("users routes", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-users-secret";
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    adminId = admin!.id;
    adminToken = signJwt({ sub: adminId, role: "admin" });
  });

  it("GET / lists active users (no passwordHash)", async () => {
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${adminToken}` } });
    await usersIndex(req as any, res as any);
    const data = JSON.parse(res._getData());
    expect(Array.isArray(data.users)).toBe(true);
    expect(data.users.find((u: any) => u.username === "admin")).toBeDefined();
    expect(data.users[0].passwordHash).toBeUndefined();
  });

  it("GET /me returns the calling user", async () => {
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${adminToken}` } });
    await usersMe(req as any, res as any);
    expect(JSON.parse(res._getData()).user.username).toBe("admin");
  });

  it("DELETE refuses to delete the only admin", async () => {
    // Ensure admin is the only active admin
    await prisma.user.updateMany({ where: { role: "admin" }, data: { isActive: false } });
    await prisma.user.update({ where: { id: adminId }, data: { isActive: true } });

    const { req, res } = createMocks({
      method: "DELETE",
      headers: { authorization: `Bearer ${adminToken}` },
      query: { id: String(adminId) },
    });
    await usersId(req as any, res as any);
    expect(res._getStatusCode()).toBe(400);
    expect(JSON.parse(res._getData()).error).toMatch(/only active admin/i);
  });
});
