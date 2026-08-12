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
    <AppShell
      title="Income Analytics"
      onOpenNewTransaction={() => setIsModalOpen(true)}
    >
      <div className="flex flex-col gap-4 sm:gap-6">
        {/* Control Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight">
              Income Streams & Earnings
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Salary, freelance contracts, dividends, and consulting payouts
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
              Add Income
            </Button>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Total Inflow
                </span>
                <div className="p-2 rounded-lg bg-income-bg text-income">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-income">
                {formatCurrency(analytics?.totalIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-ink-muted">
                {analytics?.transactionCount || 0} Income deposits logged
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Top Income Source
                </span>
                <div className="p-2 rounded-lg bg-sky-brand-bg text-primary">
                  <Banknote className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink">
                {formatCurrency(analytics?.highestIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-ink-muted truncate">
                Source: <strong>{analytics?.highestIncomeSource || "N/A"}</strong>
              </div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Average Deposit
                </span>
                <Badge variant="income" size="sm">
                  Average
                </Badge>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink">
                {formatCurrency(analytics?.averageIncome || 0)}
              </div>
              <div className="mt-2 text-xs text-ink-muted">Per deposit metric</div>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">
                  Income Streams
                </span>
                <div className="p-2 rounded-lg bg-investment-bg text-investment">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-ink">
                {analytics?.incomeByItem?.length || 0}
              </div>
              <div className="mt-2 text-xs text-ink-muted">Unique income sources</div>
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
                <CategoryPieChart data={analytics?.incomeByCategory || []} />
              )}
            </CardContent>
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeader>
              <CardTitle>Top Income Sources</CardTitle>
              <CardDescription>Individual clients and salary payments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics?.incomeByItem?.length > 0 ? (
                analytics.incomeByItem.map((src: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <div className="p-2 rounded-lg bg-income-bg text-income">
                        <Banknote className="w-4 h-4" />
                      </div>
                      <div className="font-bold text-sm text-ink">
                        {src.item}
                      </div>
                    </div>
                    <div className="font-extrabold text-sm text-income">
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
