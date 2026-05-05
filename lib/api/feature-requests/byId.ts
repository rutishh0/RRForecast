// V5/lib/api/feature-requests/byId.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId, role }) => {
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const found = await prisma.featureRequest.findUnique({
    where: { id },
    include: { requester: { select: { id: true, displayName: true, avatarColor: true, jobTitle: true } } },
  });
  if (!found) return res.status(404).json({ error: "not found" });

  if (req.method === "GET") return res.status(200).json({ request: found });

  if (req.method === "PUT") {
    if (role !== "admin") return res.status(403).json({ error: "admin only" });
    const b = (req.body ?? {}) as any;
    const allowedStatuses = ["submitted", "under_review", "in_progress", "completed", "declined"];
    if (b.status && !allowedStatuses.includes(b.status)) {
      return res.status(400).json({ error: "invalid status" });
    }
    const request = await prisma.featureRequest.update({
      where: { id },
      data: {
        status: b.status ?? found.status,
        adminNotes: b.adminNotes ?? found.adminNotes,
      },
    });
    return res.status(200).json({ request });
  }

  if (req.method === "DELETE") {
    if (role !== "admin" && found.requesterId !== userId) {
      return res.status(403).json({ error: "not your request" });
    }
    await prisma.featureRequest.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
});
