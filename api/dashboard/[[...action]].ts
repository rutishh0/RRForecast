// V5/api/dashboard/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleList from "../../lib/api/dashboard/list";
import handleCreate from "../../lib/api/dashboard/create";
import handleById from "../../lib/api/dashboard/byId";
import handleSummary from "../../lib/api/dashboard/summary";
import handleUpcoming from "../../lib/api/dashboard/upcoming";

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

  // /api/dashboard
  if (segments.length === 0) {
    if (method === "GET") return handleList(req, res);
    if (method === "POST") return handleCreate(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/dashboard/<single>
  if (segments.length === 1) {
    const [first] = segments;
    if (first === "summary" && method === "GET") return handleSummary(req, res);
    if (first === "upcoming" && method === "GET") return handleUpcoming(req, res);
    if (/^\d+$/.test(first)) {
      // /api/dashboard/:id (PUT/DELETE)
      (req.query as any).id = first;
      if (method === "PUT" || method === "DELETE") return handleById(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    return NOT_FOUND(res);
  }

  return NOT_FOUND(res);
}
