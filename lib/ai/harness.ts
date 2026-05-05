// V5/lib/ai/harness.ts
//
// runAi() — single entry-point the rest of the codebase uses to invoke a
// language model. Today only Google is wired; jarvis + openrouter are
// reserved provider identities so the dispatch table can grow without API
// changes. The harness:
//
// 1. Resolves the active provider (DB Setting → env → default "google").
// 2. Builds a failover chain (active → others) and skips providers whose env
//    isn't configured.
// 3. Calls the rate-limit gate before invoking metered providers (all of
//    google/openrouter today; jarvis would be unmetered when added).
// 4. Logs every attempt to AiRequest with success/error, tokens, duration.
// 5. Bubbles non-retryable errors immediately; advances on retryable errors.

import { prisma } from "../db/prisma.js";
import { AiNonRetryableError, isRetryable } from "./types.js";
import type {
  AiMessage,
  AiProvider,
  AiStreamChunk,
  CallProviderArgs,
  NormalizedAiResponse,
} from "./types.js";
import { callGoogle, DEFAULT_MODEL_GOOGLE, streamGoogle } from "./google-client.js";
import { checkRateLimit } from "./rate-limit.js";

/**
 * The grounding directive prepended (as a system message) to ad-hoc calls
 * that don't ship their own system prompt. Chat traffic passes
 * skipGrounding=true because chat-prompt.ts already injects a richer system
 * prompt + live snapshot.
 */
export const GROUNDING_DIRECTIVE = `You operate strictly on the data provided in this conversation. Do not invent facts, cite world knowledge, or use external context. Do not speculate. If the data does not support an answer, say so clearly. Output ONLY the final answer text — no reasoning trace, no preamble, no meta-commentary.`;

export interface RunAiArgs {
  feature: "chat" | "ad-hoc" | "system";
  userId: number | null;
  messages: AiMessage[];
  provider?: AiProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  skipGrounding?: boolean;
  responseSchema?: object;
}

type ProviderCall = (args: CallProviderArgs) => Promise<NormalizedAiResponse>;
type ProviderStream = (args: CallProviderArgs) => AsyncGenerator<AiStreamChunk, void, unknown>;

const NOT_WIRED: ProviderCall = async () => {
  throw new AiNonRetryableError("provider not wired in v1 (google only)");
};
async function* notWiredStream(): AsyncGenerator<AiStreamChunk, void, unknown> {
  throw new AiNonRetryableError("provider not wired in v1 (google only)");
}

const PROVIDER_CALLS: Record<AiProvider, ProviderCall> = {
  google: callGoogle,
  jarvis: NOT_WIRED,
  openrouter: NOT_WIRED,
};

const PROVIDER_STREAMS: Record<AiProvider, ProviderStream> = {
  google: streamGoogle,
  jarvis: notWiredStream,
  openrouter: notWiredStream,
};

const DEFAULT_MODELS: Record<AiProvider, string> = {
  google: DEFAULT_MODEL_GOOGLE,
  jarvis: process.env.JARVIS_DEFAULT_MODEL ?? "gemma-3-27b-it",
  openrouter: "google/gemini-2.5-flash",
};

function isProviderConfigured(p: AiProvider): boolean {
  switch (p) {
    case "google":
      return !!process.env.GEMINI_API_KEY;
    case "jarvis":
      return !!process.env.JARVIS_BASE_URL;
    case "openrouter":
      return !!process.env.OPENROUTER_API_KEY;
  }
}

function isAiProvider(v: unknown): v is AiProvider {
  return v === "google" || v === "jarvis" || v === "openrouter";
}

// Provider cache (60s TTL) so we don't hit the Setting table on every call.
let _cachedProvider: { value: AiProvider; readAt: number } | null = null;
const PROVIDER_TTL_MS = 60_000;

export function invalidateProviderCache(): void {
  _cachedProvider = null;
}

async function resolveProvider(): Promise<AiProvider> {
  const now = Date.now();
  if (_cachedProvider && now - _cachedProvider.readAt < PROVIDER_TTL_MS) {
    return _cachedProvider.value;
  }
  const row = await prisma.setting
    .findUnique({ where: { key: "ai.primaryProvider" } })
    .catch(() => null);
  const fromDb = row?.value as unknown;
  const fromEnv = process.env.AI_PROVIDER as unknown;
  const fallback: AiProvider = "google";
  const value: AiProvider = isAiProvider(fromDb)
    ? fromDb
    : isAiProvider(fromEnv)
      ? fromEnv
      : fallback;
  _cachedProvider = { value, readAt: now };
  return value;
}

function buildChain(primary: AiProvider): AiProvider[] {
  const all: AiProvider[] = ["google", "jarvis", "openrouter"];
  return [primary, ...all.filter((p) => p !== primary)];
}

function isMeteredProvider(p: AiProvider): boolean {
  // Jarvis (when added) would be self-hosted and unmetered. Everything else
  // hits a paid quota and consults the rate limiter.
  return p !== "jarvis";
}

