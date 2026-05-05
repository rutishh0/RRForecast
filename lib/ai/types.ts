// V5/lib/ai/types.ts

/**
 * Provider identity. v1 wires Google only; jarvis + openrouter exist as
 * placeholders so the harness keeps an extensible provider seam.
 */
export type AiProvider = "google" | "jarvis" | "openrouter";

export type AiRole = "user" | "assistant" | "system";

export interface AiMessage {
  role: AiRole;
  content: string;
}

export interface AiUsage {
  promptTokens: number;
  completionTokens: number;
  reasoningTokens?: number;
  totalTokens: number;
}

export interface NormalizedAiResponse {
  content: string;
  reasoningDetails?: unknown;
  usage: AiUsage;
  model: string;
}

export interface CallProviderArgs {
  messages: AiMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseSchema?: object;
}

/**
 * Streaming counterpart — yields content chunks. Provider clients return an
 * async iterator of plain-text deltas plus a terminal "final" frame carrying
 * usage + model identity, so the harness can log AiRequest at the end.
 */
export type AiStreamChunk =
  | { type: "delta"; text: string }
  | { type: "final"; usage: AiUsage; model: string };

// Error types so the harness can distinguish retryable vs non-retryable failures.

export class AiRateLimitError extends Error {
  retryAfterSeconds?: number;
  constructor(message: string, retryAfterSeconds?: number) {
    super(message);
    this.name = "AiRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export class AiRetryableError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AiRetryableError";
    this.statusCode = statusCode;
  }
}

export class AiNonRetryableError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "AiNonRetryableError";
    this.statusCode = statusCode;
  }
}

export const isRetryable = (e: unknown): boolean =>
  e instanceof AiRateLimitError ||
  e instanceof AiRetryableError ||
  (e instanceof Error && /timeout|ECONNRESET|ENOTFOUND|fetch failed/i.test(e.message));
