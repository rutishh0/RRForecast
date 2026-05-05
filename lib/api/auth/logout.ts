// V5/lib/api/auth/logout.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { withAuth } from "@/lib/auth/with-auth";

// Best-effort: client clears localStorage. Server is no-op for stateless JWT.
export default withAuth(async (req: VercelRequest, res: VercelResponse) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }
  return res.status(200).json({ ok: true });
});
