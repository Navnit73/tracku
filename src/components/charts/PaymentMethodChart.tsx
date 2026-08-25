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

export interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  percentage?: number;
}

const METHOD_COLORS = [
  "var(--primary)",
  "var(--expense)",
  "var(--warning)",
  "var(--investment)",
  "#06B6D4", // Cyan
  "#EC4899", // Pink
  "#8B5CF6", // Purple
];

export const PaymentMethodChart = React.memo(function PaymentMethodChart({
  data,
  currency = "USD",
}: {
  data: PaymentMethodData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 flex items-center justify-center text-xs font-semibold text-ink-muted">
        No payment method records available.
      </div>
    );
  }

  return (
    <div className="w-full h-60 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" opacity={0.6} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
            tickFormatter={(v) => formatCompactCurrency(v, currency)}
          />
          <YAxis
            type="category"
            dataKey="method"
            tick={{ fontSize: 10, fill: "var(--ink)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--hairline)" }}
            width={78}
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
              `${formatCurrency(Number(value) || 0, currency)} (${item.payload?.percentage || 0}%)`,
              "Volume",
            ]}
          />
          <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
            {data.map((_, index) => (
              <Cell
                key={`pm-cell-${index}`}
                fill={METHOD_COLORS[index % METHOD_COLORS.length]}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});
