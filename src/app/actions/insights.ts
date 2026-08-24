"use server";

import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { requireAuthUser } from "@/lib/auth";
import { getDateRangeBounds, formatCurrency } from "@/lib/utils";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface InsightItem {
  id: string;
  type: "warning" | "positive" | "neutral" | "info" | "ai";
  icon: string;
  headline: string;
  description: string;
  metric?: string;
  delta?: number;
}

export interface RecurringExpense {
  item: string;
  categoryName: string;
  occurrences: number;
  averageAmount: number;
  estimatedMonthly: number;
  lastDate: string;
  amountVariance: number;
}

export interface MonthComparisonCategory {
  category: string;
  currentAmount: number;
  previousAmount: number;
  delta: number;
  absoluteChange: number;
}

export interface MonthComparison {
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  currentIncome: number;
  previousIncome: number;
  incomeDelta: number;
  currentExpenses: number;
  previousExpenses: number;
  expensesDelta: number;
  currentInvestments: number;
  previousInvestments: number;
  investmentsDelta: number;
  categories: MonthComparisonCategory[];
}

export interface SavingsAnalysis {
  savingsRate: number;
  currentSavings: number;
  totalIncome: number;
  totalExpenses: number;
  projectedMonthlySavings: number;
  dailyBurnRate: number;
  projectedMonthEndTotal: number;
  daysInMonth: number;
  daysElapsed: number;
  trend: "improving" | "declining" | "stable";
  previousSavingsRate: number;
}

export interface NetWorthSnapshot {
  totalInvestments: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  investmentsByCategory: { name: string; amount: number }[];
}

export interface HealthScore {
  score: number;
  grade: "Excellent" | "Good" | "Needs Attention" | "Critical";
  color: string;
  breakdown: {
    savingsRate: { score: number; weight: number; detail: string };
    spendingConsistency: { score: number; weight: number; detail: string };
    investmentRatio: { score: number; weight: number; detail: string };
    expenseDiversity: { score: number; weight: number; detail: string };
    trendImprovement: { score: number; weight: number; detail: string };
  };
}

export interface InsightsFilter {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export interface ComprehensiveInsightsResponse {
  success: boolean;
  currency: string;
  insights: InsightItem[];
  recurring: RecurringExpense[];
  totalMonthlyRecurring: number;
  comparison: MonthComparison | null;
  savings: SavingsAnalysis | null;
  netWorth: NetWorthSnapshot | null;
  healthScore: HealthScore | null;
  error?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// Pure Helper Functions
// ────────────────────────────────────────────────────────────────────────────

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : current < 0 ? -100 : 0;
  return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

function getPreviousPeriodBounds(start: Date | null, end: Date | null) {
  const now = new Date();
  if (!start || !end) {
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59, 999);
    return {
      currentStart: thisMonthStart,
      currentEnd: now,
      previousStart: lastMonthStart,
      previousEnd: lastMonthEnd,
    };
  }

  // Proper calendar month shifting if starting on 1st of month
  if (start.getDate() === 1) {
    const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1, 0, 0, 0, 0);
    const lastDayOfPrevMonth = new Date(start.getFullYear(), start.getMonth(), 0).getDate();
    // If viewing current running month mid-month, compare identical days (MTD vs prior MTD)
    const isCurrentMonthRunning = start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
    const dayToMatch = isCurrentMonthRunning ? Math.min(end.getDate(), lastDayOfPrevMonth) : lastDayOfPrevMonth;
    const prevEnd = new Date(start.getFullYear(), start.getMonth() - 1, dayToMatch, 23, 59, 59, 999);
    return {
      currentStart: start,
      currentEnd: end,
      previousStart: prevStart,
      previousEnd: prevEnd,
    };
  }

