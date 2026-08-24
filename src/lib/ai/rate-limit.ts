// ────────────────────────────────────────────────────────────────────────────
// AI Rate Limiting — Per-user rate limiting and concurrency control
// ────────────────────────────────────────────────────────────────────────────

import { connectToDatabase } from "@/lib/db";
import { AIUsage } from "@/models/AIUsage";
import { AIError } from "./errors";

// ────────────────────────────────────────────────────────────────────────────
// Configurable Limits (from environment variables)
// ────────────────────────────────────────────────────────────────────────────

function getFreeDailyLimit(): number {
  return parseInt(process.env.AI_FREE_DAILY_LIMIT || "10", 10);
}
function getFreeMinuteLimit(): number {
  return parseInt(process.env.AI_FREE_MINUTE_LIMIT || "2", 10);
}
function getProDailyLimit(): number {
  return parseInt(process.env.AI_PRO_DAILY_LIMIT || "100", 10);
}
function getProMinuteLimit(): number {
  return parseInt(process.env.AI_PRO_MINUTE_LIMIT || "10", 10);
}
function getFreeConcurrency(): number {
  return parseInt(process.env.AI_FREE_CONCURRENCY || "1", 10);
}
function getProConcurrency(): number {
  return parseInt(process.env.AI_PRO_CONCURRENCY || "3", 10);
}

// ────────────────────────────────────────────────────────────────────────────
// In-Memory Stores (per server instance)
// ────────────────────────────────────────────────────────────────────────────

/** Sliding window timestamps for per-minute rate limiting */
const minuteWindowStore = new Map<string, number[]>();

