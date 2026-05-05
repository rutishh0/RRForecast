// V5/api/auth/[...action].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleSiteGateCheck from "../../lib/api/auth/site-gate-check";
import handleLogin from "../../lib/api/auth/login";
import handleLogout from "../../lib/api/auth/logout";
import handleCheck from "../../lib/api/auth/check";
import handleRegister from "../../lib/api/auth/register";
import handleChangePassword from "../../lib/api/auth/change-password";

function getSegments(req: VercelRequest): string[] {
  const a = req.query.action;
  if (Array.isArray(a)) return a;
  if (typeof a === "string") return [a];
  return [];
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
