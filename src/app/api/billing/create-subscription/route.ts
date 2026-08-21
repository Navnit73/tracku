import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Subscription, SubscriptionPlan } from "@/models/Subscription";
import {
  createRazorpaySubscription,
  PLAN_CONFIGS,
} from "@/lib/razorpay";
import { hasActiveSubscription } from "@/lib/subscription";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();
    const planType = body?.plan as SubscriptionPlan;

    if (!planType || !["MONTHLY", "YEARLY"].includes(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid plan selected. Must be MONTHLY or YEARLY.",
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already has active subscription
    const isAlreadyActive = await hasActiveSubscription(user.id);
    if (isAlreadyActive) {
      return NextResponse.json(
        {
          success: false,
          error: "You already have an active subscription.",
        },
        { status: 400 }
      );
    }

    const planConfig = PLAN_CONFIGS[planType];

    // Create subscription on Razorpay
    const { subscription, planId } = await createRazorpaySubscription({
      planType,
      userId: user.id,
      userEmail: user.email || "",
      userName: user.name || "FinanceTrack User",
    });

    // Save pending subscription in MongoDB
    await Subscription.create({
      userId: user.id,
      razorpaySubscriptionId: subscription.id,
      razorpayPlanId: planId,
      razorpayCustomerId: subscription.customer_id || undefined,
      plan: planType,
      status: "PENDING",
      currency: planConfig.currency,
      amount: planConfig.price,
      shortUrl: subscription.short_url,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      keyId: process.env.RAZORPAY_KEY_ID,
      plan: planType,
      amount: planConfig.price,
      currency: planConfig.currency,
      name: planConfig.name,
      description: planConfig.description,
    });
  } catch (error: any) {
    console.error("[Create Subscription Error]", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to create subscription session.",
      },
      { status: 500 }
    );
  }
}
