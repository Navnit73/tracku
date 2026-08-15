import { connectToDatabase } from "@/lib/db";
import { Subscription, ISubscription } from "@/models/Subscription";
import { Transaction } from "@/models/Transaction";
import { PLAN_CONFIGS } from "@/lib/razorpay";

export const FREE_TIER_LIMIT = 10;

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
  } | null;
}

/**
 * Authoritatively determines whether a user currently holds active premium privileges.
 * Checks for status ACTIVE or CANCEL_AT_PERIOD_END with period validity.
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  await connectToDatabase();

  const now = new Date();

  // Find the most recent active subscription
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

  const [isPremium, transactionCount, subRecord] = await Promise.all([
    hasActiveSubscription(userId),
    Transaction.countDocuments({ userId }),
    Subscription.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean<ISubscription | null>(),
  ]);

  const canCreate = isPremium || transactionCount < FREE_TIER_LIMIT;
  const remainingFreeTransactions = Math.max(0, FREE_TIER_LIMIT - transactionCount);

  let formattedSub = null;
  if (subRecord) {
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
    };
  }

  return {
    isPremium,
    canCreate,
    transactionCount,
    freeLimit: FREE_TIER_LIMIT,
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
