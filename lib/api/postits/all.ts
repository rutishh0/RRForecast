// V5/lib/api/postits/all.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const postits = await prisma.postitNote.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { id: true, displayName: true, avatarColor: true } } },
  });
  return res.status(200).json({ postits });
});
