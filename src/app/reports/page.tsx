"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { InsightCard } from "@/components/insights/InsightCard";
import { getDashboardAnalytics } from "@/app/actions/analytics";
import { getTransactions } from "@/app/actions/transactions";
import { getSpendingInsights, getMonthComparison, getSavingsAnalysis, getFinancialHealthScore } from "@/app/actions/insights";
import type { InsightItem, MonthComparisonCategory, HealthScore } from "@/app/actions/insights";
import { downloadTransactionsCSV } from "@/lib/csvExport";
import { formatCurrency } from "@/lib/utils";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export default function ReportsPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [categories, setCategories] = useState<MonthComparisonCategory[]>([]);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const filters = { dateRange: datePreset, startDate: customStart, endDate: customEnd };

    const [analyticsRes, transRes, insightsRes, compRes, savingsRes, healthRes] = await Promise.all([
      getDashboardAnalytics(filters),
      getTransactions({ ...filters, limit: 500 }),
      getSpendingInsights(filters),
      getMonthComparison(filters),
      getSavingsAnalysis(filters),
      getFinancialHealthScore(filters),
    ]);

    if (analyticsRes.success) setAnalytics(analyticsRes);
    if (transRes.success) setTransactions(transRes.transactions);
    if (insightsRes.success) setInsights((insightsRes.insights || []).slice(0, 3));
    if (compRes.success && compRes.comparison) setCategories(compRes.comparison.categories || []);
    if (savingsRes.success && savingsRes.analysis) setSavingsRate(savingsRes.analysis.savingsRate);
    if (healthRes.success && healthRes.healthScore) setHealthScore(healthRes.healthScore);

    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = (typeFilter: string) => {
    const filtered =
      typeFilter === "All"
        ? transactions
        : transactions.filter((t) => t.type === typeFilter);
    downloadTransactionsCSV(filtered, `report_${typeFilter.toLowerCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Financial Reports">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Executive Financial Statement
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Consolidated audit statement for period horizon: <strong>{datePreset}</strong>
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
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Print Report
            </Button>
            <Button
              size="sm"
              onClick={() => handleExportCSV("All")}
              leftIcon={<Download className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Export Report CSV
            </Button>
          </div>
        </div>

        {/* Report Overview Card */}
        <Card className="p-4 sm:p-6">
          <div className="border-b border-hairline pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start gap-2">
            <div>
              <div className="text-xs uppercase font-bold text-primary tracking-wider">
                Personal Finance Audit Summary
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-ink mt-1">
                Cash Flow & Wealth Report
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {healthScore && (
                <Badge
                  variant={healthScore.score >= 60 ? "income" : "expense"}
                  size="md"
                >
                  Health: {healthScore.score}/100
                </Badge>
              )}
              <Badge variant="sky" size="md">
                Verified Realtime Data
              </Badge>
            </div>
          </div>

          {/* Summary cards with MoM deltas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <div className="p-3.5 sm:p-4 rounded-xl bg-canvas border border-hairline">
              <div className="text-xs font-semibold text-ink-muted">Total Cash Inflow</div>
              <div className="text-lg sm:text-xl font-extrabold text-income mt-1">
                {formatCurrency(analytics?.summary?.totalIncome || 0)}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-canvas border border-hairline">
              <div className="text-xs font-semibold text-ink-muted">Total Cash Outflow</div>
              <div className="text-lg sm:text-xl font-extrabold text-expense mt-1">
                {formatCurrency(analytics?.summary?.totalExpenses || 0)}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-canvas border border-hairline">
              <div className="text-xs font-semibold text-ink-muted">Total Wealth Invested</div>
              <div className="text-lg sm:text-xl font-extrabold text-investment mt-1">
                {formatCurrency(analytics?.summary?.totalInvestments || 0)}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-secondary text-white">
              <div className="text-xs font-semibold text-blue-200">Net Surplus / Balance</div>
              <div className="text-lg sm:text-xl font-extrabold mt-1">
                {formatCurrency(analytics?.summary?.balance || 0)}
              </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-xl bg-canvas border border-hairline">
              <div className="text-xs font-semibold text-ink-muted flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Savings Rate
              </div>
              <div className={`text-lg sm:text-xl font-extrabold mt-1 ${savingsRate >= 20 ? "text-income" : savingsRate >= 0 ? "text-warning" : "text-expense"}`}>
                {Math.round(savingsRate)}%
              </div>
            </div>
          </div>

          {/* Top Insights Section */}
          {insights.length > 0 && (
            <div className="mb-6 pt-4 border-t border-hairline">
              <h3 className="text-sm font-bold text-ink mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Key Insights for This Period
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {insights.map((insight, idx) => (
                  <InsightCard key={insight.id} insight={insight} index={idx} />
                ))}
              </div>
            </div>
          )}

          {/* Category Breakdown Table */}
          {categories.length > 0 && (
            <div className="mb-6 pt-4 border-t border-hairline">
              <h3 className="text-sm font-bold text-ink mb-3">
                Category Breakdown — This Period vs Previous
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left py-2 px-3 text-[10px] uppercase font-bold text-ink-faint tracking-wider">
                        Category
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] uppercase font-bold text-ink-faint tracking-wider">
                        Current
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] uppercase font-bold text-ink-faint tracking-wider">
                        Previous
                      </th>
                      <th className="text-right py-2 px-3 text-[10px] uppercase font-bold text-ink-faint tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <tr
                        key={cat.category}
                        className="border-b border-hairline/50 hover:bg-canvas transition-colors"
                      >
                        <td className="py-2.5 px-3 font-semibold text-ink">
                          {cat.category}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-ink">
                          {formatCurrency(cat.currentAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-ink-muted">
                          {formatCurrency(cat.previousAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {cat.delta !== 0 ? (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-bold ${
                                cat.delta > 0
                                  ? "text-expense"
                                  : "text-income"
                              }`}
                            >
                              {cat.delta > 0 ? (
                                <ArrowUpRight className="w-3 h-3" />
                              ) : (
                                <ArrowDownRight className="w-3 h-3" />
                              )}
                              {Math.abs(cat.delta)}%
                            </span>
                          ) : (
                            <span className="text-xs text-ink-faint">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick Export Downloads Section */}
          <div className="mt-4 pt-6 border-t border-hairline">
            <h3 className="text-sm font-bold text-ink mb-3">
              Export Segmented Data Reports
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Expense")}
                leftIcon={<Download className="w-4 h-4 text-expense" />}
                className="justify-between"
              >
                <span>Expense Ledger CSV</span>
                <Badge variant="expense" size="sm">
                  CSV
                </Badge>
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Income")}
                leftIcon={<Download className="w-4 h-4 text-income" />}
                className="justify-between"
              >
                <span>Income Ledger CSV</span>
                <Badge variant="income" size="sm">
                  CSV
                </Badge>
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Investment")}
                leftIcon={<Download className="w-4 h-4 text-investment" />}
                className="justify-between"
              >
                <span>Investment Portfolio CSV</span>
                <Badge variant="investment" size="sm">
                  CSV
                </Badge>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
