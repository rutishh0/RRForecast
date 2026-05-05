// V5/lib/api/dashboard/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const b = (req.body ?? {}) as any;
  if (!b.itemType || !b.title) return res.status(400).json({ error: "itemType and title required" });
  const item = await prisma.dashboardItem.create({
    data: {
      userId,
      itemType: b.itemType,
      title: b.title,
      description: b.description ?? null,
      dueDate: b.dueDate ? new Date(b.dueDate) : null,
      priority: b.priority ?? "medium",
      relatedEsn: b.relatedEsn ?? null,
      relatedEngineType: b.relatedEngineType ?? null,
    },
  });
  return res.status(201).json({ item });
});
