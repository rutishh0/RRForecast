// V5/api/health.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "../lib/db/prisma.js";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  let dbStatus = "unknown";
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = "connected";
  } catch (e: any) {
    dbStatus = `error: ${e.message ?? "unknown"}`;
  }

  return res.status(200).json({
    ok: true,
    version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev",
    db: dbStatus,
  });
}
