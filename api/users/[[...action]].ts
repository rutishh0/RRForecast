// V5/api/users/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleList from "../../lib/api/users/list.js";
import handleMe from "../../lib/api/users/me.js";
import handleById from "../../lib/api/users/byId.js";

function getSegments(req: VercelRequest): string[] {
  // Parse URL directly — Vercel's @vercel/node v5 does not reliably populate
  // req.query for catch-all routes. /api/<resource>/<...rest> → <...rest>.
  const url = req.url ?? "";
  const pathOnly = url.split("?")[0];
  const parts = pathOnly.split("/").filter((s) => s.length > 0);
  return parts.slice(2);
}

const NOT_FOUND = (res: VercelResponse) => res.status(404).json({ error: "Not found" });
const METHOD_NOT_ALLOWED = (res: VercelResponse) => res.status(405).json({ error: "method not allowed" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const segments = getSegments(req);
  const method = req.method ?? "GET";

  // /api/users (rewritten to /_root by vercel.json)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "_root")) {
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
