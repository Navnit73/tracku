"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Receipt,
  TrendingDown,
  TrendingUp,
  LineChart,
  Tag,
  ShieldCheck,
  Brain,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Lightbulb,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface FirstTimeUserGuideProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewTransaction?: () => void;
}

const GUIDE_STEPS = [
  {
    id: "step-1",
    title: "1. Log Your Daily Transactions",
    subtitle: "Effortlessly record Income, Expenses, and Wealth Investments",
    icon: Receipt,
    badge: "The Ledger",
    color: "text-primary bg-primary/10 border-primary/20",
    content: (
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Expenseliy gives you a single unified ledger with 3 distinct transaction types to ensure your cash flow and net savings are always accurate:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-income-bg border border-income-border flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-income">
              <TrendingUp className="w-3.5 h-3.5" /> Income
            </div>
            <span className="text-[11px] text-ink-muted leading-tight">
              Salaries, dividends, client payments & windfalls.
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-expense-bg border border-expense-border flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-expense">
              <TrendingDown className="w-3.5 h-3.5" /> Expenses
            </div>
            <span className="text-[11px] text-ink-muted leading-tight">
              Daily groceries, rent, utilities, dining & subscriptions.
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-investment-bg border border-investment-border flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-investment">
              <LineChart className="w-3.5 h-3.5" /> Investments
            </div>
            <span className="text-[11px] text-ink-muted leading-tight">
              Stocks, mutual funds, gold, crypto & real estate.
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-canvas border border-hairline text-xs text-ink-muted flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Pro Tip:</strong> Click <em>"Add Entry"</em> on mobile or <em>"Add Transaction"</em> anytime from the navbar or bottom bar to log entries in seconds.
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "step-2",
    title: "2. Organize with Smart Categories",
    subtitle: "Track where every dollar flows & identify spending trends",
    icon: Tag,
    badge: "Categorization",
    color: "text-sky-brand bg-sky-brand-bg border-sky-brand-border",
    content: (
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Categories power your charts and spending analytics. You can use default categories or create custom tags with tailored icons and colors:
        </p>
        <div className="space-y-2.5">
          <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Essentials (Housing, Groceries, Medical)</span>
            </div>
            <span className="text-[10px] text-ink-muted bg-surface px-2 py-0.5 rounded border border-hairline font-bold">Needs</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Lifestyle (Dining, Travel, Entertainment)</span>
            </div>
            <span className="text-[10px] text-ink-muted bg-surface px-2 py-0.5 rounded border border-hairline font-bold">Wants</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-ink">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Future Wealth (SIPs, ETFs, Emergency Fund)</span>
            </div>
            <span className="text-[10px] text-ink-muted bg-surface px-2 py-0.5 rounded border border-hairline font-bold">Savings</span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "step-3",
    title: "3. Financial Intelligence & Health Score",
    subtitle: "Your personal AI financial advisor answering the 4 big money questions",
    icon: Brain,
    badge: "AI Insights",
    color: "text-investment bg-investment-bg border-investment-border",
    content: (
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          The <strong>Financial Insights</strong> page isn't just dry data — it calculates your real-time Financial Health Score and provides actionable guidance:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-canvas border border-hairline space-y-1">
            <div className="font-bold text-ink flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-income" /> 100-Point Health Score
            </div>
            <p className="text-ink-muted text-[11px]">
              Evaluates savings velocity, expense ratios, recurring bills & emergency runway.
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-canvas border border-hairline space-y-1">
            <div className="font-bold text-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" /> AI Intelligence Studio
            </div>
            <p className="text-ink-muted text-[11px]">
              DeepSeek AI analyzes unusual spikes, hidden subscription costs, and forecasts savings.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "step-4",
    title: "4. Multi-Currency, Reports & Pro Freedom",
    subtitle: "Tailor your experience, export CSV ledgers, and unlock unlimited entries",
    icon: Globe,
    badge: "Customization",
    color: "text-income bg-income-bg border-income-border",
    content: (
      <div className="space-y-4">
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Everything in Expenseliy is built for seamless everyday use:
        </p>
        <div className="space-y-2 text-xs">
          <div className="p-3 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
            <Globe className="w-4 h-4 text-sky-brand shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-ink block">7+ World Currencies</span>
              <span className="text-ink-muted text-[11px]">Switch between USD ($), INR (₹), EUR (€), GBP (£), CAD, AUD, and JPY in Settings.</span>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-canvas border border-hairline flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-income shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-ink block">Freemium to Pro</span>
              <span className="text-ink-muted text-[11px]">Enjoy 40 free transactions to get started, or upgrade to Pro for unlimited recording & deep AI intelligence.</span>
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

export function FirstTimeUserGuide({
  isOpen,
  onClose,
  onOpenNewTransaction,
}: FirstTimeUserGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("expenseliy_guide_completed", "true");
    }
    onClose();
  };

  const handleNext = () => {
    if (currentStep < GUIDE_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const step = GUIDE_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleFinish}
      maxWidth="2xl"
    >
      <div className="flex flex-col gap-5 py-1">
        {/* Step Progress Header */}
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 flex items-center gap-1">
              <Compass className="w-3 h-3" /> Quick Start Guide
            </span>
            <span className="text-xs text-ink-muted font-medium">
              Step {currentStep + 1} of {GUIDE_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleFinish}
            className="text-xs font-semibold text-ink-muted hover:text-ink cursor-pointer transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Progress Bar Indicators */}
        <div className="grid grid-cols-4 gap-1.5">
          {GUIDE_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentStep(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 cursor-pointer",
                idx === currentStep
                  ? "bg-primary"
                  : idx < currentStep
                  ? "bg-primary/40"
                  : "bg-hairline"
              )}
              title={`Jump to step ${idx + 1}`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Step Hero */}
        <div className="flex items-start gap-3.5 pt-1">
          <div className={cn("p-3 rounded-2xl border shrink-0", step.color)}>
            <StepIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-ink tracking-tight">
              {step.title}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {step.subtitle}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="min-h-[190px]">
          {step.content}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-hairline">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className={cn("text-xs", currentStep === 0 && "opacity-0 pointer-events-none")}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {currentStep === 0 && onOpenNewTransaction && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFinish();
                  onOpenNewTransaction();
                }}
                className="text-xs hidden sm:inline-flex"
              >
                Log Entry Now
              </Button>
            )}

            <Button
              variant="primary"
              size="sm"
              onClick={handleNext}
              rightIcon={currentStep < GUIDE_STEPS.length - 1 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              className="font-bold text-xs px-5"
            >
              {currentStep < GUIDE_STEPS.length - 1 ? "Next Step" : "Get Started"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
