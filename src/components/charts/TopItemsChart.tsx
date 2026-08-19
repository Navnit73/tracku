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
import { formatCurrency } from "@/lib/utils";

export interface TopItemData {
  item: string;
  totalAmount: number;
}

export const TopItemsChart = React.memo(function TopItemsChart({
  data,
  currency = "USD",
}: {
  data: TopItemData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 flex items-center justify-center text-xs font-semibold text-ink-muted">
        No item spend data available.
      </div>
    );
  }

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 15, left: 10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" opacity={0.6} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
            tickFormatter={(v) => formatCurrency(v, currency)}
          />
          <YAxis
            type="category"
            dataKey="item"
            tick={{ fontSize: 11, fill: "var(--ink)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
            width={90}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--hairline)",
              borderRadius: "14px",
              fontSize: "12px",
              color: "var(--ink)",
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
              padding: "10px 14px",
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), "Total Spend"]}
          />
          <Bar dataKey="totalAmount" radius={[0, 6, 6, 0]}>
            {data.map((_, index) => {
              // Descending opacity of expense color so rank #1 is brightest red and #2-#5 are subtle expense tones
              const opacities = [1, 0.85, 0.7, 0.55, 0.4];
              const opacity = opacities[index] || 0.4;
              return (
                <Cell
                  key={`bar-${index}`}
                  fill="var(--expense)"
                  fillOpacity={opacity}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

