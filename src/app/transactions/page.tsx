"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getTransactions, deleteTransaction } from "@/app/actions/transactions";
import { getCategories } from "@/app/actions/categories";
import { downloadTransactionsCSV } from "@/lib/csvExport";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { showToast, confirmDialog } from "@/lib/toast";
import {
  Search,
  Plus,
  Download,
  Filter,
  Edit2,
  Trash2,
  ArrowUpDown,
  Tag,
  Calendar,
} from "lucide-react";

export default function TransactionsPage() {
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

  const fetchCategories = async () => {
    const res = await getCategories("All");
    if (res.success && res.categories) {
      setCategories(res.categories);
    }
  };

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    const res = await getTransactions({
      search,
      type: type as any,
      categoryId,
      dateRange,
      startDate: customStart,
      endDate: customEnd,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
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
    search,
    type,
    categoryId,
    dateRange,
    customStart,
    customEnd,
    minAmount,
    maxAmount,
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
      text: "This action cannot be undone. Permanent deletion from database.",
      confirmText: "Delete Transaction",
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

  const [showMobileFilters, setShowMobileFilters] = useState(false);

  return (
    <AppShell
      title="Transactions Ledger"
      onOpenNewTransaction={() => {
        setSelectedTransaction(null);
        setIsModalOpen(true);
      }}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Action & Filter Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 sm:p-5 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Transaction Records
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Filtered Total: <strong className="text-[#0075de]">{pagination.totalItems}</strong> entries
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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

        {/* Filters Bar */}
        <Card className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between gap-2 sm:hidden mb-2.5">
            <Input
              placeholder="Search item, notes..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="w-4 h-4" />}
              className="flex-1"
            />
            <Button
              variant={showMobileFilters ? "primary" : "secondary"}
              size="sm"
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              leftIcon={<Filter className="w-4 h-4" />}
            >
              Filters
            </Button>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3",
              !showMobileFilters && "hidden sm:grid"
            )}
          >
            {/* Search Input (Desktop view / Mobile drawer) */}
            <div className="hidden sm:block lg:col-span-2">
              <Input
                placeholder="Search item, notes, tags..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            {/* Type Filter */}
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Types</option>
              <option value="Expense">Expense</option>
              <option value="Income">Income</option>
              <option value="Investment">Investment</option>
            </Select>

            {/* Category Filter */}
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

            {/* Date Range Picker */}
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
            />
          </div>

          {/* Amount range collapse */}
          <div
            className={cn(
              "mt-3 pt-3 border-t border-[#e6e6e6] dark:border-[#2f2f2f] flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#615d59]",
              !showMobileFilters && "hidden sm:flex"
            )}
          >
            <span className="font-semibold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Amount Range:
            </span>
            <input
              type="number"
              placeholder="Min $"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-20 sm:w-24 px-2 py-1 text-xs rounded border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#191919]"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max $"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-20 sm:w-24 px-2 py-1 text-xs rounded border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#191919]"
            />
            {(search || type !== "All" || categoryId !== "All" || minAmount || maxAmount) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setType("All");
                  setCategoryId("All");
                  setMinAmount("");
                  setMaxAmount("");
                  setDateRange("All Time");
                }}
                className="text-xs py-0.5 px-2 ml-auto"
              >
                Reset Filters
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
                      <div className="flex items-center gap-1">
                        Date <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort("item")}
                    >
                      <div className="flex items-center gap-1">
                        Item / Source <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none text-right"
                      onClick={() => toggleSort("amount")}
                    >
                      <div className="flex items-center justify-end gap-1">
                        Amount <ArrowUpDown className="w-3 h-3" />
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
                      <TableCell className="font-medium text-xs">
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
                      <TableCell className="font-semibold text-xs text-[#31302e] dark:text-[#d3d3d3]">
                        {t.categoryName}
                      </TableCell>
                      <TableCell className="font-bold">{t.item}</TableCell>
                      <TableCell
                        className={`text-right font-extrabold text-sm ${
                          t.type === "Income"
                            ? "text-[#059669]"
                            : t.type === "Expense"
                            ? "text-[#e11d48]"
                            : "text-[#7c3aed]"
                        }`}
                      >
                        {t.type === "Income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </TableCell>
                      <TableCell className="text-xs text-[#615d59] dark:text-[#9b9b9b]">
                        {t.paymentMethod}
                      </TableCell>
                      <TableCell className="text-xs text-[#615d59] max-w-xs truncate">
                        {t.notes || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(t)}
                            className="p-1.5 rounded-lg text-[#0075de] hover:bg-[#f0f9ff] dark:hover:bg-[#1a2e40]"
                            title="Edit Transaction"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(t._id, t.item)}
                            className="p-1.5 rounded-lg text-[#e11d48] hover:bg-[#fff1f2] dark:hover:bg-[#3b1c24]"
                            title="Delete Transaction"
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
                <Card key={t._id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
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
                    <span className="text-xs text-[#615d59]">{formatDate(t.date)}</span>
                  </div>

                  <div className="flex items-center justify-between mt-1">
                    <div>
                      <div className="text-base font-bold text-[#171717] dark:text-[#f7f7f7]">
                        {t.item}
                      </div>
                      <div className="text-xs text-[#615d59] font-medium">
                        {t.categoryName} • {t.paymentMethod}
                      </div>
                    </div>
                    <div
                      className={`text-lg font-extrabold ${
                        t.type === "Income"
                          ? "text-[#059669]"
                          : t.type === "Expense"
                          ? "text-[#e11d48]"
                          : "text-[#7c3aed]"
                      }`}
                    >
                      {formatCurrency(t.amount)}
                    </div>
                  </div>

                  {t.notes && (
                    <p className="text-xs text-[#615d59] bg-[#f6f5f4] dark:bg-[#191919] p-2 rounded-lg italic">
                      "{t.notes}"
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e6e6e6] dark:border-[#2f2f2f] mt-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}>
                      Edit
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(t._id, t.item)}
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
            description="No entries matched your active filters or search string."
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
      />
    </AppShell>
  );
}
