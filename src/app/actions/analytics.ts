"use server";

import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { requireAuthUser } from "@/lib/auth";
import { getDateRangeBounds } from "@/lib/utils";

export interface AnalyticsFilter {
  dateRange?: string;
  startDate?: string;
  endDate?: string;
}

export async function getDashboardAnalytics(filters?: AnalyticsFilter) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const range = filters?.dateRange || "This Month";
    const isDefaultThisMonth = range === "This Month" && !filters?.startDate && !filters?.endDate;
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const queryMatch: any = { userId: user.id };
    if (startDate || endDate) {
      queryMatch.date = {};
      if (startDate) queryMatch.date.$gte = startDate;
      if (endDate) queryMatch.date.$lte = endDate;
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel execution of required queries using optimized MongoDB aggregations
    const facetPromise = Transaction.aggregate([
      { $match: queryMatch },
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
          incomeCategories: [
            { $match: { type: "Income" } },
            {
              $group: {
                _id: "$categoryName",
                amount: { $sum: "$amount" },
              },
            },
          ],
          investmentCategories: [
            { $match: { type: "Investment" } },
            {
              $group: {
                _id: "$categoryName",
                amount: { $sum: "$amount" },
              },
            },
          ],
          expenseItems: [
            { $match: { type: "Expense" } },
            {
              $group: {
                _id: "$item",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
                lastDate: { $max: "$date" },
                categoryName: { $first: "$categoryName" },
              },
            },
            { $sort: { totalAmount: -1 } },
            { $limit: 20 },
          ],
          dailyTrends: [
            {
              $group: {
                _id: {
                  date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                  type: "$type",
                },
                total: { $sum: "$amount" },
              },
            },
            { $sort: { "_id.date": 1 } },
          ],
          dailyInvestments: [
            { $match: { type: "Investment" } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                amount: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          recentTransactions: [
            { $sort: { date: -1 } },
            { $limit: 6 },
            {
              $project: {
                type: 1,
                categoryName: 1,
                item: 1,
                amount: 1,
                date: 1,
                paymentMethod: 1,
              },
            },
          ],
        },
      },
    ]);

    // Only run separate monthly aggregation if the current filter is not already "This Month"
    const monthlyPromise = isDefaultThisMonth
      ? Promise.resolve(null)
      : Transaction.aggregate([
          {
            $match: {
              userId: user.id,
              date: { $gte: startOfCurrentMonth },
            },
          },
          {
            $group: {
              _id: "$type",
              total: { $sum: "$amount" },
            },
          },
        ]);

    const priorInvestPromise = startDate
      ? Transaction.aggregate([
          { $match: { userId: user.id, type: "Investment", date: { $lt: startDate } } },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ])
      : Promise.resolve([]);

    const [facetResult, monthlyResult, priorInvestResult] = await Promise.all([
      facetPromise,
      monthlyPromise,
      priorInvestPromise,
    ]);

    const currency = user.currency || "USD";
    const facet = facetResult[0] || {};

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestments = 0;

    (facet.totalsByType || []).forEach((t: any) => {
      if (t._id === "Income") totalIncome = t.total || 0;
      else if (t._id === "Expense") totalExpenses = t.total || 0;
      else if (t._id === "Investment") totalInvestments = t.total || 0;
    });

    // Liquid Cash Balance remaining in wallet/bank
    const balance = totalIncome - totalExpenses - totalInvestments;
    // Net Savings (Total Retained Wealth = Income - Expenses = Liquid Cash + Investments)
    const netSavings = totalIncome - totalExpenses;
    const netCashFlow = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0;

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let monthlyInvestments = 0;

    // Use monthlyResult if calculated, otherwise fallback directly to facet totals (for "This Month")
    const monthlySource = monthlyResult !== null ? monthlyResult : (facet.totalsByType || []);
    (monthlySource || []).forEach((m: any) => {
      if (m._id === "Income") monthlyIncome = m.total || 0;
      else if (m._id === "Expense") monthlyExpenses = m.total || 0;
      else if (m._id === "Investment") monthlyInvestments = m.total || 0;
    });

    // Top spending items & frequently spent items
    const expenseItems = facet.expenseItems || [];
    const topSpendingItems = expenseItems
      .slice(0, 5)
      .map((item: any) => ({
        item: item._id,
        totalAmount: item.totalAmount,
      }));

    const frequentlySpentItems = [...expenseItems]
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5)
      .map((item: any) => ({
        item: item._id,
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.count > 0 ? item.totalAmount / item.count : 0,
        lastPurchaseDate: item.lastDate ? new Date(item.lastDate).toISOString() : new Date().toISOString(),
        categoryName: item.categoryName,
      }));

    // Build Daily Trend Series (Income vs Expense vs Investment)
    const dailyMap: Record<string, { date: string; income: number; expense: number; investment: number }> = {};
    (facet.dailyTrends || []).forEach((d: any) => {
      const dateKey = d._id.date;
      if (!dailyMap[dateKey]) {
        dailyMap[dateKey] = { date: dateKey, income: 0, expense: 0, investment: 0 };
      }
      if (d._id.type === "Income") dailyMap[dateKey].income += d.total || 0;
      else if (d._id.type === "Expense") dailyMap[dateKey].expense += d.total || 0;
      else if (d._id.type === "Investment") dailyMap[dateKey].investment += d.total || 0;
    });

    const incomeVsExpenseChart = Object.values(dailyMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Category Spending Series
    const categorySpendingChart = (facet.expenseCategories || []).map((c: any) => ({
      name: c._id,
      amount: c.amount,
    }));

    // Investment Growth Series initialized with prior portfolio baseline
    const priorBaseline = priorInvestResult?.[0]?.total || 0;
    let cumulative = priorBaseline;
    const investmentGrowthChart = (facet.dailyInvestments || []).map((inv: any) => {
      cumulative += inv.amount || 0;
      return {
        date: inv._id,
        amount: inv.amount,
        cumulative,
      };
    });

    // Recent 6 transactions formatted from embedded facet pipeline
    const recentTransactions = (facet.recentTransactions || []).map((t: any) => ({
      _id: t._id.toString(),
      type: t.type,
      categoryName: t.categoryName,
      item: t.item,
      amount: t.amount,
      date: t.date ? new Date(t.date).toISOString() : new Date().toISOString(),
      paymentMethod: t.paymentMethod,
    }));

    return {
      success: true,
      currency,
      summary: {
        balance,
        netCashFlow,
        netSavings,
        savingsRate,
        totalIncome,
        totalExpenses,
        totalInvestments,
        monthlyIncome,
        monthlyExpenses,
        monthlyInvestments,
      },
      charts: {
        incomeVsExpense: incomeVsExpenseChart,
        categorySpending: categorySpendingChart,
        investmentGrowth: investmentGrowthChart,
        topSpendingItems,
      },
      frequentlySpentItems,
      recentTransactions,
    };
  } catch (error: any) {
    console.error("[REDACTED Analytics Error]", error instanceof Error ? error.message : "Failed to calculate analytics");
    return {
      success: false,
      error: error?.message || "Failed to calculate analytics",
    };
  }
}

