"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { deleteUserAccountAndData, getUserCurrency, updateUserCurrency } from "@/app/actions/user";
import { clearAllUserData } from "@/app/actions/transactions";
import { showToast, confirmDialog } from "@/lib/toast";
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
  Laptop,
  Sparkles,
  Lock,
} from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("USD");
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingTx, setIsClearingTx] = useState(false);
  const [activeTheme, setActiveTheme] = useState<"light" | "dark">("light");

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

  // Load saved currency from DB on mount
  useEffect(() => {
    (async () => {
      const res = await getUserCurrency();
      if (res.success && res.currency) setCurrency(res.currency);
    })();
  }, []);

  const handleCurrencyChange = useCallback(async (newCurrency: string) => {
    setCurrency(newCurrency);
    setIsSavingCurrency(true);
    setCurrencySaved(false);
    const res = await updateUserCurrency(newCurrency);
    setIsSavingCurrency(false);
    if (res.success) {
      setCurrencySaved(true);
      showToast.success("Currency Updated", `Display currency set to ${newCurrency}.`);
      setTimeout(() => setCurrencySaved(false), 2000);
    } else {
      showToast.error("Failed to Save", res.error);
    }
  }, []);

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

  return (
    <AppShell title="Settings & Preferences">
      <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto w-full">
        {/* Top Header Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-hairline shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-primary" />
              Settings & Preferences
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Manage your personal profile, display theme, currency formats, and security controls
            </p>
          </div>
          <Badge variant="primary" size="md">
            Active Session
          </Badge>
        </div>

        {/* Section 1: User Profile */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="w-4 h-4 text-primary" />
              Profile & Account
            </CardTitle>
            <CardDescription>Your authenticated Google user account details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-canvas border border-hairline">
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Google User"}
                    className="w-12 h-12 rounded-full border-2 border-primary/40 shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg shrink-0 shadow-xs">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-ink truncate">
                    {session?.user?.name || "Authenticated User"}
                  </div>
                  <div className="text-xs text-ink-muted truncate mt-0.5">
                    {session?.user?.email || "No email associated"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-2 h-2 rounded-full bg-income" />
                    <span className="text-[11px] font-semibold text-income">Connected via Google OAuth</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="w-full sm:w-auto shrink-0"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Appearance & Theme */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="w-4 h-4 text-sky-brand" />
              Appearance & Theme
            </CardTitle>
            <CardDescription>Customize the visual interface and dark mode settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Light Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange("light")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                  activeTheme === "light"
                    ? "bg-surface border-primary ring-2 ring-primary/20 shadow-xs"
                    : "bg-canvas border-hairline hover:border-hairline-strong text-ink-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${activeTheme === "light" ? "bg-primary text-white" : "bg-surface text-ink-muted"}`}>
                    <Sun className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">Light Mode</div>
                    <div className="text-xs text-ink-muted mt-0.5">Clean off-white palette</div>
                  </div>
                </div>
                {activeTheme === "light" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>

              {/* Dark Mode Option */}
              <button
                type="button"
                onClick={() => handleThemeChange("dark")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between active:scale-98 ${
                  activeTheme === "dark"
                    ? "bg-surface border-primary ring-2 ring-primary/20 shadow-xs"
                    : "bg-canvas border-hairline hover:border-hairline-strong text-ink-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${activeTheme === "dark" ? "bg-primary text-white" : "bg-surface text-ink-muted"}`}>
                    <Moon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-ink">Dark Mode</div>
                    <div className="text-xs text-ink-muted mt-0.5">Sleek slate green theme</div>
                  </div>
                </div>
                {activeTheme === "dark" && (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Currency & Regional Formatting */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="w-4 h-4 text-income" />
              Currency & Region Preferences
            </CardTitle>
            <CardDescription>Select your primary display currency for ledger records, reports, and charts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="flex-1">
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
              <div className="flex items-center gap-2 pb-1">
                {isSavingCurrency && (
                  <span className="text-xs text-ink-muted animate-pulse font-medium">Saving...</span>
                )}
                {currencySaved && (
                  <span className="text-xs text-income font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Saved Successfully
                  </span>
                )}
              </div>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Currency preferences are saved to your account and sync seamlessly across the dashboard, transactions ledger, insight charts, and downloadable CSV financial statements.
            </p>
          </CardContent>
        </Card>

        {/* Section 4: Data Security & Privacy */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Data Security & Privacy Architecture
            </CardTitle>
            <CardDescription>How your financial records are isolated and protected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-ink-muted leading-relaxed">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-hairline">
              <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-semibold">Strict Account Isolation: </strong>
                All financial documents (transactions, custom categories, analytics) are strictly keyed to your unique authentication identifier in MongoDB Atlas.
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-canvas border border-hairline">
              <ShieldCheck className="w-4 h-4 text-income shrink-0 mt-0.5" />
              <div>
                <strong className="text-ink font-semibold">Zero External Sharing: </strong>
                No third-party data tracking or external data brokers have access to your personal finance records.
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Danger Zone */}
        <Card className="p-4 sm:p-6 border-expense-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-expense text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-expense" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions for resetting transaction history or deleting your entire account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Action A: Clear Ledger */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-expense-bg border border-expense-border">
              <div className="min-w-0">
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
                    } else {
                      showToast.error("Error", res.error);
                    }
                  }
                }}
                isLoading={isClearingTx}
                leftIcon={<RefreshCcw className="w-4 h-4 text-expense" />}
                className="w-full sm:w-auto shrink-0 border-expense/40 text-expense hover:bg-expense-bg"
              >
                Reset Ledger
              </Button>
            </div>

            {/* Action B: Account Deletion (GDPR) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-expense-bg border border-expense-border">
              <div className="min-w-0">
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
                leftIcon={<Trash2 className="w-4 h-4" />}
                className="w-full sm:w-auto shrink-0"
              >
                Delete Everything
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

