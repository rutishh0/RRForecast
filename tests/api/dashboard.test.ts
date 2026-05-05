// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import dashboardIndex from "@/api/dashboard/index";
import dashboardId from "@/api/dashboard/[id]";
import summary from "@/api/dashboard/summary";
import upcoming from "@/api/dashboard/upcoming";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

let token: string;
let userId: number;

describe("dashboard routes", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-dashboard-secret";
    await prisma.dashboardItem.deleteMany({});
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    userId = admin!.id;
    token = signJwt({ sub: userId, role: "admin" });
  });

  it("POST creates an item, GET lists it", async () => {
    let { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { itemType: "todo", title: "Test todo", priority: "high" },
    });
    await dashboardIndex(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } }));
    await dashboardIndex(req as any, res as any);
    const data = JSON.parse(res._getData());
    expect(data.items.length).toBe(1);
    expect(data.items[0].title).toBe("Test todo");
  });

  it("PUT updates only own items", async () => {
    const created = await prisma.dashboardItem.create({
      data: { userId, itemType: "todo", title: "mine" },
    });
    const { req, res } = createMocks({
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
      query: { id: String(created.id) },
      body: { title: "updated" },
    });
    await dashboardId(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);
    const fresh = await prisma.dashboardItem.findUnique({ where: { id: created.id } });
    expect(fresh!.title).toBe("updated");
  });

  it("DELETE returns 404 for items not owned by caller", async () => {
    const other = await prisma.user.upsert({
      where: { username: "test-other" },
      update: { isActive: true },
      create: { username: "test-other", passwordHash: await bcrypt.hash("x", 10), displayName: "Other", role: "user", isActive: true },
    });
    const created = await prisma.dashboardItem.create({
      data: { userId: other.id, itemType: "todo", title: "theirs" },
    });
    const { req, res } = createMocks({
      method: "DELETE",
      headers: { authorization: `Bearer ${token}` },
      query: { id: String(created.id) },
    });
    await dashboardId(req as any, res as any);
    expect(res._getStatusCode()).toBe(404);
  });

  it("summary returns expected counts", async () => {
    await prisma.dashboardItem.createMany({
      data: [
        { userId, itemType: "todo", title: "t1", status: "pending" },
        { userId, itemType: "todo", title: "t2", status: "completed" },
        { userId, itemType: "action_item", title: "a1", status: "pending" },
      ],
    });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await summary(req as any, res as any);
    const data = JSON.parse(res._getData());
    expect(data.todosPending).toBe(1);
    expect(data.actionItemsPending).toBe(1);
  });

  it("upcoming returns items due in next 7 days", async () => {
    const tomorrow = new Date(Date.now() + 86400_000);
    const farFuture = new Date(Date.now() + 30 * 86400_000);
    await prisma.dashboardItem.createMany({
      data: [
        { userId, itemType: "deadline", title: "soon", dueDate: tomorrow },
        { userId, itemType: "deadline", title: "later", dueDate: farFuture },
      ],
    });
    const { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } });
    await upcoming(req as any, res as any);
    const data = JSON.parse(res._getData());
    expect(data.items.length).toBe(1);
    expect(data.items[0].title).toBe("soon");
  });
});
