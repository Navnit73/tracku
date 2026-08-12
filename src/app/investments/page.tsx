"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { InvestmentGrowthChart } from "@/components/charts/InvestmentGrowthChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getInvestmentAnalytics, getDashboardAnalytics } from "@/app/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { LineChart, Plus, ShieldCheck, Coins, Bitcoin } from "lucide-react";

export default function InvestmentsPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("All Time");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [invRes, dashRes] = await Promise.all([
      getInvestmentAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
      getDashboardAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
    ]);

    if (invRes.success) setAnalytics(invRes);
    if (dashRes.success) setGrowthData(dashRes.charts?.investmentGrowth || []);
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppShell
      title="Investments Portfolio"
      onOpenNewTransaction={() => setIsModalOpen(true)}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Asset Allocation & Wealth Accumulation
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Stocks, Mutual Funds, Crypto, Gold, Fixed Deposits & ETF Holdings
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
              size="sm"
              onClick={() => setIsModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Add Investment
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card variant="hero" className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Total Portfolio Invested
                </span>
                <div className="p-2 rounded-lg bg-white/10 text-white backdrop-blur-xs">
                  <LineChart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {formatCurrency(analytics?.totalInvested || 0)}
              </div>
              <div className="mt-2 text-xs text-purple-200 border-t border-white/10 pt-2 flex justify-between">
                <span>Investments Count:</span>
                <strong className="text-white">{analytics?.investmentCount || 0}</strong>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Largest Allocation
                </span>
                <div className="p-2 rounded-lg bg-investment-bg text-investment">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-investment">
                {formatCurrency(analytics?.largestInvestment || 0)}
              </div>
              <div className="mt-2 text-xs text-ink-muted truncate">
                Asset: <strong>{analytics?.largestInvestmentItem || "N/A"}</strong>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Average Allocation
                </span>
                <Badge variant="investment" size="sm">
                  DCA Avg
                </Badge>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink">
                {formatCurrency(analytics?.averageInvestment || 0)}
              </div>
              <div className="mt-2 text-xs text-ink-muted">Per deposit metric</div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Asset Types
                </span>
                <div className="p-2 rounded-lg bg-income-bg text-income">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink">
                {analytics?.investmentByCategory?.length || 0}
              </div>
              <div className="mt-2 text-xs text-ink-muted">Active asset classes</div>
            </Card>
          </div>
        )}

        {/* Investment Growth Chart & Category Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2 p-4 sm:p-5">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Cumulative Portfolio Growth</CardTitle>
                <CardDescription>Historical wealth accumulation trajectory</CardDescription>
              </div>
              <Badge variant="investment" size="sm">
                Cumulative
              </Badge>
            </CardHeader>
            <CardContent>
              {loading ? <ChartSkeleton /> : <InvestmentGrowthChart data={growthData} />}
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle>Asset Allocation</CardTitle>
              <CardDescription>Portfolio split by investment type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart data={analytics?.investmentByCategory || []} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset Items Breakdown List */}
        <Card className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Individual Asset Holdings</CardTitle>
            <CardDescription>Investments grouped by asset ticker/name</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {analytics?.investmentByItem?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.investmentByItem.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline"
                  >
                    <div>
                      <div className="text-sm font-bold text-ink">
                        {item.item}
                      </div>
                      <div className="text-xs text-ink-muted">Asset Holding</div>
                    </div>
                    <div className="text-right font-extrabold text-sm text-investment">
                      {formatCurrency(item.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No Investment Assets"
                description="Start recording stocks, mutual funds, or gold investments to build your portfolio."
              />
            )}
          </CardContent>
        </Card>
      </div>

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
        defaultType="Investment"
      />
    </AppShell>
  );
}
