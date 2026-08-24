// ────────────────────────────────────────────────────────────────────────────
// AI Types — TypeScript types and Zod validation schemas for AI responses
// ────────────────────────────────────────────────────────────────────────────

import { z } from "zod";

// ────────────────────────────────────────────────────────────────────────────
// Zod Response Schema — Validates structured JSON output from DeepSeek
// ────────────────────────────────────────────────────────────────────────────

export const AISpendingChangeSchema = z.object({
  category: z.string().default("General"),
  direction: z.union([
    z.enum(["up", "down", "stable"]),
    z.string().transform((val) => {
      const lower = val.toLowerCase();
      if (lower.includes("up") || lower.includes("increase")) return "up" as const;
      if (lower.includes("down") || lower.includes("decrease")) return "down" as const;
      return "stable" as const;
    }),
  ]).default("stable"),
  percentage: z.coerce.number().default(0),
  note: z.string().default(""),
});

export const AIForecastSchema = z.object({
  next_month_expenses: z.coerce.number().default(0),
  confidence: z.union([
    z.enum(["low", "medium", "high"]),
    z.string().transform((val) => {
      const lower = val.toLowerCase();
      if (lower.includes("high")) return "high" as const;
      if (lower.includes("low")) return "low" as const;
      return "medium" as const;
    }),
  ]).default("medium"),
  rationale: z.string().default("Based on current spending trends."),
});

export const AIInsightResponseSchema = z.object({
  summary: z.string().default("Financial summary generated based on your spending data."),
  key_findings: z.array(z.string()).default([]),
  spending_changes: z.array(AISpendingChangeSchema).default([]),
  recommendations: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  forecast: AIForecastSchema.default({
    next_month_expenses: 0,
    confidence: "medium",
    rationale: "Based on current spending trends.",
  }),
  disclaimer: z.string().optional(),
});

export type AIInsightResponse = z.infer<typeof AIInsightResponseSchema>;
export type AISpendingChange = z.infer<typeof AISpendingChangeSchema>;
export type AIForecast = z.infer<typeof AIForecastSchema>;

// ────────────────────────────────────────────────────────────────────────────
// Internal Request Types
// ────────────────────────────────────────────────────────────────────────────

export type AIAnalysisType = "financial_insight" | "spending_analysis" | "forecast";

export interface AIAnalysisRequest {
  userId: string;
  analysisType: AIAnalysisType;
  isPremium: boolean;
  financialData: PreparedFinancialData;
  currency: string;
  dateRange?: string;
}

/**
 * Pre-aggregated financial data prepared by the backend before sending to DeepSeek.
 * Contains ONLY computed summaries — never raw transaction details or PII.
 */
export interface PreparedFinancialData {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  savingsRate: number;
  dailyBurnRate: number;
  daysElapsed: number;
  daysInMonth: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentOfTotal: number;
    previousAmount?: number;
    changePercent?: number;
    transactionCount?: number;
  }[];
  incomeBreakdown?: {
    category: string;
    amount: number;
    percentOfTotal: number;
  }[];
  topSpendingItems?: {
    item: string;
    category: string;
    amount: number;
  }[];
  monthOverMonthChanges: {
    incomeChange: number;
    expenseChange: number;
    investmentChange: number;
  };
  recurringExpenseTotal: number;
  topRecurringItems: { description: string; monthlyAmount: number }[];
  investmentRatio: number;
  previousSavingsRate: number;
  savingsTrend: "improving" | "declining" | "stable";
}

// ────────────────────────────────────────────────────────────────────────────
// DeepSeek API Types (OpenAI-compatible Chat Completions)
// ────────────────────────────────────────────────────────────────────────────

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekChatRequest {
  model: string;
  messages: DeepSeekMessage[];
  response_format?: { type: "json_object" };
  temperature?: number;
  max_tokens?: number;
  user?: string;
  stream?: false;
}

export interface DeepSeekUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
}

export interface DeepSeekChatResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: DeepSeekUsage;
}

// ────────────────────────────────────────────────────────────────────────────
// Frontend Result Type
// ────────────────────────────────────────────────────────────────────────────

export interface AIInsightsResult {
  success: true;
  insights: AIInsightResponse;
  usage: {
    requestsToday: number;
    dailyLimit: number;
    remainingToday: number;
  };
  cached: boolean;
  generatedAt: string;
}

export interface AIInsightsError {
  success: false;
  error: string;
  message: string;
  retryable: boolean;
  usage?: {
    requestsToday: number;
    dailyLimit: number;
    remainingToday: number;
  };
}

export type AIInsightsResponse = AIInsightsResult | AIInsightsError;

export interface AIUsageStats {
  requestsToday: number;
  requestsThisMonth: number;
  totalTokensThisMonth: number;
  estimatedCostThisMonth: number;
  dailyLimit: number;
  remainingToday: number;
  lastRequestAt: string | null;
}