function withGrounding(args: RunAiArgs): AiMessage[] {
  if (args.skipGrounding) return args.messages;
  const hasSystem = args.messages.some((m) => m.role === "system");
  if (hasSystem) return args.messages;
  return [{ role: "system", content: GROUNDING_DIRECTIVE }, ...args.messages];
}

async function logAiRequest(args: {
  userId: number | null;
  feature: string;
  provider: string;
  model: string;
  durationMs: number;
  success: boolean;
  promptTokens?: number;
  completionTokens?: number;
  reasoningTokens?: number | null;
  totalTokens?: number;
  errorMessage?: string;
}): Promise<void> {
  await prisma.aiRequest
    .create({
      data: {
        userId: args.userId,
        feature: args.feature,
        provider: args.provider,
        model: args.model,
        durationMs: args.durationMs,
        success: args.success,
        promptTokens: args.promptTokens ?? null,
        completionTokens: args.completionTokens ?? null,
        reasoningTokens: args.reasoningTokens ?? null,
        totalTokens: args.totalTokens ?? null,
        errorMessage: args.errorMessage?.slice(0, 4000) ?? null,
      },
    })
    .catch(() => {
      // Don't let an audit-log failure break the user's request.
    });
}

export async function runAi(args: RunAiArgs): Promise<NormalizedAiResponse> {
  const primary = args.provider ?? (await resolveProvider());
  const chain = buildChain(primary);
  const messages = withGrounding(args);

  let lastError: unknown = new Error("AI provider chain exhausted (no providers configured)");

  for (const provider of chain) {
    if (!isProviderConfigured(provider)) continue;

    if (isMeteredProvider(provider)) {
      const rl = await checkRateLimit(args.userId);
      if (!rl.allowed) {
        lastError = new Error(`Rate limit exhausted (${rl.used}/${rl.limit})`);
        // Skip silently to next provider; do not log a row for skipped attempts.
        continue;
      }
    }

    const model = args.model ?? DEFAULT_MODELS[provider];
    const t0 = Date.now();
    try {
      const result = await PROVIDER_CALLS[provider]({
        messages,
        model,
        maxTokens: args.maxTokens,
        temperature: args.temperature,
        responseSchema: args.responseSchema,
      });

      await logAiRequest({
        userId: args.userId,
        feature: args.feature,
        provider,
        model: result.model ?? model,
        durationMs: Date.now() - t0,
        success: true,
        promptTokens: result.usage.promptTokens,
        completionTokens: result.usage.completionTokens,
        reasoningTokens: result.usage.reasoningTokens ?? null,
        totalTokens: result.usage.totalTokens,
      });

      return result;
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await logAiRequest({
        userId: args.userId,
        feature: args.feature,
        provider,
        model,
        durationMs: Date.now() - t0,
        success: false,
        errorMessage: errMsg,
      });

      lastError = e;
      if (e instanceof AiNonRetryableError) throw e;
      if (!isRetryable(e)) throw e;
      // otherwise advance the chain
    }
  }

  if (lastError instanceof Error) throw lastError;
  throw new Error(String(lastError));
}

/**
 * Streaming variant. Yields delta + final chunks from the active provider,
 * with rate-limit gating and AiRequest logging at the end. On failure we
 * fall back to non-streaming via the failover chain — but only the active
 * provider can stream; if it fails before any tokens flow we propagate.
 */
export async function* streamAi(
  args: RunAiArgs,
): AsyncGenerator<AiStreamChunk, void, unknown> {
  const primary = args.provider ?? (await resolveProvider());
  if (!isProviderConfigured(primary)) {
    throw new AiNonRetryableError(
      `Active provider "${primary}" is not configured (missing env)`,
    );
  }
  const messages = withGrounding(args);

  if (isMeteredProvider(primary)) {
    const rl = await checkRateLimit(args.userId);
    if (!rl.allowed) {
      throw new AiNonRetryableError(
        `Rate limit exhausted (${rl.used}/${rl.limit}). Try again tomorrow.`,
      );
    }
  }

  const model = args.model ?? DEFAULT_MODELS[primary];
  const t0 = Date.now();
  let usage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 } as {
    promptTokens: number;
    completionTokens: number;
    reasoningTokens?: number;
    totalTokens: number;
  };
  let resolvedModel = model;

  try {
    for await (const chunk of PROVIDER_STREAMS[primary]({
      messages,
      model,
      maxTokens: args.maxTokens,
      temperature: args.temperature,
      responseSchema: args.responseSchema,
    })) {
      if (chunk.type === "final") {
        usage = chunk.usage;
        resolvedModel = chunk.model;
      }
      yield chunk;
    }

    await logAiRequest({
      userId: args.userId,
      feature: args.feature,
      provider: primary,
      model: resolvedModel,
      durationMs: Date.now() - t0,
      success: true,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      reasoningTokens: usage.reasoningTokens ?? null,
      totalTokens: usage.totalTokens,
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    await logAiRequest({
      userId: args.userId,
      feature: args.feature,
      provider: primary,
      model: resolvedModel,
      durationMs: Date.now() - t0,
      success: false,
      errorMessage: errMsg,
    });
    throw e;
  }
}
