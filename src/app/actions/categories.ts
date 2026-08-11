"use server";

import { connectToDatabase } from "@/lib/db";
import { Category, CategoryType } from "@/models/Category";
import { requireAuthUser } from "@/lib/auth";
import { categorySchema, CategoryInput } from "@/lib/validations";
import { revalidatePath } from "next/cache";

const DEFAULT_CATEGORIES = [
  { name: "Salary", type: "Income", icon: "Banknote", color: "#10b981" },
  { name: "Freelance", type: "Income", icon: "Laptop", color: "#06b6d4" },
  { name: "Food & Dining", type: "Expense", icon: "Utensils", color: "#f59e0b" },
  { name: "Shopping", type: "Expense", icon: "ShoppingBag", color: "#ec4899" },
  { name: "Transport", type: "Expense", icon: "Car", color: "#3b82f6" },
  { name: "Rent & Housing", type: "Expense", icon: "Home", color: "#8b5cf6" },
  { name: "Bills & Utilities", type: "Expense", icon: "Zap", color: "#ef4444" },
  { name: "Entertainment", type: "Expense", icon: "Film", color: "#6366f1" },
  { name: "Stocks & Equities", type: "Investment", icon: "TrendingUp", color: "#10b981" },
  { name: "Mutual Funds", type: "Investment", icon: "PieChart", color: "#8b5cf6" },
  { name: "Gold & Precious Metals", type: "Investment", icon: "Coins", color: "#eab308" },
  { name: "Crypto", type: "Investment", icon: "Bitcoin", color: "#f97316" },
  { name: "Fixed Deposit (FD)", type: "Investment", icon: "ShieldCheck", color: "#14b8a6" },
  { name: "Other", type: "Expense", icon: "Tag", color: "#64748b" },
];

export async function getCategories(typeFilter?: string) {
  try {
    const user = await requireAuthUser();
    await connectToDatabase();

    let query: any = { userId: user.id };
    if (typeFilter && typeFilter !== "All") {
      query.type = typeFilter;
    }

    let categories = await Category.find(query).sort({ name: 1 }).lean();

    // Auto-seed default categories if user has zero categories created
    if (categories.length === 0 && (!typeFilter || typeFilter === "All")) {
      const docsToInsert = DEFAULT_CATEGORIES.map((cat) => ({
        ...cat,
        userId: user.id,
      }));
      const seeded = await Category.insertMany(docsToInsert);
      categories = seeded.map((doc) => doc.toObject());
    }

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
    console.error("getCategories error:", error);
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
    console.error("createCategory error:", error);
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

    revalidatePath("/categories");
    revalidatePath("/transactions");

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

    revalidatePath("/categories");
    revalidatePath("/transactions");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete category" };
  }
}
