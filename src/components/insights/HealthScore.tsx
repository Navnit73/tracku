"use client";

import React from "react";
import type { HealthScore as HealthScoreType } from "@/app/actions/insights";

export function HealthScoreRing({ healthScore }: { healthScore: HealthScoreType }) {
  const { score, grade, color, breakdown } = healthScore;

  // SVG ring configuration
  const size = 180;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Score Ring */}
      <div className="relative">
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
            stroke={color}
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
            style={{ color }}
          >
            {score}
          </span>
          <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">
            {grade}
          </span>
        </div>
      </div>

      {/* Breakdown bars */}
      <div className="w-full space-y-2.5">
        {Object.entries(breakdown).map(([key, item]) => (
          <div key={key} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-muted capitalize">
                {key.replace(/([A-Z])/g, " $1").trim()}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-ink-faint">
                  {item.weight}%
                </span>
                <span className="font-bold text-ink">
                  {item.score}
                </span>
              </div>
            </div>
            <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${item.score}%`,
                  backgroundColor: item.score >= 70 ? "var(--income)" : item.score >= 40 ? "var(--warning)" : "var(--expense)",
                }}
              />
            </div>
            <p className="text-[10px] text-ink-faint">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
