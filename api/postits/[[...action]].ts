// V5/api/postits/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleList from "../../lib/api/postits/list.js";
import handleCreate from "../../lib/api/postits/create.js";
import handleAll from "../../lib/api/postits/all.js";
import handleById from "../../lib/api/postits/byId.js";
import handleMarkRead from "../../lib/api/postits/mark-read.js";
import handleUnreadCount from "../../lib/api/postits/unread-count.js";

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

  // /api/postits (rewritten to /_root by vercel.json)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "_root")) {
    if (method === "GET") return handleList(req, res);
    if (method === "POST") return handleCreate(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/postits/<single>
  if (segments.length === 1) {
    const [first] = segments;
    if (first === "all" && method === "GET") return handleAll(req, res);
    if (first === "unread-count" && method === "GET") return handleUnreadCount(req, res);
    if (/^\d+$/.test(first)) {
      // /api/postits/:id (PUT/DELETE)
      (req.query as any).id = first;
      if (method === "PUT" || method === "DELETE") return handleById(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    return NOT_FOUND(res);
  }

  // /api/postits/:id/read
  if (segments.length === 2) {
    const [first, second] = segments;
    if (/^\d+$/.test(first) && second === "read") {
      (req.query as any).id = first;
      if (method === "POST") return handleMarkRead(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
  }

  return NOT_FOUND(res);
}
