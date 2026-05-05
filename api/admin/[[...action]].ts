// V5/api/admin/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleGetSettings from "../../lib/api/admin/get-settings.js";
import handlePutSettings from "../../lib/api/admin/put-settings.js";

function getSegments(req: VercelRequest): string[] {
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

  if (segments.length === 1 && segments[0] === "settings") {
    if (method === "GET") return handleGetSettings(req, res);
    if (method === "PUT") return handlePutSettings(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  return NOT_FOUND(res);
}
