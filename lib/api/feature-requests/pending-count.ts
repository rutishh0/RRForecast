// V5/lib/api/feature-requests/pending-count.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db/prisma";

export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });
  const count = await prisma.featureRequest.count({
    where: { status: { in: ["submitted", "under_review"] } },
  });
  return res.status(200).json({ count });
});
