// V5/lib/api/users/me.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      email: true,
      jobTitle: true,
      avatarColor: true,
      createdAt: true,
      lastLogin: true,
    },
  });
  if (!user) return res.status(404).json({ error: "not found" });
  return res.status(200).json({ user });
});
