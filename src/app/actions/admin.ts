"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User, UserRole, UserAccountStatus } from "@/models/User";
import { Subscription } from "@/models/Subscription";
import { Transaction } from "@/models/Transaction";
import { AIUsage } from "@/models/AIUsage";
import { WebhookEvent } from "@/models/WebhookEvent";
import { requireSuperAdmin, SUPER_ADMIN_EMAILS } from "@/lib/adminAuth";
import { PLAN_CONFIGS } from "@/lib/razorpay";
import { revalidatePath } from "next/cache";

// ────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────

export interface AdminOverviewStats {
  users: {
    total: number;
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
    suspended: number;
    admins: number;
  };
  subscriptions: {
    freeCount: number;
    monthlyCount: number;
    yearlyCount: number;
    vipCount: number;
    totalPaidActive: number;
    cancelledCount: number;
    estimatedMRR: number;
    totalEstimatedRevenue: number;
  };
  financials: {
    totalTransactions: number;
    totalExpenseAmount: number;
    totalIncomeAmount: number;
    totalInvestmentAmount: number;
    totalVolume: number;
  };
  ai: {
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    activeAIUsersCount: number;
  };
  growthTimeline: Array<{
    date: string;
    signups: number;
    transactions: number;
    aiRequests: number;
    aiCost: number;
  }>;
  planDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  status: UserAccountStatus;
  isSuperAdmin: boolean;
  isVipOverride: boolean;
  currency: string;
  loginCount: number;
  lastLoginAt?: string | null;
  createdAt: string;
  adminNotes?: string;
  subscription: {
    plan: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME_VIP";
    planName: string;
    status: string;
    currentPeriodEnd?: string | null;
    razorpaySubscriptionId?: string;
    isVip: boolean;
  };
  usage: {
    transactionCount: number;
    totalExpense: number;
    totalIncome: number;
    totalInvestment: number;
    aiRequests: number;
    aiTokens: number;
    aiCost: number;
    lastActiveAt?: string | null;
  };
}

