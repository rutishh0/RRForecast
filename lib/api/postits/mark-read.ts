// V5/lib/api/postits/mark-read.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  await prisma.postitRead.upsert({
    where: { postitId_userId: { postitId: id, userId } },
    update: { readAt: new Date() },
    create: { postitId: id, userId },
  });

  return res.status(200).json({ ok: true });
});
