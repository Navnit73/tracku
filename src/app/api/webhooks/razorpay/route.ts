import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Subscription } from "@/models/Subscription";
import { WebhookEvent } from "@/models/WebhookEvent";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";
    const eventIdHeader = req.headers.get("x-razorpay-event-id");

    // 1. Verify cryptographic signature of the webhook payload
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Webhook Error] Cryptographic webhook signature invalid.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const eventType = payload.event;
    const eventId =
      eventIdHeader ||
      payload.event_id ||
      `${eventType}_${payload.payload?.subscription?.entity?.id || payload.payload?.payment?.entity?.id}_${payload.created_at || Date.now()}`;

    // 2. Idempotency Check: Prevent duplicate event execution
    const existingEvent = await WebhookEvent.findOne({ razorpayEventId: eventId });
    if (existingEvent && existingEvent.processed) {
      return NextResponse.json(
        { received: true, duplicate: true },
        { status: 200 }
      );
    }

    // Record webhook event
    const webhookDoc =
      existingEvent ||
      (await WebhookEvent.create({
        razorpayEventId: eventId,
        eventType,
        processed: false,
        payload,
      }));

    // 3. Process Subscription Lifecycle Events
    const subEntity = payload.payload?.subscription?.entity;
    const paymentEntity = payload.payload?.payment?.entity;

    const subscriptionId = subEntity?.id || paymentEntity?.subscription_id;

    if (subscriptionId) {
      switch (eventType) {
        case "subscription.authenticated": {
          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "ACTIVE",
                razorpayCustomerId: subEntity?.customer_id || undefined,
              },
            }
          );
          break;
        }

        case "subscription.activated": {
          const currentPeriodStart = subEntity?.current_start
            ? new Date(subEntity.current_start * 1000)
            : new Date();
          const currentPeriodEnd = subEntity?.current_end
            ? new Date(subEntity.current_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "ACTIVE",
                currentPeriodStart,
                currentPeriodEnd,
                razorpayCustomerId: subEntity?.customer_id || undefined,
              },
            }
          );
          break;
        }

        case "subscription.charged": {
          // Recurring charge succeeded
          const currentPeriodStart = subEntity?.current_start
            ? new Date(subEntity.current_start * 1000)
            : new Date();
          const currentPeriodEnd = subEntity?.current_end
            ? new Date(subEntity.current_end * 1000)
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "ACTIVE",
                currentPeriodStart,
                currentPeriodEnd,
              },
            }
          );
          break;
        }

        case "subscription.cancelled": {
          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "CANCELLED",
                cancelAtPeriodEnd: false,
                cancelledAt: new Date(),
                endedAt: new Date(),
              },
            }
          );
          break;
        }

        case "subscription.halted": {
          // Recurring payment attempts exhausted
          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "HALTED",
              },
            }
          );
          break;
        }

        case "subscription.completed":
        case "subscription.expired": {
          await Subscription.findOneAndUpdate(
            { razorpaySubscriptionId: subscriptionId },
            {
              $set: {
                status: "COMPLETED",
                endedAt: new Date(),
              },
            }
          );
          break;
        }

        case "payment.failed": {
          if (paymentEntity?.subscription_id) {
            await Subscription.findOneAndUpdate(
              { razorpaySubscriptionId: paymentEntity.subscription_id },
              {
                $set: {
                  status: "PAST_DUE",
                },
              }
            );
          }
          break;
        }

        default:
          console.info(`[Razorpay Webhook Unhandled Event] ${eventType}`);
          break;
      }
    }

    // 4. Mark webhook event as processed
    webhookDoc.processed = true;
    webhookDoc.processedAt = new Date();
    await webhookDoc.save();

    return NextResponse.json({ received: true, event: eventType }, { status: 200 });
  } catch (error: any) {
    console.error("[Razorpay Webhook Handler Error]", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Webhook processing error." },
      { status: 500 }
    );
  }
}
