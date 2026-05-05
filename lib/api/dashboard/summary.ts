// V5/lib/api/dashboard/summary.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const inSevenDays = new Date(Date.now() + 7 * 86400_000);

  const [deadlinesApproaching, todosPending, actionItemsPending, meetingsUpcoming] = await Promise.all([
    prisma.dashboardItem.count({
      where: {
        userId,
        itemType: "deadline",
        status: { not: "completed" },
        dueDate: { not: null, lte: inSevenDays },
      },
    }),
    prisma.dashboardItem.count({
      where: { userId, itemType: "todo", status: { not: "completed" } },
    }),
    prisma.dashboardItem.count({
      where: { userId, itemType: "action_item", status: { not: "completed" } },
    }),
    prisma.dashboardItem.count({
      where: {
        userId,
        itemType: "meeting",
        status: { not: "completed" },
        dueDate: { not: null, gte: new Date() },
      },
    }),
  ]);

  return res.status(200).json({ deadlinesApproaching, todosPending, actionItemsPending, meetingsUpcoming });
});
