"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  User,
  Shield,
  CreditCard,
  Receipt,
  Brain,
  Sparkles,
  Save,
  Lock,
  Unlock,
  FileText,
  Loader2,
  Copy,
  Check,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  getAdminUserDetails,
  updateUserRole,
  toggleUserSuspension,
  toggleUserVipOverride,
  updateUserAdminNotes,
} from "@/app/actions/admin";
import { showToast, confirmDialog } from "@/lib/toast";
import type { UserRole } from "@/models/User";

interface AdminUserDetailModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: () => void;
}

export interface UserDetailData {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: UserRole;
    status: string;
    currency: string;
    isSuperAdmin: boolean;
    isVipOverride: boolean;
    adminNotes?: string;
    loginCount: number;
    lastLoginAt?: string | Date | null;
    createdAt: string | Date;
  };
  financials: {
    totalTransactions: number;
    totalCategories: number;
    expenseTotal: number;
    incomeTotal: number;
    investmentTotal: number;
    netSavings: number;
  };
  subscriptions: Array<{
    id: string;
    razorpaySubscriptionId?: string;
    plan: string;
    planName: string;
    status: string;
    amount: number;
    currency: string;
    currentPeriodStart?: string | Date | null;
    currentPeriodEnd?: string | Date | null;
    cancelAtPeriodEnd?: boolean;
    createdAt: string | Date;
  }>;
  recentTransactions: Array<{
    id: string;
    type: "Expense" | "Income" | "Investment";
    item: string;
    categoryName: string;
    amount: number;
    paymentMethod: string;
    date: string | Date;
  }>;
  aiLogs: Array<{
    date: string | Date;
    requestCount: number;
    totalTokens: number;
    estimatedCost: number;
    lastRequestAt?: string | Date;
  }>;
}

