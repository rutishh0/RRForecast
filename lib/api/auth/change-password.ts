// V5/lib/api/auth/change-password.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { currentPassword, newPassword } = (req.body ?? {}) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "currentPassword and newPassword required" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "newPassword must be at least 6 characters" });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(401).json({ error: "Current password is incorrect" });

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Current password is incorrect" });

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

  return res.status(200).json({ ok: true });
});
