"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

export interface DayOfWeekData {
  dayIndex: number;
  day: string;
  amount: number;
  count: number;
}

export const DayOfWeekChart = React.memo(function DayOfWeekChart({
  data,
  currency = "USD",
}: {
  data: DayOfWeekData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 flex items-center justify-center text-xs font-semibold text-ink-muted">
        No weekly distribution records available.
      </div>
    );
  }

  // Sort Monday through Sunday
  const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const sortedData = [...data].sort((a, b) => dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day));

  const maxAmount = Math.max(...sortedData.map((d) => d.amount), 1);

  return (
    <div className="w-full h-60 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sortedData}
          margin={{ top: 10, right: 10, left: -6, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" opacity={0.6} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
          />
          <Tooltip
            wrapperStyle={{ zIndex: 50 }}
            contentStyle={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--hairline)",
              borderRadius: "14px",
              fontSize: "12px",
              color: "var(--ink)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "8px 12px",
            }}
            formatter={(value: any, name: any, item: any) => [
              `${formatCurrency(Number(value) || 0, currency)} (${item.payload?.count || 0} transactions)`,
              "Spending",
            ]}
          />
          <Bar dataKey="amount" maxBarSize={38} radius={[6, 6, 0, 0]}>
            {sortedData.map((entry, index) => {
              const isPeak = entry.amount === maxAmount;
              return (
                <Cell
                  key={`day-cell-${index}`}
                  fill={isPeak ? "var(--expense)" : "var(--primary)"}
                  fillOpacity={isPeak ? 0.95 : 0.65}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
