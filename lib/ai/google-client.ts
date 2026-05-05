// V5/lib/ai/google-client.ts
//
// Google Gemini provider client. Uses @google/generative-ai SDK directly for
// both non-streaming generate + streaming generate. Translates OpenAI-style
// {role:user|assistant|system, content} messages into Gemini's
// {role:user|model, parts:[{text}]} format, hoisting any "system" messages
// into a single systemInstruction string.
//
// On HTTP failures we throw the typed errors from ./types so the harness can
// distinguish 429 vs 5xx vs 4xx.

import {
  GoogleGenerativeAI,
  type Content,
  type EnhancedGenerateContentResponse,
  type GenerateContentResult,
  type GenerationConfig,
} from "@google/generative-ai";
import {
  AiNonRetryableError,
  AiRateLimitError,
  AiRetryableError,
} from "./types.js";
import type {
  AiMessage,
  AiStreamChunk,
  AiUsage,
  CallProviderArgs,
  NormalizedAiResponse,
} from "./types.js";

export const DEFAULT_MODEL_GOOGLE = "gemini-2.5-flash";

/**
 * Convert OpenAI-style chat history into Gemini's contents[] format. System
 * messages are concatenated into a single systemInstruction string the SDK
 * supports natively, so we don't have to graft them onto the first user turn.
 */
function toGeminiContents(messages: AiMessage[]): {
  contents: Content[];
  systemInstruction: string | undefined;
} {
  const contents: Content[] = [];
  const systemPieces: string[] = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemPieces.push(m.content);
      continue;
    }
    contents.push({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    });
  }
  return {
    contents,
    systemInstruction: systemPieces.length ? systemPieces.join("\n\n") : undefined,
  };
}

function buildGenerationConfig(args: CallProviderArgs): GenerationConfig {
  const cfg: GenerationConfig = {
    maxOutputTokens: args.maxTokens ?? 8192,
    temperature: args.temperature ?? 0.4,
  };
  if (args.responseSchema) {
    cfg.responseMimeType = "application/json";
    // The SDK types use a stricter ResponseSchema type; we accept generic
    // JSON-Schema input from callers and cast at the boundary.
    (cfg as unknown as Record<string, unknown>).responseSchema =
      args.responseSchema;
  }
  return cfg;
}

function classifyError(e: unknown): never {
  // The SDK throws GoogleGenerativeAIFetchError / *Error subclasses.
  // Status code lives on `.status` on the fetch error.
  const err = e as { status?: number; message?: string };
  const status = typeof err?.status === "number" ? err.status : undefined;
  const msg = err?.message ?? "Google call failed";
  if (status === 429) throw new AiRateLimitError(`Google: ${msg}`);
  if (status !== undefined && status >= 500) {
    throw new AiRetryableError(`Google ${status}: ${msg}`, status);
  }
  if (status !== undefined && status >= 400) {
    throw new AiNonRetryableError(`Google ${status}: ${msg}`, status);
  }
  // Network-level / unknown — let isRetryable classify by message
  throw new AiRetryableError(msg);
}

function readUsage(resp: EnhancedGenerateContentResponse): AiUsage {
  const u = resp.usageMetadata;
  return {
    promptTokens: u?.promptTokenCount ?? 0,
    completionTokens: u?.candidatesTokenCount ?? 0,
    totalTokens: u?.totalTokenCount ?? 0,
  };
}

function getApiKey(): string {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new AiNonRetryableError("GEMINI_API_KEY not set");
  return k;
}

export async function callGoogle(
  args: CallProviderArgs,
): Promise<NormalizedAiResponse> {
  const apiKey = getApiKey();
  const modelName = args.model ?? DEFAULT_MODEL_GOOGLE;
  const { contents, systemInstruction } = toGeminiContents(args.messages);

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: buildGenerationConfig(args),
  });

  let result: GenerateContentResult;
  try {
    result = await model.generateContent({ contents });
  } catch (e) {
    classifyError(e);
  }

  const text = result.response.text();
  return {
    content: text,
    usage: readUsage(result.response),
    model: modelName,
  };
}

/**
 * Streaming version. Yields incremental text deltas as they arrive, then a
 * single terminal "final" frame with usage + model identity.
 */
export async function* streamGoogle(
  args: CallProviderArgs,
): AsyncGenerator<AiStreamChunk, void, unknown> {
  const apiKey = getApiKey();
  const modelName = args.model ?? DEFAULT_MODEL_GOOGLE;
  const { contents, systemInstruction } = toGeminiContents(args.messages);

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction,
    generationConfig: buildGenerationConfig(args),
  });

  let stream: AsyncGenerator<EnhancedGenerateContentResponse>;
  let finalResponsePromise: Promise<EnhancedGenerateContentResponse>;
  try {
    const r = await model.generateContentStream({ contents });
    stream = r.stream;
    finalResponsePromise = r.response;
  } catch (e) {
    classifyError(e);
  }

  try {
    for await (const chunk of stream) {
      const t = chunk.text();
      if (t) yield { type: "delta", text: t };
    }
  } catch (e) {
    classifyError(e);
  }

  let usage: AiUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  try {
    const finalResp = await finalResponsePromise;
    usage = readUsage(finalResp);
  } catch {
    // The aggregated response can throw if the prompt was filtered. We've
    // already streamed whatever text the model produced; emit a final frame
    // with zero usage so the harness can still log the call.
  }
  yield { type: "final", usage, model: modelName };
}
