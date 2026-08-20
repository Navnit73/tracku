"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategories, deleteCategory, clearAllCategories } from "@/app/actions/categories";
import { invalidateCategoryCache } from "@/components/transactions/TransactionModal";
import { showToast, confirmDialog } from "@/lib/toast";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Tag, Plus, Edit2, Trash2, Trash, FolderTree } from "lucide-react";

export default function CategoriesPage() {
  const [activeType, setActiveType] = useState<string>("All");
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const fetchCategoryData = async () => {
    invalidateCategoryCache();
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

  const handleClearAll = async () => {
    const confirmed = await confirmDialog({
      title: "Delete ALL Categories?",
      text: "This will remove all existing categories from your database so you can add your custom categories from scratch.",
      confirmText: "Delete All Categories",
    });

    if (confirmed) {
      const res = await clearAllCategories();
      if (res.success) {
        showToast.success("Categories Cleared", "All existing categories removed.");
        fetchCategoryData();
      } else {
        showToast.error("Clear Failed", res.error);
      }
    }
  };

  return (
    <AppShell
      title="Custom Categories"
      onOpenNewTransaction={() => {
        setSelectedCategory(null);
        setIsModalOpen(true);
      }}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-primary" />
              Category Management
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Create custom category tags for Expense, Income & Investment transactions
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            {categories.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                leftIcon={<Trash className="w-4 h-4 text-expense" />}
                className="flex-1 sm:flex-none text-expense hover:bg-expense-bg"
              >
                Clear All
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => {
                setSelectedCategory(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Create Category
            </Button>
          </div>
        </div>

        {/* Category Type Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {["All", "Expense", "Income", "Investment"].map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all select-none cursor-pointer border whitespace-nowrap active:scale-95 min-h-[38px] ${
                activeType === type
                  ? "bg-primary text-white border-primary "
                  : "bg-surface text-ink-muted border-hairline hover:text-ink hover:bg-canvas"
              }`}
            >
              {type === "All" ? "All Categories" : `${type}s`}
            </button>
          ))}
        </div>

        {/* Categories Grid */}
        {loading ? (
          <TableSkeleton rows={4} />
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {categories.map((cat) => (
              <Card
                key={cat._id}
                className="flex items-center justify-between p-4 sm:p-5 hover:border-primary/40 transition-all "
              >
                <div className="flex items-center gap-3.5 min-w-0 pr-2">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 "
                    style={{ backgroundColor: cat.color || "var(--primary)" }}
                  >
                    <CategoryIcon iconName={cat.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-ink truncate">
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

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="p-2 rounded-xl text-ink-muted hover:text-primary hover:bg-canvas transition-colors cursor-pointer"
                    title="Edit Category"
                    aria-label="Edit Category"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat._id, cat.name)}
                    className="p-2 rounded-xl text-ink-muted hover:text-expense hover:bg-expense-bg transition-colors cursor-pointer"
                    title="Delete Category"
                    aria-label="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Categories Yet"
            description="You have no categories created. Click 'Create Category' to add your custom categories."
            actionLabel="Create Category"
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

