"use server";

import { connectToDatabase } from "@/lib/db";
import { Category, CategoryType } from "@/models/Category";
import { requireAuthUser } from "@/lib/auth";
import { categorySchema, CategoryInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function getCategories(typeFilter?: string) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    let query: any = { userId: user.id };
    if (typeFilter && typeFilter !== "All") {
      query.type = typeFilter;
    }

    const categories = await Category.find(query).sort({ name: 1 }).lean();

    return {
      success: true,
      categories: categories.map((cat: any) => ({
        _id: cat._id.toString(),
        userId: cat.userId,
        name: cat.name,
        type: cat.type,
        icon: cat.icon,
        color: cat.color,
        createdAt: cat.createdAt ? cat.createdAt.toISOString() : new Date().toISOString(),
        updatedAt: cat.updatedAt ? cat.updatedAt.toISOString() : new Date().toISOString(),
      })),
    };
  } catch (error: any) {
    console.error("[REDACTED Categories Error]", error instanceof Error ? error.message : "Failed to fetch categories");
    return { success: false, error: error.message || "Failed to fetch categories" };
  }
}

export async function createCategory(input: CategoryInput) {
  try {
    const user = await requireAuthUser();
    const validated = categorySchema.parse(input);

    await connectToDatabase();

    // Check duplicate name for this user
    const existing = await Category.findOne({ userId: user.id, name: validated.name });
    if (existing) {
      return { success: false, error: "Category with this name already exists." };
    }

    const category = await Category.create({
      ...validated,
      userId: user.id,
    });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/");

    return {
      success: true,
      category: {
        _id: category._id.toString(),
        name: category.name,
        type: category.type,
        icon: category.icon,
        color: category.color,
      },
    };
  } catch (error: any) {
    console.error("[REDACTED Categories Error]", error instanceof Error ? error.message : "Failed to create category");
    return { success: false, error: error.message || "Failed to create category" };
  }
}

export async function updateCategory(id: string, input: CategoryInput) {
  try {
    const user = await requireAuthUser();
    const validated = categorySchema.parse(input);

    await connectToDatabase();

    const category = await Category.findOneAndUpdate(
      { _id: id, userId: user.id },
      { $set: validated },
      { new: true }
    );

    if (!category) {
      return { success: false, error: "Category not found or unauthorized." };
    }

    // Sync updated category name across user's existing transactions
    const { Transaction } = await import("@/models/Transaction");
    await Transaction.updateMany(
      { userId: user.id, categoryId: id },
      { $set: { categoryName: validated.name } }
    );

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    const category = await Category.findOneAndDelete({ _id: id, userId: user.id });
    if (!category) {
      return { success: false, error: "Category not found or unauthorized." };
    }

    // Update transactions associated with this category
    const { Transaction } = await import("@/models/Transaction");
    await Transaction.updateMany(
      { userId: user.id, categoryId: id },
      { $set: { categoryName: "Uncategorized" } }
    );

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category" };
  }
}

export async function clearAllCategories() {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    await Category.deleteMany({ userId: user.id });

    revalidatePath("/categories");
    revalidatePath("/transactions");
    revalidatePath("/");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to clear categories" };
  }
}