export interface AdminUsersFilterParams {
  search?: string;
  plan?: "all" | "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME_VIP";
  status?: "all" | "active" | "suspended" | "banned";
  role?: "all" | "user" | "admin" | "superadmin";
  sortBy?: "createdAt" | "lastLoginAt" | "loginCount" | "name" | "email" | "transactionCount" | "aiTokens";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface AdminUsersResponse {
  users: AdminUserListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ────────────────────────────────────────────────────────────────────────────
// 1. Overview & Executive KPIs
// ────────────────────────────────────────────────────────────────────────────

export async function getAdminOverviewStats(): Promise<{
  success: boolean;
  data?: AdminOverviewStats;
  error?: string;
}> {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. Users Counts
    const [
      totalUsers,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      suspendedUsers,
      adminUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLoginAt: { $gte: oneDayAgo } }),
      User.countDocuments({ lastLoginAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ lastLoginAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ status: { $in: ["suspended", "banned"] } }),
      User.countDocuments({ role: { $in: ["admin", "superadmin"] } }),
    ]);

    // 2. Subscriptions Metrics
    const [
      monthlyActive,
      yearlyActive,
      vipUsers,
      cancelledSubs,
    ] = await Promise.all([
      Subscription.countDocuments({ plan: "MONTHLY", status: "ACTIVE" }),
      Subscription.countDocuments({ plan: "YEARLY", status: "ACTIVE" }),
      User.countDocuments({
        $or: [
          { isVipOverride: true },
          { email: { $in: SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()) } },
        ],
      }),
      Subscription.countDocuments({
        status: { $in: ["CANCELLED", "EXPIRED", "PAST_DUE", "HALTED"] },
      }),
    ]);

    const totalPaidActive = monthlyActive + yearlyActive;
    const estimatedMRR = monthlyActive * 15 + yearlyActive * (99 / 12);
    const totalEstimatedRevenue = monthlyActive * 15 + yearlyActive * 99;
    const freeUsersCount = Math.max(0, totalUsers - totalPaidActive - vipUsers);

    // 3. Platform Financial & Transaction Aggregations
    const [totalTransactions, transactionVolumeAgg] = await Promise.all([
      Transaction.countDocuments(),
      Transaction.aggregate([
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    let totalExpenseAmount = 0;
    let totalIncomeAmount = 0;
    let totalInvestmentAmount = 0;

    for (const item of transactionVolumeAgg) {
      if (item._id === "Expense") totalExpenseAmount = item.totalAmount;
      if (item._id === "Income") totalIncomeAmount = item.totalAmount;
      if (item._id === "Investment") totalInvestmentAmount = item.totalAmount;
    }

    const totalVolume = totalExpenseAmount + totalIncomeAmount + totalInvestmentAmount;

    // 4. Platform AI Consumption Aggregations
    const [aiAgg, activeAIUsersAgg] = await Promise.all([
      AIUsage.aggregate([
        {
          $group: {
            _id: null,
            totalRequests: { $sum: "$requestCount" },
            totalTokens: { $sum: "$totalTokens" },
            totalCost: { $sum: "$estimatedCost" },
          },
        },
      ]),
      AIUsage.distinct("userId"),
    ]);

    const totalRequests = aiAgg[0]?.totalRequests || 0;
    const totalTokens = aiAgg[0]?.totalTokens || 0;
    const totalCost = aiAgg[0]?.totalCost || 0;
    const activeAIUsersCount = activeAIUsersAgg?.length || 0;

    // 5. Growth Timeline (Last 30 Days)
    const [signupsByDay, transactionsByDay, aiUsageByDay] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      AIUsage.aggregate([
        { $match: { date: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            requests: { $sum: "$requestCount" },
            cost: { $sum: "$estimatedCost" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    // Build complete 30-day timeline map
    const timelineMap = new Map<
      string,
      { signups: number; transactions: number; aiRequests: number; aiCost: number }
    >();

    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      timelineMap.set(dateStr, {
        signups: 0,
        transactions: 0,
        aiRequests: 0,
        aiCost: 0,
      });
    }

    for (const item of signupsByDay) {
      if (timelineMap.has(item._id)) {
        timelineMap.get(item._id)!.signups = item.count;
      }
    }
    for (const item of transactionsByDay) {
      if (timelineMap.has(item._id)) {
        timelineMap.get(item._id)!.transactions = item.count;
      }
    }
    for (const item of aiUsageByDay) {
      if (timelineMap.has(item._id)) {
        timelineMap.get(item._id)!.aiRequests = item.requests;
        timelineMap.get(item._id)!.aiCost = Number((item.cost || 0).toFixed(4));
      }
    }

    const growthTimeline = Array.from(timelineMap.entries()).map(([date, data]) => ({
      date,
      ...data,
    }));

    // 6. Plan Distribution for Charts
    const planDistribution = [
      { name: "Free Tier", value: freeUsersCount, color: "#94a3b8" },
      { name: "Monthly Pro", value: monthlyActive, color: "#10B981" },
      { name: "Annual Pro", value: yearlyActive, color: "#00874C" },
      { name: "Lifetime VIP", value: vipUsers, color: "#8b5cf6" },
    ];

    return {
      success: true,
      data: {
        users: {
          total: totalUsers,
          activeToday,
          activeThisWeek,
          activeThisMonth,
          suspended: suspendedUsers,
          admins: adminUsers,
        },
        subscriptions: {
          freeCount: freeUsersCount,
          monthlyCount: monthlyActive,
          yearlyCount: yearlyActive,
          vipCount: vipUsers,
          totalPaidActive,
          cancelledCount: cancelledSubs,
          estimatedMRR: Number(estimatedMRR.toFixed(2)),
          totalEstimatedRevenue: Number(totalEstimatedRevenue.toFixed(2)),
        },
        financials: {
          totalTransactions,
          totalExpenseAmount: Number(totalExpenseAmount.toFixed(2)),
          totalIncomeAmount: Number(totalIncomeAmount.toFixed(2)),
          totalInvestmentAmount: Number(totalInvestmentAmount.toFixed(2)),
          totalVolume: Number(totalVolume.toFixed(2)),
        },
        ai: {
          totalRequests,
          totalTokens,
          totalCost: Number(totalCost.toFixed(4)),
          activeAIUsersCount,
        },
        growthTimeline,
        planDistribution,
      },
    };
  } catch (error: any) {
    console.error("[Admin Overview Error]", error instanceof Error ? error.message : "Stats error");
    return { success: false, error: error?.message || "Failed to fetch admin overview stats." };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helper: Collect all possible candidate IDs for a user (ObjectId, string, email, googleId)
// ────────────────────────────────────────────────────────────────────────────

function getUserIdentifierCandidates(u: { _id?: any; id?: any; email?: string; googleId?: string }): string[] {
  const ids: string[] = [];
  if (u._id) {
    ids.push(u._id.toString());
    ids.push(String(u._id));
  }
  if (u.id) {
    ids.push(String(u.id));
  }
  if (u.email) {
    ids.push(u.email);
    ids.push(u.email.toLowerCase().trim());
  }
  if (u.googleId) {
    ids.push(u.googleId);
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

// ────────────────────────────────────────────────────────────────────────────
// 2. Users Directory & Usage Table (Search, Filter, Sort, Paginate)
// ────────────────────────────────────────────────────────────────────────────

export async function getAdminUsers(params: AdminUsersFilterParams): Promise<{
  success: boolean;
  data?: AdminUsersResponse;
  error?: string;
}> {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const {
      search = "",
      plan = "all",
      status = "all",
      role = "all",
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 10,
    } = params;

    const andClauses: any[] = [];

    // 1. Search Query
    if (search.trim()) {
      const cleanSearch = search.trim();
      andClauses.push({
        $or: [
          { name: { $regex: cleanSearch, $options: "i" } },
          { email: { $regex: cleanSearch, $options: "i" } },
        ],
      });
    }

    // 2. Status Filter
    if (status !== "all") {
      andClauses.push({ status });
    }

    // 3. Role Filter
    if (role !== "all") {
      andClauses.push({ role });
    }

    // 4. Plan Filter preparation
    if (plan === "LIFETIME_VIP") {
      andClauses.push({
        $or: [
          { isVipOverride: true },
          { email: { $in: SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()) } },
        ],
      });
    } else if (plan === "MONTHLY" || plan === "YEARLY") {
      const activeSubs = await Subscription.find({
        plan,
        status: "ACTIVE",
      }).select("userId").lean();
      const userIdsMatchingPlan = activeSubs.map((s) => s.userId);
      andClauses.push({ _id: { $in: userIdsMatchingPlan } });
    } else if (plan === "FREE") {
      const activeSubs = await Subscription.find({
        status: "ACTIVE",
      }).select("userId").lean();
      const paidUserIds = activeSubs.map((s) => s.userId);
      andClauses.push({
        _id: { $nin: paidUserIds },
        isVipOverride: { $ne: true },
        email: { $nin: SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()) },
      });
    }

    const query = andClauses.length > 0 ? { $and: andClauses } : {};

    // Sort order
    const sortVal = sortOrder === "asc" ? 1 : -1;
    const sortOptions: any = {};
    if (sortBy === "createdAt" || sortBy === "lastLoginAt" || sortBy === "loginCount" || sortBy === "name" || sortBy === "email") {
      sortOptions[sortBy] = sortVal;
    } else {
      sortOptions.createdAt = -1;
    }

    // Pagination bounds
    const safePage = Math.max(1, Number(page));
    const safeLimit = Math.min(100, Math.max(1, Number(limit)));
    const skip = (safePage - 1) * safeLimit;

    const [totalUsersCount, rawUsers] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort(sortOptions).skip(skip).limit(safeLimit).lean(),
    ]);

    // Build candidate identifier mapping for each user
    const userToIdsMap = new Map<string, string[]>();
    const allQueryIds: string[] = [];

    for (const u of rawUsers) {
      const uIdStr = u._id.toString();
      const ids = getUserIdentifierCandidates(u);
      userToIdsMap.set(uIdStr, ids);
      allQueryIds.push(...ids);
    }

    // In parallel, fetch usage & subscription data for this page batch
    const [subscriptionsBatch, transactionsAggBatch, aiUsageAggBatch] = await Promise.all([
      Subscription.find({
        userId: { $in: allQueryIds },
        status: { $in: ["ACTIVE", "CANCEL_AT_PERIOD_END", "PENDING", "PAST_DUE", "CANCELLED", "EXPIRED"] },
      })
        .sort({ createdAt: -1 })
        .lean(),
      Transaction.aggregate([
        { $match: { userId: { $in: allQueryIds } } },
        {
          $group: {
            _id: { userId: "$userId", type: "$type" },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
            lastTransactionDate: { $max: "$date" },
          },
        },
      ]),
      AIUsage.aggregate([
        { $match: { userId: { $in: allQueryIds } } },
        {
          $group: {
            _id: "$userId",
            totalRequests: { $sum: "$requestCount" },
            totalTokens: { $sum: "$totalTokens" },
            totalCost: { $sum: "$estimatedCost" },
            lastRequestAt: { $max: "$lastRequestAt" },
          },
        },
      ]),
    ]);

    // Map helpers
    const subMap = new Map<string, any>();
    for (const sub of subscriptionsBatch) {
      const uId = String(sub.userId);
      if (!subMap.has(uId)) {
        subMap.set(uId, sub);
      }
    }

    const txMap = new Map<
      string,
      { count: number; expense: number; income: number; investment: number; lastDate?: Date }
    >();
    for (const tx of transactionsAggBatch) {
      const uId = String(tx._id.userId);
      if (!txMap.has(uId)) {
        txMap.set(uId, { count: 0, expense: 0, income: 0, investment: 0 });
      }
      const item = txMap.get(uId)!;
      item.count += tx.count;
      if (tx._id.type === "Expense") item.expense += tx.totalAmount;
      if (tx._id.type === "Income") item.income += tx.totalAmount;
      if (tx._id.type === "Investment") item.investment += tx.totalAmount;
      if (tx.lastTransactionDate && (!item.lastDate || new Date(tx.lastTransactionDate) > new Date(item.lastDate))) {
        item.lastDate = tx.lastTransactionDate;
      }
    }

    const aiMap = new Map<string, { requests: number; tokens: number; cost: number; lastAt?: Date }>();
    for (const ai of aiUsageAggBatch) {
      aiMap.set(String(ai._id), {
        requests: ai.totalRequests || 0,
        tokens: ai.totalTokens || 0,
        cost: ai.totalCost || 0,
        lastAt: ai.lastRequestAt,
      });
    }

    // Transform into clean user list item
    const formattedUsers: AdminUserListItem[] = rawUsers.map((u: any) => {
      const uId = u._id.toString();
      const candidateIds = userToIdsMap.get(uId) || [uId];

      const isSuper =
        SUPER_ADMIN_EMAILS.includes(u.email?.toLowerCase()) ||
        u.role === "superadmin" ||
        u.role === "admin";
      const isVip = u.isVipOverride === true || isSuper;

      // Find subscription matching any of this user's IDs
      let sub: any = null;
      for (const cid of candidateIds) {
        if (subMap.has(cid)) {
          sub = subMap.get(cid);
          break;
        }
      }

      let planType: "FREE" | "MONTHLY" | "YEARLY" | "LIFETIME_VIP" = "FREE";
      let planName = "Free Tier (40 Limit)";
      let subStatus = "FREE";
      let currentPeriodEnd = null;
      let razorpaySubId = undefined;

      if (isVip) {
        planType = "LIFETIME_VIP";
        planName = "Lifetime VIP Pro";
        subStatus = "ACTIVE";
      } else if (sub) {
        planType = sub.plan as any;
        planName = PLAN_CONFIGS[sub.plan as "MONTHLY" | "YEARLY"]?.name || sub.plan;
        subStatus = sub.status;
        currentPeriodEnd = sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toISOString() : null;
        razorpaySubId = sub.razorpaySubscriptionId;
      }

      // Aggregate transaction usage across all candidate IDs
      let txCount = 0;
      let txExpense = 0;
      let txIncome = 0;
      let txInvestment = 0;
      let lastTxDate: Date | undefined = undefined;

      for (const cid of candidateIds) {
        if (txMap.has(cid)) {
          const item = txMap.get(cid)!;
          txCount += item.count;
          txExpense += item.expense;
          txIncome += item.income;
          txInvestment += item.investment;
          if (item.lastDate && (!lastTxDate || new Date(item.lastDate) > new Date(lastTxDate))) {
            lastTxDate = item.lastDate;
          }
        }
      }

      // Aggregate AI usage across all candidate IDs
      let aiRequests = 0;
      let aiTokens = 0;
      let aiCost = 0;
      let lastAiDate: Date | undefined = undefined;

      for (const cid of candidateIds) {
        if (aiMap.has(cid)) {
          const item = aiMap.get(cid)!;
          aiRequests += item.requests;
          aiTokens += item.tokens;
          aiCost += item.cost;
          if (item.lastAt && (!lastAiDate || new Date(item.lastAt) > new Date(lastAiDate))) {
            lastAiDate = item.lastAt;
          }
        }
      }

      // Determine latest activity timestamp
      const timestamps = [
        u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0,
        lastTxDate ? new Date(lastTxDate).getTime() : 0,
        lastAiDate ? new Date(lastAiDate).getTime() : 0,
      ];
      const maxTime = Math.max(...timestamps);
      const lastActiveAt = maxTime > 0 ? new Date(maxTime).toISOString() : null;

      return {
        id: uId,
        name: u.name || "Unnamed User",
        email: u.email || "",
        image: u.image || "",
        role: (u.role as UserRole) || "user",
        status: (u.status as UserAccountStatus) || "active",
        isSuperAdmin: isSuper,
        isVipOverride: !!u.isVipOverride,
        currency: u.currency || "USD",
        loginCount: u.loginCount || 0,
        lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : null,
        createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
        adminNotes: u.adminNotes || "",
        subscription: {
          plan: planType,
          planName,
          status: subStatus,
          currentPeriodEnd,
          razorpaySubscriptionId: razorpaySubId,
          isVip,
        },
        usage: {
          transactionCount: txCount,
          totalExpense: Number(txExpense.toFixed(2)),
          totalIncome: Number(txIncome.toFixed(2)),
          totalInvestment: Number(txInvestment.toFixed(2)),
          aiRequests,
          aiTokens,
          aiCost: Number(aiCost.toFixed(4)),
          lastActiveAt,
        },
      };
    });

    // If sorting by calculated fields (transactionCount or aiTokens)
    if (sortBy === "transactionCount") {
      formattedUsers.sort((a, b) =>
        sortOrder === "asc"
          ? a.usage.transactionCount - b.usage.transactionCount
          : b.usage.transactionCount - a.usage.transactionCount
      );
    } else if (sortBy === "aiTokens") {
      formattedUsers.sort((a, b) =>
        sortOrder === "asc"
          ? a.usage.aiTokens - b.usage.aiTokens
          : b.usage.aiTokens - a.usage.aiTokens
      );
    }

    return {
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          total: totalUsersCount,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(totalUsersCount / safeLimit) || 1,
        },
      },
    };
  } catch (error: any) {
    console.error("[Admin Users List Error]", error instanceof Error ? error.message : "User fetch error");
    return { success: false, error: error?.message || "Failed to fetch users list." };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 3. User 360 Deep-Dive Details Modal
// ────────────────────────────────────────────────────────────────────────────

export async function getAdminUserDetails(userId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    if (!userId) {
      return { success: false, error: "User ID is required." };
    }

    let user: any = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).lean();
    }
    if (!user) {
      user = await User.findOne({
        $or: [
          { email: userId },
          { email: userId.toLowerCase().trim() },
          { googleId: userId },
        ],
      }).lean();
    }

    if (!user) {
      return { success: false, error: "User not found." };
    }

    const queryIds = getUserIdentifierCandidates(user);
    if (!queryIds.includes(String(userId))) {
      queryIds.push(String(userId));
    }

    const [
      subscriptions,
      recentTransactions,
      categoriesCount,
      transactionsSummary,
      aiDailyLogs,
    ] = await Promise.all([
      Subscription.find({ userId: { $in: queryIds } }).sort({ createdAt: -1 }).lean(),
      Transaction.find({ userId: { $in: queryIds } }).sort({ date: -1 }).limit(20).lean(),
      Transaction.distinct("categoryId", { userId: { $in: queryIds } }),
      Transaction.aggregate([
        { $match: { userId: { $in: queryIds } } },
        {
          $group: {
            _id: "$type",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),
      AIUsage.find({ userId: { $in: queryIds } }).sort({ date: -1 }).limit(14).lean(),
    ]);

    let expenseTotal = 0;
    let incomeTotal = 0;
    let investmentTotal = 0;
    let totalTxCount = 0;

    for (const item of transactionsSummary) {
      totalTxCount += item.count;
      if (item._id === "Expense") expenseTotal = item.totalAmount;
      if (item._id === "Income") incomeTotal = item.totalAmount;
      if (item._id === "Investment") investmentTotal = item.totalAmount;
    }

    const isSuper =
      SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase()) ||
      user.role === "superadmin" ||
      user.role === "admin";

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name || "Unnamed User",
          email: user.email || "",
          image: user.image || "",
          role: (user.role as UserRole) || "user",
          status: (user.status as UserAccountStatus) || "active",
          currency: user.currency || "USD",
          isSuperAdmin: isSuper,
          isVipOverride: !!user.isVipOverride,
          adminNotes: user.adminNotes || "",
          loginCount: user.loginCount || 0,
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
          createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : new Date().toISOString(),
        },
        financials: {
          totalTransactions: totalTxCount,
          totalCategories: categoriesCount ? categoriesCount.length : 0,
          expenseTotal: Number(expenseTotal.toFixed(2)),
          incomeTotal: Number(incomeTotal.toFixed(2)),
          investmentTotal: Number(investmentTotal.toFixed(2)),
          netSavings: Number((incomeTotal - expenseTotal).toFixed(2)),
        },
        subscriptions: subscriptions.map((s: any) => ({
          id: s._id.toString(),
          razorpaySubscriptionId: s.razorpaySubscriptionId || "",
          plan: s.plan || "MONTHLY",
          planName: PLAN_CONFIGS[s.plan as "MONTHLY" | "YEARLY"]?.name || s.plan || "Monthly Pro",
          status: s.status || "ACTIVE",
          amount: Number(s.amount || 0),
          currency: s.currency || "USD",
          currentPeriodStart: s.currentPeriodStart ? new Date(s.currentPeriodStart).toISOString() : null,
          currentPeriodEnd: s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toISOString() : null,
          cancelAtPeriodEnd: !!s.cancelAtPeriodEnd,
          createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString(),
        })),
        recentTransactions: recentTransactions.map((tx: any) => ({
          id: tx._id.toString(),
          type: tx.type || "Expense",
          item: tx.item || "Untitled",
          categoryName: tx.categoryName || "General",
          amount: Number(tx.amount || 0),
          paymentMethod: tx.paymentMethod || "Cash",
          date: tx.date ? new Date(tx.date).toISOString() : new Date().toISOString(),
        })),
        aiLogs: aiDailyLogs.map((log: any) => ({
          date: log.date ? (log.date instanceof Date ? log.date.toISOString() : String(log.date)) : "",
          requestCount: Number(log.requestCount || 0),
          totalTokens: Number(log.totalTokens || 0),
          estimatedCost: Number(log.estimatedCost || 0),
          lastRequestAt: log.lastRequestAt ? new Date(log.lastRequestAt).toISOString() : null,
        })),
      },
    };
  } catch (error: any) {
    console.error("[Admin User Details Error]", error instanceof Error ? error.message : "User detail error");
    return { success: false, error: error?.message || "Failed to load user details." };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Admin Management Actions (Role, VIP, Suspension, Notes)
// ────────────────────────────────────────────────────────────────────────────

export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const { dbUser } = await requireSuperAdmin();
    if (!["user", "admin", "superadmin"].includes(newRole)) {
      return { success: false, error: "Invalid role specification." };
    }

    // Safety: prevent demoting oneself if the only superadmin
    if (userId === dbUser._id.toString() && newRole !== "superadmin") {
      return { success: false, error: "You cannot revoke your own Super Admin role." };
    }

    await connectToDatabase();
    await User.findByIdAndUpdate(userId, { role: newRole });

    revalidatePath("/admin");
    return { success: true, message: `User role successfully updated to ${newRole}.` };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update user role." };
  }
}

export async function toggleUserSuspension(
  userId: string,
  suspended: boolean,
  reason?: string
) {
  try {
    const { dbUser } = await requireSuperAdmin();

    if (userId === dbUser._id.toString()) {
      return { success: false, error: "You cannot suspend your own account." };
    }

    await connectToDatabase();
    const newStatus: UserAccountStatus = suspended ? "suspended" : "active";

    const updateDoc: any = { status: newStatus };
    if (reason?.trim()) {
      const noteEntry = `\n[${new Date().toISOString()}] Account ${
        suspended ? "suspended" : "reactivated"
      } by ${dbUser.name}: ${reason.trim()}`;
      updateDoc.$set = { status: newStatus };
      updateDoc.$concat = { adminNotes: noteEntry };
    }

    await User.findByIdAndUpdate(userId, updateDoc);

    revalidatePath("/admin");
    return {
      success: true,
      message: `User account has been ${suspended ? "suspended" : "reactivated"}.`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to update account status." };
  }
}

export async function toggleUserVipOverride(userId: string, isVip: boolean) {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    await User.findByIdAndUpdate(userId, { isVipOverride: isVip });

    revalidatePath("/admin");
    return {
      success: true,
      message: `VIP Lifetime Pro override ${isVip ? "granted" : "revoked"} successfully.`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to toggle VIP override." };
  }
}

export async function updateUserAdminNotes(userId: string, notes: string) {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    await User.findByIdAndUpdate(userId, { adminNotes: notes });

    revalidatePath("/admin");
    return { success: true, message: "Admin notes saved successfully." };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to save admin notes." };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Subscriptions & Webhook Events Registry
// ────────────────────────────────────────────────────────────────────────────

export async function getAdminSubscriptionsAndWebhooks(): Promise<{
  success: boolean;
  data?: {
    subscriptions: any[];
    webhookEvents: any[];
  };
  error?: string;
}> {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const [subscriptions, webhookEvents] = await Promise.all([
      Subscription.find().sort({ createdAt: -1 }).limit(50).lean(),
      WebhookEvent.find().sort({ createdAt: -1 }).limit(50).lean(),
    ]);

    const userIds = subscriptions.map((s) => s.userId);
    const users = await User.find({ _id: { $in: userIds } }).select("name email").lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    const formattedSubs = subscriptions.map((s) => {
      const u = userMap.get(s.userId);
      return {
        id: s._id.toString(),
        userId: s.userId,
        userName: u?.name || "Unknown User",
        userEmail: u?.email || "Unknown Email",
        razorpaySubscriptionId: s.razorpaySubscriptionId,
        plan: s.plan,
        status: s.status,
        amount: s.amount,
        currency: s.currency,
        currentPeriodStart: s.currentPeriodStart,
        currentPeriodEnd: s.currentPeriodEnd,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        createdAt: s.createdAt,
      };
    });

    const formattedWebhooks = webhookEvents.map((w) => ({
      id: w._id.toString(),
      razorpayEventId: w.razorpayEventId,
      eventType: w.eventType,
      processed: w.processed,
      processedAt: w.processedAt,
      error: w.error,
      createdAt: w.createdAt,
    }));

    return {
      success: true,
      data: {
        subscriptions: formattedSubs,
        webhookEvents: formattedWebhooks,
      },
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to fetch subscriptions and webhooks." };
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 6. CSV Export of All Users & Usage Data
// ────────────────────────────────────────────────────────────────────────────

export async function exportAdminUsersCsv(): Promise<{
  success: boolean;
  csv?: string;
  filename?: string;
  error?: string;
}> {
  try {
    await requireSuperAdmin();
    await connectToDatabase();

    const users = await User.find().sort({ createdAt: -1 }).lean();

    const userToIdsMap = new Map<string, string[]>();
    const allQueryIds: string[] = [];

    for (const u of users) {
      const uIdStr = u._id.toString();
      const ids = getUserIdentifierCandidates(u);
      userToIdsMap.set(uIdStr, ids);
      allQueryIds.push(...ids);
    }

    const [subs, txAgg, aiAgg] = await Promise.all([
      Subscription.find({ userId: { $in: allQueryIds } }).lean(),
      Transaction.aggregate([
        { $match: { userId: { $in: allQueryIds } } },
        {
          $group: {
            _id: "$userId",
            count: { $sum: 1 },
            totalAmount: { $sum: "$amount" },
          },
        },
      ]),
      AIUsage.aggregate([
        { $match: { userId: { $in: allQueryIds } } },
        {
          $group: {
            _id: "$userId",
            requests: { $sum: "$requestCount" },
            tokens: { $sum: "$totalTokens" },
            cost: { $sum: "$estimatedCost" },
          },
        },
      ]),
    ]);

    const subMap = new Map(subs.map((s) => [String(s.userId), s]));
    const txMap = new Map(txAgg.map((t) => [String(t._id), t]));
    const aiMap = new Map(aiAgg.map((a) => [String(a._id), a]));

    const headers = [
      "User ID",
      "Full Name",
      "Email",
      "Role",
      "Account Status",
      "Subscription Plan",
      "Subscription Status",
      "Total Transactions",
      "Total Tracked Volume",
      "Total AI Requests",
      "Total AI Tokens",
      "Estimated AI Cost ($)",
      "Total Logins",
      "Last Login Date",
      "Joined Date",
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const val = String(str).replace(/"/g, '""');
      return `"${val}"`;
    };

    const rows = users.map((u) => {
      const uId = u._id.toString();
      const candidateIds = userToIdsMap.get(uId) || [uId];

      let sub: any = null;
      for (const cid of candidateIds) {
        if (subMap.has(cid)) {
          sub = subMap.get(cid);
          break;
        }
      }

      let txCount = 0;
      let txAmount = 0;
      for (const cid of candidateIds) {
        if (txMap.has(cid)) {
          const item = txMap.get(cid)!;
          txCount += item.count;
          txAmount += item.totalAmount;
        }
      }

      let aiRequests = 0;
      let aiTokens = 0;
      let aiCost = 0;
      for (const cid of candidateIds) {
        if (aiMap.has(cid)) {
          const item = aiMap.get(cid)!;
          aiRequests += item.requests;
          aiTokens += item.tokens;
          aiCost += item.cost;
        }
      }

      const isVip =
        u.isVipOverride || SUPER_ADMIN_EMAILS.includes(u.email.toLowerCase());

      const plan = isVip
        ? "LIFETIME_VIP"
        : sub
        ? sub.plan
        : "FREE";
      const subStatus = isVip
        ? "ACTIVE"
        : sub
        ? sub.status
        : "FREE";

      return [
        escapeCsv(uId),
        escapeCsv(u.name || "Unnamed User"),
        escapeCsv(u.email || ""),
        escapeCsv(u.role || "user"),
        escapeCsv(u.status || "active"),
        escapeCsv(plan),
        escapeCsv(subStatus),
        escapeCsv(txCount),
        escapeCsv(txAmount.toFixed(2)),
        escapeCsv(aiRequests),
        escapeCsv(aiTokens),
        escapeCsv(aiCost.toFixed(4)),
        escapeCsv(u.loginCount || 0),
        escapeCsv(u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : "Never"),
        escapeCsv(new Date(u.createdAt).toISOString()),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const dateStamp = new Date().toISOString().split("T")[0];

    return {
      success: true,
      csv: csvContent,
      filename: `expenseliy_users_export_${dateStamp}.csv`,
    };
  } catch (error: any) {
    return { success: false, error: error?.message || "Failed to export CSV." };
  }
}
