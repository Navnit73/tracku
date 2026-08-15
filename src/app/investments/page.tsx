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
import { getInvestmentAnalytics } from "@/app/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { LineChart, Plus, ShieldCheck, Coins, TrendingUp } from "lucide-react";

export default function InvestmentsPage() {
  const { currency } = useCurrency();
  const [datePreset, setDatePreset] = useState<DateRangePreset>("All Time");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeCurrency = analytics?.currency || currency;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const invRes = await getInvestmentAnalytics({
      dateRange: datePreset,
      startDate: customStart,
      endDate: customEnd,
    });

    if (invRes.success) {
      setAnalytics(invRes);
      setGrowthData(invRes.investmentGrowth || []);
    }
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-4 sm:p-5 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <LineChart className="w-5 h-5 text-investment" />
              Asset Allocation & Wealth Portfolio
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Stocks, mutual funds, crypto, gold, fixed deposits & ETF holdings
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
              Add Investment
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
            {/* Total Portfolio Invested */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px] border-investment/20">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Total Portfolio
                  </span>
                  <div className="p-2 rounded-xl bg-investment-bg text-investment ">
                    <LineChart className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-investment tracking-tight truncate">
                  {formatCurrency(analytics?.totalInvested || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2 flex items-center justify-between">
                <span className="text-[11px]">{analytics?.investmentCount || 0} Assets Logged</span>
                <Badge variant="investment" size="sm">Portfolio</Badge>
              </div>
            </Card>

            {/* Largest Allocation */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Largest Holding
                  </span>
                  <div className="p-2 rounded-xl bg-investment-bg text-investment ">
                    <Coins className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.largestInvestment || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted truncate border-t border-hairline pt-2">
                Asset: <strong className="text-ink font-semibold">{analytics?.largestInvestmentItem || "None recorded"}</strong>
              </div>
            </Card>

            {/* Average Allocation */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Average Allocation
                  </span>
                  <div className="p-2 rounded-xl bg-sky-brand-bg text-primary ">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {formatCurrency(analytics?.averageInvestment || 0, activeCurrency)}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                DCA average per entry
              </div>
            </Card>

            {/* Asset Classes */}
            <Card className="p-4 sm:p-5 flex flex-col justify-between min-h-[140px]">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Asset Classes
                  </span>
                  <div className="p-2 rounded-xl bg-income-bg text-income ">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl sm:text-3xl font-black text-ink tracking-tight truncate">
                  {analytics?.investmentByCategory?.length || 0}
                </div>
              </div>
              <div className="mt-3 text-xs text-ink-muted border-t border-hairline pt-2">
                Diversified categories
              </div>
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
              {loading ? (
                <ChartSkeleton />
              ) : (
                <InvestmentGrowthChart data={growthData} currency={activeCurrency} />
              )}
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
                <CategoryPieChart
                  data={analytics?.investmentByCategory || []}
                  currency={activeCurrency}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Asset Items Breakdown List */}
        <Card className="p-4 sm:p-5">
          <CardHeader>
            <CardTitle>Individual Asset Holdings</CardTitle>
            <CardDescription>Investments grouped by asset ticker or name</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics?.investmentByItem?.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {analytics.investmentByItem.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas border border-hairline"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-sm font-bold text-ink truncate">
                        {item.item}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">Asset Holding</div>
                    </div>
                    <div className="text-right font-black text-sm text-investment shrink-0">
                      {formatCurrency(item.amount, activeCurrency)}
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

