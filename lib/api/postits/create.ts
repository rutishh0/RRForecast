// V5/lib/api/postits/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const b = (req.body ?? {}) as any;
  if (!b.contextType || !b.content) {
    return res.status(400).json({ error: "contextType and content required" });
  }
  const postit = await prisma.postitNote.create({
    data: {
      authorId: userId,
      contextType: b.contextType,
      contextId: b.contextId ?? null,
      content: b.content,
      color: b.color ?? "#FBBF24",
      positionX: b.positionX ?? null,
      positionY: b.positionY ?? null,
    },
  });
  return res.status(201).json({ postit });
});
