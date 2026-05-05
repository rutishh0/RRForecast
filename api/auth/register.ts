// V5/api/auth/register.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const { username, password, displayName, role, jobTitle, email } = (req.body ?? {}) as {
    username?: string;
    password?: string;
    displayName?: string;
    role?: "admin" | "manager" | "user";
    jobTitle?: string;
    email?: string;
  };

  if (!username || !password || !displayName) {
    return res.status(400).json({ error: "username, password, and displayName required" });
  }
  if (role && !["admin", "manager", "user"].includes(role)) {
    return res.status(400).json({ error: "invalid role" });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { username, passwordHash, displayName, role: role ?? "user", jobTitle, email, isActive: true },
    });
    return res.status(201).json({ userId: created.id });
  } catch (e: any) {
    if (e?.code === "P2002") {
      return res.status(409).json({ error: "Username already exists" });
    }
    throw e;
  }
}, { adminOnly: true });
