// ────────────────────────────────────────────────────────────────────────────
// AI Prompts — System prompts and templates for financial analysis
// ────────────────────────────────────────────────────────────────────────────
//
// Design notes:
// 1. System prompt is kept STABLE so DeepSeek's automatic context caching
//    can reduce per-request costs by caching the prefix.
// 2. Dynamic financial data is placed in the USER message only.
// 3. All prompts position the AI as an informational tool, not a financial advisor.
// 4. Prompt instructs JSON-only output matching our Zod validation schema.
// ────────────────────────────────────────────────────────────────────────────

import type { PreparedFinancialData } from "./types";

/**
 * Stable system prompt — remains identical across requests to maximize
 * DeepSeek prompt cache hit rate. Do not add dynamic data here.
 */
export const FINANCIAL_ANALYSIS_SYSTEM_PROMPT = `You are an intelligent financial analysis assistant integrated into a personal finance tracking application.

ROLE:
- You analyze pre-aggregated personal financial data and provide actionable insights.
- You are an informational tool, NOT a licensed financial advisor.
- You must NEVER make guarantees about investment returns, guaranteed savings, guaranteed profits, or future market performance.
- All forecasts are estimates based on historical spending patterns.

OUTPUT FORMAT:
You MUST respond with a single valid JSON object matching this exact schema:
{
  "summary": "A 1-3 sentence executive summary of the user's financial situation this period.",
  "key_findings": ["Finding 1", "Finding 2", ...],
  "spending_changes": [
    { "category": "Category Name", "direction": "up|down|stable", "percentage": 15, "note": "Brief explanation" }
  ],
  "recommendations": ["Actionable recommendation 1", "Actionable recommendation 2", ...],
  "warnings": ["Warning about concerning patterns, if any"],
  "forecast": {
    "next_month_expenses": 1500.00,
    "confidence": "low|medium|high",
    "rationale": "Based on X trend..."
  },
  "disclaimer": "These insights are estimates based on your historical spending data and are not financial advice."
}

RULES:
1. Output ONLY the JSON object. No markdown, no code fences, no explanatory text before or after.
2. Keep findings concise (under 200 characters each).
3. Maximum 8 key findings, 6 recommendations, 4 warnings, 10 spending changes.
4. If data is insufficient for meaningful analysis, say so in the summary and provide fewer findings.
5. The forecast disclaimer must always be included.
6. Use the currency provided in the data context.
7. Never reference specific merchant names, account numbers, or personally identifiable information.
8. Focus on patterns, trends, and actionable advice based on the aggregate numbers provided.
9. For forecasts, always note they are estimates with limited confidence.`;

/**
 * Builds the user message containing pre-aggregated financial data.
 * Only sends computed summaries — never raw transactions or PII.
 */
