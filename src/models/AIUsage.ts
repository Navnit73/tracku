import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAIUsage extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  /** Day-level granularity for daily limit tracking (YYYY-MM-DD as midnight UTC) */
  date: Date;
  /** Number of AI requests made on this day */
  requestCount: number;
  /** Accumulated input + output tokens */
  totalTokens: number;
  /** Estimated cost in USD based on token pricing */
  estimatedCost: number;
  /** Timestamp of the last AI request */
  lastRequestAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AIUsageSchema = new Schema<IAIUsage>(
  {
    userId: { type: String, required: true },
    date: { type: Date, required: true },
    requestCount: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    estimatedCost: { type: Number, default: 0 },
    lastRequestAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient daily limit lookups per user
AIUsageSchema.index({ userId: 1, date: -1 });
// Unique constraint: one document per user per day
AIUsageSchema.index({ userId: 1, date: 1 }, { unique: true });

export const AIUsage: Model<IAIUsage> =
  mongoose.models.AIUsage || mongoose.model<IAIUsage>("AIUsage", AIUsageSchema);
