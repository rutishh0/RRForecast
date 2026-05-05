// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import postitsList from "@/lib/api/postits/list";
import postitsCreate from "@/lib/api/postits/create";
import postitsId from "@/lib/api/postits/byId";
import postitRead from "@/lib/api/postits/mark-read";
import unreadCount from "@/lib/api/postits/unread-count";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";

let userId: number, token: string;

describe("postits routes", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-postits-secret";
    await prisma.postitRead.deleteMany({});
    await prisma.postitNote.deleteMany({});
    const admin = await prisma.user.findUnique({ where: { username: "admin" } });
    userId = admin!.id;
    token = signJwt({ sub: userId, role: "admin" });
  });

  it("creates a post-it; lists it; updates; marks read", async () => {
    let { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: { contextType: "general", content: "hello world" },
    });
    await postitsCreate(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);
    const created = JSON.parse(res._getData()).postit;

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } }));
    await postitsList(req as any, res as any);
    expect(JSON.parse(res._getData()).postits.length).toBe(1);

    ({ req, res } = createMocks({
      method: "PUT",
      headers: { authorization: `Bearer ${token}` },
      query: { id: String(created.id) },
      body: { content: "edited" },
    }));
    await postitsId(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);

    ({ req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      query: { id: String(created.id) },
    }));
    await postitRead(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } }));
    await unreadCount(req as any, res as any);
    expect(JSON.parse(res._getData()).count).toBe(0);
  });
});
