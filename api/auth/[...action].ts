// V5/api/auth/[...action].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleSiteGateCheck from "../../lib/api/auth/site-gate-check.js";
import handleLogin from "../../lib/api/auth/login.js";
import handleLogout from "../../lib/api/auth/logout.js";
import handleCheck from "../../lib/api/auth/check.js";
import handleRegister from "../../lib/api/auth/register.js";
import handleChangePassword from "../../lib/api/auth/change-password.js";

function getSegments(req: VercelRequest): string[] {
  // Parse URL directly — Vercel's @vercel/node v5 does not reliably populate
  // req.query for catch-all routes. /api/<resource>/<...rest> → <...rest>.
  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const parts = pathOnly.split("/").filter((s) => s.length > 0);
  return parts.slice(2);
}

const NOT_FOUND = (res: VercelResponse) => res.status(404).json({ error: "Not found" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = getSegments(req);

  if (segments.length === 1) {
    const [first] = segments;
    switch (first) {
      case "site-gate-check": return handleSiteGateCheck(req, res);
      case "login":           return handleLogin(req, res);
      case "logout":          return handleLogout(req, res);
      case "check":           return handleCheck(req, res);
      case "register":        return handleRegister(req, res);
      case "change-password": return handleChangePassword(req, res);
    }
  }

  return NOT_FOUND(res);
}
