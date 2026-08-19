"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { FreeTierBanner } from "@/components/billing/FreeTierBanner";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTransactions, deleteTransaction } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { downloadTransactionsCSV } from "@/lib/csvExport";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { showToast, confirmDialog } from "@/lib/toast";
import {
  Search,
  Plus,
  Download,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  RotateCcw,
  Calendar,
  X,
} from "lucide-react";

export default function TransactionsPage() {
  const { currency, currencySymbol } = useCurrency();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [categoryId, setCategoryId] = useState("All");
  const [dateRange, setDateRange] = useState<DateRangePreset>("All Time");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "item">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Debounced filters to avoid querying DB on every keystroke
  const debouncedSearch = useDebounce(search, 300);
  const debouncedMinAmount = useDebounce(minAmount, 350);
  const debouncedMaxAmount = useDebounce(maxAmount, 350);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    pageSize: 10,
  });
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const fetchCategories = async () => {
    const res = await getCategories("All");
    if (res.success && res.categories) {
      setCategories(res.categories);
    }
  };

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    const res = await getTransactions({
      search: debouncedSearch,
      type: type as any,
      categoryId,
      dateRange,
      startDate: customStart,
      endDate: customEnd,
      minAmount: debouncedMinAmount ? parseFloat(debouncedMinAmount) : undefined,
      maxAmount: debouncedMaxAmount ? parseFloat(debouncedMaxAmount) : undefined,
      sortBy,
      sortOrder,
      page,
      limit: pageSize,
    });

    if (res.success) {
      setTransactions(res.transactions);
      if (res.pagination) setPagination(res.pagination);
    } else {
      showToast.error("Failed to load transactions", res.error);
    }
    setLoading(false);
  }, [
    debouncedSearch,
    type,
    categoryId,
    dateRange,
    customStart,
    customEnd,
    debouncedMinAmount,
    debouncedMaxAmount,
    sortBy,
    sortOrder,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, item: string) => {
    const confirmed = await confirmDialog({
      title: `Delete ${item}?`,
      text: "This action cannot be undone. The entry will be permanently deleted.",
      confirmText: "Yes, Delete",
    });

    if (confirmed) {
      const res = await deleteTransaction(id);
      if (res.success) {
        showToast.success("Transaction Deleted", `Removed "${item}" from records.`);
        fetchLedger();
      } else {
        showToast.error("Delete Failed", res.error);
      }
    }
  };

  const handleExportCSV = () => {
    downloadTransactionsCSV(transactions, `transactions_${type.toLowerCase()}`);
  };

  const toggleSort = (field: "date" | "amount" | "item") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const activeFilterCount = [
    search.trim() !== "",
    type !== "All",
    categoryId !== "All",
    dateRange !== "All Time",
    minAmount !== "",
    maxAmount !== "",
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    setSearch("");
    setType("All");
    setCategoryId("All");
    setMinAmount("");
    setMaxAmount("");
    setDateRange("All Time");
    setPage(1);
  };

  return (
    <AppShell
      title="Transactions Ledger"
      onOpenNewTransaction={() => {
        setSelectedTransaction(null);
        setIsModalOpen(true);
      }}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Free Tier Usage Banner */}
        <FreeTierBanner onUpgradeSuccess={fetchLedger} />

        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Transaction Records
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Filtered Total: <strong className="text-primary font-semibold">{pagination.totalItems}</strong> entries
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setSelectedTransaction(null);
                setIsModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Filters Bar Card */}
        <Card className="p-4 sm:p-5">
          {/* Mobile search + filter trigger row */}
          <div className="flex items-center gap-2 sm:hidden mb-3">
            <div className="flex-1">
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <Button
              variant={showMobileFilters ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
              className="shrink-0"
            >
              Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </div>

          {/* Desktop & Collapsed Mobile Filter Controls */}
          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3",
              !showMobileFilters && "hidden sm:grid"
            )}
          >
            <div className="hidden sm:block">
              <Input
                placeholder="Search items or notes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Transaction Types</option>
              <option value="Expense">Expenses Only</option>
              <option value="Income">Income Only</option>
              <option value="Investment">Investments Only</option>
            </Select>

            <Select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </Select>

            <DatePicker
              selectedPreset={dateRange}
              startDate={customStart}
              endDate={customEnd}
              onChange={(preset, start, end) => {
                setDateRange(preset);
                setCustomStart(start);
                setCustomEnd(end);
                setPage(1);
              }}
              className="w-full"
            />
          </div>

          {/* Amount range collapse */}
          <div
            className={cn(
              "mt-3 pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-2.5 text-xs text-ink-muted",
              !showMobileFilters && "hidden sm:flex"
            )}
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-ink flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-primary" /> Amount Range:
              </span>
              <input
                type="number"
                placeholder={`Min ${currencySymbol}`}
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-24 sm:w-28 px-3 py-1.5 text-xs rounded-xl border border-hairline bg-surface text-ink placeholder-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
              />
              <span className="text-ink-faint">to</span>
              <input
                type="number"
                placeholder={`Max ${currencySymbol}`}
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
                className="w-24 sm:w-28 px-3 py-1.5 text-xs rounded-xl border border-hairline bg-surface text-ink placeholder-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[36px]"
              />
            </div>

            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAllFilters}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="text-xs text-expense hover:text-expense"
              >
                Reset Filters ({activeFilterCount})
              </Button>
            )}
          </div>
        </Card>

        {/* Ledger Table & Cards View */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : transactions.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("date")}
                    >
                      <div className="flex items-center gap-1.5">
                        Date <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("item")}
                    >
                      <div className="flex items-center gap-1.5">
                        Item / Source <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        Amount ({currencySymbol}) <ArrowUpDown className="w-3.5 h-3.5 text-ink-muted" />
                      </div>
                    </TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t) => (
                    <TableRow key={t._id}>
                      <TableCell className="font-medium text-xs whitespace-nowrap">
                        {formatDate(t.date)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.type === "Income"
                              ? "income"
                              : t.type === "Expense"
                              ? "expense"
                              : "investment"
                          }
                          size="sm"
                        >
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-xs text-ink-secondary whitespace-nowrap">
                        {t.categoryName}
                      </TableCell>
                      <TableCell className="font-bold text-ink max-w-[200px] truncate">{t.item}</TableCell>
                      <TableCell
                        className={`text-right font-extrabold text-sm whitespace-nowrap ${
                          t.type === "Income"
                            ? "text-income"
                            : t.type === "Expense"
                            ? "text-expense"
                            : "text-investment"
                        }`}
                      >
                        {t.type === "Income" ? "+" : t.type === "Expense" ? "-" : "+"}
                        {formatCurrency(t.amount, currency)}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted whitespace-nowrap">
                        {t.paymentMethod}
                      </TableCell>
                      <TableCell className="text-xs text-ink-muted max-w-[180px] truncate">
                        {t.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-2 rounded-xl text-ink-muted hover:text-primary hover:bg-canvas transition-colors cursor-pointer"
                            title="Edit Transaction"
                            aria-label="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id, t.item)}
                            className="p-2 rounded-xl text-ink-muted hover:text-expense hover:bg-expense-bg transition-colors cursor-pointer"
                            title="Delete Transaction"
                            aria-label="Delete Transaction"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card List View */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {transactions.map((t) => (
                <Card key={t._id} className="p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant={
                        t.type === "Income"
                          ? "income"
                          : t.type === "Expense"
                          ? "expense"
                          : "investment"
                      }
                      size="sm"
                    >
                      {t.type}
                    </Badge>
                    <span className="text-xs text-ink-muted font-medium">{formatDate(t.date)}</span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base font-bold text-ink truncate">
                        {t.item}
                      </div>
                      <div className="text-xs text-ink-muted font-medium mt-0.5">
                        {t.categoryName} • {t.paymentMethod}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-black shrink-0 ${
                        t.type === "Income"
                          ? "text-income"
                          : t.type === "Expense"
                          ? "text-expense"
                          : "text-investment"
                      }`}
                    >
                      {t.type === "Income" ? "+" : t.type === "Expense" ? "-" : "+"}
                      {formatCurrency(t.amount, currency)}
                    </div>
                  </div>

                  {t.notes && (
                    <p className="text-xs text-ink-muted bg-canvas p-2.5 rounded-xl border border-hairline italic">
                      "{t.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-hairline mt-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(t)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(t._id, t.item)}
                      leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination Controls */}
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              pageSize={pagination.pageSize}
              onPageChange={(p) => setPage(p)}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setPage(1);
              }}
            />
          </>
        ) : (
          <EmptyState
            title="No Transactions Found"
            description="No entries matched your active filters or search criteria."
            actionLabel="Add Transaction"
            onAction={() => {
              setSelectedTransaction(null);
              setIsModalOpen(true);
            }}
          />
        )}
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTransaction(null);
        }}
        onSuccess={fetchLedger}
        transactionToEdit={selectedTransaction}
        initialCategories={categories}
      />
    </AppShell>
  );
}

