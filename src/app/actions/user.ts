"use server";

import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { Transaction } from "@/models/Transaction";
import { Category } from "@/models/Category";
import { requireAuthUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

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
