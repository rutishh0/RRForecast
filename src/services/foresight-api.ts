// V5/src/services/foresight-api.ts
//
// Frontend HTTP client for the ForeSight (chat assistant) feature.
//
// Endpoints (matching the contract in the Spec B integration brief):
//   POST   /api/chat                               — SSE stream of {content} chunks, ending with {done:true,...}
//   GET    /api/chat/conversations                 — list user's conversations
//   GET    /api/chat/conversations/:id             — fetch one conversation + its messages
//   DELETE /api/chat/conversations/:id             — delete a conversation
//   GET    /api/admin/settings                     — admin: read AI settings
//   PUT    /api/admin/settings                     — admin: update AI settings
//   GET    /api/ai/status                          — public: rate-limit headroom + provider
//
// Auth: same JWT scheme as services/api.ts (Authorization: Bearer <token>),
// reading the same `auth_token` localStorage key so site-wide login flows through.

const API_BASE = "/api";

export interface ChatMessageDTO {
  id: string;
  conversationId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export interface ConversationDTO {
  id: string;
  title: string | null;
  createdAt?: string;
  updatedAt: string;
  _count?: { messages: number };
}

export interface ConversationDetail {
  conversation: ConversationDTO;
  messages: ChatMessageDTO[];
}

export interface AiStatusResponse {
  ok: boolean;
  provider: string;
  dailyUsed: number;
  dailyLimit: number;
}

export interface AdminSettings {
  // Backend may evolve this; we keep it open-ended so the settings page can
  // round-trip unknown fields without dropping them.
  primaryProvider?: "google" | "jarvis" | "openrouter";
  model?: string;
  dailyLimit?: number;
  updatedAt?: string | null;
  updatedBy?: number | null;
  [key: string]: unknown;
}

/** Stream event emitted by the SSE handler in {@link sendChatStream}. */
export type ChatStreamEvent =
  | { kind: "chunk"; content: string }
  | { kind: "done"; conversationId: string; messageId: string; title?: string | null }
  | { kind: "error"; error: string };

function authHeader(): Record<string, string> {
  const t = typeof localStorage !== "undefined" ? localStorage.getItem("auth_token") : null;
  return t ? { Authorization: `Bearer ${t}` } : {};
}

async function callJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
      ...(init.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string })?.error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/**
 * Parse one SSE "event" frame (a block of lines terminated by a blank line).
 * Returns the JSON payload from the `data:` line(s), or null if there isn't one.
 */
function parseSseFrame(frame: string): unknown | null {
  const dataLines: string[] = [];
  for (const raw of frame.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).replace(/^ /, ""));
    }
  }
  if (dataLines.length === 0) return null;
  const joined = dataLines.join("\n");
  if (joined === "[DONE]") return { done: true };
  try {
    return JSON.parse(joined);
  } catch {
    // Non-JSON keepalive payload — ignore.
    return null;
  }
}

/**
 * POST /api/chat with SSE streaming. Calls `onEvent` for every chunk/done/error.
 * Returns when the stream ends. Throws on transport-level errors.
 *
 * Contract (provisional — matches the integration brief):
 *   data: {"content":"..."}\n\n        — incremental token chunks
 *   data: {"done":true,"conversationId":"...","messageId":"...","title":"..."}\n\n
 *   data: {"error":"..."}\n\n          — error frame (terminal)
 */
export async function sendChatStream(
  message: string,
  conversationId: string | undefined,
  onEvent: (ev: ChatStreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...authHeader(),
    },
    body: JSON.stringify({ message, conversationId }),
    signal,
  });

  if (!res.ok) {
    let errMsg = `HTTP ${res.status}`;
    try {
      const text = await res.text();
      try {
        const j = JSON.parse(text);
        if (j && typeof j === "object" && "error" in j && typeof j.error === "string") {
          errMsg = j.error;
        }
      } catch {
        if (text) errMsg = text;
      }
    } catch {
      // ignore body-read errors, fall back to status
    }
    throw new Error(errMsg);
  }

  if (!res.body) throw new Error("Stream body unavailable");

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  // Read until the stream closes. SSE frames are separated by blank lines (\n\n or \r\n\r\n).
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // Split on a blank line, accepting either LF or CRLF.
    let sepIdx: number;
    while (
      // eslint-disable-next-line no-cond-assign
      (sepIdx = buffer.search(/\r?\n\r?\n/)) !== -1
    ) {
      const frame = buffer.slice(0, sepIdx);
      const sepLen = buffer.slice(sepIdx).match(/^\r?\n\r?\n/)?.[0].length ?? 2;
      buffer = buffer.slice(sepIdx + sepLen);

      const payload = parseSseFrame(frame);
      if (!payload || typeof payload !== "object") continue;

      const obj = payload as Record<string, unknown>;
      if (typeof obj.error === "string") {
        onEvent({ kind: "error", error: obj.error });
        continue;
      }
      if (obj.done === true) {
        onEvent({
          kind: "done",
          conversationId: typeof obj.conversationId === "string" ? obj.conversationId : "",
          messageId: typeof obj.messageId === "string" ? obj.messageId : "",
          title: typeof obj.title === "string" || obj.title === null ? (obj.title as string | null) : undefined,
        });
        continue;
      }
      if (typeof obj.content === "string") {
        onEvent({ kind: "chunk", content: obj.content });
      }
    }
  }

  // Drain any final buffered frame (some servers omit the trailing blank line).
  if (buffer.trim().length > 0) {
    const payload = parseSseFrame(buffer);
    if (payload && typeof payload === "object") {
      const obj = payload as Record<string, unknown>;
      if (typeof obj.error === "string") {
        onEvent({ kind: "error", error: obj.error });
      } else if (obj.done === true) {
        onEvent({
          kind: "done",
          conversationId: typeof obj.conversationId === "string" ? obj.conversationId : "",
          messageId: typeof obj.messageId === "string" ? obj.messageId : "",
          title:
            typeof obj.title === "string" || obj.title === null ? (obj.title as string | null) : undefined,
        });
      } else if (typeof obj.content === "string") {
        onEvent({ kind: "chunk", content: obj.content });
      }
    }
  }
}

export const foresightAPI = {
  /** Streaming chat send. Caller drives UI updates from the event callback. */
  sendStream: sendChatStream,

  listConversations: () =>
    callJSON<{ conversations: ConversationDTO[] }>("/chat/conversations"),

  getConversation: (id: string) =>
    callJSON<ConversationDetail>(
      `/chat/conversations/${encodeURIComponent(id)}`,
    ),

  deleteConversation: (id: string) =>
    callJSON<{ ok: true }>(`/chat/conversations/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  status: () => callJSON<AiStatusResponse>("/ai/status"),

  getSettings: () => callJSON<{ settings: AdminSettings }>("/admin/settings"),

  updateSettings: (settings: AdminSettings) =>
    callJSON<{ ok: true }>("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ settings }),
    }),
};
