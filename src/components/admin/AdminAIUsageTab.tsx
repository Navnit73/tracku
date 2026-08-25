"use client";

import React from "react";
import {
  Brain,
  Cpu,
  DollarSign,
  Activity,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { AdminOverviewStats } from "@/app/actions/admin";

interface AdminAIUsageTabProps {
  stats: AdminOverviewStats;
}

export function AdminAIUsageTab({ stats }: AdminAIUsageTabProps) {
  const { ai, growthTimeline } = stats;

  const avgCostPerRequest =
    ai.totalRequests > 0 ? (ai.totalCost / ai.totalRequests).toFixed(4) : "0.0000";

  return (
    <div className="space-y-6">
      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-hairline bg-surface flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Total Prompts Sent
            </p>
            <h3 className="text-2xl font-black text-ink mt-0.5">
              {ai.totalRequests.toLocaleString()}
            </h3>
            <span className="text-[11px] text-ink-muted">Platform-wide executions</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-investment/10 text-investment flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-hairline bg-surface flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Total Tokens Used
            </p>
            <h3 className="text-2xl font-black text-ink mt-0.5">
              {(ai.totalTokens / 1000).toFixed(1)}k
            </h3>
            <span className="text-[11px] text-ink-muted">Input + output tokens</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky/10 text-sky flex items-center justify-center">
            <Cpu className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-hairline bg-surface flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Estimated Total Cost
            </p>
            <h3 className="text-2xl font-black text-income mt-0.5">
              ${ai.totalCost.toFixed(4)}
            </h3>
            <span className="text-[11px] text-ink-muted">DeepSeek V3 inference</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-income/10 text-income flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </Card>

        <Card className="p-4 border-hairline bg-surface flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
              Active AI Users
            </p>
            <h3 className="text-2xl font-black text-primary mt-0.5">
              {ai.activeAIUsersCount}
            </h3>
            <span className="text-[11px] text-ink-muted">${avgCostPerRequest} avg / prompt</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </Card>
      </div>

      {/* AI Daily Calls & Cost Chart */}
      <Card className="p-5 border-hairline bg-surface shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-ink">Daily AI Requests & Consumption (30 Days)</h3>
            <p className="text-xs text-ink-muted">
              Daily prompt executions and associated compute cost
            </p>
          </div>
          <Badge variant="investment" size="sm" className="font-bold text-[10px]">
            DeepSeek-Chat (V3)
          </Badge>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={growthTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    const reqs = payload[0]?.value || 0;
                    const cost = payload[0]?.payload?.aiCost || 0;
                    return (
                      <div className="bg-surface p-3 rounded-xl border border-hairline shadow-lg text-xs space-y-1">
                        <p className="font-bold text-ink mb-1">{label}</p>
                        <p className="text-investment font-bold">Requests: {reqs}</p>
                        <p className="text-income font-bold">Cost: ${Number(cost).toFixed(4)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey="aiRequests"
                name="AI Prompts"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
