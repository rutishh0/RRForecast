// V5/api/feature-requests/index.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method === "GET") {
    const requests = await prisma.featureRequest.findMany({
      orderBy: { createdAt: "desc" },
      include: { requester: { select: { id: true, displayName: true, avatarColor: true, jobTitle: true } } },
    });
    return res.status(200).json({ requests });
  }

  if (req.method === "POST") {
    const b = (req.body ?? {}) as any;
    if (!b.title || !b.description) {
      return res.status(400).json({ error: "title and description required" });
    }
    const request = await prisma.featureRequest.create({
      data: { requesterId: userId, title: b.title, description: b.description },
    });
    return res.status(201).json({ request });
  }

  return res.status(405).json({ error: "method not allowed" });
});
