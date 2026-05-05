// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { createMocks } from "node-mocks-http";
import sendMessage from "@/api/messages/index";
import inbox from "@/api/messages/inbox";
import unreadCount from "@/api/messages/unread-count";
import readMessage from "@/api/messages/[id]/read";
import { signJwt } from "@/lib/auth/jwt";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";

let aliceId: number, bobId: number, aliceToken: string, bobToken: string;

describe("messages routes", () => {
  beforeEach(async () => {
    process.env.JWT_SECRET = "test-msgs-secret";
    await prisma.message.deleteMany({});
    const alice = await prisma.user.upsert({
      where: { username: "test-alice" },
      update: { isActive: true },
      create: { username: "test-alice", passwordHash: await bcrypt.hash("x", 10), displayName: "Alice", role: "user", isActive: true },
    });
    const bob = await prisma.user.upsert({
      where: { username: "test-bob" },
      update: { isActive: true },
      create: { username: "test-bob", passwordHash: await bcrypt.hash("x", 10), displayName: "Bob", role: "user", isActive: true },
    });
    aliceId = alice.id; bobId = bob.id;
    aliceToken = signJwt({ sub: aliceId, role: "user" });
    bobToken   = signJwt({ sub: bobId,   role: "user" });
  });

  it("Alice sends to Bob; Bob's inbox shows it; Alice's doesn't", async () => {
    let { req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${aliceToken}` },
      body: { recipientId: bobId, subject: "Hi", body: "Hello Bob" },
    });
    await sendMessage(req as any, res as any);
    expect(res._getStatusCode()).toBe(201);

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${bobToken}` } }));
    await inbox(req as any, res as any);
    const bobInbox = JSON.parse(res._getData());
    expect(bobInbox.messages.length).toBe(1);
    expect(bobInbox.messages[0].body).toBe("Hello Bob");

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${aliceToken}` } }));
    await inbox(req as any, res as any);
    const aliceInbox = JSON.parse(res._getData());
    expect(aliceInbox.messages.length).toBe(0);
  });

  it("unread count + mark-as-read", async () => {
    const msg = await prisma.message.create({
      data: { senderId: aliceId, recipientId: bobId, body: "hey" },
    });

    let { req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${bobToken}` } });
    await unreadCount(req as any, res as any);
    expect(JSON.parse(res._getData()).count).toBe(1);

    ({ req, res } = createMocks({
      method: "POST",
      headers: { authorization: `Bearer ${bobToken}` },
      query: { id: String(msg.id) },
    }));
    await readMessage(req as any, res as any);
    expect(res._getStatusCode()).toBe(200);

    ({ req, res } = createMocks({ method: "GET", headers: { authorization: `Bearer ${bobToken}` } }));
    await unreadCount(req as any, res as any);
    expect(JSON.parse(res._getData()).count).toBe(0);
  });
});
