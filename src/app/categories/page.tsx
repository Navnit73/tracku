"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategories, deleteCategory } from "@/app/actions/categories";
import { showToast, confirmDialog } from "@/lib/toast";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Tag, Plus, Edit2, Trash2, Layers } from "lucide-react";

export default function CategoriesPage() {
  const [activeType, setActiveType] = useState<string>("All");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const fetchCategoryData = async () => {
    setLoading(true);
    const res = await getCategories(activeType);
    if (res.success && res.categories) {
      setCategories(res.categories);
    } else {
      showToast.error("Failed to load categories", res.error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategoryData();
  }, [activeType]);

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    const confirmed = await confirmDialog({
      title: `Delete category "${name}"?`,
      text: "Transactions associated with this category will remain, but the category option will be removed.",
      confirmText: "Delete Category",
    });

    if (confirmed) {
      const res = await deleteCategory(id);
      if (res.success) {
        showToast.success("Category Deleted", `Removed "${name}".`);
        fetchCategoryData();
      } else {
        showToast.error("Delete Failed", res.error);
      }
    }
  };

  return (
    <AppShell title="Custom Categories">
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Custom Classification Engine
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Organize transactions into personalized categories with custom color tokens
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setSelectedCategory(null);
              setIsModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create Category
          </Button>
        </div>

        {/* Category Type Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {["All", "Expense", "Income", "Investment"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all select-none cursor-pointer border ${
                activeType === type
                  ? "bg-[#0075de] text-white border-[#0075de] shadow-xs"
                  : "bg-[#ffffff] dark:bg-[#202020] text-[#615d59] dark:text-[#9b9b9b] border-[#e6e6e6] dark:border-[#2f2f2f] hover:text-[#171717] dark:hover:text-[#f7f7f7]"
              }`}
            >
              {type} Categories
            </button>
          ))}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <TableSkeleton rows={4} />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <Card
                key={cat._id}
                className="flex items-center justify-between p-4 hover:border-[#0075de] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: cat.color || "#0075de" }}
                  >
                    <CategoryIcon iconName={cat.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-[#171717] dark:text-[#f7f7f7]">
                      {cat.name}
                    </div>
                    <Badge
                      variant={
                        cat.type === "Income"
                          ? "income"
                          : cat.type === "Expense"
                          ? "expense"
                          : cat.type === "Investment"
                          ? "investment"
                          : "neutral"
                      }
                      size="sm"
                      className="mt-1"
                    >
                      {cat.type}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-1.5 rounded-lg text-[#0075de] hover:bg-[#f0f9ff] dark:hover:bg-[#1a2e40]"
                    title="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id, cat.name)}
                    className="p-1.5 rounded-lg text-[#e11d48] hover:bg-[#fff1f2] dark:hover:bg-[#3b1c24]"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Categories Found"
            description="Create custom categories to organize your financial transactions."
            actionLabel="Add Category"
            onAction={() => {
              setSelectedCategory(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCategory(null);
        }}
        onSuccess={fetchCategoryData}
        categoryToEdit={selectedCategory}
      />
    </AppShell>
  );
}
