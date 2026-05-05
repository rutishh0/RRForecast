// V5/api/postits/unread-count.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const allPostits = await prisma.postitNote.findMany({ select: { id: true } });
  const reads = await prisma.postitRead.findMany({
    where: { userId, postitId: { in: allPostits.map((p) => p.id) } },
    select: { postitId: true },
  });
  const readSet = new Set(reads.map((r) => r.postitId));
  const count = allPostits.filter((p) => !readSet.has(p.id)).length;
  return res.status(200).json({ count });
});
