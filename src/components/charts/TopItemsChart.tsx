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

export function TopItemsChart({
  data,
  currency = "USD",
}: {
  data: TopItemData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-ink-muted">
        No item spend data available.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" opacity={0.5} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
            tickFormatter={(v) => formatCurrency(v, currency)}
          />
          <YAxis
            type="category"
            dataKey="item"
            tick={{ fontSize: 11, fill: "var(--ink-muted)" }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--hairline)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--ink)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), "Total Spend"]}
          />
          <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`bar-${index}`} fill={index === 0 ? "var(--expense)" : "var(--primary)"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
