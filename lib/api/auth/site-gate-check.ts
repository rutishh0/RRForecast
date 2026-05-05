// V5/lib/api/auth/site-gate-check.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifySiteCode } from "../../auth/site-gate.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  const code = (req.body?.code ?? "") as string;
  if (typeof code !== "string" || !verifySiteCode(code)) {
    return res.status(401).json({ error: "Invalid site code" });
  }
  return res.status(200).json({ ok: true });
}
