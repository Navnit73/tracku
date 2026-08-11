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
    const { startDate, endDate } = getDateRangeBounds(range, filters?.startDate, filters?.endDate);

    const query: any = { userId: user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Fetch all transactions matching filter
    const transactions = await Transaction.find(query).sort({ date: 1 }).lean();

    let totalIncome = 0;
    let totalExpenses = 0;
    let totalInvestments = 0;

    const expenseCategoryMap: Record<string, { name: string; amount: number; color?: string }> = {};
    const incomeCategoryMap: Record<string, number> = {};
    const investmentCategoryMap: Record<string, number> = {};

    const itemSpendMap: Record<
      string,
      { item: string; count: number; totalAmount: number; lastDate: Date; categoryName: string }
    > = {};

    const dailyTrendMap: Record<string, { date: string; income: number; expense: number; investment: number }> = {};
    const investmentGrowthMap: Record<string, { date: string; amount: number; cumulative: number }> = {};

    let cumulativeInvestment = 0;

    transactions.forEach((t: any) => {
      const amt = Number(t.amount) || 0;
      const dateKey = t.date ? new Date(t.date).toISOString().split("T")[0] : "";

      if (!dailyTrendMap[dateKey]) {
        dailyTrendMap[dateKey] = { date: dateKey, income: 0, expense: 0, investment: 0 };
      }

      if (t.type === "Income") {
        totalIncome += amt;
        incomeCategoryMap[t.categoryName] = (incomeCategoryMap[t.categoryName] || 0) + amt;
        dailyTrendMap[dateKey].income += amt;
      } else if (t.type === "Expense") {
        totalExpenses += amt;
        if (!expenseCategoryMap[t.categoryName]) {
          expenseCategoryMap[t.categoryName] = { name: t.categoryName, amount: 0 };
        }
        expenseCategoryMap[t.categoryName].amount += amt;
        dailyTrendMap[dateKey].expense += amt;

        // Frequently / Top item tracking for expenses
        if (!itemSpendMap[t.item]) {
          itemSpendMap[t.item] = {
            item: t.item,
            count: 0,
            totalAmount: 0,
            lastDate: new Date(t.date),
            categoryName: t.categoryName,
          };
        }
        itemSpendMap[t.item].count += 1;
        itemSpendMap[t.item].totalAmount += amt;
        if (new Date(t.date) > itemSpendMap[t.item].lastDate) {
          itemSpendMap[t.item].lastDate = new Date(t.date);
        }
      } else if (t.type === "Investment") {
        totalInvestments += amt;
        investmentCategoryMap[t.categoryName] = (investmentCategoryMap[t.categoryName] || 0) + amt;
        dailyTrendMap[dateKey].investment += amt;

        cumulativeInvestment += amt;
        const prevAmount = investmentGrowthMap[dateKey]?.amount || 0;
        investmentGrowthMap[dateKey] = {
          date: dateKey,
          amount: prevAmount + amt,
          cumulative: cumulativeInvestment,
        };
      }
    });

    // Required formulas:
    // Balance = Income - Expenses - Investments
    // Savings = Income - Expenses
    const balance = totalIncome - totalExpenses - totalInvestments;
    const savings = totalIncome - totalExpenses;

    // Monthly totals (current calendar month)
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyTransactions = await Transaction.find({
      userId: user.id,
      date: { $gte: startOfCurrentMonth },
    }).lean();

    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    let monthlyInvestments = 0;

    monthlyTransactions.forEach((t: any) => {
      const amt = Number(t.amount) || 0;
      if (t.type === "Income") monthlyIncome += amt;
      else if (t.type === "Expense") monthlyExpenses += amt;
      else if (t.type === "Investment") monthlyInvestments += amt;
    });

    // Frequently spent items list
    const frequentlySpentItems = Object.values(itemSpendMap)
      .map((item) => ({
        item: item.item,
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.totalAmount / item.count,
        lastPurchaseDate: item.lastDate.toISOString(),
        categoryName: item.categoryName,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top spending items by total amount
    const topSpendingItems = Object.values(itemSpendMap)
      .map((item) => ({
        item: item.item,
        totalAmount: item.totalAmount,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5);

    // Income vs Expense chart series
    const incomeVsExpenseChart = Object.values(dailyTrendMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Category spending chart series
    const categorySpendingChart = Object.values(expenseCategoryMap).sort(
      (a, b) => b.amount - a.amount
    );

    // Investment growth chart series
    const investmentGrowthChart = Object.values(investmentGrowthMap).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Recent transactions feed (top 6)
    const recentTransactions = transactions.slice(-6).reverse().map((t: any) => ({
      _id: t._id.toString(),
      type: t.type,
      categoryName: t.categoryName,
      item: t.item,
      amount: t.amount,
      date: t.date ? t.date.toISOString() : new Date().toISOString(),
      paymentMethod: t.paymentMethod,
    }));

    return {
      success: true,
      summary: {
        balance,
        savings,
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

    const query: any = { userId: user.id, type: "Expense" };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const expenses = await Transaction.find(query).sort({ date: 1 }).lean();

    let totalExpense = 0;
    let highestExpense = 0;
    let highestExpenseItem = "";

    const categoryMap: Record<string, number> = {};
    const itemMap: Record<
      string,
      { item: string; count: number; totalAmount: number; lastDate: Date; categoryName: string }
    > = {};

    expenses.forEach((e: any) => {
      const amt = Number(e.amount) || 0;
      totalExpense += amt;

      if (amt > highestExpense) {
        highestExpense = amt;
        highestExpenseItem = e.item;
      }

      categoryMap[e.categoryName] = (categoryMap[e.categoryName] || 0) + amt;

      if (!itemMap[e.item]) {
        itemMap[e.item] = {
          item: e.item,
          count: 0,
          totalAmount: 0,
          lastDate: new Date(e.date),
          categoryName: e.categoryName,
        };
      }
      itemMap[e.item].count += 1;
      itemMap[e.item].totalAmount += amt;
      if (new Date(e.date) > itemMap[e.item].lastDate) {
        itemMap[e.item].lastDate = new Date(e.date);
      }
    });

    const averageExpense = expenses.length > 0 ? totalExpense / expenses.length : 0;

    const frequentlyPurchased = Object.values(itemMap)
      .map((item) => ({
        item: item.item,
        count: item.count,
        totalAmount: item.totalAmount,
        averageAmount: item.totalAmount / item.count,
        lastPurchaseDate: item.lastDate.toISOString(),
        categoryName: item.categoryName,
      }))
      .sort((a, b) => b.count - a.count);

    const categorySpending = Object.entries(categoryMap).map(([name, amount]) => ({
      name,
      amount,
    }));

    return {
      success: true,
      totalExpense,
      highestExpense,
      highestExpenseItem,
      averageExpense,
      transactionCount: expenses.length,
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

    const query: any = { userId: user.id, type: "Income" };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const incomeRecords = await Transaction.find(query).sort({ date: 1 }).lean();

    let totalIncome = 0;
    let highestIncome = 0;
    let highestIncomeSource = "";

    const categoryMap: Record<string, number> = {};
    const itemMap: Record<string, number> = {};

    incomeRecords.forEach((i: any) => {
      const amt = Number(i.amount) || 0;
      totalIncome += amt;

      if (amt > highestIncome) {
        highestIncome = amt;
        highestIncomeSource = i.item;
      }

      categoryMap[i.categoryName] = (categoryMap[i.categoryName] || 0) + amt;
      itemMap[i.item] = (itemMap[i.item] || 0) + amt;
    });

    const averageIncome = incomeRecords.length > 0 ? totalIncome / incomeRecords.length : 0;

    const incomeByCategory = Object.entries(categoryMap).map(([name, amount]) => ({
      name,
      amount,
    }));

    const incomeByItem = Object.entries(itemMap)
      .map(([item, amount]) => ({ item, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      success: true,
      totalIncome,
      highestIncome,
      highestIncomeSource,
      averageIncome,
      transactionCount: incomeRecords.length,
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

    const query: any = { userId: user.id, type: "Investment" };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    const investments = await Transaction.find(query).sort({ date: 1 }).lean();

    let totalInvested = 0;
    let largestInvestment = 0;
    let largestInvestmentItem = "";

    const categoryMap: Record<string, number> = {};
    const itemMap: Record<string, number> = {};

    investments.forEach((inv: any) => {
      const amt = Number(inv.amount) || 0;
      totalInvested += amt;

      if (amt > largestInvestment) {
        largestInvestment = amt;
        largestInvestmentItem = inv.item;
      }

      categoryMap[inv.categoryName] = (categoryMap[inv.categoryName] || 0) + amt;
      itemMap[inv.item] = (itemMap[inv.item] || 0) + amt;
    });

    const averageInvestment = investments.length > 0 ? totalInvested / investments.length : 0;

    const investmentByCategory = Object.entries(categoryMap).map(([name, amount]) => ({
      name,
      amount,
    }));

    const investmentByItem = Object.entries(itemMap)
      .map(([item, amount]) => ({ item, amount }))
      .sort((a, b) => b.amount - a.amount);

    return {
      success: true,
      totalInvested,
      largestInvestment,
      largestInvestmentItem,
      averageInvestment,
      investmentCount: investments.length,
      investmentByCategory,
      investmentByItem,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
