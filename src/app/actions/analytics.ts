"use server";

import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { User } from "@/models/User";
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
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const queryMatch: any = { userId: user.id };
    if (startDate || endDate) {
      queryMatch.date = {};
      if (startDate) queryMatch.date.$gte = startDate;
      if (endDate) queryMatch.date.$lte = endDate;
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Parallel execution of all required queries using optimized MongoDB aggregations
    const [dbUser, facetResult, monthlyResult, recentTxns, priorInvestResult] = await Promise.all([
      User.findById(user.id).select("currency").lean(),
      Transaction.aggregate([
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
          },
        },
      ]),
      Transaction.aggregate([
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
      ]),
      Transaction.find(queryMatch)
        .select("type categoryName item amount date paymentMethod")
        .sort({ date: -1 })
        .limit(6)
        .lean(),
      startDate
        ? Transaction.aggregate([
            { $match: { userId: user.id, type: "Investment", date: { $lt: startDate } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ])
        : Promise.resolve([]),
    ]);

    const currency = (dbUser as any)?.currency || "USD";
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

    (monthlyResult || []).forEach((m: any) => {
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

    // Recent 6 transactions formatted
    const recentTransactions = (recentTxns || []).map((t: any) => ({
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

    const [dbUser, facetResult, highestTx] = await Promise.all([
      User.findById(user.id).select("currency").lean(),
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
            ],
          },
        },
      ]),
      Transaction.findOne(queryMatch).sort({ amount: -1 }).select("item amount").lean(),
    ]);

    const currency = (dbUser as any)?.currency || "USD";
    const facet = facetResult[0] || {};
    const stats = facet.stats?.[0] || { totalExpense: 0, highestExpense: 0, averageExpense: 0, count: 0 };

    const categorySpending = (facet.byCategory || []).map((c: any) => ({
      name: c._id,
      amount: c.amount,
    }));

    const frequentlyPurchased = (facet.byItem || []).map((item: any) => ({
      item: item._id,
      count: item.count,
      totalAmount: item.totalAmount,
      averageAmount: item.count > 0 ? item.totalAmount / item.count : 0,
      lastPurchaseDate: item.lastDate ? new Date(item.lastDate).toISOString() : new Date().toISOString(),
      categoryName: item.categoryName,
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

    const [dbUser, facetResult, highestTx] = await Promise.all([
      User.findById(user.id).select("currency").lean(),
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

    const currency = (dbUser as any)?.currency || "USD";
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

    const [dbUser, facetResult, highestTx, priorInvestResult] = await Promise.all([
      User.findById(user.id).select("currency").lean(),
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

    const currency = (dbUser as any)?.currency || "USD";
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
