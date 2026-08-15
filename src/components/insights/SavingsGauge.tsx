"use client";

import React from "react";
import type { SavingsAnalysis } from "@/app/actions/insights";
import { formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";

export function SavingsGauge({
  analysis,
  currency: propCurrency,
}: {
  analysis: SavingsAnalysis;
  currency?: string;
}) {
  const { currency: globalCurrency } = useCurrency();
  const currency = propCurrency || globalCurrency;
  const { savingsRate, totalIncome, totalExpenses, dailyBurnRate, projectedMonthEndTotal, daysElapsed, daysInMonth, trend, previousSavingsRate, currentSavings, projectedMonthlySavings } = analysis;

  // Gauge configuration
  const size = 160;
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
  const trendColor = trend === "improving" ? "text-income" : trend === "declining" ? "text-expense" : "text-ink-muted";
  const trendLabel = trend === "improving" ? "Improving" : trend === "declining" ? "Declining" : "Stable";

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Gauge */}
      <div className="relative">
        <svg width={size} height={size / 2 + strokeWidth} viewBox={`0 0 ${size} ${size / 2 + strokeWidth}`}>
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
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-3xl font-black tracking-tight" style={{ color: gaugeColor }}>
            {Math.round(savingsRate)}%
          </span>
          <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
            Savings Rate
          </span>
        </div>
      </div>

      {/* Trend badge */}
      <div className={`flex items-center gap-1.5 text-xs font-bold ${trendColor}`}>
        <span className="text-base">{trendIcon}</span>
        <span>{trendLabel}</span>
        <span className="text-ink-faint font-normal">
          (prev: {previousSavingsRate}%)
        </span>
      </div>

      {/* Stats grid */}
      <div className="w-full grid grid-cols-2 gap-2.5">
        <div className="p-2.5 rounded-lg bg-canvas border border-hairline">
          <div className="text-[10px] uppercase font-bold text-ink-faint tracking-wider">
            Saved So Far
          </div>
          <div className="text-sm font-extrabold text-income mt-0.5">
            {formatCurrency(currentSavings, currency)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-canvas border border-hairline">
          <div className="text-[10px] uppercase font-bold text-ink-faint tracking-wider">
            Daily Burn
          </div>
          <div className="text-sm font-extrabold text-expense mt-0.5">
            {formatCurrency(dailyBurnRate, currency)}/day
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-canvas border border-hairline">
          <div className="text-[10px] uppercase font-bold text-ink-faint tracking-wider">
            Projected Expenses
          </div>
          <div className="text-sm font-extrabold text-ink mt-0.5">
            {formatCurrency(projectedMonthEndTotal, currency)}
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-canvas border border-hairline">
          <div className="text-[10px] uppercase font-bold text-ink-faint tracking-wider">
            Projected Savings
          </div>
          <div className={`text-sm font-extrabold mt-0.5 ${projectedMonthlySavings >= 0 ? "text-income" : "text-expense"}`}>
            {formatCurrency(projectedMonthlySavings, currency)}
          </div>
        </div>
      </div>

      {/* Progress bar for month */}
      <div className="w-full">
        <div className="flex justify-between text-[10px] text-ink-faint mb-1">
          <span>Day {daysElapsed}</span>
          <span>{daysInMonth} days</span>
        </div>
        <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(daysElapsed / daysInMonth) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
