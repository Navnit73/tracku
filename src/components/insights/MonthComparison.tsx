"use client";

import React from "react";
import { cn, formatCurrency } from "@/lib/utils";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import type { MonthComparison as MonthComparisonType, MonthComparisonCategory } from "@/app/actions/insights";

function ComparisonBar({
  category,
  currency,
  maxGlobalAmount,
}: {
  category: MonthComparisonCategory;
  currency?: string;
  maxGlobalAmount: number;
}) {
  const currentWidth = maxGlobalAmount > 0 ? (category.currentAmount / maxGlobalAmount) * 100 : 0;
  const previousWidth = maxGlobalAmount > 0 ? (category.previousAmount / maxGlobalAmount) * 100 : 0;
  const isNew = category.previousAmount === 0 && category.currentAmount > 0;

  return (
    <div className="p-3 rounded-xl bg-canvas/70 border border-hairline/80 hover:border-hairline transition-all">
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-ink truncate">
            {category.category}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs sm:text-sm font-black text-ink">
            {formatCurrency(category.currentAmount, currency)}
          </span>
          {isNew ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-brand-bg text-sky-brand border border-sky-brand-border shrink-0">
              New
            </span>
          ) : category.delta !== 0 ? (
            <span
              className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 inline-flex items-center gap-0.5",
                category.delta > 0
                  ? "bg-expense-bg text-expense border-expense-border"
                  : "bg-income-bg text-income border-income-border"
              )}
            >
              <span>{category.delta > 0 ? "↑" : "↓"}</span>
              <span>{Math.abs(category.delta)}%</span>
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-hairline shrink-0">
              Equal
            </span>
          )}
        </div>
      </div>

      {/* Relative visual bar track */}
      <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-hairline/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
          style={{ width: `${Math.max(4, currentWidth)}%` }}
        />
      </div>

      {/* Previous period comparison reference when previous data exists */}
      {category.previousAmount > 0 && (
        <div className="flex items-center justify-between mt-1 text-[10px] text-ink-faint">
          <span>Previous: {formatCurrency(category.previousAmount, currency)}</span>
          <span>{previousWidth.toFixed(0)}% baseline</span>
        </div>
      )}
    </div>
  );
}

export function MonthComparisonChart({
  comparison,
  currency: propCurrency,
}: {
  comparison: MonthComparisonType;
  currency?: string;
}) {
  const { currency: globalCurrency } = useCurrency();
  const currency = propCurrency || globalCurrency;

  const maxGlobalAmount = Math.max(
    ...comparison.categories.map((c) => Math.max(c.currentAmount || 0, c.previousAmount || 0)),
    1
  );

  return (
    <div className="space-y-4">
      {/* Period labels */}
      <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-ink font-semibold">
              Current ({comparison.currentPeriodLabel})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-ink-faint/50" />
            <span className="text-ink-muted">
              Previous ({comparison.previousPeriodLabel})
            </span>
          </div>
        </div>

        <span className="text-[11px] text-ink-muted font-medium">
          {comparison.categories.length} spending categories
        </span>
      </div>

      {/* Top-level summary metric tiles */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        <div className="p-3 sm:p-3.5 rounded-xl bg-income-bg border border-income-border flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold text-income tracking-wider">Income</div>
          <div className="text-sm sm:text-base font-black text-income mt-0.5 truncate">
            {formatCurrency(comparison.currentIncome, currency)}
          </div>
          <div className="mt-1">
            {comparison.previousIncome === 0 ? (
              <span className="text-[10px] font-bold text-income">1st Cycle</span>
            ) : comparison.incomeDelta !== 0 ? (
              <span className={cn("text-[10px] font-bold inline-flex items-center gap-0.5", comparison.incomeDelta > 0 ? "text-income" : "text-expense")}>
                <span>{comparison.incomeDelta > 0 ? "↑" : "↓"}</span>
                <span>{Math.abs(comparison.incomeDelta)}% MoM</span>
              </span>
            ) : (
              <span className="text-[10px] text-ink-muted">0% shift</span>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-expense-bg border border-expense-border flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold text-expense tracking-wider">Expenses</div>
          <div className="text-sm sm:text-base font-black text-expense mt-0.5 truncate">
            {formatCurrency(comparison.currentExpenses, currency)}
          </div>
          <div className="mt-1">
            {comparison.previousExpenses === 0 ? (
              <span className="text-[10px] font-bold text-expense">1st Cycle</span>
            ) : comparison.expensesDelta !== 0 ? (
              <span className={cn("text-[10px] font-bold inline-flex items-center gap-0.5", comparison.expensesDelta > 0 ? "text-expense" : "text-income")}>
                <span>{comparison.expensesDelta > 0 ? "↑" : "↓"}</span>
                <span>{Math.abs(comparison.expensesDelta)}% MoM</span>
              </span>
            ) : (
              <span className="text-[10px] text-ink-muted">0% shift</span>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-3.5 rounded-xl bg-investment-bg border border-investment-border flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold text-investment tracking-wider">Invested</div>
          <div className="text-sm sm:text-base font-black text-investment mt-0.5 truncate">
            {formatCurrency(comparison.currentInvestments, currency)}
          </div>
          <div className="mt-1">
            {comparison.previousInvestments === 0 ? (
              <span className="text-[10px] font-bold text-investment">1st Cycle</span>
            ) : comparison.investmentsDelta !== 0 ? (
              <span className={cn("text-[10px] font-bold inline-flex items-center gap-0.5", comparison.investmentsDelta > 0 ? "text-income" : "text-expense")}>
                <span>{comparison.investmentsDelta > 0 ? "↑" : "↓"}</span>
                <span>{Math.abs(comparison.investmentsDelta)}% MoM</span>
              </span>
            ) : (
              <span className="text-[10px] text-ink-muted">0% shift</span>
            )}
          </div>
        </div>
      </div>

      {/* Category breakdown rows with accurate relative scaling */}
      <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
        {comparison.categories.map((cat) => (
          <ComparisonBar
            key={cat.category}
            category={cat}
            currency={currency}
            maxGlobalAmount={maxGlobalAmount}
          />
        ))}
      </div>
    </div>
  );
}
