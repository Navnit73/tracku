"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { InsightCard } from "@/components/insights/InsightCard";
import { getTransactions } from "@/app/actions/transactions";
import { getComprehensiveFinancialInsights } from "@/app/actions/insights";
import type { InsightItem, MonthComparisonCategory, HealthScore, MonthComparison } from "@/app/actions/insights";
import { downloadTransactionsCSV } from "@/lib/csvExport";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { showToast } from "@/lib/toast";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  TrendingUp,
  RotateCw,
} from "lucide-react";

export default function ReportsPage() {
  const { currency } = useCurrency();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [comparison, setComparison] = useState<MonthComparison | null>(null);
  const [serverCurrency, setServerCurrency] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [categories, setCategories] = useState<MonthComparisonCategory[]>([]);
  const [savingsRate, setSavingsRate] = useState<number>(0);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportingType, setExportingType] = useState<string | null>(null);

  const activeCurrency = serverCurrency || currency;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const filters = { dateRange: datePreset, startDate: customStart, endDate: customEnd };

    // Single unified intelligence query replaces 3 overlapping roundtrips
    const comprehensiveInsightsRes = await getComprehensiveFinancialInsights(filters);

    if (comprehensiveInsightsRes.success) {
      if (comprehensiveInsightsRes.currency) setServerCurrency(comprehensiveInsightsRes.currency);
      setComparison(comprehensiveInsightsRes.comparison);
      setInsights((comprehensiveInsightsRes.insights || []).slice(0, 3));
      if (comprehensiveInsightsRes.comparison) {
        setCategories(comprehensiveInsightsRes.comparison.categories || []);
      }
      if (comprehensiveInsightsRes.savings) {
        setSavingsRate(comprehensiveInsightsRes.savings.savingsRate);
      }
      if (comprehensiveInsightsRes.healthScore) {
        setHealthScore(comprehensiveInsightsRes.healthScore);
      }
    } else {
      showToast.error("Failed to load report", comprehensiveInsightsRes.error);
    }

    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // On-demand CSV export: only fetches transactions when requested
  const handleExportCSV = async (typeFilter: string) => {
    setExportingType(typeFilter);
    showToast.info("Preparing Export", `Generating ${typeFilter === "All" ? "full" : typeFilter} transaction report...`);

    try {
      const res = await getTransactions({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
        type: typeFilter === "All" ? undefined : (typeFilter as any),
        limit: 2000,
      });

      if (res.success && res.transactions && res.transactions.length > 0) {
        downloadTransactionsCSV(res.transactions, `report_${typeFilter.toLowerCase()}`);
        showToast.success("Export Downloaded", `Saved ${res.transactions.length} transaction records.`);
      } else if (res.success && (!res.transactions || res.transactions.length === 0)) {
        showToast.info("No Records", "No matching transactions found for this period to export.");
      } else {
        showToast.error("Export Failed", res.error || "Failed to generate CSV export.");
      }
    } catch (err: any) {
      showToast.error("Export Error", err?.message || "Failed to generate CSV file.");
    } finally {
      setExportingType(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Financial Reports">
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Executive Financial Statement
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Consolidated audit statement for period horizon: <strong className="text-primary font-semibold">{datePreset}</strong>
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
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
              className="flex-1 sm:flex-none"
            >
              Print
            </Button>
            <Button
              size="sm"
              onClick={() => handleExportCSV("All")}
              isLoading={exportingType === "All"}
              leftIcon={<Download className="w-4 h-4" />}
              className="flex-1 sm:flex-none shrink-0"
            >
              Export CSV
            </Button>
          </div>
        </div>

        {/* Report Overview Card */}
        <Card className="p-4 sm:p-6 lg:p-8">
          <div className="border-b border-hairline pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="text-xs uppercase font-bold text-primary tracking-wider">
                Personal Finance Audit Summary
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-ink mt-0.5 tracking-tight">
                Cash Flow & Wealth Report
              </h1>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="p-4 rounded-2xl bg-canvas border border-hairline">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Inflow</div>
              <div className="text-xl sm:text-2xl font-black text-income mt-1 truncate">
                {formatCurrency(comparison?.currentIncome || 0, activeCurrency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-canvas border border-hairline">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Outflow</div>
              <div className="text-xl sm:text-2xl font-black text-expense mt-1 truncate">
                {formatCurrency(comparison?.currentExpenses || 0, activeCurrency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-canvas border border-hairline">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider">Total Invested</div>
              <div className="text-xl sm:text-2xl font-black text-investment mt-1 truncate">
                {formatCurrency(comparison?.currentInvestments || 0, activeCurrency)}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-primary text-white ">
              <div className="text-xs font-bold text-emerald-100 uppercase tracking-wider">Net Balance</div>
              <div className="text-xl sm:text-2xl font-black mt-1 truncate">
                {formatCurrency(
                  (comparison?.currentIncome || 0) -
                    (comparison?.currentExpenses || 0) -
                    (comparison?.currentInvestments || 0),
                  activeCurrency
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-canvas border border-hairline">
              <div className="text-xs font-bold text-ink-muted uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-income" /> Savings Rate
              </div>
              <div className={`text-xl sm:text-2xl font-black mt-1 ${savingsRate >= 20 ? "text-income" : savingsRate >= 0 ? "text-warning" : "text-expense"}`}>
                {Math.round(savingsRate)}%
              </div>
            </div>
          </div>

          {/* Top Insights Section */}
          {insights.length > 0 && (
            <div className="mb-6 pt-5 border-t border-hairline">
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
            <div className="mb-6 pt-5 border-t border-hairline">
              <h3 className="text-sm font-bold text-ink mb-3">
                Category Breakdown — This Period vs Previous
              </h3>
              <div className="overflow-x-auto rounded-2xl border border-hairline">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline bg-canvas/80">
                      <th className="text-left py-2.5 px-3.5 text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                        Category
                      </th>
                      <th className="text-right py-2.5 px-3.5 text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                        Current
                      </th>
                      <th className="text-right py-2.5 px-3.5 text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                        Previous
                      </th>
                      <th className="text-right py-2.5 px-3.5 text-[10px] uppercase font-bold text-ink-muted tracking-wider">
                        Change
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {categories.map((cat) => (
                      <tr
                        key={cat.category}
                        className="hover:bg-canvas/50 transition-colors"
                      >
                        <td className="py-3 px-3.5 font-bold text-ink">
                          {cat.category}
                        </td>
                        <td className="py-3 px-3.5 text-right font-black text-ink">
                          {formatCurrency(cat.currentAmount, activeCurrency)}
                        </td>
                        <td className="py-3 px-3.5 text-right text-ink-muted font-medium">
                          {formatCurrency(cat.previousAmount, activeCurrency)}
                        </td>
                        <td className="py-3 px-3.5 text-right">
                          {cat.delta !== 0 ? (
                            <span
                              className={`inline-flex items-center gap-0.5 text-xs font-extrabold ${
                                cat.delta > 0
                                  ? "text-expense"
                                  : "text-income"
                              }`}
                            >
                              {cat.delta > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : (
                                <ArrowDownRight className="w-3.5 h-3.5" />
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
                isLoading={exportingType === "Expense"}
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
                isLoading={exportingType === "Income"}
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
                isLoading={exportingType === "Investment"}
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
