"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { IncomeExpenseChart } from "@/components/charts/IncomeExpenseChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TopItemsChart } from "@/components/charts/TopItemsChart";
import { InvestmentGrowthChart } from "@/components/charts/InvestmentGrowthChart";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getDashboardAnalytics } from "@/app/actions/analytics";
import { seedSampleTransactions } from "@/app/actions/transactions";
import { getSpendingInsights } from "@/app/actions/insights";
import type { InsightItem } from "@/app/actions/insights";
import { InsightCard } from "@/components/insights/InsightCard";
import { formatCurrency, formatDate } from "@/lib/utils";
import { showToast } from "@/lib/toast";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  LineChart,
  PiggyBank,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Calendar,
  Sparkles,
  Brain,
} from "lucide-react";

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickInsights, setQuickInsights] = useState<InsightItem[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const [res, insightsRes] = await Promise.all([
      getDashboardAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
      getSpendingInsights({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
    ]);
    if (res.success) {
      setAnalytics(res);
    } else {
      showToast.error("Failed to load dashboard data", res.error);
    }
    if (insightsRes.success) {
      setQuickInsights((insightsRes.insights || []).slice(0, 3));
    }
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateChange = (preset: DateRangePreset, start?: string, end?: string) => {
    setDatePreset(preset);
    setCustomStart(start);
    setCustomEnd(end);
  };

  const handleSeedDemoData = async () => {
    setSeeding(true);
    const res = await seedSampleTransactions();
    setSeeding(false);
    if (res.success) {
      showToast.success("Sample Data Populated!", "Your dashboard now displays realistic financial datasets.");
      fetchAnalytics();
    } else {
      showToast.error("Seeding Error", res.error);
    }
  };

  return (
    <AppShell title="Dashboard" onOpenNewTransaction={() => setIsModalOpen(true)}>
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Financial Summary
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Metrics horizon: <strong className="text-primary font-semibold">{datePreset}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto">
            <DatePicker
              selectedPreset={datePreset}
              startDate={customStart}
              endDate={customEnd}
              onChange={handleDateChange}
              className="w-full sm:w-auto"
            />

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              New Transaction
            </Button>
          </div>
        </div>

        {/* Quick Insights Strip */}
        {!loading && quickInsights.length > 0 && (
          <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-ink flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                Quick Insights
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/insights")}
              >
                View All Insights →
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {quickInsights.map((insight, idx) => (
                <InsightCard key={insight.id} insight={insight} index={idx} />
              ))}
            </div>
          </div>
        )}

        {/* Summary Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            {/* 1. Total Net Balance (Hero Accent) */}
            <Card variant="hero" className="relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between min-h-[145px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
                    Total Net Balance
                  </span>
                  <div className="p-2 rounded-xl bg-white/15 text-white backdrop-blur-xs ">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl xl:text-2xl 2xl:text-3xl font-black tracking-tight text-white truncate">
                  {formatCurrency(analytics?.summary?.balance || 0, analytics?.currency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-emerald-100 flex items-center justify-between border-t border-white/15 pt-2">
                <span className="text-[11px] opacity-90 truncate">Net Surplus Balance</span>
                <span className="font-bold text-[10px] bg-white/20 px-2 py-0.5 rounded-full text-white shrink-0">
                  Active
                </span>
              </div>
            </Card>

            {/* 2. Net Savings */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[145px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Net Savings
                  </span>
                  <div className="p-2 rounded-xl bg-income-bg text-income ">
                    <PiggyBank className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl xl:text-2xl 2xl:text-3xl font-black text-income tracking-tight truncate">
                  {formatCurrency(analytics?.summary?.savings || 0, analytics?.currency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted flex items-center justify-between border-t border-hairline pt-2 gap-1">
                <span className="text-[11px] truncate">Monthly Inflow:</span>
                <Badge variant="income" size="sm">
                  +{formatCurrency(analytics?.summary?.monthlyIncome || 0, analytics?.currency)}
                </Badge>
              </div>
            </Card>

            {/* 3. Cash Flow Split (Income vs Expenses) */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[145px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Income vs Expenses
                  </span>
                  <div className="p-2 rounded-xl bg-sky-brand-bg text-sky-brand ">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] text-ink-muted font-medium">Inflow</div>
                    <div className="text-base sm:text-lg font-extrabold text-income truncate">
                      +{formatCurrency(analytics?.summary?.totalIncome || 0, analytics?.currency)}
                    </div>
                  </div>
                  <div className="text-right min-w-0">
                    <div className="text-[11px] text-ink-muted font-medium">Outflow</div>
                    <div className="text-base sm:text-lg font-extrabold text-expense truncate">
                      -{formatCurrency(analytics?.summary?.totalExpenses || 0, analytics?.currency)}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px] truncate">Mo. Spend:</span>
                <strong className="text-expense text-[11px]">
                  {formatCurrency(analytics?.summary?.monthlyExpenses || 0, analytics?.currency)}
                </strong>
              </div>
            </Card>

            {/* 4. Total Wealth Invested */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[145px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Total Investments
                  </span>
                  <div className="p-2 rounded-xl bg-investment-bg text-investment ">
                    <LineChart className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl xl:text-2xl 2xl:text-3xl font-black text-investment tracking-tight truncate">
                  {formatCurrency(analytics?.summary?.totalInvestments || 0, analytics?.currency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted flex items-center justify-between border-t border-hairline pt-2 gap-1">
                <span className="text-[11px] truncate">Mo. Invested:</span>
                <strong className="text-investment text-[11px]">
                  +{formatCurrency(analytics?.summary?.monthlyInvestments || 0, analytics?.currency)}
                </strong>
              </div>
            </Card>
          </div>
        )}

        {/* Charts Grid Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Income vs Expenses Trend Chart */}
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Income vs Expenses Trend</CardTitle>
                <CardDescription>
                  Comparative tracking of cash flow over time
                </CardDescription>
              </div>
              <Badge variant="sky" size="sm">
                Area Chart
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <IncomeExpenseChart
                  data={analytics?.charts?.incomeVsExpense || []}
                  currency={analytics?.currency}
                />
              )}
            </CardContent>
          </Card>

          {/* Category Spending Breakdown */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="pb-2">
              <CardTitle>Category Spending</CardTitle>
              <CardDescription>Expense allocation by category</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart
                  data={analytics?.charts?.categorySpending || []}
                  currency={analytics?.currency}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Investment Portfolio Growth */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Investment Growth</CardTitle>
                <CardDescription>Cumulative asset portfolio accumulation</CardDescription>
              </div>
              <Badge variant="investment" size="sm">
                Portfolio
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <InvestmentGrowthChart
                  data={analytics?.charts?.investmentGrowth || []}
                  currency={analytics?.currency}
                />
              )}
            </CardContent>
          </Card>

          {/* Top Spending Items */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="pb-2">
              <CardTitle>Top Spending Items</CardTitle>
              <CardDescription>Highest expenditure line items</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <TopItemsChart
                  data={analytics?.charts?.topSpendingItems || []}
                  currency={analytics?.currency}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Frequently Spent & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Frequently Spent Items */}
          <Card className="lg:col-span-1 p-4 sm:p-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="w-4 h-4 text-primary" />
                Frequently Spent Items
              </CardTitle>
              <CardDescription>High frequency recurring purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.frequentlySpentItems?.length > 0 ? (
                analytics.frequentlySpentItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline"
                  >
                    <div>
                      <div className="text-sm font-bold text-ink">
                        {item.item}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {item.count} transactions • Avg {formatCurrency(item.averageAmount)}
                      </div>
                    </div>
                    <div className="text-right font-semibold text-sm text-expense">
                      {formatCurrency(item.totalAmount)}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No Frequent Items"
                  description="Record recurring expenses to view frequency metrics."
                />
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions Ledger Feed */}
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity across all types</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (window.location.href = "/transactions")}
              >
                View Ledger →
              </Button>
            </CardHeader>
            <CardContent>
              {analytics?.recentTransactions?.length > 0 ? (
                <div className="divide-y divide-hairline">
                  {analytics.recentTransactions.map((t: any) => (
                    <div key={t._id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div
                          className={`p-2 rounded-xl text-white shrink-0 ${
                            t.type === "Income"
                              ? "bg-income"
                              : t.type === "Expense"
                              ? "bg-expense"
                              : "bg-investment"
                          }`}
                        >
                          {t.type === "Income" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-ink truncate">
                            {t.item}
                          </div>
                          <div className="text-xs text-ink-muted truncate">
                            {t.categoryName} • {formatDate(t.date)}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold shrink-0 ${
                          t.type === "Income"
                            ? "text-income"
                            : t.type === "Expense"
                            ? "text-expense"
                            : "text-investment"
                        }`}
                      >
                        {t.type === "Income" ? "+" : "-"}
                        {formatCurrency(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Recent Transactions"
                  description="Click New Transaction to record your first income, expense, or investment."
                  actionLabel="Create Transaction"
                  onAction={() => setIsModalOpen(true)}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchAnalytics}
      />
    </AppShell>
  );
}
