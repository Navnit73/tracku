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

export interface IncomeExpenseData {
  date: string;
  income: number;
  expense: number;
  investment: number;
}

export function IncomeExpenseChart({ data }: { data: IncomeExpenseData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[#615d59] dark:text-[#9b9b9b]">
        No trend data available for selected filter period.
      </div>
    );
  }

  const formattedData = data.map((d) => ({
    ...d,
    displayDate: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#059669" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="investmentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" opacity={0.5} />
          <XAxis
            dataKey="displayDate"
            tick={{ fontSize: 11, fill: "#615d59" }}
            axisLine={{ stroke: "#e6e6e6" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#615d59" }}
            axisLine={{ stroke: "#e6e6e6" }}
            tickFormatter={(val) => `$${val}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e6e6e6",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, ""]}
          />
          <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
          <Area
            type="monotone"
            dataKey="income"
            name="Income"
            stroke="#059669"
            fillOpacity={1}
            fill="url(#incomeGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            name="Expenses"
            stroke="#e11d48"
            fillOpacity={1}
            fill="url(#expenseGrad)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="investment"
            name="Investments"
            stroke="#7c3aed"
            fillOpacity={1}
            fill="url(#investmentGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
