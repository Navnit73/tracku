"use client";

import React, { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DatePicker, DateRangePreset } from "@/components/ui/DatePicker";
import { Badge } from "@/components/ui/Badge";
import { getDashboardAnalytics } from "@/app/actions/analytics";
import { getTransactions } from "@/app/actions/transactions";
import { downloadTransactionsCSV } from "@/lib/csvExport";
import { formatCurrency } from "@/lib/utils";
import { FileSpreadsheet, Download, Printer, CheckCircle, PieChart, Sparkles } from "lucide-react";

export default function ReportsPage() {
  const [datePreset, setDatePreset] = useState<DateRangePreset>("This Month");
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();

  const [analytics, setAnalytics] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [analyticsRes, transRes] = await Promise.all([
      getDashboardAnalytics({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
      }),
      getTransactions({
        dateRange: datePreset,
        startDate: customStart,
        endDate: customEnd,
        limit: 500,
      }),
    ]);

    if (analyticsRes.success) setAnalytics(analyticsRes);
    if (transRes.success) setTransactions(transRes.transactions);
    setLoading(false);
  }, [datePreset, customStart, customEnd]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleExportCSV = (typeFilter: string) => {
    const filtered =
      typeFilter === "All"
        ? transactions
        : transactions.filter((t) => t.type === typeFilter);
    downloadTransactionsCSV(filtered, `report_${typeFilter.toLowerCase()}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell title="Financial Reports">
      <div className="flex flex-col gap-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <div>
            <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[#0075de]" />
              Executive Financial Statement
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
              Consolidated audit statement for period horizon: <strong>{datePreset}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DatePicker
              selectedPreset={datePreset}
              startDate={customStart}
              endDate={customEnd}
              onChange={(p, s, e) => {
                setDatePreset(p);
                setCustomStart(s);
                setCustomEnd(e);
              }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Report
            </Button>
            <Button
              size="sm"
              onClick={() => handleExportCSV("All")}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Report CSV
            </Button>
          </div>
        </div>

        {/* Report Overview Card */}
        <Card className="p-6">
          <div className="border-b border-[#e6e6e6] dark:border-[#2f2f2f] pb-4 mb-6 flex justify-between items-start">
            <div>
              <div className="text-xs uppercase font-bold text-[#0075de] tracking-wider">
                Personal Finance Audit Summary
              </div>
              <h1 className="text-2xl font-black text-[#171717] dark:text-[#f7f7f7] mt-1">
                Cash Flow & Wealth Report
              </h1>
            </div>
            <Badge variant="sky" size="md">
              Verified Realtime Data
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="p-4 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]">
              <div className="text-xs font-semibold text-[#615d59]">Total Cash Inflow</div>
              <div className="text-xl font-extrabold text-[#059669] mt-1">
                {formatCurrency(analytics?.summary?.totalIncome || 0)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]">
              <div className="text-xs font-semibold text-[#615d59]">Total Cash Outflow</div>
              <div className="text-xl font-extrabold text-[#e11d48] mt-1">
                {formatCurrency(analytics?.summary?.totalExpenses || 0)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]">
              <div className="text-xs font-semibold text-[#615d59]">Total Wealth Invested</div>
              <div className="text-xl font-extrabold text-[#7c3aed] mt-1">
                {formatCurrency(analytics?.summary?.totalInvestments || 0)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#213183] text-white">
              <div className="text-xs font-semibold text-blue-200">Net Surplus / Balance</div>
              <div className="text-xl font-extrabold mt-1">
                {formatCurrency(analytics?.summary?.balance || 0)}
              </div>
            </div>
          </div>

          {/* Quick Export Downloads Section */}
          <div className="mt-8 pt-6 border-t border-[#e6e6e6] dark:border-[#2f2f2f]">
            <h3 className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7] mb-3">
              Export Segmented Data Reports
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Expense")}
                leftIcon={<Download className="w-4 h-4 text-[#e11d48]" />}
                className="justify-between"
              >
                <span>Expense Ledger CSV</span>
                <Badge variant="expense" size="sm">
                  CSV
                </Badge>
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Income")}
                leftIcon={<Download className="w-4 h-4 text-[#059669]" />}
                className="justify-between"
              >
                <span>Income Ledger CSV</span>
                <Badge variant="income" size="sm">
                  CSV
                </Badge>
              </Button>

              <Button
                variant="secondary"
                onClick={() => handleExportCSV("Investment")}
                leftIcon={<Download className="w-4 h-4 text-[#7c3aed]" />}
                className="justify-between"
              >
                <span>Investment Portfolio CSV</span>
                <Badge variant="investment" size="sm">
                  CSV
                </Badge>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
