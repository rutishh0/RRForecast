// V5/lib/api/auth/check.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth } from "@/lib/auth/verify";
import { prisma } from "@/lib/db/prisma";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method not allowed" });
  }
  try {
    const { userId } = await verifyAuth(req);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isActive) {
      return res.status(401).json({ authenticated: false });
    }
    const { passwordHash, ...safe } = user;
    return res.status(200).json({ authenticated: true, user: safe });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
}
