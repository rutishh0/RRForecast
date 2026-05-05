// V5/api/engine-data/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleGet from "../../lib/api/engine-data/get.js";
import handleUpload from "../../lib/api/engine-data/upload.js";

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

  // /api/engine-data (rewritten to /_root by vercel.json)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "_root")) {
    if (method === "GET") return handleGet(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/engine-data/upload
  if (segments.length === 1 && segments[0] === "upload") {
    if (method === "POST") return handleUpload(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  return NOT_FOUND(res);
}
