// V5/lib/api/dashboard/list.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "GET") return res.status(405).json({ error: "method not allowed" });

  const type = req.query.type as string | undefined;
  const where: any = { userId };
  if (type) where.itemType = type;
  const items = await prisma.dashboardItem.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }],
  });
  return res.status(200).json({ items });
});
