// V5/lib/api/messages/inbox.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const messages = await prisma.message.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    include: { sender: { select: { id: true, displayName: true, avatarColor: true, jobTitle: true } } },
  });
  return res.status(200).json({ messages });
});
