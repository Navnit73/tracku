"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { PricingCard } from "@/components/billing/PricingCard";
import { PLAN_CONFIGS } from "@/lib/razorpay";
import { openRazorpayCheckout } from "@/components/billing/RazorpayScript";
import { useBilling } from "@/components/providers/BillingProvider";
import { showToast } from "@/lib/toast";
import {
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
  CreditCard,
} from "lucide-react";

export default function PricingPage() {
  const { data: session } = useSession();
  const { subscription, isPremium, refreshBilling } = useBilling();
  const currentPlan = isPremium && subscription ? subscription.plan : null;
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubscribe = async (planType: "MONTHLY" | "SIX_MONTH" | "YEARLY") => {
    setLoadingPlan(planType);

    try {
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
            refreshBilling();
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

  const FAQS = [
    {
      q: "How does the Freemium model work?",
      a: "Every new user receives 40 free transaction records. You can explore all dashboard charts, custom categories, and analytical insights. Once you reach 40 transactions, subscribe to any Pro plan to continue adding unlimited income, expense, and investment entries.",
    },
    {
      q: "What payment methods are supported?",
      a: "We use Razorpay Subscription billing supporting all major credit cards, debit cards, UPI AutoPay, NetBanking, and international cards with seamless automatic renewals.",
    },
    {
      q: "Can I cancel my subscription anytime?",
      a: "Yes! You can cancel your subscription with a single click in Settings. When you cancel, your account retains full Pro features until the end of your current paid billing period.",
    },
    {
      q: "What happens to my data if my subscription ends?",
      a: "All your existing transactions, custom categories, and historical charts remain safe and accessible. You simply won't be able to add new transactions beyond the 40 free tier limit until you re-subscribe.",
    },
  ];

  return (
    <AppShell title="Plans & Pricing">
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        {/* Hero Banner */}
        <div className="text-center space-y-3 pt-2 sm:pt-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="w-3.5 h-3.5" />
            Transparent Pricing • Zero Hidden Fees
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight">
            Take Full Control of Your Financial Journey
          </h1>
          <p className="text-sm sm:text-base text-ink-muted max-w-2xl mx-auto leading-relaxed">
            Free users can record up to 40 transactions. Upgrade to Pro for unlimited transactions, deep AI insights, and multi-currency tracking.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 items-stretch">
          <PricingCard
            plan={PLAN_CONFIGS.MONTHLY}
            isCurrentPlan={currentPlan === "MONTHLY"}
            isLoading={loadingPlan === "MONTHLY"}
            onSubscribe={handleSubscribe}
          />
          <PricingCard
            plan={PLAN_CONFIGS.YEARLY}
            isPopular={true}
            isCurrentPlan={currentPlan === "YEARLY"}
            isLoading={loadingPlan === "YEARLY"}
            onSubscribe={handleSubscribe}
          />
          <PricingCard
            plan={PLAN_CONFIGS.SIX_MONTH}
            isCurrentPlan={currentPlan === "SIX_MONTH"}
            isLoading={loadingPlan === "SIX_MONTH"}
            onSubscribe={handleSubscribe}
          />
        </div>

        {/* Comparison Feature Highlights */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-hairline ">
          <h3 className="text-lg font-bold text-ink mb-6 text-center">
            Every Pro Plan Includes Everything You Need
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Unlimited Ledger Entries</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Log unlimited daily expenses, payroll income, and investment portfolio assets.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 shrink-0 mt-0.5">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">AI Insights & Trends</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Smart anomaly detection, highest spending alerts, and recurring bill forecasting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-income/10 text-income shrink-0 mt-0.5">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Multi-Currency Engine</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Seamlessly view and format financial reports in USD, EUR, GBP, INR, CAD, AUD, and JPY.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0 mt-0.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">CSV & Excel Exports</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Export formatted transaction ledgers and financial statements anytime.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Bank-Grade Isolation</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Zero third-party trackers. All financial entries are strictly isolated to your account.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Cancel Anytime Guarantee</h4>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  No questions asked. Manage, pause, or cancel subscriptions directly in Settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-hairline ">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-bold text-ink">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-hairline rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full text-left p-4 sm:p-4.5 bg-canvas/60 hover:bg-canvas flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-sm font-bold text-ink">{faq.q}</span>
                  <span className="text-primary font-bold text-lg">
                    {activeFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {activeFaq === idx && (
                  <div className="p-4 sm:p-4.5 text-xs sm:text-sm text-ink-muted leading-relaxed border-t border-hairline bg-surface">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
