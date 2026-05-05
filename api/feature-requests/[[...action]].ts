// V5/api/feature-requests/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleList from "../../lib/api/feature-requests/list.js";
import handleCreate from "../../lib/api/feature-requests/create.js";
import handleById from "../../lib/api/feature-requests/byId.js";
import handlePendingCount from "../../lib/api/feature-requests/pending-count.js";

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

  // /api/feature-requests
  if (segments.length === 0) {
    if (method === "GET") return handleList(req, res);
    if (method === "POST") return handleCreate(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/feature-requests/<single>
  if (segments.length === 1) {
    const [first] = segments;
    if (first === "pending-count" && method === "GET") return handlePendingCount(req, res);
    if (/^\d+$/.test(first)) {
      // /api/feature-requests/:id (GET/PUT/DELETE)
      (req.query as any).id = first;
      if (method === "GET" || method === "PUT" || method === "DELETE") return handleById(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    return NOT_FOUND(res);
  }

  return NOT_FOUND(res);
}
