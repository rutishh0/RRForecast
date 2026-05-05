// V5/lib/api/admin/put-settings.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../auth/verify.js";
import { prisma } from "../../db/prisma.js";
import { invalidateProviderCache } from "../../ai/harness.js";

const ALLOWED_KEYS = new Set(["ai.primaryProvider", "ai.model", "ai.dailyLimit"]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PUT") return res.status(405).json({ error: "method not allowed" });

  let auth: { userId: number; role: string };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }
  if (auth.role !== "admin") return res.status(403).json({ error: "admin only" });

  const body = (req.body ?? {}) as { settings?: Record<string, unknown> };
  const settings = body.settings ?? {};

  const writes = Object.entries(settings)
    .filter(([k]) => ALLOWED_KEYS.has(k))
    .map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: value as never, updatedBy: auth.userId },
        create: { key, value: value as never, updatedBy: auth.userId },
      }),
    );

  await Promise.all(writes);
  invalidateProviderCache();

  return res.status(200).json({ ok: true });
}
