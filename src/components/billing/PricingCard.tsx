"use client";

import React from "react";
import { Check, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { PlanDetails } from "@/lib/razorpay";
import { cn } from "@/lib/utils";

export interface PricingCardProps {
  plan: PlanDetails;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  isLoading?: boolean;
  onSubscribe: (planId: "MONTHLY" | "SIX_MONTH" | "YEARLY") => void;
}

export function PricingCard({
  plan,
  isPopular = false,
  isCurrentPlan = false,
  isLoading = false,
  onSubscribe,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        "relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 backdrop-blur-md",
        isPopular
          ? "bg-surface border-2 border-primary ring-4 ring-primary/10 shadow-[0_12px_30px_rgba(0,210,123,0.15)] z-10"
          : "bg-surface/80 border border-hairline hover:border-hairline-strong shadow-sm hover:shadow-md"
      )}
    >
      {/* Badges */}
      {isPopular && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-20">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-primary text-slate-950 shadow-md">
            <Sparkles className="w-3.5 h-3.5 fill-current" />
            Most Popular • Best Value
          </span>
        </div>
      )}

      <div>
        {/* Header section */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-ink">{plan.name}</h3>
          {plan.savingsBadge && !isPopular && (
            <Badge variant="income" size="sm">
              {plan.savingsBadge}
            </Badge>
          )}
        </div>

        <p className="text-xs text-ink-muted mt-1.5 leading-relaxed min-h-[36px]">
          {plan.description}
        </p>

        {/* Price display */}
        <div className="mt-5 pb-5 border-b border-hairline">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl sm:text-4xl font-black text-ink tracking-tight">
              ${plan.price}
            </span>
            <span className="text-xs font-semibold text-ink-muted">
              {plan.id === "MONTHLY" ? "/ month" : plan.id === "SIX_MONTH" ? "/ 6 months" : "/ year"}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-ink-muted">
            <span className="font-bold text-primary">{plan.effectiveMonthly}</span>
            <span>•</span>
            <span>{plan.billingText}</span>
          </div>
        </div>

        {/* Feature List */}
        <div className="mt-5 space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
            What's included
          </div>
          <ul className="space-y-2.5">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-ink-secondary">
                <div className="p-0.5 rounded-full bg-primary/15 text-primary shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action CTA Button */}
      <div className="mt-8 pt-4 border-t border-hairline">
        {isCurrentPlan ? (
          <Button
            variant="outline"
            className="w-full justify-center border-primary/40 text-primary cursor-default"
            disabled
          >
            <ShieldCheck className="w-4 h-4 mr-2" /> Current Plan
          </Button>
        ) : (
          <Button
            variant={isPopular ? "primary" : "secondary"}
            className="w-full justify-center font-bold"
            isLoading={isLoading}
            onClick={() => onSubscribe(plan.id)}
            leftIcon={isPopular ? <Zap className="w-4 h-4" /> : undefined}
          >
            {isPopular ? "Upgrade to Annual Pro" : `Select ${plan.name}`}
          </Button>
        )}
      </div>
    </div>
  );
}
