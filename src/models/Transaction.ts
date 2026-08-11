import mongoose, { Schema, Document, Model } from "mongoose";

export type TransactionType = "Expense" | "Income" | "Investment";

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string;
  type: TransactionType;
  categoryId: mongoose.Types.ObjectId | string;
  categoryName: string;
  item: string;
  amount: number;
  date: Date;
  paymentMethod: string;
  notes?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["Expense", "Income", "Investment"],
      required: true,
      index: true,
    },
    categoryId: { type: Schema.Types.Mixed, required: true, index: true },
    categoryName: { type: String, required: true },
    item: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, index: true },
    paymentMethod: { type: String, default: "Cash" },
    notes: { type: String, default: "" },
    tags: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

// Compound indexes required by prompt specifications:
// userId, date, type, categoryId, userId + date, userId + type
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1 });
TransactionSchema.index({ userId: 1, categoryId: 1 });
TransactionSchema.index({ userId: 1, date: -1, type: 1 });

export const Transaction: Model<ITransaction> =
  mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
