// V5/lib/api/users/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const users = await prisma.user.findMany({
    where: { isActive: true },
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
    orderBy: { displayName: "asc" },
  });
  return res.status(200).json({ users });
});
