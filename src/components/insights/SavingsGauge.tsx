"use client";

import React from "react";
import type { SavingsAnalysis } from "@/app/actions/insights";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import { PiggyBank, Flame, Calendar, TrendingUp, TrendingDown } from "lucide-react";

export function SavingsGauge({
  analysis,
  currency: propCurrency,
}: {
  analysis: SavingsAnalysis;
  currency?: string;
}) {
  const { currency: globalCurrency } = useCurrency();
  const currency = propCurrency || globalCurrency;
  const {
    savingsRate,
    dailyBurnRate,
    projectedMonthEndTotal,
    daysElapsed,
    daysInMonth,
    trend,
    previousSavingsRate,
    currentSavings,
    projectedMonthlySavings,
  } = analysis;

  // Enhanced Gauge configuration
  const size = 190;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Half circle
  const clampedRate = Math.max(-20, Math.min(100, savingsRate));
  const normalizedRate = (clampedRate + 20) / 120; // Normalize to 0–1 range (−20 to 100)
  const progress = normalizedRate * circumference;

  // Color based on rate
  let gaugeColor = "var(--expense)";
  if (savingsRate >= 30) gaugeColor = "var(--income)";
  else if (savingsRate >= 20) gaugeColor = "var(--primary)";
  else if (savingsRate >= 10) gaugeColor = "var(--warning)";
  else if (savingsRate >= 0) gaugeColor = "var(--warning)";

  const trendIcon = trend === "improving" ? "↗" : trend === "declining" ? "↘" : "→";
  const trendBadgeClass =
    trend === "improving"
      ? "bg-income-bg text-income border-income-border"
      : trend === "declining"
      ? "bg-expense-bg text-expense border-expense-border"
      : "bg-surface text-ink-muted border-hairline";
  const trendLabel = trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable";

  return (
    <div className="flex flex-col justify-between h-full space-y-4">
      {/* Gauge Hero Card */}
      <div className="p-4 rounded-2xl bg-canvas/60 border border-hairline flex flex-col items-center justify-center relative">
        <div className="relative my-1">
          <svg width={size} height={size / 2 + strokeWidth + 4} viewBox={`0 0 ${size} ${size / 2 + strokeWidth + 4}`}>
            {/* Background arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              className="text-hairline"
            />
            {/* Progress arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              stroke={gaugeColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              className="transition-all duration-1000 ease-out"
            />
          </svg>

          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
            <span className="text-4xl font-black tracking-tight" style={{ color: gaugeColor }}>
              {Math.round(savingsRate)}%
            </span>
            <span className="text-[10px] font-bold uppercase text-ink-muted tracking-wider mt-0.5">
              Net Savings Rate
            </span>
          </div>
        </div>

        {/* Trend badge */}
        <div className={`mt-2 px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${trendBadgeClass}`}>
          <span>{trendIcon}</span>
          <span>{trendLabel}</span>
          <span className="text-[10px] opacity-75 font-normal">
            (prev: {previousSavingsRate}%)
          </span>
        </div>
      </div>

      {/* 4 KPI summary cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="p-3 rounded-xl bg-canvas/70 border border-hairline flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider flex items-center gap-1">
            <PiggyBank className="w-3 h-3 text-income" /> Saved So Far
          </span>
          <div className="text-sm sm:text-base font-black text-income mt-1 truncate">
            {formatCurrency(currentSavings, currency)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-canvas/70 border border-hairline flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider flex items-center gap-1">
            <Flame className="w-3 h-3 text-expense" /> Daily Burn
          </span>
          <div className="text-sm sm:text-base font-black text-expense mt-1 truncate">
            {formatCurrency(dailyBurnRate, currency)}/day
          </div>
        </div>

        <div className="p-3 rounded-xl bg-canvas/70 border border-hairline flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-primary" /> Projected Outlays
          </span>
          <div className="text-sm sm:text-base font-black text-ink mt-1 truncate">
            {formatCurrency(projectedMonthEndTotal, currency)}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-canvas/70 border border-hairline flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-ink-muted tracking-wider flex items-center gap-1">
            {projectedMonthlySavings >= 0 ? (
              <TrendingUp className="w-3 h-3 text-income" />
            ) : (
              <TrendingDown className="w-3 h-3 text-expense" />
            )}
            Projected Net
          </span>
          <div className={`text-sm sm:text-base font-black mt-1 truncate ${projectedMonthlySavings >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(projectedMonthlySavings, currency)}
          </div>
        </div>
      </div>

      {/* Progress bar for month */}
      <div className="w-full pt-1">
        <div className="flex justify-between text-[10px] text-ink-muted mb-1 font-medium">
          <span>Month Cycle (Day {daysElapsed})</span>
          <span>{daysInMonth} days total ({Math.round((daysElapsed / daysInMonth) * 100)}%)</span>
        </div>
        <div className="w-full h-1.5 bg-canvas border border-hairline rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${Math.min(100, (daysElapsed / daysInMonth) * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