/** Active concurrent request timestamps per user (with safety expiration) */
const concurrencyStore = new Map<string, number[]>();
const CONCURRENCY_SAFETY_TIMEOUT_MS = 60_000; // 60s safety timeout

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanupTimer() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    const cutoff = now - 120_000; // 2 minute window
    for (const [key, timestamps] of minuteWindowStore) {
      const filtered = timestamps.filter((t) => t > cutoff);
      if (filtered.length === 0) {
        minuteWindowStore.delete(key);
      } else {
        minuteWindowStore.set(key, filtered);
      }
    }
  }, CLEANUP_INTERVAL);
  // Allow Node.js to exit naturally
  if (cleanupTimer && typeof cleanupTimer === "object" && "unref" in cleanupTimer) {
    cleanupTimer.unref();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Rate Limit Checking
// ────────────────────────────────────────────────────────────────────────────

/**
 * Returns today's start-of-day in UTC for consistent daily bucketing.
 */
function getTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Gets the user's AI request count for today from MongoDB.
 */
async function getDailyRequestCount(userId: string): Promise<number> {
  await connectToDatabase();
  const today = getTodayUTC();
  const usage = await AIUsage.findOne({ userId, date: today }).select("requestCount").lean<{ requestCount?: number } | null>();
  return usage?.requestCount || 0;
}

/**
 * Checks per-minute rate limit using an in-memory sliding window.
 */
function checkMinuteLimit(userId: string, limit: number): boolean {
  ensureCleanupTimer();
  const now = Date.now();
  const windowMs = 60_000; // 1 minute
  const key = `minute:${userId}`;

  let timestamps = minuteWindowStore.get(key) || [];
  // Remove expired timestamps
  timestamps = timestamps.filter((t) => now - t < windowMs);
  minuteWindowStore.set(key, timestamps);

  return timestamps.length < limit;
}

/**
 * Records a request in the per-minute sliding window.
 */
function recordMinuteRequest(userId: string): void {
  const key = `minute:${userId}`;
  const timestamps = minuteWindowStore.get(key) || [];
  timestamps.push(Date.now());
  minuteWindowStore.set(key, timestamps);
}

/**
 * Full rate limit check: minute-level + daily limit.
 * Throws AIError with code AI_RATE_LIMITED if any limit is exceeded.
 */
export async function checkRateLimit(userId: string, isPremium: boolean): Promise<void> {
  const minuteLimit = isPremium ? getProMinuteLimit() : getFreeMinuteLimit();
  const dailyLimit = isPremium ? getProDailyLimit() : getFreeDailyLimit();

  // 1. Check per-minute limit (in-memory, fast)
  if (!checkMinuteLimit(userId, minuteLimit)) {
    throw new AIError(
      "AI_RATE_LIMITED",
      `AI request limit reached (${minuteLimit} per minute). Please wait a moment and try again.`,
      429,
      true
    );
  }

  // 2. Check daily limit (MongoDB)
  const dailyCount = await getDailyRequestCount(userId);
  if (dailyCount >= dailyLimit) {
    throw new AIError(
      "AI_RATE_LIMITED",
      `Daily AI request limit reached (${dailyCount}/${dailyLimit}). ${isPremium ? "Your limit resets at midnight UTC." : "Upgrade to Pro for more AI analyses."}`,
      429,
      false
    );
  }

  // Record in minute window
  recordMinuteRequest(userId);
}

// ────────────────────────────────────────────────────────────────────────────
// Concurrency Control
// ────────────────────────────────────────────────────────────────────────────

/**
 * Acquires a concurrency slot for the user.
 * Throws AIError if the user already has the maximum number of concurrent AI requests.
 */
export function acquireConcurrencySlot(userId: string, isPremium: boolean): void {
  const maxConcurrent = isPremium ? getProConcurrency() : getFreeConcurrency();
  const now = Date.now();
  const activeTimestamps = (concurrencyStore.get(userId) || []).filter(
    (t) => now - t < CONCURRENCY_SAFETY_TIMEOUT_MS
  );

  if (activeTimestamps.length >= maxConcurrent) {
    throw new AIError(
      "AI_CONCURRENCY_LIMITED",
      "An AI analysis is already in progress. Please wait for it to complete.",
      429,
      true
    );
  }

  activeTimestamps.push(now);
  concurrencyStore.set(userId, activeTimestamps);
}

/**
 * Releases a concurrency slot for the user. Must always be called in a finally block.
 */
export function releaseConcurrencySlot(userId: string): void {
  const activeTimestamps = concurrencyStore.get(userId) || [];
  if (activeTimestamps.length <= 1) {
    concurrencyStore.delete(userId);
  } else {
    activeTimestamps.shift();
    concurrencyStore.set(userId, activeTimestamps);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Usage Tracking
// ────────────────────────────────────────────────────────────────────────────

/**
 * Records an AI request in MongoDB (atomic upsert with $inc).
 * Safe to call concurrently — uses MongoDB atomic operations.
 */
export async function trackAIUsage(
  userId: string,
  tokensUsed: number,
  estimatedCost: number
): Promise<void> {
  try {
    await connectToDatabase();
    const today = getTodayUTC();

    await AIUsage.updateOne(
      { userId, date: today },
      {
        $inc: {
          requestCount: 1,
          totalTokens: tokensUsed,
          estimatedCost: estimatedCost,
        },
        $set: {
          lastRequestAt: new Date(),
        },
      },
      { upsert: true }
    );
  } catch (err) {
    // Usage tracking failure should not break the AI request
    console.error("[AI Usage Tracking Error]", err instanceof Error ? err.message : "Usage tracking failed");
  }
}

/**
 * Returns the user's AI usage statistics for the current day.
 */
export async function getUserDailyUsage(userId: string, isPremium: boolean): Promise<{
  requestsToday: number;
  dailyLimit: number;
  remainingToday: number;
}> {
  const dailyLimit = isPremium ? getProDailyLimit() : getFreeDailyLimit();
  const requestsToday = await getDailyRequestCount(userId);
  return {
    requestsToday,
    dailyLimit,
    remainingToday: Math.max(0, dailyLimit - requestsToday),
  };
}

/**
 * Returns comprehensive usage stats for the user (current day + month).
 */
export async function getComprehensiveUsageStats(userId: string, isPremium: boolean): Promise<{
  requestsToday: number;
  requestsThisMonth: number;
  totalTokensThisMonth: number;
  estimatedCostThisMonth: number;
  dailyLimit: number;
  remainingToday: number;
  lastRequestAt: string | null;
}> {
  await connectToDatabase();
  const today = getTodayUTC();
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const dailyLimit = isPremium ? getProDailyLimit() : getFreeDailyLimit();

  const [todayUsage, monthlyAgg] = await Promise.all([
    AIUsage.findOne({ userId, date: today })
      .select("requestCount lastRequestAt")
      .lean<{ requestCount?: number; lastRequestAt?: Date } | null>(),
    AIUsage.aggregate([
      { $match: { userId, date: { $gte: monthStart } } },
      {
        $group: {
          _id: null,
          totalRequests: { $sum: "$requestCount" },
          totalTokens: { $sum: "$totalTokens" },
          totalCost: { $sum: "$estimatedCost" },
          lastRequest: { $max: "$lastRequestAt" },
        },
      },
    ]),
  ]);

  const monthly = monthlyAgg[0] || {};
  const requestsToday = todayUsage?.requestCount || 0;

  return {
    requestsToday,
    requestsThisMonth: monthly.totalRequests || 0,
    totalTokensThisMonth: monthly.totalTokens || 0,
    estimatedCostThisMonth: monthly.totalCost || 0,
    dailyLimit,
    remainingToday: Math.max(0, dailyLimit - requestsToday),
    lastRequestAt: monthly.lastRequest ? new Date(monthly.lastRequest).toISOString() : null,
  };
}
