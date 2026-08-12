"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { deleteUserAccountAndData, getUserCurrency, updateUserCurrency } from "@/app/actions/user";
import { clearAllUserData } from "@/app/actions/transactions";
import { showToast, confirmDialog } from "@/lib/toast";
import { Settings as SettingsIcon, Globe, User, LogOut, ShieldCheck, Trash2, AlertTriangle, Check, RefreshCcw } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("USD");
  const [isSavingCurrency, setIsSavingCurrency] = useState(false);
  const [currencySaved, setCurrencySaved] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearingTx, setIsClearingTx] = useState(false);

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
      <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl">
        <div className="bg-surface p-3.5 sm:p-4 rounded-2xl border border-hairline ">
          <h2 className="text-lg sm:text-xl font-bold text-ink tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-primary" />
            Application Settings
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure currency formatting, region preferences, and authenticated user account
          </p>
        </div>

        {/* User Account Profile */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Google Account Profile
            </CardTitle>
            <CardDescription>Authenticated user session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-canvas border border-hairline">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Google User"}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-primary shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-base sm:text-lg shrink-0">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-ink truncate">
                    {session?.user?.name || "Google Authenticated User"}
                  </div>
                  <div className="text-xs text-ink-muted truncate">
                    {session?.user?.email || "No email associated"}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4" />}
                className="w-full sm:w-auto"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Locale Preferences */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-income" />
              Currency Formatting
            </CardTitle>
            <CardDescription>Formatting for transaction amounts and display symbols</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <Select
                  label="Primary Display Currency"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                  <option value="JPY">JPY (¥) - Japanese Yen</option>
                </Select>
              </div>
              {isSavingCurrency && (
                <span className="text-xs text-ink-muted animate-pulse pb-2">Saving...</span>
              )}
              {currencySaved && (
                <span className="text-xs text-income flex items-center gap-1 pb-2">
                  <Check className="w-3.5 h-3.5" /> Saved
                </span>
              )}
            </div>
            <p className="text-xs text-ink-muted">
              Changes apply immediately across all pages and reports.
            </p>
          </CardContent>
        </Card>

        {/* Data Security Note */}
        <Card className="p-4 sm:p-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-income" />
              Data Isolation & Security
            </CardTitle>
            <CardDescription>Database security protocol</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-ink-muted leading-relaxed">
            Your transactions and custom categories are associated directly with your Google user ID in MongoDB Atlas. No other user can read or modify your financial data.
          </CardContent>
        </Card>

        {/* Danger Zone: Data Reset & Account Erasure */}
        <Card className="p-4 sm:p-6 border-expense/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-expense">
              <AlertTriangle className="w-4 h-4 text-expense" />
              Danger Zone: Data Reset & Account Erasure
            </CardTitle>
            <CardDescription>
              Clear transaction ledger or permanently delete your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-expense-bg border border-expense/20">
              <div>
                <div className="text-sm font-bold text-ink">Clear All Transactions</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  Deletes all income, expense, and investment records so you can test with new data. Keeps account & categories intact.
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const confirmed = await confirmDialog({
                    title: "CLEAR ALL TRANSACTIONS?",
                    text: "All income, expense, and investment entries will be permanently deleted.",
                    confirmText: "Yes, Clear All Transactions",
                  });
                  if (confirmed) {
                    setIsClearingTx(true);
                    const res = await clearAllUserData();
                    setIsClearingTx(false);
                    if (res.success) {
                      showToast.success("Cleared", res.message);
                    } else {
                      showToast.error("Error", res.error);
                    }
                  }
                }}
                isLoading={isClearingTx}
                leftIcon={<RefreshCcw className="w-4 h-4 text-expense" />}
                className="w-full sm:w-auto shrink-0 border-expense/40 text-expense"
              >
                Clear All Transactions
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3.5 rounded-xl bg-expense-bg border border-expense/20">
              <div>
                <div className="text-sm font-bold text-expense">Delete Account & All Data (GDPR)</div>
                <div className="text-xs text-ink-muted mt-0.5">
                  Purges user profile, transactions, custom categories, and signs out immediately.
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
                Delete Account & All Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
