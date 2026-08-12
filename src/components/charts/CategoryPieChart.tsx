"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface CategoryData {
  name: string;
  amount: number;
}

const COLORS = [
  "var(--primary)",
  "var(--expense)",
  "var(--income)",
  "var(--investment)",
  "var(--warning)",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#8b5cf6",
  "var(--ink-muted)",
];

export function CategoryPieChart({
  data,
  currency = "USD",
}: {
  data: CategoryData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-ink-muted">
        No category data available for selected filter period.
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={4}
            dataKey="amount"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--surface)",
              borderColor: "var(--hairline)",
              borderRadius: "8px",
              fontSize: "12px",
              color: "var(--ink)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), "Amount"]}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
