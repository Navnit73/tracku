// ────────────────────────────────────────────────────────────────────────────
// DeepSeek Client — Centralized API client with retry, timeout, and error mapping
// ────────────────────────────────────────────────────────────────────────────
//
// Uses native fetch (Node 18+ / Next.js 16) — no additional HTTP dependencies.
// DeepSeek API is OpenAI-compatible (Chat Completions endpoint format).
// Model: DeepSeek-V4-Flash-0731 (configurable via DEEPSEEK_MODEL env var).
// ────────────────────────────────────────────────────────────────────────────

import { AIError, mapDeepSeekHttpError } from "./errors";
import { AIInsightResponseSchema } from "./types";
import type {
  DeepSeekMessage,
  DeepSeekChatResponse,
  DeepSeekUsage,
  AIInsightResponse,
} from "./types";

// ────────────────────────────────────────────────────────────────────────────
// Configuration (from environment variables)
// ────────────────────────────────────────────────────────────────────────────

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = new Set([429, 500, 503]);

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new AIError(
      "AI_AUTH_ERROR",
      "AI service is not configured. Please contact support.",
      500
    );
  }
  return key;
}

const VALID_MODELS = [
  "deepseek-v4-flash",
  "deepseek-v4-pro",
  "deepseek-v4-flash-vision-exp",
];

function getModel(): string {
  const raw = (process.env.DEEPSEEK_MODEL || "deepseek-v4-flash").trim().toLowerCase();

  // Exact match
  if (VALID_MODELS.includes(raw)) {
    return raw;
  }

  // Alias & format normalizations (e.g. DeepSeek-V4-Flash, deepseek-v4-flash-0731)
  if (raw.includes("vision")) {
    return "deepseek-v4-flash-vision-exp";
  }
  if (raw.includes("pro")) {
    return "deepseek-v4-pro";
  }
  if (raw.includes("flash") || raw.includes("v4") || raw.includes("deepseek")) {
    return "deepseek-v4-flash";
  }

  return "deepseek-v4-flash";
}

function getTimeoutMs(): number {
  return parseInt(process.env.DEEPSEEK_TIMEOUT_MS || "45000", 10);
}

// ────────────────────────────────────────────────────────────────────────────
// Retry Logic — Exponential backoff with jitter
// ────────────────────────────────────────────────────────────────────────────

function calculateBackoffMs(attempt: number, retryAfterHeader?: string | null): number {
  // If DeepSeek provides Retry-After, respect it
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0 && seconds <= 60) {
      return seconds * 1000;
    }
  }

  // Exponential backoff: 1s, 2s, 4s
  const baseMs = Math.pow(2, attempt) * 1000;
  // Add random jitter (0-500ms) to prevent thundering herd
  const jitter = Math.random() * 500;
  return baseMs + jitter;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ────────────────────────────────────────────────────────────────────────────
// Core API Call
// ────────────────────────────────────────────────────────────────────────────

export interface DeepSeekCallResult {
  content: string;
  usage: DeepSeekUsage;
  model: string;
  latencyMs: number;
  retryCount: number;
}

/**
 * Sends a Chat Completions request to DeepSeek with retry, timeout, and error mapping.
 * This is the ONLY function that communicates with the DeepSeek API.
 *
 * @param messages - The chat messages (system + user)
 * @param userId - The authenticated user's opaque internal ID (not email/name)
 * @param options - Optional overrides for temperature, max_tokens
 */
