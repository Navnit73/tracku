import mongoose, { Schema, Document, Model } from "mongoose";

export interface IWebhookEvent extends Document {
  _id: mongoose.Types.ObjectId;
  razorpayEventId: string;
  eventType: string;
  processed: boolean;
  processedAt?: Date;
  payload?: any;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const WebhookEventSchema = new Schema<IWebhookEvent>(
  {
    razorpayEventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    processed: { type: Boolean, default: false, index: true },
    processedAt: { type: Date },
    payload: { type: Schema.Types.Mixed },
    error: { type: String },
  },
  {
    timestamps: true,
  }
);

WebhookEventSchema.index({ createdAt: -1 });

export const WebhookEvent: Model<IWebhookEvent> =
  mongoose.models.WebhookEvent ||
  mongoose.model<IWebhookEvent>("WebhookEvent", WebhookEventSchema);
