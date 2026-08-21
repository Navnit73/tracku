import mongoose, { Schema, Document, Model } from "mongoose";

export type SubscriptionPlan = "MONTHLY" | "YEARLY";

export type SubscriptionStatus =
  | "ACTIVE"
  | "PENDING"
  | "CANCEL_AT_PERIOD_END"
  | "CANCELLED"
  | "PAST_DUE"
  | "HALTED"
  | "EXPIRED"
  | "COMPLETED";

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  razorpaySubscriptionId: string;
  razorpayPlanId: string;
  razorpayCustomerId?: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  currency: string;
  amount: number;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  endedAt?: Date;
  shortUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true, index: true },
    razorpaySubscriptionId: { type: String, required: true, unique: true, index: true },
    razorpayPlanId: { type: String, required: true },
    razorpayCustomerId: { type: String },
    plan: {
      type: String,
      enum: ["MONTHLY", "YEARLY"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "ACTIVE",
        "PENDING",
        "CANCEL_AT_PERIOD_END",
        "CANCELLED",
        "PAST_DUE",
        "HALTED",
        "EXPIRED",
        "COMPLETED",
      ],
      default: "PENDING",
      index: true,
    },
    currency: { type: String, default: "USD" },
    amount: { type: Number, required: true },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    cancelledAt: { type: Date },
    endedAt: { type: Date },
    shortUrl: { type: String },
  },
  {
    timestamps: true,
  }
);

// Targeted compound indexes for high-frequency user-scoped queries and background sync
SubscriptionSchema.index({ userId: 1, status: 1, createdAt: -1 });
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
SubscriptionSchema.index({ userId: 1, createdAt: -1 });

export const Subscription: Model<ISubscription> =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
