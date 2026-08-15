"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { CategoryInput } from "@/lib/validations";
import { createCategory, updateCategory } from "@/app/actions/categories";
import { showToast } from "@/lib/toast";

export interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: {
    _id: string;
    name: string;
    type: "Expense" | "Income" | "Investment" | "All";
    icon: string;
    color: string;
  } | null;
}

const COLOR_PALETTE = [
  "#00874C",
  "#0075de",
  "#e11d48",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#ec4899",
  "#ea580c",
  "#06b6d4",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
];

const ICONS = [
  "Tag",
  "Utensils",
  "ShoppingBag",
  "Car",
  "Home",
  "Zap",
  "Film",
  "Banknote",
  "Laptop",
  "TrendingUp",
  "PieChart",
  "Coins",
  "Bitcoin",
  "ShieldCheck",
  "Briefcase",
  "HeartPulse",
];

export function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"Expense" | "Income" | "Investment" | "All">("Expense");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState("#00874C");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (categoryToEdit) {
        setName(categoryToEdit.name);
        setType(categoryToEdit.type);
        setIcon(categoryToEdit.icon || "Tag");
        setColor(categoryToEdit.color || "#00874C");
      } else {
        setName("");
        setType("Expense");
        setIcon("Tag");
        setColor("#00874C");
      }
      setError("");
    }
  }, [isOpen, categoryToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }

    setIsLoading(true);
    setError("");

    const payload: CategoryInput = {
      name: name.trim(),
      type,
      icon,
      color,
    };

    let res;
    if (categoryToEdit) {
      res = await updateCategory(categoryToEdit._id, payload);
    } else {
      res = await createCategory(payload);
    }

    setIsLoading(false);

    if (res.success) {
      showToast.success(
        categoryToEdit ? "Category Updated" : "Category Created",
        `Category "${name}" is now ready for use.`
      );
      onSuccess();
      onClose();
    } else {
      setError(res.error || "Failed to save category");
      showToast.error("Category Error", res.error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryToEdit ? "Edit Category" : "Create Custom Category"}
      description="Custom categories let you classify transactions effectively."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Category Name *"
          placeholder="e.g. Travel, Gym, Consulting"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          required
        />

        <Select
          label="Category Classification *"
          value={type}
          onChange={(e) => setType(e.target.value as any)}
        >
          <option value="Expense">Expense</option>
          <option value="Income">Income</option>
          <option value="Investment">Investment</option>
          <option value="All">All Types</option>
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Select label="Icon *" value={icon} onChange={(e) => setIcon(e.target.value)}>
            {ICONS.map((ic) => (
              <option key={ic} value={ic}>
                {ic}
              </option>
            ))}
          </Select>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none">
              Color Token
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 p-1 rounded-xl border border-hairline bg-surface cursor-pointer shadow-xs"
              />
              <span className="text-xs font-mono font-semibold text-ink">
                {color}
              </span>
            </div>
          </div>
        </div>

        {/* Color Palette Presets */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none">
            Preset Swatches
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl transition-all cursor-pointer shadow-xs active:scale-90 ${
                  color.toLowerCase() === c.toLowerCase()
                    ? "ring-2 ring-offset-2 ring-primary scale-110"
                    : "hover:scale-105"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 sm:gap-3 mt-4 pt-3.5 border-t border-hairline">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            className="w-full sm:w-auto"
          >
            {categoryToEdit ? "Save Category" : "Add Category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

