// V5/lib/api/auth/login.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { verifySiteCode } from "@/lib/auth/site-gate";
import { signJwt } from "@/lib/auth/jwt";

const GENERIC_401 = { error: "Invalid credentials" };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  const { siteCode, username, password } = (req.body ?? {}) as {
    siteCode?: string;
    username?: string;
    password?: string;
  };

  if (typeof siteCode !== "string" || typeof username !== "string" || typeof password !== "string") {
    return res.status(401).json(GENERIC_401);
  }

  // 1. Site code check (timing-safe)
  if (!verifySiteCode(siteCode)) {
    return res.status(401).json(GENERIC_401);
  }

  // 2. User lookup
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user || !user.isActive) {
    // run a dummy bcrypt to keep timing constant-ish
    await bcrypt.compare("dummy", "$2b$10$abcdefghijklmnopqrstuv.abcdefghijklmnopqrstuvwxyz1234");
    return res.status(401).json(GENERIC_401);
  }

  // 3. Password check
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json(GENERIC_401);
  }

  // 4. Update lastLogin
  await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } });

  // 5. Sign JWT
  const token = signJwt({ sub: user.id, role: user.role as "admin" | "manager" | "user" });

  // 6. Return token + sanitized user
  const { passwordHash: _passwordHash, ...safeUser } = user;
  return res.status(200).json({ token, user: safeUser });
}
