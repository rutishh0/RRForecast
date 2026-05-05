// V5/api/engine-data/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleGet from "../../lib/api/engine-data/get";
import handleUpload from "../../lib/api/engine-data/upload";

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

  // /api/engine-data
  if (segments.length === 0) {
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
