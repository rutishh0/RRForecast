// V5/lib/api/messages/delete.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "DELETE") return res.status(405).json({ error: "method not allowed" });
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const msg = await prisma.message.findFirst({
    where: { id, OR: [{ senderId: userId }, { recipientId: userId }] },
  });
  if (!msg) return res.status(404).json({ error: "not found" });

  await prisma.message.delete({ where: { id } });
  return res.status(200).json({ ok: true });
});
