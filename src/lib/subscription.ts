import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Subscription, ISubscription } from "@/models/Subscription";
import { Transaction } from "@/models/Transaction";
import { PLAN_CONFIGS } from "@/lib/razorpay";

export const FREE_TIER_LIMIT = 40;

/**
 * Whitelist of email addresses that receive permanent full access (Lifetime Pro VIP)
 * without requiring payment or subscription renewals.
 * 
 * To add more emails in the future, simply add them to this list, or define
 * FULL_ACCESS_EMAILS="email1@example.com,email2@example.com" in your .env.local file.
 */
export const FULL_ACCESS_EMAILS: string[] = [
  "navnitrai5389@gmail.com",
];

/**
 * Checks whether an email address is in the full-access VIP whitelist (case-insensitive).
 */
export function isWhitelistedEmail(email?: string | null): boolean {
  if (!email) return false;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check code list
  if (FULL_ACCESS_EMAILS.some((e) => e.trim().toLowerCase() === cleanEmail)) {
    return true;
  }

  // 2. Check environment variables
  const envEmails = process.env.FULL_ACCESS_EMAILS || process.env.VIP_EMAILS || "";
  if (envEmails) {
    const list = envEmails.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(cleanEmail)) {
      return true;
    }
  }

  return false;
}

export interface UserSubscriptionUsage {
  isPremium: boolean;
  canCreate: boolean;
  transactionCount: number;
  freeLimit: number;
  remainingFreeTransactions: number;
  subscription: {
    id?: string;
    razorpaySubscriptionId?: string;
    plan?: string;
    planName?: string;
    status?: string;
    amount?: number;
    currency?: string;
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
    cancelAtPeriodEnd?: boolean;
    cancelledAt?: string | null;
    isVip?: boolean;
  } | null;
}

/**
 * Authoritatively determines whether a user currently holds active premium privileges.
 * Checks if user is VIP whitelisted or has an ACTIVE / CANCEL_AT_PERIOD_END subscription.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  await connectToDatabase();

  // 1. Check if user is in VIP whitelist
  const user = await User.findById(userId).select("email").lean<{ email?: string } | null>();
  if (user?.email && isWhitelistedEmail(user.email)) {
    return true;
  }

  const now = new Date();

  // 2. Find the most recent active subscription
  const activeSub = await Subscription.findOne({
    userId,
    status: { $in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] },
  })
    .sort({ createdAt: -1 })
    .lean<ISubscription | null>();

  if (!activeSub) {
    return false;
  }

  // If cancellation is scheduled or period is specified, check if period has ended
  if (activeSub.currentPeriodEnd) {
    const periodEnd = new Date(activeSub.currentPeriodEnd);
    if (periodEnd.getTime() < now.getTime()) {
      // Period has naturally expired
      return false;
    }
  }

  return true;
}

/**
 * Returns full subscription record and details for a user.
 */
export async function getUserSubscription(userId: string): Promise<ISubscription | null> {
  await connectToDatabase();

  return await Subscription.findOne({
    userId,
    status: { $in: ["ACTIVE", "CANCEL_AT_PERIOD_END", "PENDING", "PAST_DUE", "HALTED"] },
  })
    .sort({ createdAt: -1 })
    .lean<ISubscription | null>();
}

/**
 * Returns comprehensive transaction count and billing status for a user.
 */
export async function getUserTransactionUsage(userId: string): Promise<UserSubscriptionUsage> {
  await connectToDatabase();

  const [user, transactionCount, subRecord] = await Promise.all([
    User.findById(userId).select("email").lean<{ email?: string } | null>(),
    Transaction.countDocuments({ userId }),
    Subscription.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean<ISubscription | null>(),
  ]);

  const isVip = isWhitelistedEmail(user?.email);
  const isSubscribed = await hasActiveSubscription(userId);
  const isPremium = isVip || isSubscribed;

  const canCreate = isPremium || transactionCount < FREE_TIER_LIMIT;
  const remainingFreeTransactions = isPremium ? 999999 : Math.max(0, FREE_TIER_LIMIT - transactionCount);

  let formattedSub = null;
  if (isVip) {
    formattedSub = {
      id: "vip_lifetime_access",
      plan: "LIFETIME_VIP",
      planName: "Lifetime Pro Access (VIP)",
      status: "ACTIVE",
      amount: 0,
      currency: "INR",
      currentPeriodStart: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      cancelledAt: null,
      isVip: true,
    };
  } else if (subRecord) {
    const planConfig = subRecord.plan ? PLAN_CONFIGS[subRecord.plan] : undefined;
    formattedSub = {
      id: subRecord._id.toString(),
      razorpaySubscriptionId: subRecord.razorpaySubscriptionId,
      plan: subRecord.plan,
      planName: planConfig ? planConfig.name : subRecord.plan,
      status: subRecord.status,
      amount: subRecord.amount,
      currency: subRecord.currency || "USD",
      currentPeriodStart: subRecord.currentPeriodStart
        ? new Date(subRecord.currentPeriodStart).toISOString()
        : null,
      currentPeriodEnd: subRecord.currentPeriodEnd
        ? new Date(subRecord.currentPeriodEnd).toISOString()
        : null,
      cancelAtPeriodEnd: subRecord.cancelAtPeriodEnd || false,
      cancelledAt: subRecord.cancelledAt
        ? new Date(subRecord.cancelledAt).toISOString()
        : null,
      isVip: false,
    };
  }

  return {
    isPremium,
    canCreate,
    transactionCount,
    freeLimit: isPremium ? 999999 : FREE_TIER_LIMIT,
    remainingFreeTransactions,
    subscription: formattedSub,
  };
}

/**
 * Authoritatively asserts that a user is permitted to create a new transaction.
 * Throws a typed exception if free tier limit is reached without premium access.
 */
export async function assertCanCreateTransaction(userId: string): Promise<void> {
  const usage = await getUserTransactionUsage(userId);

  if (!usage.canCreate) {
    const error: any = new Error(
      `You have reached your limit of ${FREE_TIER_LIMIT} free transactions. Please upgrade to a Pro plan to record unlimited transactions.`
    );
    error.code = "TRANSACTION_LIMIT_REACHED";
    throw error;
  }
}
