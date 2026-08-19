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
};

const TYPE_STYLES: Record<string, { bg: string; border: string; icon: string; badge: string; badgeText: string }> = {
  warning: {
    bg: "bg-warning-brand-bg",
    border: "border-warning-brand/30",
    icon: "text-warning-brand",
    badge: "bg-warning-brand-bg",
    badgeText: "text-warning-brand",
  },
  positive: {
    bg: "bg-income-bg",
    border: "border-income/30",
    icon: "text-income",
    badge: "bg-income-bg",
    badgeText: "text-income",
  },
  neutral: {
    bg: "bg-canvas",
    border: "border-hairline",
    icon: "text-ink-muted",
    badge: "bg-hairline/60",
    badgeText: "text-ink-muted",
  },
  info: {
    bg: "bg-sky-brand-bg",
    border: "border-sky-brand/30",
    icon: "text-sky-brand",
    badge: "bg-sky-brand-bg",
    badgeText: "text-sky-brand",
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
