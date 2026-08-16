"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { PricingModal } from "@/components/billing/PricingModal";
import { deleteUserAccountAndData } from "@/app/actions/user";
import { clearAllUserData } from "@/app/actions/transactions";
import { showToast, confirmDialog } from "@/lib/toast";
import { useCurrency } from "@/components/providers/CurrencyProvider";
import {
  Settings as SettingsIcon,
  Globe,
  User,
  LogOut,
  ShieldCheck,
  Trash2,
  AlertTriangle,
  Check,
  RefreshCcw,
  Sun,
  Moon,
  Sparkles,
  Lock,
  CreditCard,
  Zap,
  Calendar,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { currency, setCurrency: setGlobalCurrency, isSaving: isSavingCurrency } = useCurrency();
  const [currencySaved, setCurrencySaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingTx, setIsClearingTx] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

  // Subscription state
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  const [isCancellingSub, setIsCancellingSub] = useState(false);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const fetchBillingStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/billing/status");
      const data = await res.json();
      if (data.success) {
        setBillingInfo(data);
      }
    } catch {
      // Ignore
    } finally {
      setLoadingBilling(false);
    }
  }, []);

  // Load saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || (!saved && document.documentElement.classList.contains("dark"))) {
      setActiveTheme("dark");
    } else {
      setActiveTheme("light");
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setActiveTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
    showToast.success("Theme Updated", `Switched to ${newTheme} mode.`);
  };

  // Load billing status on mount
  useEffect(() => {
    fetchBillingStatus();
  }, [fetchBillingStatus]);

  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    setCurrencySaved(false);
    const success = await setGlobalCurrency(newCurrency);
    if (success) {
      setCurrencySaved(true);
      showToast.success("Currency Updated", `Display currency set to ${newCurrency}.`);
      setTimeout(() => setCurrencySaved(false), 2000);
    } else {
      showToast.error("Failed to Save", "Could not update currency preference.");
    }
  }, [setGlobalCurrency]);

  const handleCancelSubscription = async () => {
    const periodEndDate = billingInfo?.subscription?.currentPeriodEnd
      ? new Date(billingInfo.subscription.currentPeriodEnd).toLocaleDateString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
        })
      : "the end of your billing cycle";

    const confirmed = await confirmDialog({
      title: "Cancel Subscription?",
      text: `You'll keep full Premium Pro access until ${periodEndDate}. After that date, your account will return to the free plan (40 transaction limit).`,
      confirmText: "Yes, Cancel at Cycle End",
    });

    if (confirmed) {
      setIsCancellingSub(true);
      try {
        const res = await fetch("/api/billing/cancel-subscription", {
          method: "POST",
        });
        const data = await res.json();
        setIsCancellingSub(false);

        if (data.success) {
          showToast.success("Cancellation Scheduled", data.message);
          fetchBillingStatus();
        } else {
          showToast.error("Cancellation Error", data.error || "Failed to cancel subscription.");
        }
      } catch (err: any) {
        setIsCancellingSub(false);
        showToast.error("Network Error", err?.message || "Failed to communicate with server.");
      }
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmDialog({
      title: "PERMANENTLY DELETE ACCOUNT & ALL DATA?",
      text: "This action CANNOT be undone. All your personal records, income, expenses, investments, and custom categories will be permanently purged from the database.",
      confirmText: "Yes, Delete Everything",
    });

    if (confirmed) {
      setIsDeleting(true);
      const res = await deleteUserAccountAndData();
      setIsDeleting(false);

      if (res.success) {
        showToast.success("Account & Data Purged", res.message || "Your account has been deleted.");
        signOut({ callbackUrl: "/auth/signin" });
      } else {
        showToast.error("Deletion Failed", res.error);
      }
    }
  };

  const sub = billingInfo?.subscription;
  const isPremium = billingInfo?.isPremium;
  const isScheduledCancel = sub?.cancelAtPeriodEnd || sub?.status === "CANCEL_AT_PERIOD_END";

  return (
    <AppShell title="Settings & Preferences">
      <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
        {/* Top Header Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary shrink-0" />
              <span>Settings & Preferences</span>
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Manage your personal profile, subscription tier, display theme, and currency formats
            </p>
          </div>
          <div className="self-start sm:self-center shrink-0">
            <Badge variant={isPremium ? "income" : "neutral"} size="md">
              {isPremium ? "Pro Member" : "Free Plan"}
            </Badge>
          </div>
        </div>

        {/* Section 1: Subscription & Billing */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <CreditCard className="w-4 h-4 text-primary shrink-0" />
                  <span>Subscription & Billing</span>
                </CardTitle>
                <CardDescription>
                  Manage your subscription tier, billing period, and transaction capacity
                </CardDescription>
              </div>
              <Link
                href="/pricing"
                className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0 self-start sm:self-center"
              >
                <span>View Plans</span> <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scheduled cancellation alert */}
            {isScheduledCancel && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                <div className="text-xs leading-relaxed">
                  <strong className="text-sm font-bold block mb-0.5">Cancellation Scheduled</strong>
                  Your subscription will remain fully active until{" "}
                  <span className="font-bold underline">
                    {sub?.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "the end of your billing cycle"}
                  </span>
                  . After this date, your account will return to the free plan with a 40 transaction limit.
                </div>
              </div>
            )}

            {/* Plan Info Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-canvas border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-extrabold text-ink truncate">
                    {isPremium
                      ? sub?.planName || "FinanceTrack Pro"
                      : "Free Tier Plan"}
                  </span>
                  <Badge
                    variant={
                      isScheduledCancel
                        ? "warning"
                        : isPremium
                        ? "income"
                        : "neutral"
                    }
                    size="sm"
                  >
                    {isScheduledCancel
                      ? "Cancellation Scheduled"
                      : isPremium
                      ? "Active"
                      : "Free Tier"}
                  </Badge>
                </div>

                <div className="text-xs text-ink-muted break-words">
                  {isPremium ? (
                    sub?.isVip ? (
                      <span className="text-income font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" /> Full Access Granted • Lifetime VIP Privileges (Unlimited)
                      </span>
                    ) : (
                      <span>
                        ${sub?.amount} USD • Billed via Razorpay Subscriptions
                      </span>
                    )
                  ) : (
                    <span>
                      {billingInfo?.transactionCount || 0} of {billingInfo?.freeLimit || 40} free transactions recorded
                    </span>
                  )}
                </div>

                {/* Free usage progress bar */}
                {!isPremium && (
                  <div className="w-full max-w-xs h-1.5 bg-surface rounded-full mt-2 overflow-hidden border border-hairline">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            ((billingInfo?.transactionCount || 0) /
                              (billingInfo?.freeLimit || 40)) *
                              100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {!isPremium ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPricingModalOpen(true)}
                    leftIcon={<Zap className="w-4 h-4 shrink-0" />}
                    className="w-full sm:w-auto font-bold justify-center"
                  >
                    Upgrade to Pro
                  </Button>
                ) : (
                  !isScheduledCancel && !sub?.isVip && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelSubscription}
                      isLoading={isCancellingSub}
                      className="w-full sm:w-auto text-ink-muted hover:text-expense hover:border-expense/40 justify-center"
                    >
                      Cancel Subscription
                    </Button>
                  )
                )}
              </div>
            </div>

            {/* Subscription Metadata details if active */}
            {isPremium && sub && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-ink-muted pt-2 border-t border-hairline">
                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline gap-2">
                  <span className="font-medium flex items-center gap-1.5 shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" /> Current Period Ends
                  </span>
                  <strong className="text-ink text-right">
                    {sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </strong>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-canvas border border-hairline gap-2">
                  <span className="font-medium flex items-center gap-1.5 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-income shrink-0" /> Razorpay Sub ID
                  </span>
                  <code
                    className="text-ink font-mono text-[11px] truncate max-w-[130px] sm:max-w-[180px] text-right"
                    title={sub.razorpaySubscriptionId || "—"}
                  >
                    {sub.razorpaySubscriptionId || "—"}
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 2: User Profile */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-4 h-4 text-primary shrink-0" />
              <span>Profile & Account</span>
            </CardTitle>
            <CardDescription>Your authenticated Google user account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-canvas border border-hairline">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="w-12 h-12 rounded-full border-2 border-primary/40 shrink-0 object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm sm:text-base font-bold text-ink truncate">
                    {session?.user?.name || "Authenticated User"}
                  </div>
                  <div className="text-xs text-ink-muted truncate mt-0.5">
                    {session?.user?.email || "No email associated"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-income shrink-0" />
                    <span className="text-[11px] font-semibold text-income truncate">Connected via Google OAuth</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4 shrink-0" />}
                className="w-full sm:w-auto shrink-0 justify-center"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Appearance & Theme */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 text-sky-brand shrink-0" />
              <span>Appearance & Theme</span>
            </CardTitle>
            <CardDescription>Customize the visual interface and dark mode settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                  activeTheme === "light"
                    ? "bg-surface border-primary ring-2 ring-primary/20"
                    : "bg-canvas border-hairline hover:border-hairline-strong text-ink-muted"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${activeTheme === "light" ? "bg-primary text-white" : "bg-surface text-ink-muted border border-hairline"}`}>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink truncate">Light Mode</div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">Clean off-white palette</div>
                  </div>
                </div>
                {activeTheme === "light" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                  activeTheme === "dark"
                    ? "bg-surface border-primary ring-2 ring-primary/20"
                    : "bg-canvas border-hairline hover:border-hairline-strong text-ink-muted"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-xl shrink-0 ${activeTheme === "dark" ? "bg-primary text-white" : "bg-surface text-ink-muted border border-hairline"}`}>
                    <Moon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-ink truncate">Dark Mode</div>
                    <div className="text-xs text-ink-muted mt-0.5 truncate">Sleek slate green theme</div>
                  </div>
                </div>
                {activeTheme === "dark" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Currency & Regional Formatting */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="w-4 h-4 text-income shrink-0" />
              <span>Currency & Region Preferences</span>
            </CardTitle>
            <CardDescription>Select your primary display currency for ledger records, reports, and charts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1 w-full">
                <Select
                  label="Primary Display Currency"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  <option value="USD">USD ($) — United States Dollar</option>
                  <option value="INR">INR (₹) — Indian Rupee</option>
                  <option value="EUR">EUR (€) — Euro</option>
                  <option value="GBP">GBP (£) — British Pound</option>
                  <option value="CAD">CAD ($) — Canadian Dollar</option>
                  <option value="AUD">AUD ($) — Australian Dollar</option>
                  <option value="JPY">JPY (¥) — Japanese Yen</option>
                </Select>
              </div>
              <div className="flex items-center gap-2 pb-1 min-h-[24px]">
                {isSavingCurrency && (
                  <span className="text-xs text-ink-muted animate-pulse font-medium">Saving...</span>
                )}
                {currencySaved && (
                  <span className="text-xs text-income font-bold flex items-center gap-1">
                    <Check className="w-4 h-4 shrink-0" /> Saved Successfully
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Currency preferences are saved to your account and sync seamlessly across the dashboard, transactions ledger, insight charts, and downloadable CSV financial statements.
            </p>
          </CardContent>
        </Card>

        {/* Section 5: Data Security & Privacy */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
              <span>Data Security & Privacy Architecture</span>
            </CardTitle>
            <CardDescription>How your financial records are isolated and protected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-ink-muted leading-relaxed">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-hairline">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div className="min-w-0">
                <strong className="text-ink font-semibold">Strict Account Isolation: </strong>
                All financial documents (transactions, custom categories, analytics) are strictly keyed to your unique authentication identifier in MongoDB Atlas.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-hairline">
              <ShieldCheck className="w-4 h-4 text-income shrink-0 mt-0.5" />
              <div className="min-w-0">
                <strong className="text-ink font-semibold">Zero External Sharing: </strong>
                No third-party data tracking or external data brokers have access to your personal finance records.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Danger Zone */}
        <Card className="p-4 sm:p-6 border-expense-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-expense text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-expense shrink-0" />
              <span>Danger Zone</span>
            </CardTitle>
            <CardDescription>
              Irreversible actions for resetting transaction history or deleting your entire account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action A: Clear Ledger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-expense-bg border border-expense-border">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-ink">Reset Transaction Ledger</div>
                <div className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  Permanently deletes all logged income, expense, and investment entries. Your account profile and custom category definitions remain intact.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: "RESET TRANSACTION LEDGER?",
                    text: "All income, expense, and investment entries will be permanently deleted.",
                    confirmText: "Yes, Reset Ledger",
                  });
                  if (confirmed) {
                    setIsClearingTx(true);
                    const res = await clearAllUserData();
                    setIsClearingTx(false);
                    if (res.success) {
                      showToast.success("Ledger Reset", res.message);
                      fetchBillingStatus();
                    } else {
                      showToast.error("Error", res.error);
                    }
                  }
                }}
                isLoading={isClearingTx}
                leftIcon={<RefreshCcw className="w-4 h-4 text-expense shrink-0" />}
                className="w-full sm:w-auto shrink-0 border-expense/40 text-expense hover:bg-expense-bg justify-center"
              >
                Reset Ledger
              </Button>
            </div>

            {/* Action B: Account Deletion (GDPR) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-expense-bg border border-expense-border">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-expense">Permanent Account Erasure (GDPR)</div>
                <div className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  Completely purges your user profile, all financial records, and custom categories from the database. Signs out immediately.
                </div>
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteAccount}
                isLoading={isDeleting}
                leftIcon={<Trash2 className="w-4 h-4 shrink-0" />}
                className="w-full sm:w-auto shrink-0 justify-center"
              >
                Delete Everything
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSuccess={fetchBillingStatus}
      />
    </AppShell>
  );
}
