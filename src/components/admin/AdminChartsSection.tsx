"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";
import type { AdminOverviewStats } from "@/app/actions/admin";

interface AdminChartsSectionProps {
  stats: AdminOverviewStats;
}

export function AdminChartsSection({ stats }: AdminChartsSectionProps) {
  const { growthTimeline, planDistribution } = stats;

  const totalPlanUsers = planDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Growth & Activity Area Chart (2 cols on large) */}
      <Card className="p-4 sm:p-6 lg:col-span-2 border-hairline bg-surface shadow-xs flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-ink">Platform Activity (Last 30 Days)</h3>
              <p className="text-xs text-ink-muted">
                Daily user signups vs transaction creation volume
              </p>
            </div>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="txGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={(val) => {
                  if (!val || typeof val !== "string") return "";
                  const parts = val.split("-");
                  return parts.length >= 3 ? `${parts[1]}/${parts[2]}` : val;
                }}
                stroke="var(--ink-muted)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="var(--ink-muted)" fontSize={11} tickLine={false} allowDecimals={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-surface p-3 rounded-xl border border-hairline shadow-lg text-xs space-y-1">
                        <p className="font-bold text-ink mb-1">{label}</p>
                        <p className="text-sky font-semibold">
                          Transactions: {payload[0]?.value || 0}
                        </p>
                        <p className="text-primary font-semibold">
                          New Signups: {payload[1]?.value || 0}
                        </p>
                        <p className="text-investment font-semibold">
                          AI Requests: {payload[2]?.value || 0}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }}
              />
              <Area
                type="monotone"
                dataKey="transactions"
                name="Transactions"
                stroke="#0284c7"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#txGradient)"
              />
              <Area
                type="monotone"
                dataKey="signups"
                name="User Signups"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#signupGradient)"
              />
              <Area
                type="monotone"
                dataKey="aiRequests"
                name="AI Requests"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 2. Subscription Breakdown Donut Pie (1 col on large) */}
      <Card className="p-4 sm:p-6 border-hairline bg-surface shadow-xs flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-lg bg-income/10 flex items-center justify-center text-income">
            <PieIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-ink">Plan Distribution</h3>
            <p className="text-xs text-ink-muted">User subscription tier breakdown</p>
          </div>
        </div>

        <div className="h-[200px] w-full relative flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={planDistribution}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
              >
                {planDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const pct = totalPlanUsers > 0 ? ((data.value / totalPlanUsers) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-surface p-2.5 rounded-xl border border-hairline shadow-md text-xs">
                        <span className="font-bold text-ink">{data.name}: </span>
                        <span className="font-extrabold" style={{ color: data.color }}>
                          {data.value} users ({pct}%)
                        </span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute flex flex-col items-center pointer-events-none">
            <span className="text-xl font-black text-ink">{totalPlanUsers}</span>
            <span className="text-[10px] uppercase font-bold text-ink-muted">Total</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="space-y-1.5 pt-3 border-t border-hairline text-xs">
          {planDistribution.map((item) => {
            const pct = totalPlanUsers > 0 ? ((item.value / totalPlanUsers) * 100).toFixed(0) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-ink font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ink">{item.value}</span>
                  <span className="text-[11px] text-ink-muted w-8 text-right">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