  // Fallback shift by duration for custom date ranges
  const duration = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return {
    currentStart: start,
    currentEnd: end,
    previousStart,
    previousEnd,
  };
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

// ────────────────────────────────────────────────────────────────────────────
// Single-Fetch Batch Intelligence Engine
// ────────────────────────────────────────────────────────────────────────────

export async function getComprehensiveFinancialInsights(
  filters?: InsightsFilter
): Promise<ComprehensiveInsightsResponse> {
  try {
    const sessionUser = await requireAuthUser();
    await connectToDatabase();

    // 1. Fetch user currency & settings directly from authenticated session
    const currency = sessionUser.currency || "USD";
    const fmt = (amt: number) => formatCurrency(amt, currency);

    const range = filters?.dateRange || "This Month";
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);
    const periods = getPreviousPeriodBounds(startDate, endDate);

    // 2. Lookback date for recurring expenses (90 days)
    const lookbackDate = new Date();
    lookbackDate.setDate(lookbackDate.getDate() - 90);

    // 3. Batch DB queries with projections (select only required fields)
    const currentQuery: any = { userId: sessionUser.id };
    if (periods.currentStart || periods.currentEnd) {
      currentQuery.date = {};
      if (periods.currentStart) currentQuery.date.$gte = periods.currentStart;
      if (periods.currentEnd) currentQuery.date.$lte = periods.currentEnd;
    }

    const previousQuery: any = {
      userId: sessionUser.id,
      date: {
        $gte: periods.previousStart,
        $lte: periods.previousEnd,
      },
    };

    const recurringQuery: any = {
      userId: sessionUser.id,
      type: "Expense",
      date: { $gte: lookbackDate },
    };

    // Execute optimized native MongoDB aggregations concurrently for blazing speed
    const [currentFacetRes, previousFacetRes, recurringRaw, allTimeSummary, allTimeInvestCats] = await Promise.all([
      Transaction.aggregate([
        { $match: currentQuery },
        {
          $facet: {
            totalsByType: [
              {
                $group: {
                  _id: "$type",
                  total: { $sum: "$amount" },
                },
              },
            ],
            expenseCategories: [
              { $match: { type: "Expense" } },
              {
                $group: {
                  _id: "$categoryName",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
            expenseItems: [
              { $match: { type: "Expense" } },
              {
                $group: {
                  _id: "$item",
                  total: { $sum: "$amount" },
                  count: { $sum: 1 },
                  category: { $first: "$categoryName" },
                },
              },
              { $sort: { total: -1 } },
            ],
          },
        },
      ]),
      Transaction.aggregate([
        { $match: previousQuery },
        {
          $facet: {
            totalsByType: [
              {
                $group: {
                  _id: "$type",
                  total: { $sum: "$amount" },
                },
              },
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
        { $match: recurringQuery },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$item" } } },
            item: { $first: "$item" },
            category: { $first: "$categoryName" },
            amounts: { $push: "$amount" },
            dates: { $push: "$date" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
            lastDate: { $max: "$date" },
          },
        },
        { $match: { count: { $gte: 3 } } },
      ]),
      Transaction.aggregate([
        { $match: { userId: sessionUser.id } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
      Transaction.aggregate([
        { $match: { userId: sessionUser.id, type: "Investment" } },
        {
          $group: {
            _id: "$categoryName",
            amount: { $sum: "$amount" },
          },
        },
        { $sort: { amount: -1 } },
      ]),
    ]);

    // ────────────────────────────────────────────────────────────────────────
    // Computation A: Current vs Previous Period Extraction
    // ────────────────────────────────────────────────────────────────────────
    const curFacet = currentFacetRes[0] || {};
    const prevFacet = previousFacetRes[0] || {};

    let curIncome = 0, curExpenses = 0, curInvestments = 0;
    (curFacet.totalsByType || []).forEach((t: any) => {
      const amt = Number(t.total) || 0;
      if (t._id === "Income") curIncome = amt;
      else if (t._id === "Expense") curExpenses = amt;
      else if (t._id === "Investment") curInvestments = amt;
    });

    const curCatMap: Record<string, number> = {};
    (curFacet.expenseCategories || []).forEach((c: any) => {
      curCatMap[c._id] = Number(c.amount) || 0;
    });

    const curItemMap: Record<string, { count: number; total: number; category: string }> = {};
    (curFacet.expenseItems || []).forEach((item: any) => {
      curItemMap[item._id] = {
        count: item.count || 0,
        total: Number(item.total) || 0,
        category: item.category || "General",
      };
    });

    let prevIncome = 0, prevExpenses = 0, prevInvestments = 0;
    (prevFacet.totalsByType || []).forEach((t: any) => {
      const amt = Number(t.total) || 0;
      if (t._id === "Income") prevIncome = amt;
      else if (t._id === "Expense") prevExpenses = amt;
      else if (t._id === "Investment") prevInvestments = amt;
    });

    const prevCatMap: Record<string, number> = {};
    (prevFacet.expenseCategories || []).forEach((c: any) => {
      prevCatMap[c._id] = Number(c.amount) || 0;
    });

    // ────────────────────────────────────────────────────────────────────────
    // Computation B: Natural Language Spending Insights
    // ────────────────────────────────────────────────────────────────────────
    const insights: InsightItem[] = [];
    let insightIdx = 0;

    // B1: Top category narrative
    const sortedCategories = Object.entries(curCatMap).sort(([, a], [, b]) => b - a);
    if (sortedCategories.length > 0) {
      const [topCat, topAmt] = sortedCategories[0];
      const prevAmt = prevCatMap[topCat] || 0;
      const delta = pctChange(topAmt, prevAmt);

      const catItems = Object.entries(curItemMap)
        .filter(([, v]) => v.category === topCat)
        .sort(([, a], [, b]) => b.total - a.total);
      const topSubItem = catItems[0];
      const subItemPct = topSubItem && topAmt > 0 ? Math.round((topSubItem[1].total / topAmt) * 100) : 0;

      let description = `Your top spending category is ${topCat} at ${fmt(topAmt)}.`;
      if (prevAmt > 0 && delta !== 0) {
        description += ` That's ${Math.abs(delta)}% ${delta > 0 ? "more" : "less"} than last period.`;
      }
      if (topSubItem && subItemPct > 30) {
        description += ` ${topSubItem[0]} accounts for ${subItemPct}% of your ${topCat} spending.`;
      }

      insights.push({
        id: `insight-${insightIdx++}`,
        type: delta > 20 ? "warning" : delta < -10 ? "positive" : "neutral",
        icon: "PieChart",
        headline: `${topCat}: ${fmt(topAmt)}`,
        description,
        metric: fmt(topAmt),
        delta,
      });
    }

    // B2: Daily burn & velocity
    const now = new Date();
    const targetDate = periods.currentStart || now;
    const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
    const periodStartMs = (periods.currentStart || new Date(now.getFullYear(), now.getMonth(), 1)).getTime();
    const periodEndMs = Math.min(now.getTime(), (periods.currentEnd || now).getTime());
    const rawElapsedDays = Math.max(1, Math.ceil((periodEndMs - periodStartMs) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.min(daysInMonth, rawElapsedDays);
    const dailyBurn = curExpenses / daysElapsed;
    const projectedTotal = dailyBurn * daysInMonth;

    if (curExpenses > 0) {
      insights.push({
        id: `insight-${insightIdx++}`,
        type: projectedTotal > curIncome * 0.9 && curIncome > 0 ? "warning" : "info",
        icon: "Zap",
        headline: `Spending ${fmt(dailyBurn)}/day`,
        description: `At your current pace, you'll spend ~${fmt(projectedTotal)} this month. ${
          curIncome > 0 && projectedTotal > curIncome
            ? "That exceeds your income — consider slowing down."
            : curIncome > 0
            ? `That's ${Math.round((projectedTotal / curIncome) * 100)}% of your income.`
            : "Keep track of your daily expenses."
        }`,
        metric: `${fmt(dailyBurn)}/day`,
      });
    }

    // B3: Income vs expense trend
    const expenseDelta = pctChange(curExpenses, prevExpenses);
    const incomeDelta = pctChange(curIncome, prevIncome);

    if (prevExpenses > 0 || prevIncome > 0) {
      if (curIncome > curExpenses && curIncome >= prevIncome) {
        insights.push({
          id: `insight-${insightIdx++}`,
          type: "positive",
          icon: "TrendingUp",
          headline: "Income growing, expenses covered",
          description: `Income is ${incomeDelta >= 0 ? `up ${incomeDelta}%` : `down ${Math.abs(incomeDelta)}%`} while expenses ${
            expenseDelta > 0 ? `rose ${expenseDelta}%` : `dropped ${Math.abs(expenseDelta)}%`
          }. You're in a healthy position.`,
          delta: incomeDelta,
        });
      } else if (curExpenses > curIncome) {
        insights.push({
          id: `insight-${insightIdx++}`,
          type: "warning",
          icon: "AlertTriangle",
          headline: "Spending exceeds income",
          description: `You've spent ${fmt(curExpenses)} against ${fmt(curIncome)} in income. That's a ${fmt(curExpenses - curIncome)} deficit this period.`,
          delta: expenseDelta,
        });
      }
    }

    // B4: Category spikes / drops
    for (const [cat, amt] of sortedCategories.slice(1, 4)) {
      const prev = prevCatMap[cat] || 0;
      const d = pctChange(amt, prev);
      if (d > 30 && prev > 0) {
        insights.push({
          id: `insight-${insightIdx++}`,
          type: "warning",
          icon: "ArrowUpRight",
          headline: `${cat} spiked ${d}%`,
          description: `${cat} spending jumped from ${fmt(prev)} to ${fmt(amt)} — a ${d}% increase.`,
          metric: fmt(amt),
          delta: d,
        });
      } else if (d < -20 && prev > 0) {
        insights.push({
          id: `insight-${insightIdx++}`,
          type: "positive",
          icon: "ArrowDownRight",
          headline: `${cat} dropped ${Math.abs(d)}%`,
          description: `Great work! ${cat} spending fell from ${fmt(prev)} to ${fmt(amt)}.`,
          metric: fmt(amt),
          delta: d,
        });
      }
    }

    // B5: Savings rate narrative
    if (curIncome > 0) {
      const savingsRate = Math.round(((curIncome - curExpenses) / curIncome) * 100);
      insights.push({
        id: `insight-${insightIdx++}`,
        type: savingsRate >= 20 ? "positive" : savingsRate >= 0 ? "neutral" : "warning",
        icon: "PiggyBank",
        headline: `Savings rate: ${savingsRate}%`,
        description:
          savingsRate >= 30
            ? `Excellent! You're saving ${savingsRate}% of your income. Financial experts recommend 20%+.`
            : savingsRate >= 10
            ? `You're saving ${savingsRate}% of income. Try pushing towards 20% for stronger financial health.`
            : savingsRate >= 0
            ? `Only ${savingsRate}% of income is being saved. Look for areas to cut back.`
            : `You're spending more than you earn. Immediate attention needed.`,
        metric: `${savingsRate}%`,
      });
    }

    // B6: Investment allocation narrative
    if (curInvestments > 0) {
      const investRatio = curIncome > 0 ? Math.round((curInvestments / curIncome) * 100) : 0;
      insights.push({
        id: `insight-${insightIdx++}`,
        type: investRatio >= 10 ? "positive" : "info",
        icon: "LineChart",
        headline: `Investing ${investRatio}% of income`,
        description: `You invested ${fmt(curInvestments)} this period (${investRatio}% of income). ${
          investRatio >= 20
            ? "Strong allocation — keep building your portfolio."
            : investRatio >= 10
            ? "Solid start. Consider increasing to 20%+ for long-term growth."
            : "Consider allocating more towards investments for wealth building."
        }`,
        metric: `${investRatio}%`,
      });
    }

    // ────────────────────────────────────────────────────────────────────────
    // Computation C: Recurring Expenses Detection via DB aggregation results
    // ────────────────────────────────────────────────────────────────────────
    const recurring: RecurringExpense[] = [];

    (recurringRaw || []).forEach((group: any) => {
      const amounts: number[] = group.amounts || [];
      const dates: Date[] = (group.dates || [])
        .map((d: any) => new Date(d))
        .sort((a: Date, b: Date) => a.getTime() - b.getTime());

      if (amounts.length < 3) return;

      const avg = group.avgAmount || (amounts.reduce((s: number, a: number) => s + a, 0) / amounts.length);
      const variance =
        Math.sqrt(
          amounts.reduce((sum: number, a: number) => sum + Math.pow(a - avg, 2), 0) / amounts.length
        ) / (avg || 1);

      if (variance <= 0.25) {
        let totalIntervalDays = 0;
        let intervalsCount = 0;
        for (let i = 1; i < dates.length; i++) {
          const diffDays = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays > 0) {
            totalIntervalDays += diffDays;
            intervalsCount++;
          }
        }
        const avgIntervalDays = intervalsCount > 0 ? totalIntervalDays / intervalsCount : 30;

        if (avgIntervalDays >= 4) {
          let monthlyFreq = 1;
          if (avgIntervalDays >= 25 && avgIntervalDays <= 35) monthlyFreq = 1;
          else if (avgIntervalDays >= 12 && avgIntervalDays <= 16) monthlyFreq = 2;
          else if (avgIntervalDays >= 6 && avgIntervalDays <= 8) monthlyFreq = 4.33;
          else monthlyFreq = Math.min(10, Math.max(0.5, 30 / avgIntervalDays));

          recurring.push({
            item: group.item,
            categoryName: group.category || "General",
            occurrences: amounts.length,
            averageAmount: Math.round(avg * 100) / 100,
            estimatedMonthly: Math.round(avg * monthlyFreq * 100) / 100,
            lastDate: group.lastDate ? new Date(group.lastDate).toISOString() : dates[dates.length - 1].toISOString(),
            amountVariance: Math.round(variance * 100) / 100,
          });
        }
      }
    });

    recurring.sort((a, b) => b.estimatedMonthly - a.estimatedMonthly);
    const totalMonthlyRecurring = Math.round(recurring.reduce((s, r) => s + r.estimatedMonthly, 0) * 100) / 100;

    // ────────────────────────────────────────────────────────────────────────
    // Computation D: Month Comparison
    // ────────────────────────────────────────────────────────────────────────
    const allCategories = new Set([...Object.keys(curCatMap), ...Object.keys(prevCatMap)]);
    const categories: MonthComparisonCategory[] = [];

    for (const cat of allCategories) {
      const cur = curCatMap[cat] || 0;
      const prev = prevCatMap[cat] || 0;
      categories.push({
        category: cat,
        currentAmount: cur,
        previousAmount: prev,
        delta: pctChange(cur, prev),
        absoluteChange: cur - prev,
      });
    }

    categories.sort((a, b) => b.currentAmount - a.currentAmount);

    const comparison: MonthComparison = {
      currentPeriodLabel: getMonthLabel(periods.currentStart || new Date()),
      previousPeriodLabel: getMonthLabel(periods.previousStart),
      currentIncome: curIncome,
      previousIncome: prevIncome,
      incomeDelta: pctChange(curIncome, prevIncome),
      currentExpenses: curExpenses,
      previousExpenses: prevExpenses,
      expensesDelta: pctChange(curExpenses, prevExpenses),
      currentInvestments: curInvestments,
      previousInvestments: prevInvestments,
      investmentsDelta: pctChange(curInvestments, prevInvestments),
      categories,
    };

    // ────────────────────────────────────────────────────────────────────────
    // Computation E: Savings Analysis
    // ────────────────────────────────────────────────────────────────────────
    const rawSavingsRate = curIncome > 0 ? ((curIncome - curExpenses) / curIncome) * 100 : 0;
    const previousSavingsRate = prevIncome > 0 ? ((prevIncome - prevExpenses) / prevIncome) * 100 : 0;
    const projectedMonthEndTotal = dailyBurn * daysInMonth;
    const projectedMonthlySavings = curIncome - projectedMonthEndTotal;

    let trend: "improving" | "declining" | "stable" = "stable";
    if (rawSavingsRate - previousSavingsRate > 3) trend = "improving";
    else if (previousSavingsRate - rawSavingsRate > 3) trend = "declining";

    const savings: SavingsAnalysis = {
      savingsRate: Math.round(rawSavingsRate * 10) / 10,
      currentSavings: curIncome - curExpenses,
      totalIncome: curIncome,
      totalExpenses: curExpenses,
      projectedMonthlySavings: Math.round(projectedMonthlySavings),
      dailyBurnRate: Math.round(dailyBurn * 100) / 100,
      projectedMonthEndTotal: Math.round(projectedMonthEndTotal),
      daysInMonth,
      daysElapsed,
      trend,
      previousSavingsRate: Math.round(previousSavingsRate * 10) / 10,
    };

    // ────────────────────────────────────────────────────────────────────────
    // Computation F: Net Worth Snapshot (All Time via Aggregation)
    // ────────────────────────────────────────────────────────────────────────
    let totalAllIncome = 0, totalAllExpenses = 0, totalAllInvestments = 0;

    allTimeSummary.forEach((group: any) => {
      const amt = Number(group.total) || 0;
      if (group._id === "Income") totalAllIncome = amt;
      else if (group._id === "Expense") totalAllExpenses = amt;
      else if (group._id === "Investment") totalAllInvestments = amt;
    });

    const investmentsByCategory = allTimeInvestCats.map((item: any) => ({
      name: item._id || "Uncategorized",
      amount: item.amount || 0,
    }));

    // True Net Worth = Total Retained Wealth (Total Income - Total Expenses = Liquid Cash + Total Investments)
    const netWorth: NetWorthSnapshot = {
      totalInvestments: totalAllInvestments,
      totalIncome: totalAllIncome,
      totalExpenses: totalAllExpenses,
      netBalance: totalAllIncome - totalAllExpenses,
      investmentsByCategory,
    };

    // ────────────────────────────────────────────────────────────────────────
    // Computation G: Financial Health Score (0–100)
    // ────────────────────────────────────────────────────────────────────────
    let savingsScore: number;
    if (rawSavingsRate >= 30) savingsScore = 100;
    else if (rawSavingsRate >= 20) savingsScore = 80 + ((rawSavingsRate - 20) / 10) * 20;
    else if (rawSavingsRate >= 10) savingsScore = 60 + ((rawSavingsRate - 10) / 10) * 20;
    else if (rawSavingsRate >= 0) savingsScore = 40 + (rawSavingsRate / 10) * 20;
    else savingsScore = Math.max(0, 40 + rawSavingsRate);

    const expDeltaAbs = Math.abs(pctChange(curExpenses, prevExpenses));
    let consistencyScore: number;
    if (prevExpenses === 0) consistencyScore = 50;
    else if (expDeltaAbs <= 10) consistencyScore = 100;
    else if (expDeltaAbs <= 25) consistencyScore = 80;
    else if (expDeltaAbs <= 50) consistencyScore = 60;
    else consistencyScore = Math.max(20, 60 - (expDeltaAbs - 50));

    const investRatio = curIncome > 0 ? (curInvestments / curIncome) * 100 : 0;
    let investScore: number;
    if (investRatio >= 20) investScore = 100;
    else if (investRatio >= 10) investScore = 70 + ((investRatio - 10) / 10) * 30;
    else if (investRatio > 0) investScore = 30 + (investRatio / 10) * 40;
    else investScore = 20;

    const catValues = Object.values(curCatMap);
    let diversityScore: number;
    if (catValues.length <= 1) {
      diversityScore = catValues.length === 0 ? 50 : 30;
    } else {
      const totalCat = catValues.reduce((s, v) => s + v, 0);
      if (totalCat === 0) {
        diversityScore = 50;
      } else {
        const hhi = catValues.reduce((sum, v) => sum + Math.pow(v / totalCat, 2), 0);
        diversityScore = Math.round((1 - hhi) * 100);
      }
    }

    const savingsImprovement = rawSavingsRate - previousSavingsRate;
    let trendScore: number;
    if (prevIncome === 0) trendScore = 50;
    else if (savingsImprovement > 5) trendScore = 100;
    else if (savingsImprovement > 0) trendScore = 70 + (savingsImprovement / 5) * 30;
    else if (savingsImprovement > -5) trendScore = 50 + (savingsImprovement / 5) * 20;
    else trendScore = Math.max(10, 50 + savingsImprovement);

    const compositeScore = Math.round(
      savingsScore * 0.4 +
        consistencyScore * 0.2 +
        investScore * 0.2 +
        diversityScore * 0.1 +
        trendScore * 0.1
    );

    const clampedScore = Math.max(0, Math.min(100, compositeScore));

    let grade: HealthScore["grade"];
    let color: string;
    if (clampedScore >= 80) {
      grade = "Excellent";
      color = "#059669";
    } else if (clampedScore >= 60) {
      grade = "Good";
      color = "#0075de";
    } else if (clampedScore >= 40) {
      grade = "Needs Attention";
      color = "#d97706";
    } else {
      grade = "Critical";
      color = "#e11d48";
    }

    const healthScore: HealthScore = {
      score: clampedScore,
      grade,
      color,
      breakdown: {
        savingsRate: {
          score: Math.round(savingsScore),
          weight: 40,
          detail: `Savings rate: ${Math.round(rawSavingsRate)}%`,
        },
        spendingConsistency: {
          score: Math.round(consistencyScore),
          weight: 20,
          detail: `Expense variance: ${expDeltaAbs}% MoM`,
        },
        investmentRatio: {
          score: Math.round(investScore),
          weight: 20,
          detail: `Investing ${Math.round(investRatio)}% of income`,
        },
        expenseDiversity: {
          score: Math.round(diversityScore),
          weight: 10,
          detail: `Spread across ${catValues.length} categories`,
        },
        trendImprovement: {
          score: Math.round(trendScore),
          weight: 10,
          detail: `Savings rate ${savingsImprovement >= 0 ? "up" : "down"} ${Math.abs(Math.round(savingsImprovement))}pp`,
        },
      },
    };

    const hasCurrentPeriodData = (curIncome > 0 || curExpenses > 0 || curInvestments > 0 || prevIncome > 0 || prevExpenses > 0 || prevInvestments > 0);
    const hasAllTimeData = (totalAllIncome > 0 || totalAllExpenses > 0 || totalAllInvestments > 0 || allTimeSummary.length > 0);

    return {
      success: true,
      currency,
      insights,
      recurring,
      totalMonthlyRecurring,
      comparison: hasCurrentPeriodData ? comparison : null,
      savings: (curIncome > 0 || curExpenses > 0) ? savings : null,
      netWorth: hasAllTimeData ? netWorth : null,
      healthScore: hasCurrentPeriodData ? healthScore : null,
    };
  } catch (error: any) {
    console.error("[Comprehensive Insights Error]", error instanceof Error ? error.message : "Failed");
    return {
      success: false,
      currency: "USD",
      insights: [],
      recurring: [],
      totalMonthlyRecurring: 0,
      comparison: null,
      savings: null,
      netWorth: null,
      healthScore: null,
      error: error?.message || "Failed to calculate comprehensive insights",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Backward Compatibility Wrappers (delegating to batch engine)
// ────────────────────────────────────────────────────────────────────────────

export async function getSpendingInsights(filters?: InsightsFilter) {
  const data = await getComprehensiveFinancialInsights(filters);
  return { success: data.success, insights: data.insights, error: data.error };
}

export async function getRecurringExpenses() {
  const data = await getComprehensiveFinancialInsights();
  return {
    success: data.success,
    recurring: data.recurring,
    totalMonthlyRecurring: data.totalMonthlyRecurring,
    count: data.recurring.length,
    error: data.error,
  };
}

export async function getMonthComparison(filters?: InsightsFilter) {
  const data = await getComprehensiveFinancialInsights(filters);
  return { success: data.success, comparison: data.comparison, error: data.error };
}

export async function getSavingsAnalysis(filters?: InsightsFilter) {
  const data = await getComprehensiveFinancialInsights(filters);
  return { success: data.success, analysis: data.savings, error: data.error };
}

export async function getNetWorthSnapshot() {
  const data = await getComprehensiveFinancialInsights();
  return { success: data.success, snapshot: data.netWorth, error: data.error };
}

export async function getFinancialHealthScore(filters?: InsightsFilter) {
  const data = await getComprehensiveFinancialInsights(filters);
  return { success: data.success, healthScore: data.healthScore, error: data.error };
}
