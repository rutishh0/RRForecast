// V5/lib/api/chat/delete-conversation.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../auth/verify.js";
import { prisma } from "../../db/prisma.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "method not allowed" });

  let auth: { userId: number };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }

  const id = Array.isArray(req.query.id) ? req.query.id[0] : req.query.id;
  if (typeof id !== "string" || !id) return res.status(400).json({ error: "id required" });

  const conv = await prisma.conversation.findFirst({
    where: { id, userId: auth.userId },
  });
  if (!conv) return res.status(404).json({ error: "not found" });

  await prisma.conversation.delete({ where: { id } });
  return res.status(200).json({ ok: true });
}
