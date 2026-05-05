// V5/api/ai/status.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../lib/auth/verify.js";
import { checkRateLimit } from "../../lib/ai/rate-limit.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  let auth: { userId: number };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }

  const provider = (process.env.AI_PROVIDER ?? "google") as string;
  const dailyLimit = Number(process.env.DAILY_AI_REQUEST_LIMIT ?? 100);
  const rl = await checkRateLimit(auth.userId).catch(() => ({ used: 0, limit: dailyLimit, allowed: true }));

  return res.status(200).json({
    ok: rl.allowed,
    provider,
    dailyUsed: rl.used,
    dailyLimit: rl.limit,
  });
}
