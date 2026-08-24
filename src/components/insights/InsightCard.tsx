"use client";

import React from "react";
import {
  PieChart,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  LineChart,
  Info,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { InsightItem } from "@/app/actions/insights";

const ICON_MAP: Record<string, React.ElementType> = {
  PieChart,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  LineChart,
  Info,
  Bot,
};

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; badge: string; badgeText: string }> = {
  warning: {
    bg: "bg-warning-brand-bg/60",
    border: "border-warning-brand-border",
    icon: "text-warning-brand",
    badge: "bg-warning-brand-bg text-warning-brand border border-warning-brand-border",
    badgeText: "text-warning-brand",
  },
  positive: {
    bg: "bg-income-bg/60",
    border: "border-income-border",
    icon: "text-income",
    badge: "bg-income-bg text-income border border-income-border",
    badgeText: "text-income",
  },
  neutral: {
    bg: "bg-canvas",
    border: "border-hairline",
    icon: "text-ink-muted",
    badge: "bg-surface text-ink-muted border border-hairline",
    badgeText: "text-ink-muted",
  },
  info: {
    bg: "bg-sky-brand-bg/60",
    border: "border-sky-brand-border",
    icon: "text-sky-brand",
    badge: "bg-sky-brand-bg text-sky-brand border border-sky-brand-border",
    badgeText: "text-sky-brand",
  },
  ai: {
    bg: "bg-investment-bg/60",
    border: "border-investment-border",
    icon: "text-investment",
    badge: "bg-investment-bg text-investment border border-investment-border",
    badgeText: "text-investment",
  },
};

export function InsightCard({ insight, index = 0 }: { insight: InsightItem; index?: number }) {
  const style = TYPE_STYLES[insight.type] || TYPE_STYLES.neutral;
  const IconComponent = ICON_MAP[insight.icon] || Info;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-300 hover:",
        style.bg,
        style.border
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn("p-2 rounded-lg shrink-0", style.badge)}>
          <IconComponent className={cn("w-4 h-4", style.icon)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-bold text-ink truncate">
              {insight.headline}
            </h4>
            {insight.delta !== undefined && insight.delta !== 0 && (
              <span
                className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                  insight.type === "positive"
                    ? insight.delta > 0
                      ? "bg-income-bg text-income border border-income/20"
                      : "bg-expense-bg text-expense border border-expense/20"
                    : insight.type === "warning"
                    ? insight.delta > 0
                      ? "bg-expense-bg text-expense border border-expense/20"
                      : "bg-income-bg text-income border border-income/20"
                    : "bg-canvas text-ink-secondary border border-hairline"
                )}
              >
                {insight.delta > 0 ? "↑" : "↓"} {Math.abs(insight.delta)}%
              </span>
            )}
          </div>
          <p className="text-xs text-ink-muted leading-relaxed">
            {insight.description}
          </p>
        </div>
      </div>
    </div>
  );
}
