"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { CardSkeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getIncomeAnalytics } from "@/app/actions/analytics";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Banknote, Plus, ArrowUpRight } from "lucide-react";

export default function IncomePage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await getIncomeAnalytics({
      dateRange: datePreset,
      startDate: customStart,
      endDate: customEnd,
    });
    if (res.success) setAnalytics(res);
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <AppShell title="Income Analytics">
      <div className="flex flex-col gap-6">
        {/* Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
              Income Streams & Earnings
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Salary, freelance contracts, dividends, and consulting payouts
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
              Add Income
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Total Inflow
                </span>
                <div className="p-2 rounded-lg bg-[#ecfdf5] text-[#059669]">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#059669]">
                {formatCurrency(analytics?.totalIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">
                {analytics?.transactionCount || 0} Income deposits logged
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Top Income Source
                </span>
                <div className="p-2 rounded-lg bg-[#f0f9ff] text-[#0075de]">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {formatCurrency(analytics?.highestIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59] truncate">
                Source: <strong>{analytics?.highestIncomeSource || "N/A"}</strong>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Average Deposit
                </span>
                <Badge variant="income" size="sm">
                  Average
                </Badge>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {formatCurrency(analytics?.averageIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Per deposit metric</div>
            </Card>

            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#615d59]">
                  Income Streams
                </span>
                <div className="p-2 rounded-lg bg-[#f5f3ff] text-[#7c3aed]">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-[#171717] dark:text-[#f7f7f7]">
                {analytics?.incomeByItem?.length || 0}
              </div>
              <div className="mt-2 text-xs text-[#615d59]">Unique income sources</div>
            </Card>
          </div>
        )}

        {/* Charts & Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Income Distribution by Category</CardTitle>
              <CardDescription>Earnings split by category type</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <ChartSkeleton />
              ) : (
                <CategoryPieChart data={analytics?.incomeByCategory || []} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Income Sources</CardTitle>
              <CardDescription>Individual clients and salary payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.incomeByItem?.length > 0 ? (
                analytics.incomeByItem.map((src: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[#ecfdf5] text-[#059669]">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-[#171717] dark:text-[#f7f7f7]">
                        {src.item}
                      </div>
                    </div>
                    <div className="font-extrabold text-sm text-[#059669]">
                      +{formatCurrency(src.amount)}
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
