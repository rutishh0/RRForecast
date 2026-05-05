// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import frList from "@/lib/api/feature-requests/list";
import frCreate from "@/lib/api/feature-requests/create";
import frId from "@/lib/api/feature-requests/byId";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

let adminId: number, adminToken: string;

describe("feature-requests routes", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-fr-secret";
    await prisma.featureRequest.deleteMany({});
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    adminId = admin!.id;
    adminToken = signJwt({ sub: adminId, role: "admin" });
  });

  it("creates and lists", async () => {
    let { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${adminToken}` },
      body: { title: "T", description: "D" },
    });
    await frCreate(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${adminToken}` } }));
    await frList(req as any, res as any);
    expect(JSON.parse(res._getData()).requests.length).toBe(1);
  });

  it("PUT status only by admin", async () => {
    const fr = await prisma.featureRequest.create({
      data: { requesterId: adminId, title: "x", description: "y" },
    });
    const userToken = signJwt({ sub: 99999, role: "user" });
    let { req, res } = createMocks({
      method: "PUT",
      headers: { authorization: `Bearer ${userToken}` },
      query: { id: String(fr.id) },
      body: { status: "completed" },
    });
    await frId(req as any, res as any);
    expect(res._getStatusCode()).toBe(403);

    ({ req, res } = createMocks({
      method: "PUT",
      headers: { authorization: `Bearer ${adminToken}` },
      query: { id: String(fr.id) },
      body: { status: "completed" },
    }));
    await frId(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const fresh = await prisma.featureRequest.findUnique({ where: { id: fr.id } });
    expect(fresh!.status).toBe("completed");
  });
});
