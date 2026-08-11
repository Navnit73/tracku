import mongoose, { Schema, Document, Model } from "mongoose";

export type CategoryType = "Expense" | "Income" | "Investment" | "All";

export interface ICategory extends Document {
  _id: mongoose.Types.ObjectId;
  userId: string; // Scoped to user
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ["Expense", "Income", "Investment", "All"],
      default: "Expense",
      required: true,
    },
    icon: { type: String, default: "Tag" },
    color: { type: String, default: "#64748b" },
  },
  {
    timestamps: true,
  }
);

// Indexes
CategorySchema.index({ userId: 1, type: 1 });
CategorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);
