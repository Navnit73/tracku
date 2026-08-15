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
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { TrendingDown, ShoppingBag, Plus, Sparkles, CreditCard, Receipt } from "lucide-react";

export default function ExpensesPage() {
  const { currency } = useCurrency();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [expensesList, setExpensesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCurrency = analytics?.currency || currency;

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
    <AppShell
      title="Expenses Analytics"
      onOpenNewTransaction={() => setIsModalOpen(true)}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-expense" />
              Expense Tracker & Analysis
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Comprehensive spending trends & category distribution
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <DatePicker
              selectedPreset={datePreset}
              startDate={customStart}
              endDate={customEnd}
              onChange={(p, s, e) => {
                setDatePreset(p);
                setCustomStart(s);
                setCustomEnd(e);
              }}
              className="w-full sm:w-auto"
            />
            <Button
              size="sm"
              variant="danger"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            {/* Total Expenses */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] border-expense/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Total Expenses
                  </span>
                  <div className="p-2 rounded-xl bg-expense-bg text-expense ">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-expense tracking-tight truncate">
                  {formatCurrency(analytics?.totalExpense || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px]">{analytics?.transactionCount || 0} Records Logged</span>
                <Badge variant="expense" size="sm">Outflow</Badge>
              </div>
            </Card>

            {/* Highest Expense */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Highest Single Outlay
                  </span>
                  <div className="p-2 rounded-xl bg-warning-brand-bg text-warning-brand ">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.highestExpense || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted truncate border-t border-hairline pt-2">
                Item: <strong className="text-ink font-semibold">{analytics?.highestExpenseItem || "None recorded"}</strong>
              </div>
            </Card>

            {/* Average Expense */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Average Expense
                  </span>
                  <div className="p-2 rounded-xl bg-sky-brand-bg text-primary ">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.averageExpense || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                Per-transaction spend
              </div>
            </Card>

            {/* Transaction Volume */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Transaction Count
                  </span>
                  <div className="p-2 rounded-xl bg-canvas text-ink ">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {analytics?.transactionCount || 0}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                Logged in selected period
              </div>
            </Card>
          </div>
        )}

        {/* Charts & Frequent Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle>Spending by Category</CardTitle>
              <CardDescription>Visual breakdown of expense categories</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart
                  data={analytics?.categorySpending || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 text-expense" />
                Frequently Purchased Items
              </CardTitle>
              <CardDescription>Most recurring expense items</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.frequentlyPurchased?.length > 0 ? (
                analytics.frequentlyPurchased.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas border border-hairline"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-bold text-ink truncate">
                        {item.item}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {item.count} purchases • Avg {formatCurrency(item.averageAmount, activeCurrency)}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-expense">
                        {formatCurrency(item.totalAmount, activeCurrency)}
                      </div>
                      <div className="text-[10px] text-ink-faint">
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

