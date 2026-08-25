"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";

export interface CategoryData {
  name: string;
  amount: number;
}

const COLORS = [
  "#00874C",
  "#e11d48",
  "#0075de",
  "#7c3aed",
  "#d97706",
  "#ec4899",
  "#ea580c",
  "#06b6d4",
  "#8b5cf6",
  "#64748b",
];

export const CategoryPieChart = React.memo(function CategoryPieChart({
  data,
  currency = "USD",
}: {
  data: CategoryData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 flex items-center justify-center text-xs font-semibold text-ink-muted">
        No category data available for selected filter period.
      </div>
    );
  }

  const totalSum = React.useMemo(() => {
    return data.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [data]);

  return (
    <div className="w-full h-60 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Pie
            data={data}
            cx="50%"
            cy="44%"
            innerRadius="50%"
            outerRadius="75%"
            paddingAngle={3}
            dataKey="amount"
            nameKey="name"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
            formatter={(value: any, name: any, item: any) => {
              const val = Number(value) || 0;
              const pct = totalSum > 0 ? Math.round((val / totalSum) * 100) : 0;
              return [`${formatCurrency(val, currency)} (${pct}%)`, String(name)];
            }}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            iconSize={8}
            wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
});

