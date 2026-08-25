import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "admin" | "superadmin";
export type UserAccountStatus = "active" | "suspended" | "banned";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password?: string;
  image?: string;
  googleId?: string;
  currency: string;
  role: UserRole;
  status: UserAccountStatus;
  isVipOverride: boolean;
  lastLoginAt?: Date;
  loginCount: number;
  adminNotes?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    image: { type: String },
    googleId: { type: String },
    currency: { type: String, default: "USD" },
    role: {
      type: String,
      enum: ["user", "admin", "superadmin"],
      default: "user",
      index: true,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "banned"],
      default: "active",
      index: true,
    },
    isVipOverride: { type: Boolean, default: false, index: true },
    lastLoginAt: { type: Date },
    loginCount: { type: Number, default: 0 },
    adminNotes: { type: String, default: "" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  {
    timestamps: true,
  }
);

UserSchema.index({ createdAt: -1 });
UserSchema.index({ lastLoginAt: -1 });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

