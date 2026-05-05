// V5/lib/api/messages/unread-count.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const count = await prisma.message.count({ where: { recipientId: userId, isRead: false } });
  return res.status(200).json({ count });
});
