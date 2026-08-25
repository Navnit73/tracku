"use client";

import React from "react";
import type { HealthScore as HealthScoreType } from "@/app/actions/insights";

export function HealthScoreRing({ healthScore }: { healthScore: HealthScoreType }) {
  const { score, grade, breakdown } = healthScore;

  // SVG ring configuration
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  const ringColor =
    score >= 80
      ? "var(--income)"
      : score >= 60
      ? "var(--sky-brand)"
      : score >= 40
      ? "var(--warning)"
      : "var(--expense)";

  const gradeBadgeClass =
    score >= 80
      ? "bg-income-bg text-income border-income-border"
      : score >= 60
      ? "bg-sky-brand-bg text-sky-brand border-sky-brand-border"
      : score >= 40
      ? "bg-warning-brand-bg text-warning-brand border-warning-brand-border"
      : "bg-expense-bg text-expense border-expense-border";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Score Ring */}
      <div className="relative my-2">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="none"
            className="text-hairline"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={ringColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-4xl font-black tracking-tight"
            style={{ color: ringColor }}
          >
            {score}
          </span>
          <span className={`mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${gradeBadgeClass}`}>
            {grade}
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="w-full space-y-3">
        {Object.entries(breakdown).map(([key, item]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-ink-faint">
                  ({item.weight}%)
                </span>
                <span className="font-bold text-ink">
                  {item.score}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-canvas border border-hairline rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: item.score >= 70 ? "var(--income)" : item.score >= 40 ? "var(--warning)" : "var(--expense)",
                }}
              />
            </div>
            <p className="text-[10px] text-ink-faint leading-tight">{item.detail}</p>
          </div>
        ))}
      </div>

      {/* Score Improvement Guidance */}
      <div className="w-full p-3 rounded-2xl bg-canvas border border-hairline text-xs text-ink-muted flex items-start gap-2">
        <span className="font-bold text-ink">💡 Goal:</span>
        <span className="text-[11px] leading-relaxed">
          {score >= 80
            ? "Excellent! You are maintaining strong savings and healthy investment ratios."
            : score >= 60
            ? "Good footing. Increase your savings rate to 20%+ and trim recurring costs to reach Grade A."
            : "Focus on curbing discretionary expenses and building at least 1-month of savings buffer."}
        </span>
      </div>
    </div>
  );
}
