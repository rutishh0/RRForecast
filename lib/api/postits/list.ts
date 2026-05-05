// V5/lib/api/postits/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const contextType = req.query.context_type as string | undefined;
  const contextId   = req.query.context_id   as string | undefined;
  const where: any = {};
  if (contextType) where.contextType = contextType;
  if (contextId)   where.contextId   = contextId;
  const postits = await prisma.postitNote.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, displayName: true, avatarColor: true } } },
  });
  return res.status(200).json({ postits });
});
