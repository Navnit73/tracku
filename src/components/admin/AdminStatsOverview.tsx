"use client";

import React from "react";
import {
  Users,
  CreditCard,
  Receipt,
  Brain,
  Coins,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { AdminOverviewStats } from "@/app/actions/admin";

interface AdminStatsOverviewProps {
  stats: AdminOverviewStats;
}

export function AdminStatsOverview({ stats }: AdminStatsOverviewProps) {
  const { users, subscriptions, financials, ai } = stats;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Registered Users Card */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between border-hairline bg-surface shadow-xs hover:border-primary/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Total User Base
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                {users.total.toLocaleString()}
              </h3>
              <Badge variant="primary" size="sm" className="text-[10px] font-bold">
                {users.admins} Admin{users.admins === 1 ? "" : "s"}
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-hairline/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-canvas">
            <span className="block text-[10px] text-ink-muted font-medium">Today</span>
            <span className="font-bold text-income">{users.activeToday}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-canvas">
            <span className="block text-[10px] text-ink-muted font-medium">7 Days</span>
            <span className="font-bold text-primary">{users.activeThisWeek}</span>
          </div>
          <div className="p-1.5 rounded-lg bg-canvas">
            <span className="block text-[10px] text-ink-muted font-medium">30 Days</span>
            <span className="font-bold text-ink">{users.activeThisMonth}</span>
          </div>
        </div>
      </Card>

      {/* 2. Subscriptions & Estimated Revenue Card */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between border-hairline bg-surface shadow-xs hover:border-income/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Active Pro & MRR
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-income tracking-tight">
                ${subscriptions.estimatedMRR.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </h3>
              <span className="text-xs font-bold text-ink-muted">/mo MRR</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-income/10 border border-income/20 flex items-center justify-center text-income shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-income inline-block" />
            <span className="text-ink font-semibold">
              {subscriptions.totalPaidActive} Paid Active
            </span>
          </div>
          <div className="flex items-center gap-2 text-ink-muted text-[11px]">
            <span>{subscriptions.monthlyCount} Mo</span>
            <span>•</span>
            <span>{subscriptions.yearlyCount} Yr</span>
            <span>•</span>
            <span className="text-investment font-bold">{subscriptions.vipCount} VIP</span>
          </div>
        </div>
      </Card>

      {/* 3. Platform Ledger Activity Card */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between border-hairline bg-surface shadow-xs hover:border-sky/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Platform Transactions
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-ink tracking-tight">
                {financials.totalTransactions.toLocaleString()}
              </h3>
              <Badge variant="neutral" size="sm" className="text-[10px] font-bold">
                ${financials.totalVolume >= 1000 ? `${(financials.totalVolume / 1000).toFixed(1)}k` : financials.totalVolume.toFixed(0)} Vol
              </Badge>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky/10 border border-sky/20 flex items-center justify-center text-sky shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-hairline/80 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-1 rounded-lg bg-expense/10 text-expense">
            <span className="block text-[9px] font-semibold">Expenses</span>
            <span className="font-bold text-[11px]">${financials.totalExpenseAmount >= 1000 ? `${(financials.totalExpenseAmount / 1000).toFixed(1)}k` : financials.totalExpenseAmount.toFixed(0)}</span>
          </div>
          <div className="p-1 rounded-lg bg-income/10 text-income">
            <span className="block text-[9px] font-semibold">Income</span>
            <span className="font-bold text-[11px]">${financials.totalIncomeAmount >= 1000 ? `${(financials.totalIncomeAmount / 1000).toFixed(1)}k` : financials.totalIncomeAmount.toFixed(0)}</span>
          </div>
          <div className="p-1 rounded-lg bg-investment/10 text-investment">
            <span className="block text-[9px] font-semibold">Invest</span>
            <span className="font-bold text-[11px]">${financials.totalInvestmentAmount >= 1000 ? `${(financials.totalInvestmentAmount / 1000).toFixed(1)}k` : financials.totalInvestmentAmount.toFixed(0)}</span>
          </div>
        </div>
      </Card>

      {/* 4. Platform AI Consumption Card */}
      <Card className="p-4 sm:p-5 flex flex-col justify-between border-hairline bg-surface shadow-xs hover:border-investment/40 transition-colors">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              DeepSeek AI Workload
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-black text-investment tracking-tight">
                {ai.totalRequests.toLocaleString()}
              </h3>
              <span className="text-xs font-bold text-ink-muted">prompts</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-investment/10 border border-investment/20 flex items-center justify-center text-investment shrink-0">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-hairline/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-ink-muted">
            <Coins className="w-3.5 h-3.5 text-warning" />
            <span>Tokens: <strong className="text-ink">{(ai.totalTokens / 1000).toFixed(1)}k</strong></span>
          </div>
          <div className="p-1 px-2 rounded-md bg-canvas font-bold text-ink text-[11px]">
            Cost: <span className="text-income font-extrabold">${ai.totalCost.toFixed(3)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
