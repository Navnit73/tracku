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
} from "lucide-react";

export default function DashboardPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const res = await getDashboardAnalytics({
      dateRange: datePreset,
      startDate: customStart,
      endDate: customEnd,
    });
    if (res.success) {
      setAnalytics(res);
    } else {
      showToast.error("Failed to load dashboard data", res.error);
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
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-6">
        {/* Top Control Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Financial Summary
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Live metrics computed for horizon: <strong className="text-[#0075de]">{datePreset}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker
              selectedPreset={datePreset}
              startDate={customStart}
              endDate={customEnd}
              onChange={handleDateChange}
            />

            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Transaction
            </Button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Balance */}
            <Card variant="hero" className="relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                  Total Net Balance
                </span>
                <div className="p-2 rounded-lg bg-white/10 text-white backdrop-blur-xs">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formatCurrency(analytics?.summary?.balance || 0)}
              </div>
              <div className="mt-2 text-xs text-blue-100 flex items-center justify-between border-t border-white/10 pt-2">
                <span>Net = Income - Exp - Inv</span>
                <span className="font-semibold text-emerald-300">Active</span>
              </div>
            </Card>

            {/* Savings */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]">
                  Net Savings
                </span>
                <div className="p-2 rounded-lg bg-[#ecfdf5] dark:bg-[#133e2b] text-[#059669]">
                  <PiggyBank className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
                {formatCurrency(analytics?.summary?.savings || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59] dark:text-[#9b9b9b] flex items-center justify-between border-t border-[#e6e6e6] dark:border-[#2f2f2f] pt-2">
                <span>Savings = Income - Exp</span>
                <Badge variant="income" size="sm">
                  +{formatCurrency(analytics?.summary?.monthlyIncome || 0)}/mo
                </Badge>
              </div>
            </Card>

            {/* Total Income & Expenses */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]">
                  Income & Expenses
                </span>
                <div className="p-2 rounded-lg bg-[#f0f9ff] dark:bg-[#0c2a3a] text-[#0075de]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline justify-between gap-1">
                <div>
                  <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">Income</div>
                  <div className="text-lg font-bold text-[#059669]">
                    {formatCurrency(analytics?.summary?.totalIncome || 0)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">Expenses</div>
                  <div className="text-lg font-bold text-[#e11d48]">
                    {formatCurrency(analytics?.summary?.totalExpenses || 0)}
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-[#615d59] dark:text-[#9b9b9b] border-t border-[#e6e6e6] dark:border-[#2f2f2f] pt-2 flex justify-between">
                <span>Mo. Expenses:</span>
                <strong className="text-[#e11d48]">
                  {formatCurrency(analytics?.summary?.monthlyExpenses || 0)}
                </strong>
              </div>
            </Card>

            {/* Investments */}
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]">
                  Total Investments
                </span>
                <div className="p-2 rounded-lg bg-[#f5f3ff] dark:bg-[#2e1a47] text-[#7c3aed]">
                  <LineChart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#7c3aed] dark:text-[#a78bfa] tracking-tight">
                {formatCurrency(analytics?.summary?.totalInvestments || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59] dark:text-[#9b9b9b] flex items-center justify-between border-t border-[#e6e6e6] dark:border-[#2f2f2f] pt-2">
                <span>Mo. Invested:</span>
                <strong className="text-[#7c3aed]">
                  {formatCurrency(analytics?.summary?.monthlyInvestments || 0)}
                </strong>
              </div>
            </Card>
          </div>
        )}

        {/* Charts Grid Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Income vs Expenses Trend Chart */}
          <Card className="lg:col-span-2">
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
                <IncomeExpenseChart data={analytics?.charts?.incomeVsExpense || []} />
              )}
            </CardContent>
          </Card>

          {/* Category Spending Breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Category Spending</CardTitle>
              <CardDescription>Expense allocation by category</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart data={analytics?.charts?.categorySpending || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Investment Portfolio Growth */}
          <Card>
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
                <InvestmentGrowthChart data={analytics?.charts?.investmentGrowth || []} />
              )}
            </CardContent>
          </Card>

          {/* Top Spending Items */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Top Spending Items</CardTitle>
              <CardDescription>Highest expenditure line items</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <TopItemsChart data={analytics?.charts?.topSpendingItems || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section: Frequently Spent & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Frequently Spent Items */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0075de]" />
                Frequently Spent Items
              </CardTitle>
              <CardDescription>High frequency recurring purchases</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.frequentlySpentItems?.length > 0 ? (
                analytics.frequentlySpentItems.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7]">
                        {item.item}
                      </div>
                      <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">
                        {item.count} transactions • Avg {formatCurrency(item.averageAmount)}
                      </div>
                    </div>
                    <div className="text-right font-semibold text-sm text-[#e11d48]">
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
          <Card className="lg:col-span-2">
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
                <div className="divide-y divide-[#e6e6e6] dark:divide-[#2f2f2f]">
                  {analytics.recentTransactions.map((t: any) => (
                    <div key={t._id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl text-white ${
                            t.type === "Income"
                              ? "bg-[#059669]"
                              : t.type === "Expense"
                              ? "bg-[#e11d48]"
                              : "bg-[#7c3aed]"
                          }`}
                        >
                          {t.type === "Income" ? (
                            <ArrowUpRight className="w-4 h-4" />
                          ) : (
                            <ArrowDownRight className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7]">
                            {t.item}
                          </div>
                          <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">
                            {t.categoryName} • {formatDate(t.date)} • {t.paymentMethod}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`text-sm font-bold ${
                          t.type === "Income"
                            ? "text-[#059669]"
                            : t.type === "Expense"
                            ? "text-[#e11d48]"
                            : "text-[#7c3aed]"
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
