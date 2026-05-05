// V5/lib/api/chat/post-chat.ts
//
// POST /api/chat — SSE-streamed chat turn.
// Body: { message: string, conversationId?: string }
// Auth: Bearer JWT (parsed by verifyAuth).
// Behavior:
//   - Load (or create) conversation, persist user message.
//   - Load chat-context for the user; build messages with the system prompt.
//   - Stream tokens from Gemini via harness.streamAi.
//   - Persist assistant message at the end. Emit a final {done} frame.
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuth, AuthError } from "../../auth/verify.js";
import { prisma } from "../../db/prisma.js";
import { streamAi } from "../../ai/harness.js";
import { buildChatMessages, extractChatAnswer, FORESIGHT_SYSTEM_PROMPT } from "../../ai/chat-prompt.js";
import { getChatContext } from "../../queries/chat-context.js";
import type { AiMessage } from "../../ai/types.js";

const MAX_HISTORY_MESSAGES = 20;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method not allowed" });
  }

  let auth: { userId: number; role: string };
  try {
    auth = await verifyAuth(req);
  } catch (e) {
    const code = e instanceof AuthError ? e.statusCode : 401;
    return res.status(code).json({ error: e instanceof Error ? e.message : "unauthorized" });
  }

  const { message, conversationId } = (req.body ?? {}) as {
    message?: string;
    conversationId?: string;
  };

  if (typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "message required" });
  }

  // Load or create conversation
  let conv = conversationId
    ? await prisma.conversation.findFirst({
        where: { id: conversationId, userId: auth.userId },
        include: { messages: { orderBy: { createdAt: "asc" }, take: MAX_HISTORY_MESSAGES } },
      })
    : null;

  if (conversationId && !conv) {
    return res.status(404).json({ error: "conversation not found" });
  }

  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        userId: auth.userId,
        title: message.slice(0, 80),
      },
      include: { messages: true },
    });
  }

  // Persist user message
  const userMsg = await prisma.chatMessage.create({
    data: {
      conversationId: conv.id,
      role: "user",
      content: message,
    },
  });

  // Build AI message history
  const history: AiMessage[] = [
    ...conv.messages.map((m) => ({
      role: m.role as AiMessage["role"],
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  // Load grounding context (best-effort; don't fail the request if it errors)
  let context: object | undefined;
  try {
    context = await getChatContext(auth.userId);
  } catch (e) {
    console.error("[chat] context load failed", e);
    context = undefined;
  }

  const messages = buildChatMessages(history, context);

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  let assistantBuffer = "";
  const writeFrame = (payload: object) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  try {
    for await (const chunk of streamAi({
      feature: "chat",
      userId: auth.userId,
      messages,
      skipGrounding: true,
      temperature: 0.4,
    })) {
      if (chunk.type === "delta") {
        assistantBuffer += chunk.text;
        writeFrame({ content: chunk.text });
      }
      // final frame ignored client-side (we use done below)
    }

    // Defensive extraction in case the model returned JSON-wrapped output
    const finalText = extractChatAnswer(assistantBuffer) || assistantBuffer;

    const assistantMsg = await prisma.chatMessage.create({
      data: {
        conversationId: conv.id,
        role: "assistant",
        content: finalText,
      },
    });

    // Update conversation's title from first message + bump updatedAt
    await prisma.conversation.update({
      where: { id: conv.id },
      data: { updatedAt: new Date() },
    });

    writeFrame({
      done: true,
      conversationId: conv.id,
      messageId: assistantMsg.id,
      title: conv.title,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "AI call failed";
    console.error("[chat] stream error:", msg);
    writeFrame({ error: msg });
  } finally {
    res.end();
  }

  // Touch the prompt to silence unused warnings if future changes drop history
  void FORESIGHT_SYSTEM_PROMPT;
  void userMsg;
}
