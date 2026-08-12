"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { InsightCard } from "@/components/insights/InsightCard";
import { HealthScoreRing } from "@/components/insights/HealthScore";
import { MonthComparisonChart } from "@/components/insights/MonthComparison";
import { SavingsGauge } from "@/components/insights/SavingsGauge";
import { getComprehensiveFinancialInsights } from "@/app/actions/insights";
import { clearAllUserData } from "@/app/actions/transactions";
import type {
  InsightItem,
  RecurringExpense,
  MonthComparison,
  SavingsAnalysis,
  NetWorthSnapshot,
  HealthScore,
} from "@/app/actions/insights";
import { showToast, confirmDialog } from "@/lib/toast";
import {
  Brain,
  Sparkles,
  RefreshCw,
  Repeat,
  ArrowLeftRight,
  PiggyBank,
  Landmark,
  ShieldCheck,
  Calendar,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function InsightsPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [recurring, setRecurring] = useState<RecurringExpense[]>([]);
  const [totalMonthlyRecurring, setTotalMonthlyRecurring] = useState(0);
  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [savings, setSavings] = useState<SavingsAnalysis | null>(null);
  const [netWorth, setNetWorth] = useState<NetWorthSnapshot | null>(null);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);

  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);

    const res = await getComprehensiveFinancialInsights({
      dateRange: datePreset,
      startDate: customStart,
      endDate: customEnd,
    });

    if (res.success) {
      setInsights(res.insights || []);
      setRecurring(res.recurring || []);
      setTotalMonthlyRecurring(res.totalMonthlyRecurring || 0);
      setComparison(res.comparison);
      setSavings(res.savings);
      setNetWorth(res.netWorth);
      setHealthScore(res.healthScore);
    } else {
      showToast.error("Insights Error", res.error);
    }

    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleClearData = async () => {
    const confirmed = await confirmDialog({
      title: "CLEAR ALL TRANSACTIONS?",
      text: "This will remove all income, expense, and investment entries so you can test cleanly with new data.",
      confirmText: "Yes, Clear All Transactions",
    });

    if (confirmed) {
      setClearing(true);
      const res = await clearAllUserData();
      setClearing(false);
      if (res.success) {
        showToast.success("Data Cleared!", res.message);
        fetchAll();
      } else {
        showToast.error("Clear Failed", res.error);
      }
    }
  };

  return (
    <AppShell title="Financial Insights">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" />
              Financial Intelligence
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Smart analysis of your spending patterns, savings, and financial health
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
              variant="outline"
              size="sm"
              onClick={fetchAll}
              leftIcon={<RefreshCw className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Refresh
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleClearData}
              isLoading={clearing}
              leftIcon={<Trash2 className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Clear All Data
            </Button>
          </div>
        </div>

        {/* Row 1: Health Score + Smart Insights Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Health Score */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Financial Health Score
              </CardTitle>
              <CardDescription>
                Composite score based on savings, spending, investments & trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : healthScore ? (
                <HealthScoreRing healthScore={healthScore} />
              ) : (
                <EmptyState
                  title="No Data Yet"
                  description="Add transactions to calculate your financial health score."
                />
              )}
            </CardContent>
          </Card>

          {/* Smart Insights Feed */}
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Smart Insights
                </CardTitle>
                <CardDescription>
                  AI-powered analysis of your financial behavior
                </CardDescription>
              </div>
              <Badge variant="sky" size="sm">
                {insights.length} insights
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : insights.length > 0 ? (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {insights.map((insight, idx) => (
                    <InsightCard key={insight.id} insight={insight} index={idx} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Insights Yet"
                  description="Add transactions to unlock smart spending insights and behavioral analysis."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 2: MoM Comparison + Savings Gauge */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Month-over-Month */}
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <ArrowLeftRight className="w-4 h-4 text-primary" />
                  Month-over-Month
                </CardTitle>
                <CardDescription>
                  Compare spending categories between current and previous period
                </CardDescription>
              </div>
              <Badge variant="investment" size="sm">
                Comparison
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : comparison && comparison.categories.length > 0 ? (
                <MonthComparisonChart comparison={comparison} />
              ) : (
                <EmptyState
                  title="Not Enough Data"
                  description="Need transactions from two consecutive periods to show comparison."
                />
              )}
            </CardContent>
          </Card>

          {/* Savings Gauge */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <PiggyBank className="w-4 h-4 text-income" />
                Savings Rate
              </CardTitle>
              <CardDescription>
                How much you&apos;re saving relative to income
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : savings ? (
                <SavingsGauge analysis={savings} />
              ) : (
                <EmptyState
                  title="No Savings Data"
                  description="Add income and expense transactions to track your savings rate."
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Row 3: Recurring Expenses + Net Worth */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Recurring Expenses */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Repeat className="w-4 h-4 text-warning-brand" />
                  Recurring Expenses
                </CardTitle>
                <CardDescription>
                  Auto-detected subscriptions and regular bills (last 90 days)
                </CardDescription>
              </div>
              {recurring.length > 0 && (
                <Badge variant="expense" size="sm">
                  ~{totalMonthlyRecurring.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : recurring.length > 0 ? (
                <div className="space-y-2.5">
                  {recurring.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-warning-brand-bg text-warning-brand shrink-0">
                          <Repeat className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-ink truncate">
                            {item.item}
                          </div>
                          <div className="text-[10px] text-ink-muted flex items-center gap-1.5">
                            <span>{item.categoryName}</span>
                            <span>•</span>
                            <span>{item.occurrences}× in 90d</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold text-expense">
                          {item.estimatedMonthly.toLocaleString("en-US", { maximumFractionDigits: 0 })}/mo
                        </div>
                        <div className="text-[10px] text-ink-faint">
                          avg {item.averageAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} each
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No Recurring Detected"
                  description="Recurring expenses appear when the same item is purchased 3+ times in 90 days with consistent amounts."
                />
              )}
            </CardContent>
          </Card>

          {/* Net Worth Snapshot */}
          <Card className="p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Landmark className="w-4 h-4 text-investment" />
                  Net Worth Snapshot
                </CardTitle>
                <CardDescription>
                  All-time wealth accumulation overview
                </CardDescription>
              </div>
              <Badge variant="investment" size="sm">
                All Time
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : netWorth ? (
                <div className="space-y-4">
                  {/* Top-level net worth */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] text-white">
                    <div className="text-[10px] uppercase font-bold text-purple-200 tracking-wider">
                      Net Balance
                    </div>
                    <div className="text-2xl font-black tracking-tight mt-0.5">
                      {netWorth.netBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] text-purple-200 mt-1">
                      Income − Expenses − Investments
                    </div>
                  </div>

                  {/* Summary grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-lg bg-income-bg border border-income/20">
                      <div className="text-[10px] uppercase font-bold text-income tracking-wider">
                        Income
                      </div>
                      <div className="text-sm font-extrabold text-income mt-0.5">
                        {netWorth.totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-expense-bg border border-expense/20">
                      <div className="text-[10px] uppercase font-bold text-expense tracking-wider">
                        Expenses
                      </div>
                      <div className="text-sm font-extrabold text-expense mt-0.5">
                        {netWorth.totalExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-investment-bg border border-investment/20">
                      <div className="text-[10px] uppercase font-bold text-investment tracking-wider">
                        Invested
                      </div>
                      <div className="text-sm font-extrabold text-investment mt-0.5">
                        {netWorth.totalInvestments.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  {/* Investment allocation breakdown */}
                  {netWorth.investmentsByCategory.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-bold text-ink">
                        Investment Allocation
                      </div>
                      {netWorth.investmentsByCategory.map((cat, idx) => {
                        const pct = netWorth.totalInvestments > 0
                          ? Math.round((cat.amount / netWorth.totalInvestments) * 100)
                          : 0;
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{
                                  backgroundColor: [
                                    "#7c3aed", "#0075de", "#059669", "#d97706", "#e11d48", "#2a9d99",
                                  ][idx % 6],
                                }}
                              />
                              <span className="text-ink-muted truncate">
                                {cat.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-bold text-ink">
                                {cat.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                              </span>
                              <span className="text-[10px] text-ink-faint">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No Financial Data"
                  description="Start tracking income, expenses, and investments to see your net worth."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
