"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { TransactionInput } from "@/lib/validations";
import { createTransaction, updateTransaction } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { showToast } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PricingModal } from "@/components/billing/PricingModal";

export interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transactionToEdit?: {
    _id: string;
    type: "Expense" | "Income" | "Investment";
    categoryId: string;
    categoryName: string;
    item: string;
    amount: number;
    date: string;
    paymentMethod: string;
    notes?: string;
    tags?: string[];
  } | null;
  defaultType?: "Expense" | "Income" | "Investment";
}

const PAYMENT_METHODS = [
  "UPI",
  "Cash",
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "Apple Pay",
  "PayPal",
  "Wire Transfer",
  "Autopay",
  "Crypto Exchange",
  "Other",
];

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
  transactionToEdit,
  defaultType = "Expense",
}: TransactionModalProps) {
  const { currency, currencySymbol } = useCurrency();
  const [type, setType] = useState<"Expense" | "Income" | "Investment">(defaultType);
  const [categories, setCategories] = useState<{ _id: string; name: string; type: string }[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Credit Card");
  const [notes, setNotes] = useState("");
  const [tagsInput, setTagsInput] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPricingOpen, setIsPricingOpen] = useState(false);

  const fetchCategories = useCallback(async (selectedType: string) => {
    const res = await getCategories("All");
    if (res.success && res.categories) {
      setCategories(res.categories);
      // Auto select first category matching type
      const matching = res.categories.filter((c: any) => c.type === selectedType || c.type === "All");
      if (matching.length > 0 && !transactionToEdit) {
        setCategoryId(matching[0]._id);
      }
    }
  }, [transactionToEdit]);

  useEffect(() => {
    if (isOpen) {
      const initialType = transactionToEdit ? transactionToEdit.type : defaultType;
      setType(initialType);
      fetchCategories(initialType);

      if (transactionToEdit) {
        setCategoryId(transactionToEdit.categoryId);
        setItem(transactionToEdit.item);
        setAmount(transactionToEdit.amount.toString());
        setDate(new Date(transactionToEdit.date).toISOString().split("T")[0]);
        setPaymentMethod(transactionToEdit.paymentMethod || "Credit Card");
        setNotes(transactionToEdit.notes || "");
        setTagsInput(transactionToEdit.tags ? transactionToEdit.tags.join(", ") : "");
      } else {
        setItem("");
        setAmount("");
        setDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        setTagsInput("");
      }
      setErrors({});
    }
  }, [isOpen, transactionToEdit, defaultType, fetchCategories]);

  const handleTypeChange = (newType: "Expense" | "Income" | "Investment") => {
    setType(newType);
    const matching = categories.filter((c) => c.type === newType || c.type === "All");
    if (matching.length > 0) {
      setCategoryId(matching[0]._id);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setErrors({ amount: "Please enter a valid amount greater than 0" });
      setIsLoading(false);
      return;
    }

    if (!item.trim()) {
      setErrors({ item: "Item or source description is required" });
      setIsLoading(false);
      return;
    }

    if (!categoryId) {
      setErrors({ categoryId: "Please select a category" });
      setIsLoading(false);
      return;
    }

    const selectedCat = categories.find((c) => c._id === categoryId);
    const categoryName = selectedCat ? selectedCat.name : "Uncategorized";

    const tagsArr = tagsInput
      ? tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    const payload: TransactionInput = {
      type,
      categoryId,
      categoryName,
      item: item.trim(),
      amount: numAmount,
      date,
      paymentMethod,
      notes: notes.trim(),
      tags: tagsArr,
    };

    let res;
    if (transactionToEdit) {
      res = await updateTransaction(transactionToEdit._id, payload);
    } else {
      res = await createTransaction(payload);
    }

    setIsLoading(false);

    if (res.success) {
      showToast.success(
        transactionToEdit ? "Transaction Updated" : "Transaction Created",
        `Successfully saved ${payload.item} (${formatCurrency(payload.amount, currency)})`
      );
      onSuccess();
      onClose();
    } else if ((res as any).code === "TRANSACTION_LIMIT_REACHED") {
      setIsPricingOpen(true);
      showToast.error("Free Limit Reached", res.error || "You've used all 10 free transactions. Upgrade to Pro to continue.");
    } else {
      showToast.error("Saving Failed", res.error || "Please check form inputs.");
    }
  };

  const matchingCategories = categories.filter(
    (c) => c.type === type || c.type === "All"
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
      onClose={onClose}
      title={transactionToEdit ? "Edit Transaction" : "Record New Transaction"}
      description="Enter transaction details below. All fields marked with * are required."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Transaction Type Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none">
            Transaction Type *
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-canvas rounded-2xl border border-hairline">
            {(["Expense", "Income", "Investment"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer select-none active:scale-98 min-h-[40px] ${
                  type === t
                    ? t === "Expense"
                      ? "bg-expense text-white "
                      : t === "Income"
                      ? "bg-income text-white "
                      : "bg-investment text-white "
                    : "text-ink-muted hover:text-ink hover:bg-surface/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Amount & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Input
            type="number"
            step="0.01"
            label={`Amount (${currencySymbol}) *`}
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={errors.amount}
            required
          />
          <Input
            type="date"
            label="Transaction Date *"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {/* Category & Item Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Select
            label="Category *"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            error={errors.categoryId}
          >
            <option value="">-- Select Category --</option>
            {matchingCategories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name} ({cat.type})
              </option>
            ))}
          </Select>

          <Input
            label="Item / Source Description *"
            placeholder="e.g. Starbucks, Salary, S&P 500 ETF"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            error={errors.item}
            required
          />
        </div>

        {/* Payment Method & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
          <Select
            label="Payment Method *"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </Select>

          <Input
            label="Tags (Comma Separated)"
            placeholder="e.g. Monthly, Fixed, Groceries"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        {/* Notes */}
        <Textarea
          label="Notes / Memo"
          placeholder="Add optional notes, receipt details, or memo..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Modal Buttons */}
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
            {transactionToEdit ? "Save Changes" : "Create Transaction"}
          </Button>
        </div>
      </form>
    </Modal>

    <PricingModal
      isOpen={isPricingOpen}
      onClose={() => setIsPricingOpen(false)}
      reason="LIMIT_REACHED"
      onSuccess={() => {
        setIsPricingOpen(false);
        onSuccess();
      }}
    />
    </>
  );
}

