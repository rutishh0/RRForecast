// V5/lib/api/admin/get-settings.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../auth/verify.js";
import { prisma } from "../../db/prisma.js";

const SETTING_KEYS = [
  "ai.primaryProvider",
  "ai.model",
  "ai.dailyLimit",
] as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  let auth: { userId: number; role: string };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }
  if (auth.role !== "admin") return res.status(403).json({ error: "admin only" });

  const rows = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  });

  const settings: Record<string, unknown> = {};
  for (const row of rows) settings[row.key] = row.value;

  // Fall back to env defaults for unset keys
  if (settings["ai.primaryProvider"] == null) {
    settings["ai.primaryProvider"] = process.env.AI_PROVIDER ?? "google";
  }
  if (settings["ai.dailyLimit"] == null) {
    settings["ai.dailyLimit"] = Number(process.env.DAILY_AI_REQUEST_LIMIT ?? 100);
  }

  return res.status(200).json({ settings });
}
