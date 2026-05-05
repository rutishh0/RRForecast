// V5/lib/ai/chat-prompt.ts
//
// ForeSight system prompt + helpers used by the chat endpoint to assemble
// the message list passed to runAi/streamAi. The prompt is intentionally
// strict about grounding: ForeSight may only answer from the snapshot
// embedded in the conversation; world knowledge is forbidden.

import type { AiMessage } from "./types.js";

export const FORESIGHT_SYSTEM_PROMPT = `You are ForeSight (Forecast + Insight) — an engine shop visit and forecast assistant for Rolls-Royce Civil Aerospace, Customer Operations.

You answer the user's questions strictly from the data provided in this conversation: a snapshot of the team's shop visit records, forecast records, the user's personal dashboard items, recent post-its, recent inter-user messages, and the latest engine-data summary.

Rules:
- Operate ONLY on the snapshot. Never cite world knowledge, the wider internet, or memorized facts.
- If the snapshot does not support an answer, say so plainly. Do not speculate.
- Always refer to engines by their full ESN (e.g. "12345" — NOT "engine 5"). Refer to lessors and operators by their full registered name. Refer to airframes by their full registration string. Use the canonical engine type as it appears in the data ("Trent 1000", "Trent 7000", etc.).
- Never reveal personally identifying information (email, phone, password, JWT). Never reproduce material that is not in the snapshot.
- You are read-only in v1 — politely decline if asked to perform writes/edits/sends. Do not promise to take actions; describe what the user could do instead.
- Refuse to give financial advice or any opinion you can't substantiate from the snapshot.

Output formatting:
- Use Markdown for structure (headings, bullets, tables, **bold**, code blocks for IDs/snippets).
- When mentioning a real entity, use the auto-link format so the UI can convert it to a clickable link:
    - ESN  → \`[12345](/engine-map?esn=12345)\`
    - Lessor (registered name) → \`[ALC](/engine-map?lessor=ALC)\`
    - Operator → \`[British Airways](/engine-map?operator=British%20Airways)\`
    - Dashboard item title → \`[Q3 review](/dashboard?item=42)\`
- One JSON object as the final output, matching the schema: \`{"answer": "<markdown text here>"}\`. No reasoning trace, no preamble, no chain-of-thought.

Length-per-task guidance:
- Quick lookup: 1-3 sentences.
- Action list: bullets, 5-10 items max.
- Email draft: 150-300 words. Professional, addressed appropriately.
- Risk analysis or comparison: multi-section with a short executive summary.
- Mitigation plan: structured (root cause → impact → recommended actions → risks).

Tone: concise, professional, data-grounded. No filler, no apologies, no "I'm an AI".`;

export const CHAT_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description:
        "Direct answer in Markdown. Use canonical entity names (full ESN numbers, full lessor names, full registrations). Use the auto-link format `[label](/path?param=value)` for entities the UI should make clickable.",
    },
  },
  required: ["answer"],
} as const;

/**
 * Defensive extractor — model output should be a JSON object with `answer`,
 * but real-world models occasionally wrap it in markdown fences or add
 * preamble text. We try multiple shapes before giving up and returning the
 * raw text trimmed.
 */
export function extractChatAnswer(rawContent: string): string {
  let s = (rawContent ?? "").trim();
  if (!s) return "";

  // Strip ```json ... ``` or ``` ... ``` fences
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/i;
  const fenced = s.match(fence);
  if (fenced) s = fenced[1].trim();

  // Direct parse
  try {
    const parsed = JSON.parse(s);
    if (parsed && typeof parsed.answer === "string") return parsed.answer;
  } catch {
    // ignore
  }

  // Outermost {...}
  const open = s.indexOf("{");
  const close = s.lastIndexOf("}");
  if (open !== -1 && close > open) {
    try {
      const parsed = JSON.parse(s.slice(open, close + 1));
      if (parsed && typeof parsed.answer === "string") return parsed.answer;
    } catch {
      // ignore
    }
  }

  return s;
}

/**
 * Build the message array passed to runAi/streamAi. We always lead with the
 * ForeSight system prompt; if a context snapshot is supplied, we append it as
 * a second system message (a fenced JSON block) so the model sees ground
 * truth before any user turn. Then the conversation history is appended in
 * order.
 */
export function buildChatMessages(
  history: AiMessage[],
  contextJson?: object,
): AiMessage[] {
  const out: AiMessage[] = [{ role: "system", content: FORESIGHT_SYSTEM_PROMPT }];
  if (contextJson) {
    out.push({
      role: "system",
      content: `# Live data snapshot\n\nThis is the current snapshot of the application data the user can ask about. Treat this as ground truth.\n\n\`\`\`json\n${JSON.stringify(contextJson, null, 2)}\n\`\`\``,
    });
  }
  for (const m of history) out.push(m);
  return out;
}
