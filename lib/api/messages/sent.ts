// V5/lib/api/messages/sent.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const messages = await prisma.message.findMany({
    where: { senderId: userId },
    orderBy: { createdAt: "desc" },
    include: { recipient: { select: { id: true, displayName: true, avatarColor: true, jobTitle: true } } },
  });
  return res.status(200).json({ messages });
});
