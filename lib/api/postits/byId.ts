// V5/lib/api/postits/byId.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId, role }) => {
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const note = await prisma.postitNote.findUnique({ where: { id } });
  if (!note) return res.status(404).json({ error: "not found" });

  if (req.method === "PUT") {
    if (note.authorId !== userId) return res.status(403).json({ error: "not your post-it" });
    const b = (req.body ?? {}) as any;
    if (typeof b.content !== "string") return res.status(400).json({ error: "content required" });
    const postit = await prisma.postitNote.update({ where: { id }, data: { content: b.content } });
    return res.status(200).json({ postit });
  }

  if (req.method === "DELETE") {
    if (note.authorId !== userId && role !== "admin") {
      return res.status(403).json({ error: "not your post-it" });
    }
    await prisma.postitNote.delete({ where: { id } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
});
