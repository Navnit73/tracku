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
    <AppShell title="Investments Portfolio">
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Asset Allocation & Wealth Accumulation
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Stocks, Mutual Funds, Crypto, Gold, Fixed Deposits & ETF Holdings
            </p>
          </div>

          <div className="flex items-center gap-2">
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
            >
              Add Investment
            </Button>
          </div>
        </div>

        {/* Portfolio Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card variant="hero">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-purple-200">
                  Total Portfolio Invested
                </span>
                <div className="p-2 rounded-lg bg-white/10 text-white backdrop-blur-xs">
                  <LineChart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold tracking-tight">
                {formatCurrency(analytics?.totalInvested || 0)}
              </div>
              <div className="mt-2 text-xs text-purple-200 border-t border-white/10 pt-2 flex justify-between">
                <span>Investments Count:</span>
                <strong className="text-white">{analytics?.investmentCount || 0}</strong>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Largest Allocation
                </span>
                <div className="p-2 rounded-lg bg-[#f5f3ff] text-[#7c3aed]">
                  <Coins className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#7c3aed]">
                {formatCurrency(analytics?.largestInvestment || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59] truncate">
                Asset: <strong>{analytics?.largestInvestmentItem || "N/A"}</strong>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Average Allocation
                </span>
                <Badge variant="investment" size="sm">
                  DCA Avg
                </Badge>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {formatCurrency(analytics?.averageInvestment || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Per deposit metric</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Asset Types
                </span>
                <div className="p-2 rounded-lg bg-[#ecfdf5] text-[#059669]">
                  <ShieldCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {analytics?.investmentByCategory?.length || 0}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Active asset classes</div>
            </Card>
          </div>
        )}

        {/* Investment Growth Chart & Category Allocation */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
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

          <Card>
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
        <Card>
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
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]"
                  >
                    <div>
                      <div className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7]">
                        {item.item}
                      </div>
                      <div className="text-xs text-[#615d59]">Asset Holding</div>
                    </div>
                    <div className="text-right font-extrabold text-sm text-[#7c3aed]">
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
