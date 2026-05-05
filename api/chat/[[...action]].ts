// V5/api/chat/[[...action]].ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import handlePostChat from "../../lib/api/chat/post-chat.js";
import handleListConversations from "../../lib/api/chat/list-conversations.js";
import handleGetConversation from "../../lib/api/chat/get-conversation.js";
import handleDeleteConversation from "../../lib/api/chat/delete-conversation.js";

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

  // /api/chat (rewritten to /_root by vercel.json)
  if (segments.length === 0 || (segments.length === 1 && segments[0] === "_root")) {
    if (method === "POST") return handlePostChat(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/chat/conversations
  if (segments.length === 1 && segments[0] === "conversations") {
    if (method === "GET") return handleListConversations(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  // /api/chat/conversations/:id
  if (segments.length === 2 && segments[0] === "conversations") {
    (req.query as Record<string, unknown>).id = segments[1];
    if (method === "GET") return handleGetConversation(req, res);
    if (method === "DELETE") return handleDeleteConversation(req, res);
    return METHOD_NOT_ALLOWED(res);
  }

  return NOT_FOUND(res);
}
