"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { AIInsightResponse } from "@/lib/ai/types";
import {
  Sparkles,
  Bot,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  RefreshCcw,
  Copy,
  Check,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  ChevronRight,
  Lightbulb,
  Info,
  Loader2,
} from "lucide-react";
import { showToast } from "@/lib/toast";

interface AIInsightStudioProps {
  insights: AIInsightResponse | null;
  loading: boolean;
  error: { message: string; retryable: boolean } | null;
  usage: { requestsToday: number; dailyLimit: number; remainingToday: number } | null;
  cached: boolean;
  generatedAt: string | null;
  currency: string;
  datePreset: string;
  onGenerate: () => void;
}

type TabKey = "overview" | "categories" | "recommendations" | "warnings" | "forecast";

export function AIInsightStudio({
  insights,
  loading,
  error,
  usage,
  cached,
  generatedAt,
  currency,
  datePreset,
  onGenerate,
}: AIInsightStudioProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    if (!insights?.summary) return;
    navigator.clipboard.writeText(insights.summary);
    setCopied(true);
    showToast.success("Copied", "AI summary copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  // Quota calculation
  const dailyLimit = usage?.dailyLimit || 100;
  const remaining = usage?.remainingToday ?? dailyLimit;
  const used = usage?.requestsToday || 0;
  const quotaPercent = Math.min(100, Math.round((used / dailyLimit) * 100));

  return (
    <div className="relative rounded-2xl overflow-hidden border border-hairline bg-surface  transition-all duration-300">
      {/* Top Header Bar */}
      <div className="relative z-10 px-5 py-4 border-b border-hairline bg-surface flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white ">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-ink tracking-tight">AI Financial Intelligence Studio</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-investment-bg text-investment border border-investment-border flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> DeepSeek V4 Flash
              </span>
              {cached && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-canvas text-ink-muted border border-hairline">
                  Cached
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              Period: <span className="font-semibold text-ink">{datePreset}</span>
              {generatedAt && (
                <span className="ml-2 text-ink-faint">
                  • Synced {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Quota & Quick Action */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          {usage && (
            <div className="hidden sm:flex flex-col items-end gap-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-ink-muted">
                <span>Daily Quota</span>
                <span className="font-bold text-primary">{remaining} left</span>
              </div>
              <div className="w-24 h-1.5 bg-canvas border border-hairline rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${quotaPercent}%` }}
                />
              </div>
            </div>
          )}

          {insights && !loading && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                title="Copy AI summary"
                className="p-2 rounded-lg border border-hairline bg-surface hover:bg-canvas text-ink-muted hover:text-ink transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-income" /> : <Copy className="w-4 h-4" />}
              </button>
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerate}
                disabled={loading}
                leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Re-diagnose
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 p-5 sm:p-6">
        {/* 1. INITIAL EMPTY STATE */}
        {!insights && !loading && !error && (
          <div className="py-10 px-4 flex flex-col items-center justify-center text-center max-w-xl mx-auto">
            <div className="relative mb-5">
              <div className="w-16 h-16 rounded-2xl bg-investment-bg border border-investment-border flex items-center justify-center text-investment ">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-ink text-canvas border border-hairline">
                v4.0
              </div>
            </div>

            <h4 className="text-lg sm:text-xl font-bold text-ink tracking-tight mb-2">
              Generate Instant Financial Diagnostics
            </h4>
            <p className="text-xs sm:text-sm text-ink-muted leading-relaxed mb-6 max-w-md">
              DeepSeek V4 Flash analyzes your spending distribution, detects budget leaks, computes category shifts, and projects your next month cash flow.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6 text-left">
              <div className="p-3.5 rounded-xl bg-canvas border border-hairline">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <Flame className="w-3.5 h-3.5 text-warning-brand" /> Category Shifts
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">Identifies sudden spikes across all spending categories.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas border border-hairline">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" /> Actionable Fixes
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">Personalized advice to maintain positive net cashflow.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-canvas border border-hairline">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink mb-1">
                  <TrendingUp className="w-3.5 h-3.5 text-income" /> Forecast Model
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">Burn-rate simulations calibrated to your transaction history.</p>
              </div>
            </div>

            <button
              onClick={onGenerate}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-primary hover:bg-primary-active text-white text-sm font-semibold  transition-all active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Run AI Financial Diagnosis</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2. LOADING STATE */}
        {loading && (
          <div className="py-12 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-investment-bg border border-investment-border flex items-center justify-center mb-4">
              <Loader2 className="w-7 h-7 text-investment animate-spin" />
            </div>
            <h4 className="text-base font-bold text-ink mb-1">DeepSeek V4 Flash is Analyzing...</h4>
            <p className="text-xs text-ink-muted leading-relaxed max-w-xs">
              Synthesizing transaction patterns, comparing category baselines, and evaluating cashflow momentum.
            </p>

            <div className="mt-5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-2 h-2 rounded-full bg-primary animate-bounce"></span>
            </div>
          </div>
        )}

        {/* 3. ERROR STATE */}
        {error && !loading && (
          <div className="py-8 px-4 flex flex-col items-center justify-center text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-2xl bg-expense-bg flex items-center justify-center text-expense border border-expense-border mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-ink mb-1">Unable to Complete AI Analysis</h4>
            <p className="text-xs text-ink-muted mb-4">{error.message}</p>
            {error.retryable && (
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerate}
                leftIcon={<RefreshCcw className="w-3.5 h-3.5" />}
              >
                Try Again
              </Button>
            )}
          </div>
        )}

        {/* 4. RESULTS DASHBOARD */}
        {insights && !loading && (
          <div className="space-y-6">
            {/* Executive Summary Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-canvas border border-hairline">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-1.5 rounded-lg bg-investment-bg text-investment border border-investment-border">
                  <Bot className="w-4 h-4" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-investment">
                  Executive AI Summary
                </span>
              </div>
              <p className="text-sm sm:text-base text-ink leading-relaxed font-normal">
                {insights.summary}
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 sm:p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Projected Next Month
                </span>
                <div className="mt-2">
                  <span className="text-base sm:text-lg font-black text-ink">
                    {formatCurrency(insights.forecast.next_month_expenses, currency)}
                  </span>
                  <div className="mt-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-investment-bg text-investment border border-investment-border">
                      {insights.forecast.confidence} confidence
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-sky-brand" /> Categories Tracked
                </span>
                <div className="mt-2">
                  <span className="text-base sm:text-lg font-black text-ink">
                    {insights.spending_changes.length || "All"}
                  </span>
                  <p className="text-[10px] text-ink-muted mt-0.5">Tracked with shifts</p>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <Lightbulb className="w-3 h-3 text-income" /> Action Items
                </span>
                <div className="mt-2">
                  <span className="text-base sm:text-lg font-black text-income">
                    {insights.recommendations.length} Recommendations
                  </span>
                  <p className="text-[10px] text-ink-muted mt-0.5">Identified for savings</p>
                </div>
              </div>

              <div className="p-3 sm:p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-ink-muted flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-warning-brand" /> Risk Signals
                </span>
                <div className="mt-2">
                  <span className="text-base sm:text-lg font-black text-warning-brand">
                    {insights.warnings.length} Warnings
                  </span>
                  <p className="text-[10px] text-ink-muted mt-0.5">Requiring attention</p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-hairline overflow-x-auto pb-px">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "overview"
                    ? "text-primary border-b-2 border-primary bg-income-bg/40 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" /> Key Findings ({insights.key_findings.length})
              </button>

              <button
                onClick={() => setActiveTab("categories")}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "categories"
                    ? "text-primary border-b-2 border-primary bg-income-bg/40 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Spending Shifts ({insights.spending_changes.length})
              </button>

              <button
                onClick={() => setActiveTab("recommendations")}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "recommendations"
                    ? "text-primary border-b-2 border-primary bg-income-bg/40 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Recommendations ({insights.recommendations.length})
              </button>

              <button
                onClick={() => setActiveTab("warnings")}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "warnings"
                    ? "text-primary border-b-2 border-primary bg-income-bg/40 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Risk Factors ({insights.warnings.length})
              </button>

              <button
                onClick={() => setActiveTab("forecast")}
                className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  activeTab === "forecast"
                    ? "text-primary border-b-2 border-primary bg-income-bg/40 font-bold"
                    : "text-ink-muted hover:text-ink hover:bg-canvas"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Forecast Model
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="pt-2">
              {/* 1. KEY FINDINGS TAB */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {insights.key_findings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-canvas border border-hairline flex items-start gap-3"
                    >
                      <div className="w-7 h-7 rounded-lg bg-income-bg text-income border border-income-border flex items-center justify-center shrink-0 font-bold text-xs">
                        {idx + 1}
                      </div>
                      <p className="text-xs sm:text-sm text-ink leading-relaxed font-normal">
                        {finding}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. SPENDING SHIFTS TAB */}
              {activeTab === "categories" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insights.spending_changes.map((change, idx) => {
                    const isUp = change.direction === "up";
                    const isDown = change.direction === "down";
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-canvas border border-hairline flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-sm font-bold text-ink">{change.category}</span>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-black px-2 py-0.5 rounded-full ${
                              isUp
                                ? "bg-expense-bg text-expense border border-expense-border"
                                : isDown
                                ? "bg-income-bg text-income border border-income-border"
                                : "bg-surface text-ink-muted border border-hairline"
                            }`}
                          >
                            {isUp ? <ArrowUpRight className="w-3 h-3" /> : isDown ? <ArrowDownRight className="w-3 h-3" /> : null}
                            {change.percentage > 0 ? `${change.percentage}%` : "Baseline"}
                          </span>
                        </div>
                        <p className="text-xs text-ink-muted leading-relaxed font-normal">
                          {change.note || "Spending categorized for period."}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 3. RECOMMENDATIONS TAB */}
              {activeTab === "recommendations" && (
                <div className="space-y-3">
                  {insights.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-income-bg/50 border border-income-border flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-income text-white shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-income">
                            Action Step {idx + 1}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-ink leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. WARNINGS TAB */}
              {activeTab === "warnings" && (
                <div className="space-y-3">
                  {insights.warnings.length === 0 ? (
                    <div className="p-8 text-center rounded-xl bg-canvas border border-hairline">
                      <CheckCircle2 className="w-8 h-8 text-income mx-auto mb-2" />
                      <p className="text-sm font-bold text-ink">No Critical Risk Alerts</p>
                      <p className="text-xs text-ink-muted">Your spending patterns are within normal operational parameters.</p>
                    </div>
                  ) : (
                    insights.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-warning-brand-bg/60 border border-warning-brand-border flex items-start gap-3"
                      >
                        <div className="p-1.5 rounded-lg bg-warning-brand text-white shrink-0 mt-0.5">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-warning-brand">
                              Caution Flag {idx + 1}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-ink leading-relaxed">
                            {warn}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* 5. FORECAST TAB */}
              {activeTab === "forecast" && (
                <div className="p-5 sm:p-6 rounded-2xl bg-canvas border border-hairline space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-investment">
                        Predictive Burn Simulation
                      </span>
                      <h4 className="text-2xl font-black text-ink mt-1 tracking-tight">
                        {formatCurrency(insights.forecast.next_month_expenses, currency)}
                      </h4>
                      <p className="text-xs text-ink-muted mt-0.5">Estimated total outlays for next calendar cycle</p>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-investment-bg border border-investment-border self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-investment animate-pulse"></span>
                      <span className="text-xs font-bold text-investment capitalize">
                        {insights.forecast.confidence} Confidence Model
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-surface border border-hairline">
                    <h5 className="text-xs font-bold text-ink uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-primary" /> Forecast Rationale
                    </h5>
                    <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                      {insights.forecast.rationale}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Disclaimer & Footer */}
            <div className="pt-4 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <p className="text-[11px] text-ink-faint leading-relaxed max-w-xl">
                {insights.disclaimer || "AI insights are algorithmic approximations based on historical transaction records and do not constitute certified financial or investment advice."}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-ink-faint">Model: DeepSeek V4 Flash</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
