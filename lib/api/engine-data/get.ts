// V5/lib/api/engine-data/get.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const [shopVisits, forecasts] = await Promise.all([
    prisma.shopVisit.findMany(),
    prisma.forecast.findMany(),
  ]);

  // Most recent uploadedAt across both tables
  let uploadedAt: Date | null = null;
  for (const r of [...shopVisits, ...forecasts]) {
    if (!uploadedAt || r.uploadedAt > uploadedAt) uploadedAt = r.uploadedAt;
  }

  return res.status(200).json({
    shopVisits,
    forecasts,
    uploadedAt: uploadedAt?.toISOString() ?? null,
  });
});
