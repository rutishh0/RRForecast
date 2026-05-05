// V5/lib/auth/with-auth.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth } from "./verify.js";
import type { Role } from "./jwt.js";

export interface AuthContext {
  userId: number;
  role: Role;
}

export function withAuth<T = void>(
  handler: (req: VercelRequest, res: VercelResponse, ctx: AuthContext) => Promise<T>,
  opts: { adminOnly?: boolean } = {},
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    let ctx: AuthContext;
    try {
      ctx = await verifyAuth(req);
    } catch (e: any) {
      return res.status(e?.statusCode ?? 401).json({ error: e?.message ?? "unauthorized" });
    }
    if (opts.adminOnly && ctx.role !== "admin") {
      return res.status(403).json({ error: "admin only" });
    }
    try {
      await handler(req, res, ctx);
    } catch (e: any) {
      console.error(`[${req.method} ${req.url}]`, e);
      if (!res.headersSent) {
        res.status(e?.statusCode ?? 500).json({ error: e?.message ?? "internal error" });
      }
    }
  };
}
