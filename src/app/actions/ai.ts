"use server";

// ────────────────────────────────────────────────────────────────────────────
// AI Server Actions — Full pipeline: Auth → Sub → Rate → Concurrency → Cache → DeepSeek → Validate → Return
// ────────────────────────────────────────────────────────────────────────────

import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { requireAuthUser } from "@/lib/auth";
import { hasActiveSubscription } from "@/lib/subscription";
import { callDeepSeek, validateAIResponse, estimateCost } from "@/lib/ai/deepseek";
import { FINANCIAL_ANALYSIS_SYSTEM_PROMPT, buildFinancialInsightPrompt, anonymizeDescription } from "@/lib/ai/prompts";
import {
  checkRateLimit,
  acquireConcurrencySlot,
  releaseConcurrencySlot,
  trackAIUsage,
  getUserDailyUsage,
  getComprehensiveUsageStats,
} from "@/lib/ai/rate-limit";
import { computeDataHash, getCachedAIResult, setCachedAIResult } from "@/lib/ai/cache";
import { AIError, toSafeErrorResponse } from "@/lib/ai/errors";
import type {
  AIInsightsResponse,
  AIUsageStats,
  PreparedFinancialData,
  DeepSeekMessage,
} from "@/lib/ai/types";
import { getDateRangeBounds } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Data Preparation — Aggregates & anonymizes financial data before sending to DeepSeek
// ────────────────────────────────────────────────────────────────────────────

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

