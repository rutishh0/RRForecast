// V5/lib/api/feature-requests/create.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "../../auth/with-auth.js";
import { prisma } from "../../db/prisma.js";

export default withAuth(async (req: VercelRequest, res: VercelResponse, { userId }) => {
  if (req.method !== "POST") return res.status(405).json({ error: "method not allowed" });

  const b = (req.body ?? {}) as any;
  if (!b.title || !b.description) {
    return res.status(400).json({ error: "title and description required" });
  }
  const request = await prisma.featureRequest.create({
    data: { requesterId: userId, title: b.title, description: b.description },
  });
  return res.status(201).json({ request });
});