export async function getExpenseAnalytics(filters?: AnalyticsFilter) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const range = filters?.dateRange || "This Month";
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const queryMatch: any = { userId: user.id, type: "Expense" };
    if (startDate || endDate) {
      queryMatch.date = {};
      if (startDate) queryMatch.date.$gte = startDate;
      if (endDate) queryMatch.date.$lte = endDate;
    }

    const [facetResult, highestTx] = await Promise.all([
      Transaction.aggregate([
        { $match: queryMatch },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalExpense: { $sum: "$amount" },
                  highestExpense: { $max: "$amount" },
                  averageExpense: { $avg: "$amount" },
                  count: { $sum: 1 },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: "$categoryName",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
            dailyTrends: [
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                  amount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            byPaymentMethod: [
              {
                $group: {
                  _id: { $ifNull: ["$paymentMethod", "Other"] },
                  amount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { amount: -1 } },
            ],
            byDayOfWeek: [
              {
                $group: {
                  _id: { $dayOfWeek: "$date" },
                  amount: { $sum: "$amount" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],
            byItem: [
              {
                $group: {
                  _id: "$item",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$amount" },
                  lastDate: { $max: "$date" },
                  categoryName: { $first: "$categoryName" },
                },
              },
              { $sort: { count: -1 } },
              { $limit: 10 },
            ],
          },
        },
      ]),
      Transaction.findOne(queryMatch).sort({ amount: -1 }).select("item amount").lean(),
    ]);

    const currency = user.currency || "USD";
    const facet = facetResult[0] || {};
    const stats = facet.stats?.[0] || { totalExpense: 0, highestExpense: 0, averageExpense: 0, count: 0 };

    const categorySpending = (facet.byCategory || []).map((c: any) => ({
      name: c._id || "Uncategorized",
      amount: c.amount,
    }));

    const dailyTrends = (facet.dailyTrends || []).map((d: any) => ({
      date: d._id,
      amount: d.amount,
      count: d.count,
    }));

    const paymentMethods = (facet.byPaymentMethod || []).map((p: any) => ({
      method: p._id || "Other",
      amount: p.amount,
      count: p.count,
      percentage: stats.totalExpense > 0 ? Math.round((p.amount / stats.totalExpense) * 100) : 0,
    }));

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayOfWeekDistribution = (facet.byDayOfWeek || []).map((d: any) => ({
      dayIndex: d._id,
      day: dayNames[(d._id - 1) % 7] || "Day",
      amount: d.amount,
      count: d.count,
    }));

    const frequentlyPurchased = (facet.byItem || []).map((item: any) => ({
      item: item._id,
      count: item.count,
      totalAmount: item.totalAmount,
      averageAmount: item.count > 0 ? item.totalAmount / item.count : 0,
      lastPurchaseDate: item.lastDate ? new Date(item.lastDate).toISOString() : new Date().toISOString(),
      categoryName: item.categoryName,
    }));

    const topSpendingItems = [...(facet.byItem || [])]
      .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
      .slice(0, 6)
      .map((item: any) => ({
        item: item._id,
        totalAmount: item.totalAmount,
      }));

    return {
      success: true,
      currency,
      totalExpense: stats.totalExpense || 0,
      highestExpense: stats.highestExpense || 0,
      highestExpenseItem: (highestTx as any)?.item || "",
      averageExpense: stats.averageExpense || 0,
      transactionCount: stats.count || 0,
      categorySpending,
      dailyTrends,
      paymentMethods,
      dayOfWeekDistribution,
      topSpendingItems,
      frequentlyPurchased,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getIncomeAnalytics(filters?: AnalyticsFilter) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const range = filters?.dateRange || "This Month";
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const queryMatch: any = { userId: user.id, type: "Income" };
    if (startDate || endDate) {
      queryMatch.date = {};
      if (startDate) queryMatch.date.$gte = startDate;
      if (endDate) queryMatch.date.$lte = endDate;
    }

    const [facetResult, highestTx] = await Promise.all([
      Transaction.aggregate([
        { $match: queryMatch },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalIncome: { $sum: "$amount" },
                  highestIncome: { $max: "$amount" },
                  averageIncome: { $avg: "$amount" },
                  count: { $sum: 1 },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: "$categoryName",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
            byItem: [
              {
                $group: {
                  _id: "$item",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
          },
        },
      ]),
      Transaction.findOne(queryMatch).sort({ amount: -1 }).select("item amount").lean(),
    ]);

    const currency = user.currency || "USD";
    const facet = facetResult[0] || {};
    const stats = facet.stats?.[0] || { totalIncome: 0, highestIncome: 0, averageIncome: 0, count: 0 };

    const incomeByCategory = (facet.byCategory || []).map((c: any) => ({
      name: c._id,
      amount: c.amount,
    }));

    const incomeByItem = (facet.byItem || []).map((item: any) => ({
      item: item._id,
      amount: item.amount,
    }));

    return {
      success: true,
      currency,
      totalIncome: stats.totalIncome || 0,
      highestIncome: stats.highestIncome || 0,
      highestIncomeSource: (highestTx as any)?.item || "",
      averageIncome: stats.averageIncome || 0,
      transactionCount: stats.count || 0,
      incomeByCategory,
      incomeByItem,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getInvestmentAnalytics(filters?: AnalyticsFilter) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const range = filters?.dateRange || "This Month";
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const queryMatch: any = { userId: user.id, type: "Investment" };
    if (startDate || endDate) {
      queryMatch.date = {};
      if (startDate) queryMatch.date.$gte = startDate;
      if (endDate) queryMatch.date.$lte = endDate;
    }

    const [facetResult, highestTx, priorInvestResult] = await Promise.all([
      Transaction.aggregate([
        { $match: queryMatch },
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalInvested: { $sum: "$amount" },
                  largestInvestment: { $max: "$amount" },
                  averageInvestment: { $avg: "$amount" },
                  count: { $sum: 1 },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: "$categoryName",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
            byItem: [
              {
                $group: {
                  _id: "$item",
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { amount: -1 } },
            ],
            dailyInvestments: [
              {
                $group: {
                  _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                  amount: { $sum: "$amount" },
                },
              },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]),
      Transaction.findOne(queryMatch).sort({ amount: -1 }).select("item amount").lean(),
      startDate
        ? Transaction.aggregate([
            { $match: { userId: user.id, type: "Investment", date: { $lt: startDate } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve([]),
    ]);

    const currency = user.currency || "USD";
    const facet = facetResult[0] || {};
    const stats = facet.stats?.[0] || { totalInvested: 0, largestInvestment: 0, averageInvestment: 0, count: 0 };

    const investmentByCategory = (facet.byCategory || []).map((c: any) => ({
      name: c._id,
      amount: c.amount,
    }));

    const investmentByItem = (facet.byItem || []).map((item: any) => ({
      item: item._id,
      amount: item.amount,
    }));

    const priorBaseline = priorInvestResult?.[0]?.total || 0;
    let cumulative = priorBaseline;
    const investmentGrowth = (facet.dailyInvestments || []).map((inv: any) => {
      cumulative += inv.amount || 0;
      return {
        date: inv._id,
        amount: inv.amount,
        cumulative,
      };
    });

    return {
      success: true,
      currency,
      totalInvested: stats.totalInvested || 0,
      largestInvestment: stats.largestInvestment || 0,
      largestInvestmentItem: (highestTx as any)?.item || "",
      averageInvestment: stats.averageInvestment || 0,
      investmentCount: stats.count || 0,
      investmentByCategory,
      investmentByItem,
      investmentGrowth,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
