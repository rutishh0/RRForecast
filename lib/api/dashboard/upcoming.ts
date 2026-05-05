// V5/lib/api/dashboard/upcoming.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const inSevenDays = new Date(Date.now() + 7 * 86400_000);

  const items = await prisma.dashboardItem.findMany({
    where: {
      userId,
      status: { not: "completed" },
      dueDate: { not: null, gte: new Date(), lte: inSevenDays },
    },
    orderBy: { dueDate: "asc" },
  });

  return res.status(200).json({ items });
});