export function AdminUserDetailModal({
  userId,
  isOpen,
  onClose,
  onUserUpdated,
}: AdminUserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "profile" | "usage" | "subscription" | "ai" | "transactions"
  >("profile");
  const [data, setData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("user");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const res = await getAdminUserDetails(userId);
      if (res.success && res.data) {
        setData(res.data as UserDetailData);
        setAdminNotes(res.data.user.adminNotes || "");
        setSelectedRole(res.data.user.role || "user");
      } else {
        showToast.error("Failed", res.error || "Failed to load user details");
      }
    } catch {
      showToast.error("Error", "Error loading user profile");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) {
      void fetchDetails();
      setActiveTab("profile");
    }
  }, [isOpen, userId, fetchDetails]);

  if (!isOpen) return null;

  const handleRoleChange = async () => {
    if (!userId || selectedRole === data?.user.role) return;
    const confirmed = await confirmDialog({
      title: "Update User Role?",
      text: `Are you sure you want to change this user's role to "${selectedRole}"?`,
      confirmText: "Yes, Update Role",
      cancelText: "Cancel",
      icon: "warning",
    });

    if (!confirmed) return;

    setIsUpdatingRole(true);
    try {
      const res = await updateUserRole(userId, selectedRole);
      if (res.success) {
        showToast.success("Success", res.message || "Role updated");
        fetchDetails();
        onUserUpdated?.();
      } else {
        showToast.error("Failed", res.error || "Failed to update role");
      }
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleVipToggle = async () => {
    if (!userId || !data) return;
    const nextVip = !data.user.isVipOverride;
    const confirmed = await confirmDialog({
      title: nextVip ? "Grant Lifetime VIP Pro?" : "Revoke Lifetime VIP Pro?",
      text: nextVip
        ? "This will grant this user permanent Pro features with unlimited transactions and AI access without billing."
        : "This will revoke manual Lifetime VIP access. The user will revert to standard billing/free tier.",
      confirmText: nextVip ? "Grant VIP Access" : "Revoke VIP",
      cancelText: "Cancel",
      icon: "question",
    });

    if (!confirmed) return;

    try {
      const res = await toggleUserVipOverride(userId, nextVip);
      if (res.success) {
        showToast.success("Success", res.message || "VIP status updated");
        fetchDetails();
        onUserUpdated?.();
      } else {
        showToast.error("Failed", res.error || "Failed to toggle VIP");
      }
    } catch {
      showToast.error("Error", "Failed to update VIP status");
    }
  };

  const handleSuspensionToggle = async () => {
    if (!userId || !data) return;
    const isSuspended = data.user.status === "suspended";
    const confirmed = await confirmDialog({
      title: isSuspended ? "Reactivate Account?" : "Suspend User Account?",
      text: isSuspended
        ? "The user will be able to log in and use the application again."
        : "The user will be immediately logged out and blocked from signing in.",
      confirmText: isSuspended ? "Reactivate" : "Suspend Account",
      cancelText: "Cancel",
      isDanger: !isSuspended,
      icon: isSuspended ? "question" : "warning",
    });

    if (!confirmed) return;

    try {
      const res = await toggleUserSuspension(userId, !isSuspended);
      if (res.success) {
        showToast.success("Success", res.message || "Status updated");
        fetchDetails();
        onUserUpdated?.();
      } else {
        showToast.error("Failed", res.error || "Failed to update account status");
      }
    } catch {
      showToast.error("Error", "Failed to change account status");
    }
  };

  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSavingNotes(true);
    try {
      const res = await updateUserAdminNotes(userId, adminNotes);
      if (res.success) {
        showToast.success("Saved", "Admin notes saved");
        fetchDetails();
      } else {
        showToast.error("Failed", res.error || "Failed to save notes");
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleCopyId = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoading || !data) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <span>User Deep Dive & Administrative Controls</span>
          </div>
        }
        maxWidth="4xl"
      >
        <div className="py-16 flex flex-col items-center justify-center gap-3 text-ink-muted">
          {isLoading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm font-semibold">Loading user intelligence & ledger metrics...</p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-ink">Unable to retrieve user ledger details.</p>
              <Button size="sm" variant="outline" onClick={fetchDetails}>
                Retry Fetch
              </Button>
            </>
          )}
        </div>
      </Modal>
    );
  }

  const { user, financials, subscriptions, recentTransactions, aiLogs } = data;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          <span>User Deep Dive & Administrative Controls</span>
        </div>
      }
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Header Identity Bar */}
        <div className="p-4 rounded-2xl bg-canvas border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-surface border border-hairline flex items-center justify-center font-black text-primary text-lg shrink-0 shadow-xs overflow-hidden">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-black text-ink truncate">{user.name}</h2>
                  {user.isSuperAdmin && (
                    <Badge variant="primary" size="sm" className="font-bold">
                      <Shield className="w-3 h-3 mr-1" /> Super Admin
                    </Badge>
                  )}
                  {user.isVipOverride && (
                    <Badge variant="investment" size="sm" className="font-bold">
                      <Sparkles className="w-3 h-3 mr-1" /> VIP Override
                    </Badge>
                  )}
                  {user.status === "suspended" && (
                    <Badge variant="expense" size="sm" className="font-bold">
                      Suspended
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5 flex-wrap">
                  <span className="font-medium">{user.email}</span>
                  <span>•</span>
                  <button
                    onClick={() => handleCopyId(user.id)}
                    className="flex items-center gap-1 hover:text-ink transition-colors cursor-pointer text-[11px]"
                    title="Click to copy User ID"
                  >
                    <span>ID: {user.id.slice(-8)}</span>
                    {copiedId ? (
                      <Check className="w-3 h-3 text-income" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                  <span>•</span>
                  <span>Currency: <strong>{user.currency}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant={user.isVipOverride ? "secondary" : "outline"}
                onClick={handleVipToggle}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                className="text-xs h-8.5 font-bold"
              >
                {user.isVipOverride ? "Revoke VIP" : "Grant Lifetime VIP"}
              </Button>
              <Button
                size="sm"
                variant={user.status === "suspended" ? "primary" : "outline"}
                onClick={handleSuspensionToggle}
                leftIcon={user.status === "suspended" ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5 text-expense" />}
                className={`text-xs h-8.5 ${user.status !== "suspended" ? "hover:text-expense hover:border-expense/40" : ""}`}
              >
                {user.status === "suspended" ? "Reactivate" : "Suspend"}
              </Button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-hairline overflow-x-auto no-scrollbar text-xs font-bold">
            <button
              onClick={() => setActiveTab("profile")}
              className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "profile"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Shield className="w-3.5 h-3.5" /> Profile & Controls
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "usage"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> App Usage ({financials.totalTransactions})
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "subscription"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" /> Subscriptions ({subscriptions.length})
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "ai"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Brain className="w-3.5 h-3.5" /> AI Consumption ({aiLogs.length}d)
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`px-3.5 py-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "transactions"
                  ? "border-primary text-primary"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Receipt className="w-3.5 h-3.5" /> Recent Ledger Log
            </button>
          </div>

          {/* Tab 1: Profile & Administrative Controls */}
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account metadata card */}
                <div className="p-4 rounded-xl border border-hairline bg-surface space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Session & Activity Meta
                  </h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-hairline/60">
                      <span className="text-ink-muted">Account Registered</span>
                      <span className="font-semibold text-ink">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline/60">
                      <span className="text-ink-muted">Total Logins</span>
                      <span className="font-bold text-income">{user.loginCount} times</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-hairline/60">
                      <span className="text-ink-muted">Last Login Timestamp</span>
                      <span className="font-semibold text-ink">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-ink-muted">Account Status</span>
                      <span className={`font-bold ${user.status === "active" ? "text-income" : "text-expense"}`}>
                        {user.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Role Assignment Card */}
                <div className="p-4 rounded-xl border border-hairline bg-surface space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted">
                      Role & Permissions
                    </h4>
                    <p className="text-xs text-ink-muted mt-1">
                      Assign elevated root administrative access to this account.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        className="flex-1 px-3 py-2 rounded-xl border border-hairline bg-canvas text-xs font-bold text-ink focus:outline-hidden focus:ring-1 focus:ring-primary"
                      >
                        <option value="user">Standard User (user)</option>
                        <option value="admin">Administrator (admin)</option>
                        <option value="superadmin">Super Administrator (superadmin)</option>
                      </select>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={handleRoleChange}
                        disabled={isUpdatingRole || selectedRole === user.role}
                        className="h-9 text-xs font-bold"
                      >
                        {isUpdatingRole ? "Saving..." : "Apply Role"}
                      </Button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-canvas border border-hairline text-[11px] text-ink-muted">
                    Super admins have access to this monitoring portal, revenue data, and user management actions.
                  </div>
                </div>
              </div>

              {/* Admin Notes Box */}
              <div className="p-4 rounded-xl border border-hairline bg-surface space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-ink-muted flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Internal Admin Notes & Audit Trail
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    leftIcon={<Save className="w-3.5 h-3.5" />}
                    className="h-8 text-xs"
                  >
                    {isSavingNotes ? "Saving..." : "Save Notes"}
                  </Button>
                </div>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Record customer support notes, reason for suspension, special concessions, or VIP granting notes here..."
                  rows={3}
                  className="w-full p-3 rounded-xl border border-hairline bg-canvas text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-1 focus:ring-primary resize-y"
                />
              </div>
            </div>
          )}

          {/* Tab 2: App Usage & Financials */}
          {activeTab === "usage" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl border border-hairline bg-surface text-center">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Total Transactions</span>
                  <span className="text-xl font-black text-ink">{financials.totalTransactions}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-hairline bg-surface text-center">
                  <span className="text-[10px] uppercase font-bold text-expense block">Total Expense</span>
                  <span className="text-xl font-black text-expense">${financials.expenseTotal.toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-hairline bg-surface text-center">
                  <span className="text-[10px] uppercase font-bold text-income block">Total Income</span>
                  <span className="text-xl font-black text-income">${financials.incomeTotal.toLocaleString()}</span>
                </div>
                <div className="p-3.5 rounded-xl border border-hairline bg-surface text-center">
                  <span className="text-[10px] uppercase font-bold text-investment block">Total Investment</span>
                  <span className="text-xl font-black text-investment">${financials.investmentTotal.toLocaleString()}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-hairline bg-surface flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-ink">Net Savings Ratio</h4>
                  <p className="text-xs text-ink-muted">Net cash flow generated in personal ledger</p>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-black ${financials.netSavings >= 0 ? "text-income" : "text-expense"}`}>
                    ${financials.netSavings.toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-ink-muted">
                    {financials.totalCategories} active categories
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Subscriptions & Billing */}
          {activeTab === "subscription" && (
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <div className="py-8 text-center border border-hairline border-dashed rounded-xl bg-canvas text-xs text-ink-muted">
                  No Razorpay subscription records found for this user.
                  {user.isVipOverride && (
                    <p className="font-bold text-investment mt-1">
                      User has Lifetime VIP Pro manual override enabled.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 rounded-xl border border-hairline bg-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-ink">{sub.planName}</span>
                          <Badge
                            variant={sub.status === "ACTIVE" ? "income" : "neutral"}
                            size="sm"
                            className="font-bold text-[10px]"
                          >
                            {sub.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-muted">
                          Razorpay Sub ID: <code className="font-mono text-ink">{sub.razorpaySubscriptionId || "N/A"}</code>
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                          <span>Amount: <strong>${sub.amount} {sub.currency}</strong></span>
                          <span>•</span>
                          <span>Auto-Renew: {sub.cancelAtPeriodEnd ? "Off (Cancelling)" : "Active"}</span>
                        </div>
                      </div>

                      <div className="text-right text-xs text-ink-muted shrink-0">
                        {sub.currentPeriodEnd && (
                          <div>
                            <span className="block text-[10px]">Current Period End</span>
                            <span className="font-bold text-ink">
                              {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: AI Consumption Logs */}
          {activeTab === "ai" && (
            <div className="space-y-3">
              {aiLogs.length === 0 ? (
                <div className="py-8 text-center border border-hairline border-dashed rounded-xl bg-canvas text-xs text-ink-muted">
                  This user has not executed any DeepSeek AI prompts yet.
                </div>
              ) : (
                <div className="border border-hairline rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2.5 px-4">Date</th>
                        <th className="p-2.5 px-4">AI Prompts</th>
                        <th className="p-2.5 px-4">Total Tokens</th>
                        <th className="p-2.5 px-4">Estimated Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {aiLogs.map((log) => (
                        <tr key={String(log.date)} className="hover:bg-canvas/50">
                          <td className="p-2.5 px-4 font-medium text-ink">
                            {new Date(log.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 px-4 font-bold text-investment">
                            {log.requestCount} requests
                          </td>
                          <td className="p-2.5 px-4 text-ink-muted">
                            {(log.totalTokens || 0).toLocaleString()} tokens
                          </td>
                          <td className="p-2.5 px-4 font-bold text-income">
                            ${(log.estimatedCost || 0).toFixed(4)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 5: Recent Transactions Ledger */}
          {activeTab === "transactions" && (
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="py-8 text-center border border-hairline border-dashed rounded-xl bg-canvas text-xs text-ink-muted">
                  No transactions recorded by this user yet.
                </div>
              ) : (
                <div className="border border-hairline rounded-xl overflow-hidden max-h-[300px] overflow-y-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px] sticky top-0">
                      <tr>
                        <th className="p-2.5 px-4">Date</th>
                        <th className="p-2.5 px-4">Type</th>
                        <th className="p-2.5 px-4">Item / Description</th>
                        <th className="p-2.5 px-4">Category</th>
                        <th className="p-2.5 px-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {recentTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-canvas/50">
                          <td className="p-2.5 px-4 text-ink-muted">
                            {new Date(tx.date).toLocaleDateString()}
                          </td>
                          <td className="p-2.5 px-4">
                            <Badge
                              variant={
                                tx.type === "Expense"
                                  ? "expense"
                                  : tx.type === "Income"
                                  ? "income"
                                  : "investment"
                              }
                              size="sm"
                              className="text-[10px] font-bold"
                            >
                              {tx.type}
                            </Badge>
                          </td>
                          <td className="p-2.5 px-4 font-semibold text-ink">
                            {tx.item}
                          </td>
                          <td className="p-2.5 px-4 text-ink-muted">
                            {tx.categoryName}
                          </td>
                          <td className="p-2.5 px-4 font-black text-right text-ink">
                            ${tx.amount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
    </Modal>
  );
}

