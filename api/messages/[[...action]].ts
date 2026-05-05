// V5/api/messages/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handleSend from "../../lib/api/messages/send";
import handleInbox from "../../lib/api/messages/inbox";
import handleSent from "../../lib/api/messages/sent";
import handleUnreadCount from "../../lib/api/messages/unread-count";
import handleDelete from "../../lib/api/messages/delete";
import handleMarkRead from "../../lib/api/messages/mark-read";

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
