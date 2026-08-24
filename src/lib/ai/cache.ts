// ────────────────────────────────────────────────────────────────────────────
// AI Cache — Server-side caching for AI-generated insights
// ────────────────────────────────────────────────────────────────────────────

import crypto from "crypto";
import type { AIInsightResponse } from "./types";

interface CachedAIResult {
  insights: AIInsightResponse;
  generatedAt: string;
  dataHash: string;
  expiresAt: number;
}

/** In-memory cache store. Key format: `ai:{userId}:{analysisType}:{month}` */
const aiCacheStore = new Map<string, CachedAIResult>();

/** Default TTL: 6 hours */
const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

/** Max cache entries to prevent unbounded memory growth */
const MAX_CACHE_ENTRIES = 500;

// Periodic cleanup every 10 minutes
let cacheCleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCacheCleanup() {
  if (cacheCleanupTimer) return;
  cacheCleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of aiCacheStore) {
      if (entry.expiresAt <= now) {
        aiCacheStore.delete(key);
      }
    }
  }, 10 * 60 * 1000);
  if (cacheCleanupTimer && typeof cacheCleanupTimer === "object" && "unref" in cacheCleanupTimer) {
    cacheCleanupTimer.unref();
  }
}

/**
 * Generates a content hash from the financial data.
 * When data changes, the hash changes, invalidating the cache.
 */
export function computeDataHash(data: Record<string, unknown>): string {
  const serialized = JSON.stringify(data, Object.keys(data).sort());
  return crypto.createHash("sha256").update(serialized).digest("hex").slice(0, 16);
}

/**
 * Builds a cache key for AI results.
 */
function buildCacheKey(userId: string, analysisType: string, month: string): string {
  return `ai:${userId}:${analysisType}:${month}`;
}

/**
 * Attempts to retrieve a cached AI result.
 * Returns null if no valid cache exists or if the financial data has changed.
 */
export function getCachedAIResult(
  userId: string,
  analysisType: string,
  month: string,
  currentDataHash: string
): CachedAIResult | null {
  ensureCacheCleanup();
  const key = buildCacheKey(userId, analysisType, month);
  const cached = aiCacheStore.get(key);

  if (!cached) return null;

  // Check expiry
  if (cached.expiresAt <= Date.now()) {
    aiCacheStore.delete(key);
    return null;
  }

  // Check data hash — invalidate if financial data changed
  if (cached.dataHash !== currentDataHash) {
    aiCacheStore.delete(key);
    return null;
  }

  return cached;
}

/**
 * Stores an AI result in the cache.
 */
export function setCachedAIResult(
  userId: string,
  analysisType: string,
  month: string,
  dataHash: string,
  insights: AIInsightResponse,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  ensureCacheCleanup();

  // Evict oldest entries if over capacity
  if (aiCacheStore.size >= MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestExpiry = Infinity;
    for (const [key, entry] of aiCacheStore) {
      if (entry.expiresAt < oldestExpiry) {
        oldestExpiry = entry.expiresAt;
        oldestKey = key;
      }
    }
    if (oldestKey) aiCacheStore.delete(oldestKey);
  }

  const key = buildCacheKey(userId, analysisType, month);
  aiCacheStore.set(key, {
    insights,
    generatedAt: new Date().toISOString(),
    dataHash,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidates all cached AI results for a specific user.
 * Call this when the user's financial data changes significantly.
 */
export function invalidateUserAICache(userId: string): void {
  const prefix = `ai:${userId}:`;
  for (const key of aiCacheStore.keys()) {
    if (key.startsWith(prefix)) {
      aiCacheStore.delete(key);
    }
  }
}
