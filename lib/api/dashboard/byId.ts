// V5/lib/api/dashboard/byId.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const owned = await prisma.dashboardItem.findFirst({ where: { id, userId } });
  if (!owned) return res.status(404).json({ error: "not found" });

  if (req.method === "PUT") {
    const b = (req.body ?? {}) as any;
    const item = await prisma.dashboardItem.update({
      where: { id },
      data: {
        title: b.title ?? owned.title,
        description: b.description ?? owned.description,
        dueDate: b.dueDate !== undefined ? (b.dueDate ? new Date(b.dueDate) : null) : owned.dueDate,
        priority: b.priority ?? owned.priority,
        status: b.status ?? owned.status,
        relatedEsn: b.relatedEsn ?? owned.relatedEsn,
        relatedEngineType: b.relatedEngineType ?? owned.relatedEngineType,
      },
    });
    return res.status(200).json({ item });
  }

  if (req.method === "DELETE") {
    await prisma.dashboardItem.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
});
