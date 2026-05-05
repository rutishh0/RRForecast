// V5/api/users/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleList from "../../lib/api/users/list.js";
import handleMe from "../../lib/api/users/me.js";
import handleById from "../../lib/api/users/byId.js";

function getSegments(req: VercelRequest): string[] {
  const a = req.query.action;
  if (Array.isArray(a)) return a;
  if (typeof a === "string") return [a];
  return [];
}

const NOT_FOUND = (res: VercelResponse) => res.status(404).json({ error: "Not found" });
const METHOD_NOT_ALLOWED = (res: VercelResponse) => res.status(405).json({ error: "method not allowed" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = getSegments(req);
  const method = req.method ?? "GET";

  // /api/users
  if (segments.length === 0) {
    if (method === "GET") return handleList(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/users/<single>
  if (segments.length === 1) {
    const [first] = segments;
    // Check "me" before numeric to avoid mismatch
    if (first === "me") {
      if (method === "GET") return handleMe(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    if (/^\d+$/.test(first)) {
      // /api/users/:id
      (req.query as any).id = first;
      if (method === "GET" || method === "PUT" || method === "DELETE") return handleById(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    return NOT_FOUND(res);
  }

  return NOT_FOUND(res);
}
