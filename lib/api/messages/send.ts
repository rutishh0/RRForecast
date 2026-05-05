// V5/lib/api/messages/send.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const b = (req.body ?? {}) as any;
  const recipientId = parseInt(b.recipientId, 10);
  const body = (b.body ?? "").trim();

  if (!Number.isFinite(recipientId)) return res.status(400).json({ error: "recipientId required" });
  if (!body) return res.status(400).json({ error: "body required" });

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.isActive) return res.status(404).json({ error: "recipient not found" });

  const message = await prisma.message.create({
    data: { senderId: userId, recipientId, subject: b.subject ?? null, body },
  });
  return res.status(201).json({ message });
});