async function prepareFinancialData(
  userId: string,
  dateRange: string,
  customStart?: string,
  customEnd?: string
): Promise<PreparedFinancialData> {
  await connectToDatabase();

  const now = new Date();
  const { startDate, endDate } = getDateRangeBounds(dateRange, customStart, customEnd);

  // Calculate previous period bounds for MoM comparison
  const currentStart = startDate || new Date(now.getFullYear(), now.getMonth(), 1);
  const currentEnd = endDate || now;
  const prevStart = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1);
  const prevEnd = new Date(currentStart.getFullYear(), currentStart.getMonth(), 0, 23, 59, 59, 999);

  const lookbackDate = new Date();
  lookbackDate.setDate(lookbackDate.getDate() - 90);

  // Build query for current period
  const currentQuery: Record<string, unknown> = { userId };
  if (startDate || endDate) {
    const dateFilter: Record<string, Date> = {};
    if (startDate) dateFilter.$gte = startDate;
    if (endDate) dateFilter.$lte = endDate;
    currentQuery.date = dateFilter;
  }

  // Execute aggregations concurrently
  const [currentFacet, previousFacet, recurringRaw] = await Promise.all([
    Transaction.aggregate([
      { $match: currentQuery },
      {
        $facet: {
          totalsByType: [
            { $group: { _id: "$type", total: { $sum: "$amount" } } },
          ],
          expenseCategories: [
            { $match: { type: "Expense" } },
            {
              $group: {
                _id: "$categoryName",
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { amount: -1 } },
          ],
          incomeCategories: [
            { $match: { type: "Income" } },
            {
              $group: {
                _id: "$categoryName",
                amount: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { amount: -1 } },
          ],
          topTransactions: [
            { $match: { type: "Expense" } },
            { $sort: { amount: -1 } },
            { $limit: 8 },
            {
              $project: {
                item: 1,
                category: "$categoryName",
                amount: 1,
              },
            },
          ],
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId, date: { $gte: prevStart, $lte: prevEnd } } },
      {
        $facet: {
          totalsByType: [
            { $group: { _id: "$type", total: { $sum: "$amount" } } },
          ],
          expenseCategories: [
            { $match: { type: "Expense" } },
            {
              $group: {
                _id: "$categoryName",
                amount: { $sum: "$amount" },
              },
            },
          ],
        },
      },
    ]),
    Transaction.aggregate([
      { $match: { userId, type: "Expense", date: { $gte: lookbackDate } } },
      {
        $group: {
          _id: { $toLower: { $trim: { input: "$item" } } },
          item: { $first: "$item" },
          amounts: { $push: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
        },
      },
      { $match: { count: { $gte: 3 } } },
      { $sort: { avgAmount: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Extract current period totals
  const curFacet = currentFacet[0] || {};
  let curIncome = 0, curExpenses = 0, curInvestments = 0;
  (curFacet.totalsByType || []).forEach((t: { _id: string; total: number }) => {
    if (t._id === "Income") curIncome = t.total || 0;
    else if (t._id === "Expense") curExpenses = t.total || 0;
    else if (t._id === "Investment") curInvestments = t.total || 0;
  });

  // Extract previous period totals & category map
  const prevFacet = previousFacet[0] || {};
  let prevIncome = 0, prevExpenses = 0, prevInvestments = 0;
  (prevFacet.totalsByType || []).forEach((t: { _id: string; total: number }) => {
    if (t._id === "Income") prevIncome = t.total || 0;
    else if (t._id === "Expense") prevExpenses = t.total || 0;
    else if (t._id === "Investment") prevInvestments = t.total || 0;
  });

  const prevCatMap = new Map<string, number>();
  (prevFacet.expenseCategories || []).forEach((c: { _id: string; amount: number }) => {
    if (c._id) prevCatMap.set(c._id, c.amount || 0);
  });

  // Detailed category breakdown with per-category MoM change
  const totalExpForPct = curExpenses || 1;
  const categoryBreakdown = (curFacet.expenseCategories || [])
    .slice(0, 20)
    .map((c: { _id: string; amount: number; count?: number }) => {
      const prevAmt = prevCatMap.get(c._id) || 0;
      return {
        category: c._id || "Uncategorized",
        amount: c.amount,
        percentOfTotal: Math.round((c.amount / totalExpForPct) * 100),
        previousAmount: prevAmt,
        changePercent: prevAmt > 0 ? pctChange(c.amount, prevAmt) : undefined,
        transactionCount: c.count || 1,
      };
    });

  // Income sources breakdown
  const totalIncForPct = curIncome || 1;
  const incomeBreakdown = (curFacet.incomeCategories || [])
    .slice(0, 10)
    .map((c: { _id: string; amount: number }) => ({
      category: c._id || "Income",
      amount: c.amount,
      percentOfTotal: Math.round((c.amount / totalIncForPct) * 100),
    }));

  // Top spending items
  const topSpendingItems = (curFacet.topTransactions || []).map(
    (t: { item: string; category: string; amount: number }) => ({
      item: anonymizeDescription(t.item || "Expense"),
      category: t.category || "General",
      amount: t.amount || 0,
    })
  );

  // Daily metrics
  const targetDate = startDate || now;
  const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
  const periodStartMs = currentStart.getTime();
  const periodEndMs = Math.min(now.getTime(), currentEnd.getTime());
  const daysElapsed = Math.max(1, Math.min(daysInMonth, Math.ceil((periodEndMs - periodStartMs) / (1000 * 60 * 60 * 24))));
  const dailyBurnRate = curExpenses / daysElapsed;

  // Savings calculations
  const savingsRate = curIncome > 0 ? ((curIncome - curExpenses) / curIncome) * 100 : 0;
  const previousSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpenses) / prevIncome) * 100 : 0;
  let savingsTrend: "improving" | "declining" | "stable" = "stable";
  if (savingsRate - previousSavingsRate > 3) savingsTrend = "improving";
  else if (previousSavingsRate - savingsRate > 3) savingsTrend = "declining";

  // Recurring expenses (anonymized descriptions)
  const topRecurringItems = (recurringRaw || []).map((r: { item: string; avgAmount: number; amounts: number[] }) => {
    const avg = r.avgAmount || 0;
    const variance = r.amounts.length > 0
      ? Math.sqrt(r.amounts.reduce((sum: number, a: number) => sum + Math.pow(a - avg, 2), 0) / r.amounts.length) / (avg || 1)
      : 1;
    return {
      description: anonymizeDescription(r.item),
      monthlyAmount: variance <= 0.25 ? Math.round(avg * 100) / 100 : 0,
    };
  }).filter((r: { monthlyAmount: number }) => r.monthlyAmount > 0);

  const recurringExpenseTotal = topRecurringItems.reduce(
    (sum: number, r: { monthlyAmount: number }) => sum + r.monthlyAmount,
    0
  );

  return {
    totalIncome: curIncome,
    totalExpenses: curExpenses,
    totalInvestments: curInvestments,
    savingsRate: Math.round(savingsRate * 10) / 10,
    dailyBurnRate: Math.round(dailyBurnRate * 100) / 100,
    daysElapsed,
    daysInMonth,
    categoryBreakdown,
    incomeBreakdown,
    topSpendingItems,
    monthOverMonthChanges: {
      incomeChange: pctChange(curIncome, prevIncome),
      expenseChange: pctChange(curExpenses, prevExpenses),
      investmentChange: pctChange(curInvestments, prevInvestments),
    },
    recurringExpenseTotal: Math.round(recurringExpenseTotal * 100) / 100,
    topRecurringItems,
    investmentRatio: curIncome > 0 ? Math.round((curInvestments / curIncome) * 1000) / 10 : 0,
    previousSavingsRate: Math.round(previousSavingsRate * 10) / 10,
    savingsTrend,
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Main Server Action: Generate AI Insights
// ────────────────────────────────────────────────────────────────────────────

export async function generateAIInsights(filters?: {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AIInsightsResponse> {
  let userId = "";
  let concurrencyAcquired = false;
  let isPremium = false;

  try {
    // ── Step 1: Authentication ──
    const sessionUser = await requireAuthUser();
    userId = sessionUser.id;
    const currency = sessionUser.currency || "USD";

    // ── Step 2: Subscription Check (server-side, cannot be bypassed) ──
    isPremium = await hasActiveSubscription(userId, sessionUser.email);

    // ── Step 3: Rate Limit Check ──
    await checkRateLimit(userId, isPremium);

    // ── Step 4: Concurrency Guard ──
    acquireConcurrencySlot(userId, isPremium);
    concurrencyAcquired = true;

    // ── Step 5: Prepare Financial Data ──
    const dateRange = filters?.dateRange || "This Month";
    const financialData = await prepareFinancialData(
      userId,
      dateRange,
      filters?.startDate,
      filters?.endDate
    );

    // ── Step 6: Check Cache ──
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM
    const dataHash = computeDataHash(financialData as unknown as Record<string, unknown>);
    const cached = getCachedAIResult(userId, "financial_insight", month, dataHash);

    if (cached) {
      const usage = await getUserDailyUsage(userId, isPremium);
      console.log(`[AI Cache Hit] userId=${userId} month=${month}`);
      return {
        success: true,
        insights: cached.insights,
        usage,
        cached: true,
        generatedAt: cached.generatedAt,
      };
    }

    // ── Step 7: Build Prompt ──
    const messages: DeepSeekMessage[] = [
      { role: "system", content: FINANCIAL_ANALYSIS_SYSTEM_PROMPT },
      { role: "user", content: buildFinancialInsightPrompt(financialData, currency, dateRange) },
    ];

    // ── Step 8: Call DeepSeek ──
    const result = await callDeepSeek(messages, userId, {
      temperature: 0.3,
      maxTokens: 4096,
      jsonMode: true,
    });

    // ── Step 9: Validate Response ──
    const insights = validateAIResponse(result.content);

    // ── Step 10: Ensure disclaimer is present ──
    if (!insights.disclaimer) {
      insights.disclaimer = "These insights are estimates based on your historical spending data and are not financial advice.";
    }

    // ── Step 11: Cache Result ──
    setCachedAIResult(userId, "financial_insight", month, dataHash, insights);

    // ── Step 12: Track Usage ──
    const cost = estimateCost(result.usage);
    await trackAIUsage(userId, result.usage?.total_tokens || 0, cost);

    // ── Step 13: Return Result ──
    const usage = await getUserDailyUsage(userId, isPremium);
    return {
      success: true,
      insights,
      usage,
      cached: false,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error(
      "[AI Insights Error]",
      error instanceof AIError ? `code=${error.code}` : "unknown",
      `userId=${userId || "unauthenticated"}`
    );

    const safeError = toSafeErrorResponse(error);

    // Try to include usage stats even on error
    let usage: { requestsToday: number; dailyLimit: number; remainingToday: number } | undefined;
    try {
      if (userId) {
        usage = await getUserDailyUsage(userId, isPremium);
      }
    } catch {
      // Ignore usage fetch failure on error path
    }

    // Handle authentication errors specially
    if (error instanceof Error && error.message.includes("Unauthorized")) {
      return {
        success: false,
        error: "UNAUTHORIZED",
        message: "Please sign in to use AI insights.",
        retryable: false,
      };
    }

    return {
      success: false,
      error: safeError.error,
      message: safeError.message,
      retryable: safeError.retryable,
      usage,
    };
  } finally {
    if (concurrencyAcquired && userId) {
      releaseConcurrencySlot(userId);
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Usage Stats Server Action
// ────────────────────────────────────────────────────────────────────────────

export async function getAIUsageStats(): Promise<
  | { success: true; stats: AIUsageStats }
  | { success: false; error: string }
> {
  try {
    const sessionUser = await requireAuthUser();
    const isPremium = await hasActiveSubscription(sessionUser.id, sessionUser.email);
    const stats = await getComprehensiveUsageStats(sessionUser.id, isPremium);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error && error.message.includes("Unauthorized")
        ? "Please sign in to view AI usage."
        : "Failed to retrieve AI usage statistics.",
    };
  }
}
