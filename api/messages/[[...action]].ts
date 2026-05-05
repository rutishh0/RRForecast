// V5/api/messages/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleSend from "../../lib/api/messages/send.js";
import handleInbox from "../../lib/api/messages/inbox.js";
import handleSent from "../../lib/api/messages/sent.js";
import handleUnreadCount from "../../lib/api/messages/unread-count.js";
import handleDelete from "../../lib/api/messages/delete.js";
import handleMarkRead from "../../lib/api/messages/mark-read.js";

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

  // /api/messages
  if (segments.length === 0) {
    if (method === "POST") return handleSend(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/messages/<single>
  if (segments.length === 1) {
    const [first] = segments;
    if (first === "inbox" && method === "GET") return handleInbox(req, res);
    if (first === "sent" && method === "GET") return handleSent(req, res);
    if (first === "unread-count" && method === "GET") return handleUnreadCount(req, res);
    if (/^\d+$/.test(first)) {
      // /api/messages/:id (DELETE)
      (req.query as any).id = first;
      if (method === "DELETE") return handleDelete(req, res);
      return METHOD_NOT_ALLOWED(res);
    }
    return NOT_FOUND(res);
  }

  // /api/messages/:id/read
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
