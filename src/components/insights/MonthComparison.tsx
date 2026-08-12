"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { MonthComparison as MonthComparisonType, MonthComparisonCategory } from "@/app/actions/insights";

function ComparisonBar({ category }: { category: MonthComparisonCategory }) {
  const maxAmount = Math.max(category.currentAmount, category.previousAmount, 1);
  const currentWidth = (category.currentAmount / maxAmount) * 100;
  const previousWidth = (category.previousAmount / maxAmount) * 100;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink truncate">
          {category.category}
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-ink">
            {category.currentAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </span>
          {category.delta !== 0 && (
            <span
              className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                category.delta > 0
                  ? "bg-expense-bg text-expense border border-expense/20"
                  : "bg-income-bg text-income border border-income/20"
              )}
            >
              {category.delta > 0 ? "↑" : "↓"} {Math.abs(category.delta)}%
            </span>
          )}
        </div>
      </div>

      {/* Current period bar */}
      <div className="w-full h-2.5 bg-canvas rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${currentWidth}%` }}
        />
      </div>

      {/* Previous period bar (dimmed) */}
      <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-ink-faint/40 transition-all duration-500 ease-out"
          style={{ width: `${previousWidth}%` }}
        />
      </div>
    </div>
  );
}

export function MonthComparisonChart({ comparison }: { comparison: MonthComparisonType }) {
  return (
    <div className="space-y-5">
      {/* Period labels */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2.5 rounded-sm bg-primary" />
          <span className="text-ink font-semibold">
            {comparison.currentPeriodLabel}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-sm bg-ink-faint/40" />
          <span className="text-ink-muted">
            {comparison.previousPeriodLabel}
          </span>
        </div>
      </div>

      {/* Top-level summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-income-bg border border-income/20">
          <div className="text-[10px] uppercase font-bold text-income tracking-wider">Income</div>
          <div className="text-base font-extrabold text-income mt-0.5">
            {comparison.currentIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          {comparison.incomeDelta !== 0 && (
            <div className={cn("text-[10px] font-bold mt-0.5", comparison.incomeDelta > 0 ? "text-income" : "text-expense")}>
              {comparison.incomeDelta > 0 ? "↑" : "↓"} {Math.abs(comparison.incomeDelta)}%
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-expense-bg border border-expense/20">
          <div className="text-[10px] uppercase font-bold text-expense tracking-wider">Expenses</div>
          <div className="text-base font-extrabold text-expense mt-0.5">
            {comparison.currentExpenses.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          {comparison.expensesDelta !== 0 && (
            <div className={cn("text-[10px] font-bold mt-0.5", comparison.expensesDelta > 0 ? "text-expense" : "text-income")}>
              {comparison.expensesDelta > 0 ? "↑" : "↓"} {Math.abs(comparison.expensesDelta)}%
            </div>
          )}
        </div>
        <div className="p-3 rounded-xl bg-investment-bg border border-investment/20">
          <div className="text-[10px] uppercase font-bold text-investment tracking-wider">Investments</div>
          <div className="text-base font-extrabold text-investment mt-0.5">
            {comparison.currentInvestments.toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </div>
          {comparison.investmentsDelta !== 0 && (
            <div className={cn("text-[10px] font-bold mt-0.5", comparison.investmentsDelta > 0 ? "text-income" : "text-expense")}>
              {comparison.investmentsDelta > 0 ? "↑" : "↓"} {Math.abs(comparison.investmentsDelta)}%
            </div>
          )}
        </div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-4">
        {comparison.categories.slice(0, 8).map((cat) => (
          <ComparisonBar key={cat.category} category={cat} />
        ))}
      </div>
    </div>
  );
}
