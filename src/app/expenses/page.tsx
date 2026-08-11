"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getExpenseAnalytics } from "@/app/actions/analytics";
import { getTransactions } from "@/app/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingDown, ShoppingBag, Plus, Sparkles, CreditCard } from "lucide-react";

export default function ExpensesPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [analyticsRes, listRes] = await Promise.all([
      getExpenseAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
      getTransactions({
        type: "Expense",
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
        limit: 20,
      }),
    ]);

    if (analyticsRes.success) setAnalytics(analyticsRes);
    if (listRes.success) setExpensesList(listRes.transactions);
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppShell title="Expenses Analytics">
      <div className="flex flex-col gap-6">
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Expense Tracker & Analysis
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Comprehensive spending trends & category distribution
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DatePicker
              selectedPreset={datePreset}
              startDate={customStart}
              endDate={customEnd}
              onChange={(p, s, e) => {
                setDatePreset(p);
                setCustomStart(s);
                setCustomEnd(e);
              }}
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Total Expenses
                </span>
                <div className="p-2 rounded-lg bg-[#fff1f2] text-[#e11d48]">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#e11d48]">
                {formatCurrency(analytics?.totalExpense || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">
                {analytics?.transactionCount || 0} Total Transactions
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Highest Single Expense
                </span>
                <div className="p-2 rounded-lg bg-[#fff7ed] text-[#ea580c]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {formatCurrency(analytics?.highestExpense || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59] truncate">
                Item: <strong>{analytics?.highestExpenseItem || "N/A"}</strong>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Average Expense
                </span>
                <div className="p-2 rounded-lg bg-[#f0f9ff] text-[#0075de]">
                  <CreditCard className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {formatCurrency(analytics?.averageExpense || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Per transaction spend</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Transaction Volume
                </span>
                <Badge variant="expense" size="sm">
                  Expenses
                </Badge>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {analytics?.transactionCount || 0}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Expense records logged</div>
            </Card>
          </div>
        )}

        {/* Charts & Frequent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Visual breakdown of expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart data={analytics?.categorySpending || []} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#e11d48]" />
                Frequently Purchased Items
              </CardTitle>
              <CardDescription>Most recurring expense items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.frequentlyPurchased?.length > 0 ? (
                analytics.frequentlyPurchased.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7]">
                        {item.item}
                      </div>
                      <div className="text-xs text-[#615d59]">
                        {item.count} purchases • Avg {formatCurrency(item.averageAmount)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-[#e11d48]">
                        {formatCurrency(item.totalAmount)}
                      </div>
                      <div className="text-[10px] text-[#a39e98]">
                        Last: {formatDate(item.lastPurchaseDate)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No Expense Items"
                  description="Start recording expenses to view recurring purchase statistics."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        defaultType="Expense"
      />
    </AppShell>
  );
}
