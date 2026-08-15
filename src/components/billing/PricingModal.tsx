"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { Modal } from "@/components/ui/Modal";
import { PricingCard } from "@/components/billing/PricingCard";
import { PLAN_CONFIGS } from "@/lib/razorpay";
import { openRazorpayCheckout } from "@/components/billing/RazorpayScript";
import { showToast } from "@/lib/toast";
import { ShieldCheck, Sparkles, AlertCircle } from "lucide-react";

export interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  reason?: "LIMIT_REACHED" | "UPGRADE_CTA" | "FEATURE_LOCKED";
}

export function PricingModal({
  isOpen,
  onClose,
  onSuccess,
  title = "Upgrade to FinanceTrack Pro",
  description = "Unlock unlimited transaction records, deep AI analytics, and multi-currency tracking.",
  reason,
}: PricingModalProps) {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleSubscribe = async (planType: "MONTHLY" | "SIX_MONTH" | "YEARLY") => {
    setLoadingPlan(planType);

    try {
      // 1. Create subscription session on backend
      const res = await fetch("/api/billing/create-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planType }),
      });

      const data = await res.json();

      if (!data.success) {
        showToast.error("Subscription Error", data.error || "Failed to initialize payment.");
        setLoadingPlan(null);
        return;
      }

      // 2. Open Razorpay Checkout modal
      await openRazorpayCheckout({
        subscriptionId: data.subscriptionId,
        keyId: data.keyId,
        description: data.description,
        user: {
          name: session?.user?.name,
          email: session?.user?.email,
          image: session?.user?.image,
        },
        onSuccess: async (response) => {
          // 3. Verify cryptographic signature on backend
          showToast.info("Verifying Payment", "Confirming your subscription status...");

          const verifyRes = await fetch("/api/billing/verify-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });

          const verifyData = await verifyRes.json();
          setLoadingPlan(null);

          if (verifyData.success) {
            showToast.success(
              "Welcome to FinanceTrack Pro!",
              "Your subscription is active. Unlimited transaction recording is now unlocked."
            );
            if (onSuccess) onSuccess();
            onClose();
          } else {
            showToast.error(
              "Verification Failed",
              verifyData.error || "Please contact support if funds were deducted."
            );
          }
        },
        onDismiss: () => {
          setLoadingPlan(null);
        },
        onError: (err) => {
          setLoadingPlan(null);
          showToast.error("Payment Cancelled", err?.message || "Payment session was closed.");
        },
      });
    } catch (error: any) {
      setLoadingPlan(null);
      showToast.error("Payment Gateway Error", error?.message || "Unable to reach payment service.");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      maxWidth="4xl"
    >
      <div className="flex flex-col gap-6 py-2">
        {/* Limit reached banner alert */}
        {reason === "LIMIT_REACHED" && (
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block text-sm">Free Tier Transaction Limit Reached (10/10)</span>
              You have used all 10 free transactions. Upgrade to Pro to continue adding unlimited income, expense, and investment entries.
            </div>
          </div>
        )}

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 items-stretch">
          <PricingCard
            plan={PLAN_CONFIGS.MONTHLY}
            isLoading={loadingPlan === "MONTHLY"}
            onSubscribe={handleSubscribe}
          />
          <PricingCard
            plan={PLAN_CONFIGS.YEARLY}
            isPopular={true}
            isLoading={loadingPlan === "YEARLY"}
            onSubscribe={handleSubscribe}
          />
          <PricingCard
            plan={PLAN_CONFIGS.SIX_MONTH}
            isLoading={loadingPlan === "SIX_MONTH"}
            onSubscribe={handleSubscribe}
          />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-hairline text-xs text-ink-muted">
          <div className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>256-Bit SSL Encrypted Checkout via Razorpay</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-4 h-4 text-income" />
            <span>Cancel Anytime from Settings</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
