"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { formatCurrency, formatCompactCurrency } from "@/lib/utils";

export interface IncomeExpenseData {
  date: string;
  income: number;
  expense: number;
  investment: number;
}

export const IncomeExpenseChart = React.memo(function IncomeExpenseChart({
  data,
  currency = "USD",
}: {
  data: IncomeExpenseData[];
  currency?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <div className="h-60 sm:h-72 flex items-center justify-center text-xs font-semibold text-ink-muted">
        No trend data available for selected filter period.
      </div>
    );
  }

  const formattedData = data.map((d) => {
    const dateObj = d.date.includes("T") ? new Date(d.date) : new Date(d.date + "T12:00:00");
    return {
      ...d,
      displayDate: dateObj.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });

  const uniqueId = React.useId().replace(/:/g, "");
  const incomeGradId = `incomeGrad-${uniqueId}`;
  const expenseGradId = `expenseGrad-${uniqueId}`;
  const investmentGradId = `investmentGrad-${uniqueId}`;

  return (
    <div className="w-full h-60 sm:h-72 lg:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -6, bottom: 0 }}>
          <defs>
            <linearGradient id={incomeGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--income)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={expenseGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={investmentGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--investment)" stopOpacity={0.35} />
              <stop offset="95%" stopColor="var(--investment)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" opacity={0.6} />
          <XAxis
            dataKey="displayDate"
            minTickGap={22}
            tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
            axisLine={{ stroke: "var(--hairline)" }}
            tickLine={false}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 10, fill: "var(--ink-muted)" }}
            axisLine={{ stroke: "var(--hairline)" }}
            tickLine={false}
            tickFormatter={(val) => formatCompactCurrency(val, currency)}
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
            formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), ""]}
          />
          <Legend
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
            iconSize={8}
          />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="var(--income)"
            fillOpacity={1}
            fill={`url(#${incomeGradId})`}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expenses"
            stroke="var(--expense)"
            fillOpacity={1}
            fill={`url(#${expenseGradId})`}
            strokeWidth={2.5}
          />
          <Area
            type="monotone"
            dataKey="investment"
            name="Investments"
            stroke="var(--investment)"
            fillOpacity={1}
            fill={`url(#${investmentGradId})`}
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

