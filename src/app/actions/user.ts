"use server";

import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { requireAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Returns the current user's currency preference.
 */
export async function getUserCurrency(): Promise<{ success: boolean; currency: string }> {
  try {
    const sessionUser = await requireAuthUser();
    await connectToDatabase();
    const dbUser = await User.findById(sessionUser.id).lean();
    return { success: true, currency: (dbUser as any)?.currency || "USD" };
  } catch {
    return { success: true, currency: "USD" };
  }
}

/**
 * Updates the user's preferred display currency in MongoDB.
 * Supported: USD, EUR, GBP, INR, CAD, AUD, JPY
 */
export async function updateUserCurrency(currency: string) {
  try {
    const SUPPORTED = ["USD", "EUR", "GBP", "INR", "CAD", "AUD", "JPY"];
    if (!SUPPORTED.includes(currency)) {
      return { success: false, error: `Unsupported currency: ${currency}` };
    }

    const sessionUser = await requireAuthUser();
    await connectToDatabase();

    await User.findByIdAndUpdate(sessionUser.id, { currency });

    return { success: true, currency };
  } catch (error: any) {
    console.error("[REDACTED Currency Update Error]", error instanceof Error ? error.message : "Currency update error");
    return { success: false, error: error?.message || "Failed to update currency preference." };
  }
}

/**
 * Permanently purges user account, PII, transaction records, and custom categories
 * from MongoDB Atlas to satisfy GDPR / Right-to-be-Forgotten data deletion standards.
 */
export async function deleteUserAccountAndData() {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const userId = user.id;

    // 1. Purge all transaction records
    const txResult = await Transaction.deleteMany({ userId });

    // 2. Purge all custom categories
    const catResult = await Category.deleteMany({ userId });

    // 3. Purge user profile record
    const userResult = await User.deleteOne({
      $or: [{ _id: userId }, { email: user.email }],
    });

    // 4. Purge AI usage logs and cache
    try {
      const { AIUsage } = await import("@/models/AIUsage");
      const { invalidateUserAICache } = await import("@/lib/ai/cache");
      await AIUsage.deleteMany({ userId });
      invalidateUserAICache(userId);
    } catch {}

    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/expenses");
    revalidatePath("/income");
    revalidatePath("/investments");
    revalidatePath("/categories");
    revalidatePath("/reports");
    revalidatePath("/settings");

    return {
      success: true,
      message: `Account & PII data deleted permanently. Cleared ${txResult.deletedCount} transactions, ${catResult.deletedCount} categories, and user profile.`,
    };
  } catch (error: any) {
    console.error("[REDACTED User Deletion Error]", error instanceof Error ? error.message : "Account deletion error");
    return {
      success: false,
      error: error?.message || "Failed to complete account deletion and data purge.",
    };
  }
}
