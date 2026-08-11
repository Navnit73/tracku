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

export interface TopItemData {
  item: string;
  totalAmount: number;
}

export function TopItemsChart({ data }: { data: TopItemData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-[#615d59] dark:text-[#9b9b9b]">
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
          <CartesianGrid strokeDasharray="3 3" stroke="#e6e6e6" opacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "#615d59" }} tickFormatter={(v) => `$${v}`} />
          <YAxis
            type="category"
            dataKey="item"
            tick={{ fontSize: 11, fill: "#615d59" }}
            width={120}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#ffffff",
              borderColor: "#e6e6e6",
              borderRadius: "8px",
              fontSize: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Total Spend"]}
          />
          <Bar dataKey="totalAmount" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`bar-${index}`} fill={index === 0 ? "#e11d48" : "#0075de"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
