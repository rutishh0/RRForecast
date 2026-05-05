// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import postitsIndex from "@/api/postits/index";
import postitsId from "@/api/postits/[id]";
import postitRead from "@/api/postits/[id]/read";
import unreadCount from "@/api/postits/unread-count";
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
    await postitsIndex(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);
    const created = JSON.parse(res._getData()).postit;

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${token}` } }));
    await postitsIndex(req as any, res as any);
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
