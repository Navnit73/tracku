"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Zap, ShieldCheck, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PricingModal } from "@/components/billing/PricingModal";
import { cn } from "@/lib/utils";

export interface FreeTierBannerProps {
  className?: string;
  onUpgradeSuccess?: () => void;
}

export function FreeTierBanner({ className, onUpgradeSuccess }: FreeTierBannerProps) {
  const [billingInfo, setBillingInfo] = useState<{
    isPremium: boolean;
    transactionCount: number;
    freeLimit: number;
    remainingFreeTransactions: number;
    subscription: any;
  } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (data.success) {
        setBillingInfo(data);
      }
    } catch {
      // Ignore network errors on background poll
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  if (loading || !billingInfo) {
    return null;
  }

  // If user has active Pro subscription, show active pill or hide
  if (billingInfo.isPremium) {
    return null;
  }

  const count = billingInfo.transactionCount;
  const limit = billingInfo.freeLimit || 10;
  const percentage = Math.min(100, Math.round((count / limit) * 100));
  const isLimitReached = count >= limit;
  const isCloseToLimit = count >= limit - 3 && !isLimitReached;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl p-4 sm:p-4.5 border transition-all duration-200 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4",
          isLimitReached
            ? "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-200"
            : isCloseToLimit
            ? "bg-sky-500/10 border-sky-500/20 text-ink"
            : "bg-surface border-hairline text-ink",
          className
        )}
      >
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div
            className={cn(
              "p-2.5 rounded-xl shrink-0",
              isLimitReached
                ? "bg-amber-500 text-slate-950"
                : "bg-primary/15 text-primary"
            )}
          >
            {isLimitReached ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                Free Tier Plan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-canvas border border-hairline text-ink-muted">
                {count} / {limit} Used
              </span>
            </div>

            <div className="text-sm font-bold text-ink mt-0.5 truncate">
              {isLimitReached
                ? "You have reached your 10 free transactions limit"
                : `${count} of ${limit} free transactions used`}
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs h-1.5 bg-canvas rounded-full mt-2 overflow-hidden border border-hairline">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isLimitReached
                    ? "bg-amber-500"
                    : isCloseToLimit
                    ? "bg-sky-500"
                    : "bg-primary"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant={isLimitReached ? "primary" : "secondary"}
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Zap className="w-4 h-4" />}
            className="w-full sm:w-auto font-bold"
          >
            {isLimitReached ? "Upgrade to Continue" : "Upgrade to Pro"}
          </Button>
        </div>
      </div>

      <PricingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reason={isLimitReached ? "LIMIT_REACHED" : "UPGRADE_CTA"}
        onSuccess={() => {
          fetchStatus();
          if (onUpgradeSuccess) onUpgradeSuccess();
        }}
      />
    </>
  );
}
