import Razorpay from "razorpay";
import crypto from "crypto";
import { SubscriptionPlan } from "@/models/Subscription";

export interface PlanDetails {
  id: SubscriptionPlan;
  name: string;
  price: number; // in USD (e.g. 10, 59, 99)
  amountInSubunit: number; // in cents (e.g. 1000, 5900, 9900)
  currency: string;
  period: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  billingText: string;
  effectiveMonthly: string;
  savingsBadge?: string;
  description: string;
  features: string[];
}

export const PLAN_CONFIGS: Record<SubscriptionPlan, PlanDetails> = {
  MONTHLY: {
    id: "MONTHLY",
    name: "Monthly Pro",
    price: 10,
    amountInSubunit: 1000, // $10.00 USD in cents
    currency: "USD",
    period: "monthly",
    interval: 1,
    billingText: "Billed every month",
    effectiveMonthly: "$10.00/mo",
    description: "Ideal for short term tracking and complete ledger freedom.",
    features: [
      "Unlimited income, expense & investment entries",
      "Real-time cash flow & category breakdown",
      "Advanced AI financial insights & forecasts",
      "Multi-currency support & historical trends",
      "CSV & Spreadsheet statement exports",
      "Standard email support",
    ],
  },
  SIX_MONTH: {
    id: "SIX_MONTH",
    name: "6-Month Pro",
    price: 59,
    amountInSubunit: 5900, // $59.00 USD in cents
    currency: "USD",
    period: "monthly",
    interval: 6,
    billingText: "Billed every 6 months ($59)",
    effectiveMonthly: "$9.83/mo",
    savingsBadge: "Save 2%",
    description: "Great balance for mid-term financial tracking and planning.",
    features: [
      "Unlimited income, expense & investment entries",
      "Real-time cash flow & category breakdown",
      "Advanced AI financial insights & forecasts",
      "Multi-currency support & historical trends",
      "CSV & Spreadsheet statement exports",
      "Priority customer assistance",
    ],
  },
  YEARLY: {
    id: "YEARLY",
    name: "Annual Pro",
    price: 99,
    amountInSubunit: 9900, // $99.00 USD in cents
    currency: "USD",
    period: "yearly",
    interval: 1,
    billingText: "Billed annually ($99)",
    effectiveMonthly: "$8.25/mo",
    savingsBadge: "Best Value • Save 18%",
    description: "Maximum value for long-term personal wealth management.",
    features: [
      "Unlimited income, expense & investment entries",
      "Real-time cash flow & category breakdown",
      "Advanced AI financial insights & forecasts",
      "Multi-currency support & historical trends",
      "CSV & Spreadsheet statement exports",
      "VIP priority customer support",
      "Early access to upcoming features",
    ],
  },
};

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error(
      "Razorpay API credentials missing. Please define RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id,
      key_secret,
    });
  }

  return razorpayInstance;
}

/**
 * Resolves the configured Razorpay Plan ID for a given plan tier.
 * Checks environment variables first. If not found in test mode, creates a plan dynamically.
 */
export async function resolveRazorpayPlanId(planType: SubscriptionPlan): Promise<string> {
  const envMap: Record<SubscriptionPlan, string | undefined> = {
    MONTHLY: process.env.RAZORPAY_PLAN_MONTHLY,
    SIX_MONTH: process.env.RAZORPAY_PLAN_SIX_MONTH,
    YEARLY: process.env.RAZORPAY_PLAN_YEARLY,
  };

  const configuredId = envMap[planType];
  if (configuredId && configuredId.startsWith("plan_")) {
    return configuredId;
  }

  const razorpay = getRazorpayClient();
  const planInfo = PLAN_CONFIGS[planType];

  try {
    // Dynamically create the plan on Razorpay if not preconfigured
    const createdPlan = await razorpay.plans.create({
      period: planInfo.period,
      interval: planInfo.interval,
      item: {
        name: planInfo.name,
        amount: planInfo.amountInSubunit,
        currency: planInfo.currency,
        description: planInfo.description,
      },
    });

    return createdPlan.id;
  } catch (error: any) {
    console.error(`[Razorpay Plan Creation Failed] ${planType}:`, error?.message || error);
    throw new Error(
      `Failed to resolve or create Razorpay plan for ${planType}. Error: ${error?.error?.description || error?.message || "Unknown error"}`
    );
  }
}

/**
 * Creates a subscription against a specific Razorpay Plan ID.
 */
export async function createRazorpaySubscription({
  planType,
  userId,
  userEmail,
  userName,
  totalCount = 120, // 10 years of cycles max
}: {
  planType: SubscriptionPlan;
  userId: string;
  userEmail: string;
  userName?: string;
  totalCount?: number;
}) {
  const razorpay = getRazorpayClient();
  const planId = await resolveRazorpayPlanId(planType);

  const subscriptionPayload: any = {
    plan_id: planId,
    total_count: totalCount,
    quantity: 1,
    customer_notify: 1,
    notes: {
      userId,
      userEmail,
      userName: userName || "User",
      planType,
    },
  };

  const subscription = await razorpay.subscriptions.create(subscriptionPayload);
  return { subscription, planId };
}

/**
 * Cancels a subscription in Razorpay.
 * @param subscriptionId Razorpay subscription ID (e.g. sub_xxxxx)
 * @param cancelAtCycleEnd If true, cancels at end of current cycle instead of immediately
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean = true
) {
  const razorpay = getRazorpayClient();
  const result = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
  return result;
}

/**
 * Fetches subscription details directly from Razorpay.
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  const razorpay = getRazorpayClient();
  const subscription = await razorpay.subscriptions.fetch(subscriptionId);
  return subscription;
}

/**
 * Cryptographically verifies the Razorpay Checkout subscription response.
 * Signature formula: HMAC_SHA256(razorpay_payment_id + "|" + razorpay_subscription_id, secret)
 */
export function verifySubscriptionSignature({
  razorpayPaymentId,
  razorpaySubscriptionId,
  razorpaySignature,
}: {
  razorpayPaymentId: string;
  razorpaySubscriptionId: string;
  razorpaySignature: string;
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !razorpaySignature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(razorpaySignature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error("[Subscription Signature Verification Error]", err);
    return false;
  }
}

/**
 * Cryptographically verifies Razorpay incoming Webhook signatures.
 */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    const receivedBuffer = Buffer.from(signature, "utf8");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (err) {
    console.error("[Webhook Signature Verification Error]", err);
    return false;
  }
}