export function buildFinancialInsightPrompt(
  data: PreparedFinancialData,
  currency: string,
  dateRange?: string
): string {
  const period = dateRange || "current period";

  const categoryList = data.categoryBreakdown
    .map((c) => {
      const changeText =
        c.changePercent !== undefined
          ? ` [${c.changePercent > 0 ? "+" : ""}${c.changePercent}% vs last period (${c.previousAmount?.toFixed(2)} ${currency})]`
          : c.previousAmount !== undefined && c.previousAmount === 0
          ? ` [New spending this period]`
          : "";
      const countText = c.transactionCount ? ` (${c.transactionCount} txn${c.transactionCount > 1 ? "s" : ""})` : "";
      return `  - ${c.category}: ${c.amount.toFixed(2)} ${currency} (${c.percentOfTotal}% of expenses)${countText}${changeText}`;
    })
    .join("\n");

  const incomeList = (data.incomeBreakdown || [])
    .map((inc) => `  - ${inc.category}: ${inc.amount.toFixed(2)} ${currency} (${inc.percentOfTotal}% of income)`)
    .join("\n");

  const topItemsList = (data.topSpendingItems || [])
    .slice(0, 6)
    .map((item) => `  - ${item.item} (${item.category}): ${item.amount.toFixed(2)} ${currency}`)
    .join("\n");

  const recurringList = data.topRecurringItems
    .slice(0, 5)
    .map((r) => `  - ${r.description}: ${r.monthlyAmount.toFixed(2)} ${currency}/mo`)
    .join("\n");

  return `Analyze the following personal financial summary for the ${period}. Currency: ${currency}.

INCOME & EXPENSES:
- Total Income: ${data.totalIncome.toFixed(2)} ${currency}
- Total Expenses: ${data.totalExpenses.toFixed(2)} ${currency}
- Total Investments: ${data.totalInvestments.toFixed(2)} ${currency}
- Net Cash Flow: ${(data.totalIncome - data.totalExpenses - data.totalInvestments).toFixed(2)} ${currency}
- Savings Rate: ${data.savingsRate.toFixed(1)}%
- Daily Burn Rate: ${data.dailyBurnRate.toFixed(2)} ${currency}/day
- Days Elapsed in Period: ${data.daysElapsed} of ${data.daysInMonth}

ALL EXPENSE CATEGORIES (${data.categoryBreakdown.length} total):
${categoryList || "  No expense categories recorded."}

INCOME SOURCES:
${incomeList || "  No specific income categories recorded."}

TOP EXPENSE TRANSACTIONS:
${topItemsList || "  No transactions recorded."}

OVERALL MONTH-OVER-MONTH CHANGES:
- Income: ${data.monthOverMonthChanges.incomeChange > 0 ? "+" : ""}${data.monthOverMonthChanges.incomeChange}%
- Expenses: ${data.monthOverMonthChanges.expenseChange > 0 ? "+" : ""}${data.monthOverMonthChanges.expenseChange}%
- Investments: ${data.monthOverMonthChanges.investmentChange > 0 ? "+" : ""}${data.monthOverMonthChanges.investmentChange}%

RECURRING EXPENSES (90-day detection):
- Total Monthly Recurring: ${data.recurringExpenseTotal.toFixed(2)} ${currency}
${recurringList || "  No recurring expenses detected."}

INVESTMENT ALLOCATION:
- Investment Ratio (of income): ${data.investmentRatio.toFixed(1)}%

SAVINGS TREND:
- Current Savings Rate: ${data.savingsRate.toFixed(1)}%
- Previous Period Savings Rate: ${data.previousSavingsRate.toFixed(1)}%
- Trend: ${data.savingsTrend}

Provide a comprehensive, accurate financial analysis using the exact categories and figures above. In the spending_changes array, include the specific category names and their directional changes.`;
}

/**
 * Anonymizes transaction item descriptions to protect user privacy.
 * Maps specific merchant/service names to generic category descriptions.
 */
export function anonymizeDescription(description: string): string {
  const lower = description.toLowerCase().trim();

  // Common streaming/entertainment services
  const entertainmentPatterns = [
    "netflix", "spotify", "hulu", "disney", "hbo", "amazon prime",
    "apple tv", "youtube", "twitch", "crunchyroll", "paramount",
  ];
  if (entertainmentPatterns.some((p) => lower.includes(p))) {
    return "Entertainment subscription";
  }

  // Food delivery services
  const foodDeliveryPatterns = [
    "uber eats", "doordash", "grubhub", "instacart", "postmates",
    "zomato", "swiggy", "deliveroo",
  ];
  if (foodDeliveryPatterns.some((p) => lower.includes(p))) {
    return "Food delivery service";
  }

  // Ride-sharing
  const ridePatterns = ["uber", "lyft", "ola", "grab", "bolt"];
  if (ridePatterns.some((p) => lower.includes(p))) {
    return "Transportation service";
  }

  // Cloud/tech services
  const techPatterns = [
    "aws", "azure", "google cloud", "digitalocean", "heroku",
    "vercel", "github", "gitlab", "slack", "notion", "figma",
    "adobe", "microsoft 365", "office 365", "dropbox", "icloud",
  ];
  if (techPatterns.some((p) => lower.includes(p))) {
    return "Technology/software subscription";
  }

  // Gym/fitness
  const fitnessPatterns = ["gym", "fitness", "planet fitness", "anytime fitness", "crossfit", "peloton"];
  if (fitnessPatterns.some((p) => lower.includes(p))) {
    return "Fitness subscription";
  }

  // Insurance
  if (lower.includes("insurance")) {
    return "Insurance payment";
  }

  // For items under 4 chars or generic enough, return as-is
  if (lower.length <= 4) {
    return description;
  }

  // Default: return the description as-is if no PII pattern detected
  // The item field in this app is user-entered (e.g., "Groceries", "Rent")
  // which are typically generic enough
  return description;
}
