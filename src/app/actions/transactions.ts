"use server";

import { connectToDatabase } from "@/lib/db";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { requireAuthUser } from "@/lib/auth";
import { transactionSchema, transactionFilterSchema, TransactionInput, TransactionFilterInput } from "@/lib/validations";
import { getDateRangeBounds } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import {
  assertCanCreateTransaction,
  getUserTransactionUsage,
  FREE_TIER_LIMIT,
} from "@/lib/subscription";

export async function getTransactions(filters: TransactionFilterInput) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const currency = user.currency || "USD";
    const parsedFilters = transactionFilterSchema.parse(filters);

    const {
      search,
      type,
      categoryId,
      item,
      dateRange,
      startDate: customStart,
      endDate: customEnd,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder,
      page,
      limit,
    } = parsedFilters;

    const query: any = { userId: user.id };

    if (type && type !== "All") {
      query.type = type;
    }

    if (categoryId && categoryId !== "All") {
      query.categoryId = categoryId;
    }

    if (item && item.trim() !== "") {
      query.item = { $regex: item.trim(), $options: "i" };
    }

    if (search && search.trim() !== "") {
      const searchRegex = { $regex: search.trim(), $options: "i" };
      query.$or = [
        { item: searchRegex },
        { categoryName: searchRegex },
        { notes: searchRegex },
        { paymentMethod: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Date range filtering
    const { startDate, endDate } = getDateRangeBounds(dateRange, customStart, customEnd);
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = startDate;
      if (endDate) query.date.$lte = endDate;
    }

    // Amount range filtering
    if (minAmount !== undefined || maxAmount !== undefined) {
      query.amount = {};
      if (minAmount !== undefined && !isNaN(minAmount)) query.amount.$gte = minAmount;
      if (maxAmount !== undefined && !isNaN(maxAmount)) query.amount.$lte = maxAmount;
    }

    const sortOption: any = {};
    sortOption[sortBy] = sortOrder === "asc" ? 1 : -1;
    // Secondary sort tiebreaker
    if (sortBy !== "date") sortOption.date = -1;

    const skip = (page - 1) * limit;

    const [facetResult] = await Transaction.aggregate([
      { $match: query },
      {
        $facet: {
          data: [
            { $sort: sortOption },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                userId: 1,
                type: 1,
                categoryId: 1,
                categoryName: 1,
                item: 1,
                amount: 1,
                date: 1,
                paymentMethod: 1,
                notes: 1,
                tags: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const transactions = facetResult?.data || [];
    const totalCount = facetResult?.totalCount?.[0]?.count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    return {
      success: true,
      currency,
      transactions: transactions.map((t: any) => ({
        _id: t._id.toString(),
        userId: t.userId,
        type: t.type,
        categoryId: t.categoryId?.toString() || "",
        categoryName: t.categoryName,
        item: t.item,
        amount: t.amount,
        date: t.date ? (t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString()) : new Date().toISOString(),
        paymentMethod: t.paymentMethod,
        notes: t.notes || "",
        tags: t.tags || [],
        createdAt: t.createdAt ? (t.createdAt instanceof Date ? t.createdAt.toISOString() : new Date(t.createdAt).toISOString()) : new Date().toISOString(),
        updatedAt: t.updatedAt ? (t.updatedAt instanceof Date ? t.updatedAt.toISOString() : new Date(t.updatedAt).toISOString()) : new Date().toISOString(),
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        pageSize: limit,
      },
    };
  } catch (error: any) {
    console.error("[REDACTED Transactions Error]", error instanceof Error ? error.message : "Failed to fetch transactions");
    return {
      success: false,
      error: error.message || "Failed to fetch transactions",
      transactions: [],
      pagination: { currentPage: 1, totalPages: 1, totalItems: 0, pageSize: 10 },
    };
  }
}

export async function createTransaction(input: TransactionInput) {
  try {
    const user = await requireAuthUser();
    const validated = transactionSchema.parse(input);

    await connectToDatabase();

    // 1. Authoritative Backend Freemium Limit Check
    await assertCanCreateTransaction(user.id, user.email);

    const txDate = validated.date.includes("T") ? new Date(validated.date) : new Date(validated.date + "T12:00:00");

    const transaction = await Transaction.create({
      ...validated,
      userId: user.id,
      date: txDate,
    });

    revalidatePath("/transactions");
    revalidatePath("/expenses");
    revalidatePath("/income");
    revalidatePath("/investments");
    revalidatePath("/");
    revalidatePath("/pricing");
    revalidatePath("/settings");

    return {
      success: true,
      transaction: {
        _id: transaction._id.toString(),
        item: transaction.item,
        amount: transaction.amount,
      },
    };
  } catch (error: any) {
    console.error("[Transactions Action Error]", error instanceof Error ? error.message : "Failed to create transaction");
    return {
      success: false,
      error: error.message || "Failed to create transaction",
      code: error.code || "CREATE_ERROR",
    };
  }
}

export async function getBillingOverview() {
  try {
    const user = await requireAuthUser();
    return await getUserTransactionUsage(user.id, user.email);
  } catch (error: any) {
    return {
      isPremium: false,
      canCreate: true,
      transactionCount: 0,
      freeLimit: FREE_TIER_LIMIT,
      remainingFreeTransactions: FREE_TIER_LIMIT,
      subscription: null,
      error: error.message,
    };
  }
}

export async function updateTransaction(id: string, input: TransactionInput) {
  try {
    const user = await requireAuthUser();
    const validated = transactionSchema.parse(input);

    await connectToDatabase();

    const txDate = validated.date.includes("T") ? new Date(validated.date) : new Date(validated.date + "T12:00:00");

    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId: user.id },
      {
        $set: {
          ...validated,
          date: txDate,
        },
      },
      { new: true }
    );

    if (!transaction) {
      return { success: false, error: "Transaction not found or unauthorized." };
    }

    revalidatePath("/transactions");
    revalidatePath("/expenses");
    revalidatePath("/income");
    revalidatePath("/investments");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update transaction" };
  }
}

export async function deleteTransaction(id: string) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const transaction = await Transaction.findOneAndDelete({ _id: id, userId: user.id });
    if (!transaction) {
      return { success: false, error: "Transaction not found or unauthorized." };
    }

    revalidatePath("/transactions");
    revalidatePath("/expenses");
    revalidatePath("/income");
    revalidatePath("/investments");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete transaction" };
  }
}

// Helper to seed rich realistic sample transactions if user has no transactions yet
export async function seedSampleTransactions() {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const existingCount = await Transaction.countDocuments({ userId: user.id });
    if (existingCount > 0) {
      return { success: true, message: "Sample data already exists." };
    }

    // Fetch user categories
    let categories = await Category.find({ userId: user.id }).lean();
    if (categories.length === 0) {
      // Trigger category default creation
      const { getCategories } = await import("./categories");
      await getCategories("All");
      categories = await Category.find({ userId: user.id }).lean();
    }

    const catMap = new Map(categories.map((c) => [c.name, c]));

    const getCatId = (name: string) => {
      const cat = catMap.get(name);
      return cat ? cat._id.toString() : categories[0]._id.toString();
    };

    const now = new Date();
    const daysAgo = (days: number) => {
      const d = new Date(now);
      d.setDate(d.getDate() - days);
      return d;
    };

    const sampleData = [
      // Income
      {
        type: "Income",
        categoryName: "Salary",
        item: "Tech Corp Monthly Salary",
        amount: 6500,
        date: daysAgo(5),
        paymentMethod: "Bank Transfer",
        notes: "Regular monthly payroll payout",
        tags: ["Salary", "Primary"],
      },
      {
        type: "Income",
        categoryName: "Freelance",
        item: "UI/UX Design Contract",
        amount: 1800,
        date: daysAgo(12),
        paymentMethod: "Wire Transfer",
        notes: "Client website redesign project milestone 2",
        tags: ["Freelance", "Client Work"],
      },
      {
        type: "Income",
        categoryName: "Freelance",
        item: "Consulting Hour Fee",
        amount: 450,
        date: daysAgo(22),
        paymentMethod: "PayPal",
        notes: "System architecture advisory session",
        tags: ["Consulting"],
      },

      // Expenses
      {
        type: "Expense",
        categoryName: "Rent & Housing",
        item: "Apartment Rent",
        amount: 2100,
        date: daysAgo(4),
        paymentMethod: "Bank Transfer",
        notes: "Monthly apartment lease payment",
        tags: ["Housing", "Fixed"],
      },
      {
        type: "Expense",
        categoryName: "Food & Dining",
        item: "Whole Foods Grocery",
        amount: 185.4,
        date: daysAgo(2),
        paymentMethod: "Credit Card",
        notes: "Weekly organic groceries & produce",
        tags: ["Groceries"],
      },
      {
        type: "Expense",
        categoryName: "Food & Dining",
        item: "Starbucks Coffee",
        amount: 12.5,
        date: daysAgo(1),
        paymentMethod: "Apple Pay",
        notes: "Morning espresso & pastries",
        tags: ["Coffee", "Daily"],
      },
      {
        type: "Expense",
        categoryName: "Food & Dining",
        item: "Whole Foods Grocery",
        amount: 142.1,
        date: daysAgo(9),
        paymentMethod: "Credit Card",
        notes: "Groceries for dinner party",
        tags: ["Groceries"],
      },
      {
        type: "Expense",
        categoryName: "Transport",
        item: "Uber Ride to Downtown",
        amount: 28.5,
        date: daysAgo(3),
        paymentMethod: "Credit Card",
        notes: "Taxi trip to business meeting",
        tags: ["Commute"],
      },
      {
        type: "Expense",
        categoryName: "Bills & Utilities",
        item: "High-Speed Internet Fiber",
        amount: 89.99,
        date: daysAgo(10),
        paymentMethod: "Autopay",
        notes: "Gigabit internet monthly bill",
        tags: ["Utilities", "Subscription"],
      },
      {
        type: "Expense",
        categoryName: "Entertainment",
        item: "Netflix & Spotify Premium",
        amount: 34.99,
        date: daysAgo(15),
        paymentMethod: "Credit Card",
        notes: "Digital streaming entertainment bundle",
        tags: ["Subscriptions"],
      },
      {
        type: "Expense",
        categoryName: "Shopping",
        item: "Amazon Tech Accessories",
        amount: 129.0,
        date: daysAgo(8),
        paymentMethod: "Credit Card",
        notes: "Ergonomic mouse pad and USB-C hub",
        tags: ["Gadgets"],
      },

      // Investments
      {
        type: "Investment",
        categoryName: "Stocks & Equities",
        item: "S&P 500 Index Fund (VOO)",
        amount: 1000,
        date: daysAgo(6),
        paymentMethod: "Brokerage Auto-Invest",
        notes: "Dollar cost averaging monthly deposit",
        tags: ["Index Fund", "DCA"],
      },
      {
        type: "Investment",
        categoryName: "Mutual Funds",
        item: "Vanguard Total World Stock",
        amount: 500,
        date: daysAgo(14),
        paymentMethod: "Direct Debit",
        notes: "Global equity index fund allocation",
        tags: ["Long term"],
      },
      {
        type: "Investment",
        categoryName: "Crypto",
        item: "Bitcoin (BTC)",
        amount: 350,
        date: daysAgo(18),
        paymentMethod: "Crypto Exchange",
        notes: "Sat stack weekly allocation",
        tags: ["Crypto", "Bitcoin"],
      },
      {
        type: "Investment",
        categoryName: "Gold & Precious Metals",
        item: "Physical Gold Sovereign Bullion",
        amount: 600,
        date: daysAgo(25),
        paymentMethod: "Bank Transfer",
        notes: "Hedge asset purchase",
        tags: ["Gold", "Safe Haven"],
      },
    ];

    const docs = sampleData.map((item) => ({
      ...item,
      userId: user.id,
      categoryId: getCatId(item.categoryName),
    }));

    await Transaction.insertMany(docs);

    revalidatePath("/");
    revalidatePath("/transactions");

    return { success: true, count: docs.length };
  } catch (error: any) {
    console.error("[REDACTED Transactions Error]", error instanceof Error ? error.message : "Failed to seed transactions");
    return { success: false, error: error.message };
  }
}

/**
 * Clears all transaction data for the logged-in user without deleting their account.
 * Allows users to test cleanly with fresh datasets.
 */
export async function clearAllUserData() {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const result = await Transaction.deleteMany({ userId: user.id });

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/expenses");
    revalidatePath("/income");
    revalidatePath("/investments");
    revalidatePath("/insights");
    revalidatePath("/reports");
    revalidatePath("/categories");

    return {
      success: true,
      message: `Cleared ${result.deletedCount} transaction records successfully. You can now test with fresh data.`,
      count: result.deletedCount,
    };
  } catch (error: any) {
    console.error("[Clear Data Error]", error instanceof Error ? error.message : "Failed to clear transactions");
    return {
      success: false,
      error: error?.message || "Failed to clear transaction records.",
    };
  }
}

