"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { LazyCategoryPieChart } from "@/components/charts/LazyCharts";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIncomeAnalytics } from "@/app/actions/analytics";
import { getClientCache, setClientCache } from "@/lib/clientCache";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { TrendingUp, DollarSign, Plus, Sparkles, Building2, Wallet, Banknote, Layers } from "lucide-react";

export default function IncomePage() {
  const { currency } = useCurrency();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCurrency = analytics?.currency || currency;

  const fetchData = useCallback(async () => {
    const cacheKey = `income_${datePreset}_${customStart || ""}_${customEnd || ""}`;
    const cached = getClientCache<any>(cacheKey);

    if (cached) {
      setAnalytics(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    try {
      const res = await getIncomeAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      });
      if (res.success) {
        setAnalytics(res);
        setClientCache(cacheKey, res, 120000);
      }
    } finally {
      setLoading(false);
    }
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppShell
      title="Income Analytics"
      onOpenNewTransaction={() => setIsModalOpen(true)}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-income" />
              Income Streams & Earnings
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Salary, freelance contracts, dividends, and consulting payouts
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
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              Add Income
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
            {/* Total Income */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] border-income/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Total Inflow
                  </span>
                  <div className="p-2 rounded-xl bg-income-bg text-income ">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-income tracking-tight truncate">
                  {formatCurrency(analytics?.totalIncome || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px]">{analytics?.transactionCount || 0} Deposits Logged</span>
                <Badge variant="income" size="sm">Inflow</Badge>
              </div>
            </Card>

            {/* Top Income Source */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Top Income Source
                  </span>
                  <div className="p-2 rounded-xl bg-sky-brand-bg text-primary ">
                    <Banknote className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.highestIncome || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted truncate border-t border-hairline pt-2">
                Source: <strong className="text-ink font-semibold">{analytics?.highestIncomeSource || "None logged"}</strong>
              </div>
            </Card>

            {/* Average Deposit */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Average Deposit
                  </span>
                  <div className="p-2 rounded-xl bg-income-bg text-income ">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.averageIncome || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                Per deposit metric
              </div>
            </Card>

            {/* Unique Streams */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Active Streams
                  </span>
                  <div className="p-2 rounded-xl bg-investment-bg text-investment ">
                    <Layers className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {analytics?.incomeByItem?.length || 0}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                Distinct revenue channels
              </div>
            </Card>
          </div>
        )}

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle>Income Distribution by Category</CardTitle>
              <CardDescription>Earnings split by category type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <LazyCategoryPieChart
                  data={analytics?.incomeByCategory || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Banknote className="w-4 h-4 text-income" />
                Top Income Sources
              </CardTitle>
              <CardDescription>Individual clients and salary payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.incomeByItem?.length > 0 ? (
                analytics.incomeByItem.map((src: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas border border-hairline"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-3">
                      <div className="p-2 rounded-xl bg-income-bg text-income shrink-0 ">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-ink truncate">
                        {src.item}
                      </div>
                    </div>
                    <div className="font-black text-sm text-income shrink-0">
                      +{formatCurrency(src.amount, activeCurrency)}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="No Income Recorded"
                  description="Record your salary or freelance earnings to see source statistics."
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
        defaultType="Income"
      />
    </AppShell>
  );
}

