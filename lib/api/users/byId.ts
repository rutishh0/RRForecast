// V5/lib/api/users/byId.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId, role }) => {
  const id = parseInt(Array.isArray(req.query.id) ? req.query.id[0] : (req.query.id as string), 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid id" });

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return res.status(404).json({ error: "not found" });

  const safeUser = (u: typeof target) => {
    const { passwordHash, ...rest } = u;
    return rest;
  };

  if (req.method === "GET") return res.status(200).json({ user: safeUser(target) });

  if (req.method === "PUT") {
    const isSelf = id === userId;
    if (!isSelf && role !== "admin") return res.status(403).json({ error: "not allowed" });

    const b = (req.body ?? {}) as any;
    const data: any = {};
    if (typeof b.displayName === "string") data.displayName = b.displayName;
    if (typeof b.email === "string" || b.email === null) data.email = b.email;
    if (typeof b.jobTitle === "string" || b.jobTitle === null) data.jobTitle = b.jobTitle;
    if (typeof b.avatarColor === "string" || b.avatarColor === null) data.avatarColor = b.avatarColor;
    // Only admin can change role; user cannot change own role
    if (b.role && role === "admin" && !isSelf) {
      if (!["admin", "manager", "user"].includes(b.role)) {
        return res.status(400).json({ error: "invalid role" });
      }
      data.role = b.role;
    }

    const updated = await prisma.user.update({ where: { id }, data });
    return res.status(200).json({ user: safeUser(updated) });
  }

  if (req.method === "DELETE") {
    if (role !== "admin") return res.status(403).json({ error: "admin only" });

    // Last-admin guard
    if (target.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin", isActive: true } });
      if (adminCount <= 1) {
        return res.status(400).json({ error: "Cannot delete the only active admin" });
      }
    }
    // Soft delete (preserve FKs for messages/post-its)
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
});
