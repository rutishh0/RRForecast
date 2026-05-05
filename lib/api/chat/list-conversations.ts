// V5/lib/api/chat/list-conversations.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../auth/verify.js";
import { prisma } from "../../db/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  let auth: { userId: number };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }

  const conversations = await prisma.conversation.findMany({
    where: { userId: auth.userId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return res.status(200).json({ conversations });
}
