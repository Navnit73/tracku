"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import {
  LazyCategoryPieChart,
  LazyExpenseTrendChart,
  LazyPaymentMethodChart,
  LazyDayOfWeekChart,
  LazyTopItemsChart,
} from "@/components/charts/LazyCharts";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getExpenseAnalytics } from "@/app/actions/analytics";
import { getClientCache, setClientCache } from "@/lib/clientCache";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  TrendingDown,
  ShoppingBag,
  Plus,
  Sparkles,
  CreditCard,
  Receipt,
  Calendar,
  Layers,
  Activity,
  ArrowDownRight,
  Flame,
} from "lucide-react";

export default function ExpensesPage() {
  const { currency } = useCurrency();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCurrency = analytics?.currency || currency;

  const fetchData = useCallback(async () => {
    const cacheKey = `expenses_${datePreset}_${customStart || ""}_${customEnd || ""}`;
    const cached = getClientCache<any>(cacheKey);

    if (cached) {
      setAnalytics(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const analyticsRes = await getExpenseAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      });

      if (analyticsRes.success) {
        setAnalytics(analyticsRes);
        setClientCache(cacheKey, analyticsRes, 120000);
      }
    } finally {
      setLoading(false);
    }
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate daily burn average based on daily trends count
  const daysWithData = analytics?.dailyTrends?.length || 1;
  const dailyBurnAverage = (analytics?.totalExpense || 0) / (daysWithData > 0 ? daysWithData : 1);

  return (
    <AppShell
      title="Expenses Analytics"
      onOpenNewTransaction={() => setIsModalOpen(true)}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline shadow-2xs">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-expense-bg text-expense">
                <TrendingDown className="w-5 h-5" />
              </div>
              Expense Intelligence & Analytics
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Deep dive into your spending trajectory, category distribution, channels, and rhythm
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
              className="w-full sm:w-auto shrink-0 shadow-xs"
            >
              Add Expense
            </Button>
          </div>
        </div>

        {/* Executive Metrics Grid */}
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
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] border-expense/30 shadow-xs hover:border-expense/50 transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Total Outflows
                  </span>
                  <div className="p-2 rounded-xl bg-expense-bg text-expense">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-expense tracking-tight truncate">
                  {formatCurrency(analytics?.totalExpense || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px] font-medium">{analytics?.transactionCount || 0} Transactions</span>
                <Badge variant="expense" size="sm">Debit</Badge>
              </div>
            </Card>

            {/* Daily Burn Rate */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-hairline-strong transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Daily Velocity
                  </span>
                  <div className="p-2 rounded-xl bg-warning-brand-bg text-warning-brand">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(dailyBurnAverage, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px] font-medium">Avg spend per active day</span>
                <span className="text-[11px] text-ink-faint">{daysWithData} days active</span>
              </div>
            </Card>

            {/* Highest Single Outlay */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-hairline-strong transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Largest Single Outlay
                  </span>
                  <div className="p-2 rounded-xl bg-canvas text-ink">
                    <ShoppingBag className="w-4 h-4 text-expense" />
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

            {/* Average Per Transaction */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] shadow-xs hover:border-hairline-strong transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Average Per Transaction
                  </span>
                  <div className="p-2 rounded-xl bg-canvas text-ink">
                    <Receipt className="w-4 h-4 text-primary" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.averageExpense || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px]">Ticket size</span>
                <Badge variant="neutral" size="sm">Standard</Badge>
              </div>
            </Card>
          </div>
        )}

        {/* Primary Row: Daily Trend & Category Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Daily Expense Trend Area Chart */}
          <Card className="p-4 sm:p-5 lg:col-span-7 flex flex-col justify-between shadow-xs">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Activity className="w-4 h-4 text-expense shrink-0" />
                    <span>Daily Expense Trajectory</span>
                  </CardTitle>
                  <CardDescription>Day-by-day cash outlays over the selected timeframe</CardDescription>
                </div>
                <Badge variant="expense" size="sm">Trend</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyExpenseTrendChart
                  data={analytics?.dailyTrends || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>

          {/* Spending by Category Donut Chart */}
          <Card className="p-4 sm:p-5 lg:col-span-5 flex flex-col justify-between shadow-xs">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Layers className="w-4 h-4 text-primary shrink-0" />
                    <span>Category Breakdown</span>
                  </CardTitle>
                  <CardDescription>Share of spending across budget categories</CardDescription>
                </div>
                <Badge variant="neutral" size="sm">Distribution</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyCategoryPieChart
                  data={analytics?.categorySpending || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Secondary Row: Payment Channels & Day of Week Spending */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Payment Method Distribution */}
          <Card className="p-4 sm:p-5 lg:col-span-6 flex flex-col justify-between shadow-xs">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <CreditCard className="w-4 h-4 text-primary shrink-0" />
                    <span>Payment Channels</span>
                  </CardTitle>
                  <CardDescription>Spending categorized by payment instrument</CardDescription>
                </div>
                <Badge variant="neutral" size="sm">Channels</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyPaymentMethodChart
                  data={analytics?.paymentMethods || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>

          {/* Day of Week Spending Rhythm */}
          <Card className="p-4 sm:p-5 lg:col-span-6 flex flex-col justify-between shadow-xs">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Calendar className="w-4 h-4 text-warning-brand shrink-0" />
                    <span>Weekly Spending Cadence</span>
                  </CardTitle>
                  <CardDescription>Outflows by day of week (Monday through Sunday)</CardDescription>
                </div>
                <Badge variant="warning" size="sm">Rhythm</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyDayOfWeekChart
                  data={analytics?.dayOfWeekDistribution || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tertiary Row: Top Spend Items Bar Chart & Frequent Purchases */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* Top Spending Items Chart */}
          <Card className="p-4 sm:p-5 lg:col-span-6 shadow-xs">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <ArrowDownRight className="w-4 h-4 text-expense shrink-0" />
                    <span>Top Expense Outlays</span>
                  </CardTitle>
                  <CardDescription>Highest individual items by total spend volume</CardDescription>
                </div>
                <Badge variant="expense" size="sm">Top Outlays</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyTopItemsChart
                  data={analytics?.topSpendingItems || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>

          {/* Frequently Purchased Items List */}
          <Card className="p-4 sm:p-5 lg:col-span-6 shadow-xs flex flex-col justify-between">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Sparkles className="w-4 h-4 text-expense shrink-0" />
                    <span>Frequently Purchased Items</span>
                  </CardTitle>
                  <CardDescription>Recurring purchases with count and average cost</CardDescription>
                </div>
                <Badge variant="neutral" size="sm">Frequency</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0 pt-2 space-y-2.5 max-h-[320px] overflow-y-auto touch-scroll no-scrollbar">
              {analytics?.frequentlyPurchased?.length > 0 ? (
                analytics.frequentlyPurchased.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline hover:border-hairline-strong transition-all"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs sm:text-sm font-bold text-ink truncate">
                        {item.item}
                      </div>
                      <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-ink">{item.count} orders</span>
                        <span>•</span>
                        <span>Avg {formatCurrency(item.averageAmount, activeCurrency)}</span>
                        {item.categoryName && (
                          <>
                            <span>•</span>
                            <span className="text-ink-faint">{item.categoryName}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs sm:text-sm font-black text-expense">
                        {formatCurrency(item.totalAmount, activeCurrency)}
                      </div>
                      <div className="text-[10px] text-ink-faint mt-0.5">
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

