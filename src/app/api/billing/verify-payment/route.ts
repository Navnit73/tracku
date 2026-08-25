import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import {
  verifySubscriptionSignature,
  fetchRazorpaySubscription,
} from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    const body = await req.json();

    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
      isSandbox,
      plan,
    } = body;

    await connectToDatabase();

    // 1. Check if Sandbox / Demo Mode upgrade
    if (isSandbox || (razorpay_subscription_id && razorpay_subscription_id.startsWith("sub_sandbox_"))) {
      const days = plan === "YEARLY" ? 365 : 30;
      const currentPeriodStart = new Date();
      const currentPeriodEnd = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const updated = await Subscription.findOneAndUpdate(
        {
          userId: user.id,
          razorpaySubscriptionId: razorpay_subscription_id || { $regex: /^sub_sandbox_/ },
        },
        {
          $set: {
            status: "ACTIVE",
            plan: plan === "YEARLY" ? "YEARLY" : "MONTHLY",
            currentPeriodStart,
            currentPeriodEnd,
          },
        },
        { new: true, upsert: true }
      );

      return NextResponse.json({
        success: true,
        status: "ACTIVE",
        currentPeriodStart: updated.currentPeriodStart,
        currentPeriodEnd: updated.currentPeriodEnd,
        message: "Expenseliy Pro successfully activated!",
      });
    }

    if (
      !razorpay_payment_id ||
      !razorpay_subscription_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required Razorpay payment signature parameters.",
        },
        { status: 400 }
      );
    }

    // 2. Verify cryptographic HMAC SHA256 signature for live mode
    const isValid = verifySubscriptionSignature({
      razorpayPaymentId: razorpay_payment_id,
      razorpaySubscriptionId: razorpay_subscription_id,
      razorpaySignature: razorpay_signature,
    });

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Cryptographic signature mismatch. Payment verification failed.",
        },
        { status: 400 }
      );
    }

    // 3. Fetch authoritative state from Razorpay
    let rzpSub: any = null;
    try {
      rzpSub = await fetchRazorpaySubscription(razorpay_subscription_id);
    } catch (err: any) {
      console.warn("[Razorpay Fetch Warning on Verify]", err?.message || err);
    }

    const currentPeriodStart = rzpSub?.current_start
      ? new Date(rzpSub.current_start * 1000)
      : new Date();

    const currentPeriodEnd = rzpSub?.current_end
      ? new Date(rzpSub.current_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // 4. Update subscription record in MongoDB
    const updated = await Subscription.findOneAndUpdate(
      {
        userId: user.id,
        razorpaySubscriptionId: razorpay_subscription_id,
      },
      {
        $set: {
          status: "ACTIVE",
          currentPeriodStart,
          currentPeriodEnd,
          razorpayCustomerId: rzpSub?.customer_id || undefined,
        },
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          error: "Subscription record not found or not owned by authenticated user.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      status: "ACTIVE",
      currentPeriodStart: updated.currentPeriodStart,
      currentPeriodEnd: updated.currentPeriodEnd,
      message: "Subscription successfully verified and activated.",
    });
  } catch (error: any) {
    console.error("[Verify Payment Error]", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to verify subscription payment.",
      },
      { status: 500 }
    );
  }
}
