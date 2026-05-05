// V5/lib/ai/rate-limit.ts
//
// DB-backed daily rate limit. We count successful AiRequest rows in the last
// 24 hours; any user-attributed call is metered. The harness consults this
// gate before invoking a metered provider (currently Google) and skips the
// call if the user has exhausted their daily allotment.

import { prisma } from "../db/prisma.js";

export interface RateLimitResult {
  allowed: boolean;
  used: number;
  limit: number;
}

/** The default daily allotment if DAILY_AI_REQUEST_LIMIT is unset. */
const DEFAULT_DAILY_LIMIT = 100;

function readLimit(): number {
  const raw = process.env.DAILY_AI_REQUEST_LIMIT;
  if (!raw) return DEFAULT_DAILY_LIMIT;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

/**
 * Check whether the given user has remaining quota. A null userId is allowed
 * (system-issued ad-hoc calls, e.g. for the admin probe) and uses a global
 * counter window.
 */
export async function checkRateLimit(userId?: number | null): Promise<RateLimitResult> {
  const limit = readLimit();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const where: { success: true; createdAt: { gte: Date }; userId?: number } = {
    success: true,
    createdAt: { gte: since },
  };
  if (typeof userId === "number") where.userId = userId;

  const used = await prisma.aiRequest.count({ where });
  return { allowed: used < limit, used, limit };
}