export async function callDeepSeek(
  messages: DeepSeekMessage[],
  userId: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<DeepSeekCallResult> {
  const apiKey = getApiKey();
  const model = getModel();
  const timeoutMs = getTimeoutMs();
  const startTime = Date.now();
  let retryCount = 0;

  const requestBody = {
    model,
    messages,
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
    user: userId,
    stream: false as const,
    ...(options?.jsonMode ? { response_format: { type: "json_object" as const } } : {}),
  };

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const httpStatus = response.status;

        let errorDetails = "";
        try {
          const errBody = await response.text();
          errorDetails = errBody.slice(0, 300);
        } catch {}

        // Log safe metadata (never log API key or full request body)
        console.error(
          `[DeepSeek API Error] status=${httpStatus} model=${model} userId=${userId} attempt=${attempt + 1}/${MAX_RETRIES + 1} details=${errorDetails}`
        );

        // Retry on retryable status codes
        if (RETRYABLE_STATUS_CODES.has(httpStatus) && attempt < MAX_RETRIES) {
          const retryAfter = response.headers.get("retry-after");
          const backoffMs = calculateBackoffMs(attempt, retryAfter);
          retryCount = attempt + 1;
          await sleep(backoffMs);
          continue;
        }

        throw mapDeepSeekHttpError(httpStatus);
      }

      const data: DeepSeekChatResponse = await response.json();
      const latencyMs = Date.now() - startTime;

      // Validate response structure
      if (!data.choices?.[0]?.message?.content?.trim()) {
        const finishReason = data.choices?.[0]?.finish_reason;
        if (finishReason === "length") {
          throw new AIError(
            "AI_RESPONSE_INVALID",
            "AI response exceeded token limits. Please try again.",
            500,
            true
          );
        }
        throw new AIError(
          "AI_RESPONSE_INVALID",
          "AI service returned an unexpected response format. Please try again.",
          500,
          true
        );
      }

      // Safe observability logging (no sensitive data)
      console.log(
        `[DeepSeek OK] model=${data.model} userId=${userId} latency=${latencyMs}ms retries=${retryCount}` +
          ` tokens=${data.usage?.total_tokens || 0}` +
          ` prompt_cached=${data.usage?.prompt_cache_hit_tokens || 0}` +
          ` cost_estimate=$${estimateCost(data.usage).toFixed(6)}`
      );

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        latencyMs,
        retryCount,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Handle abort/timeout
      if (error instanceof DOMException && error.name === "AbortError") {
        console.error(
          `[DeepSeek Timeout] model=${model} userId=${userId} timeout=${timeoutMs}ms attempt=${attempt + 1}`
        );

        if (attempt < MAX_RETRIES) {
          retryCount = attempt + 1;
          await sleep(calculateBackoffMs(attempt));
          continue;
        }

        throw new AIError(
          "AI_TIMEOUT",
          "AI analysis took too long. Please try again.",
          504,
          true
        );
      }

      // Re-throw AIErrors as-is
      if (error instanceof AIError) {
        throw error;
      }

      // Network/unknown errors
      console.error(
        `[DeepSeek Network Error] userId=${userId} attempt=${attempt + 1}`,
        error instanceof Error ? error.message : "Unknown error"
      );

      if (attempt < MAX_RETRIES) {
        retryCount = attempt + 1;
        await sleep(calculateBackoffMs(attempt));
        continue;
      }

      throw new AIError(
        "AI_PROVIDER_ERROR",
        "Unable to reach the AI service. Please try again later.",
        503,
        true
      );
    }
  }

  // Should never reach here, but TypeScript needs it
  throw new AIError("AI_PROVIDER_ERROR", "AI request failed after all retries.", 500);
}

// ────────────────────────────────────────────────────────────────────────────
// Response Validation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Parses and validates the DeepSeek response content against the Zod schema.
 * Attempts one recovery if initial parsing fails (strips markdown fences, etc.).
 */
export function validateAIResponse(rawContent: string): AIInsightResponse {
  let parsed: unknown = null;

  // 1. Direct parse
  try {
    parsed = JSON.parse(rawContent);
  } catch {}

  // 2. Strip markdown code fences
  if (!parsed) {
    const cleaned = rawContent
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {}
  }

  // 3. Extract outermost JSON object { ... }
  if (!parsed) {
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {}
    }
  }

  if (!parsed) {
    console.error("[AI Response JSON Parse Failed] rawContent preview:", rawContent.slice(0, 300));
    throw new AIError(
      "AI_RESPONSE_INVALID",
      "AI generated an invalid response. Please try again.",
      500,
      true
    );
  }

  // Validate against Zod schema
  const result = AIInsightResponseSchema.safeParse(parsed);
  if (!result.success) {
    console.error(
      "[AI Response Validation Failed]",
      result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
      "parsed preview:",
      JSON.stringify(parsed).slice(0, 300)
    );
    throw new AIError(
      "AI_RESPONSE_INVALID",
      "AI generated a response that doesn't match the expected format. Please try again.",
      500,
      true
    );
  }

  return result.data;
}

// ────────────────────────────────────────────────────────────────────────────
// Cost Estimation
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estimates the cost of a DeepSeek API call in USD.
 * Pricing is based on DeepSeek's published rates (subject to change).
 * Input: $0.1 / 1M tokens (cache miss), $0.014 / 1M tokens (cache hit)
 * Output: $0.3 / 1M tokens
 */
export function estimateCost(usage: DeepSeekUsage): number {
  if (!usage) return 0;

  const cacheHitTokens = usage.prompt_cache_hit_tokens || 0;
  const cacheMissTokens = (usage.prompt_tokens || 0) - cacheHitTokens;
  const outputTokens = usage.completion_tokens || 0;

  const inputCostCacheMiss = (cacheMissTokens / 1_000_000) * 0.1;
  const inputCostCacheHit = (cacheHitTokens / 1_000_000) * 0.014;
  const outputCost = (outputTokens / 1_000_000) * 0.3;

  return inputCostCacheMiss + inputCostCacheHit + outputCost;
}
