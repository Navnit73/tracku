import { NextRequest, NextResponse } from "next/server";
import { requireAuthUser } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { cancelRazorpaySubscription } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    // 1. Find user's active subscription
    const activeSub = await Subscription.findOne({
      userId: user.id,
      status: { $in: ["ACTIVE", "CANCEL_AT_PERIOD_END"] },
    }).sort({ createdAt: -1 });

    if (!activeSub) {
      return NextResponse.json(
        {
          success: false,
          error: "No active subscription found for this account.",
        },
        { status: 404 }
      );
    }

    if (activeSub.status === "CANCEL_AT_PERIOD_END") {
      return NextResponse.json({
        success: true,
        status: "CANCEL_AT_PERIOD_END",
        currentPeriodEnd: activeSub.currentPeriodEnd,
        message:
          "Subscription cancellation has already been scheduled for the end of the billing period.",
      });
    }

    // 2. Instruct Razorpay to cancel at the end of current cycle
    try {
      await cancelRazorpaySubscription(activeSub.razorpaySubscriptionId, true);
    } catch (err: any) {
      console.error(
        "[Razorpay Cancel API Error]",
        err?.error?.description || err?.message || err
      );
      // Even if Razorpay throws an already-cancelled or cycle-end error, update local record
    }

    // 3. Update database record to CANCEL_AT_PERIOD_END
    activeSub.status = "CANCEL_AT_PERIOD_END";
    activeSub.cancelAtPeriodEnd = true;
    activeSub.cancelledAt = new Date();
    await activeSub.save();

    return NextResponse.json({
      success: true,
      status: "CANCEL_AT_PERIOD_END",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: activeSub.currentPeriodEnd,
      message: `Your subscription has been scheduled for cancellation. You will retain full Pro benefits until ${
        activeSub.currentPeriodEnd
          ? new Date(activeSub.currentPeriodEnd).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "the end of your billing cycle"
      }.`,
    });
  } catch (error: any) {
    console.error("[Cancel Subscription Error]", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to cancel subscription.",
      },
      { status: 500 }
    );
  }
}
