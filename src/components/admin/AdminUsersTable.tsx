"use client";

import React, { useState, useCallback } from "react";
import {
  Search,
  Shield,
  Sparkles,
  Receipt,
  Brain,
  Eye,
  Lock,
  Unlock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AdminUserDetailModal } from "./AdminUserDetailModal";
import { toggleUserVipOverride, toggleUserSuspension } from "@/app/actions/admin";
import { showToast, confirmDialog } from "@/lib/toast";
import type {
  AdminUserListItem,
  AdminUsersFilterParams,
} from "@/app/actions/admin";

interface AdminUsersTableProps {
  users: AdminUserListItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: AdminUsersFilterParams;
  onFilterChange: (newFilters: Partial<AdminUsersFilterParams>) => void;
  onUserUpdated: () => void;
  isLoading?: boolean;
}

export function AdminUsersTable({
  users,
  pagination,
  filters,
  onFilterChange,
  onUserUpdated,
  isLoading = false,
}: AdminUsersTableProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handleOpenDetail = useCallback((userId: string) => {
    setSelectedUserId(userId);
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  const handleQuickVip = async (user: AdminUserListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextVip = !user.isVipOverride;
    const confirmed = await confirmDialog({
      title: nextVip ? "Grant Lifetime VIP?" : "Revoke Lifetime VIP?",
      text: nextVip
        ? `Grant unlimited Pro access to ${user.name} (${user.email})?`
        : `Revoke Lifetime VIP override for ${user.name}?`,
      confirmText: nextVip ? "Grant VIP" : "Revoke VIP",
      cancelText: "Cancel",
      icon: "question",
    });

    if (!confirmed) return;

    try {
      const res = await toggleUserVipOverride(user.id, nextVip);
      if (res.success) {
        showToast.success("Success", res.message || "VIP updated");
        onUserUpdated();
      } else {
        showToast.error("Failed", res.error || "Failed to update VIP");
      }
    } catch {
      showToast.error("Error", "Error updating VIP status");
    }
  };

  const handleQuickSuspend = async (user: AdminUserListItem, e: React.MouseEvent) => {
    e.stopPropagation();
    const isSuspended = user.status === "suspended";
    const confirmed = await confirmDialog({
      title: isSuspended ? "Reactivate Account?" : "Suspend Account?",
      text: isSuspended
        ? `Reactivate login access for ${user.name}?`
        : `Suspend ${user.name}? The user will be immediately logged out.`,
      confirmText: isSuspended ? "Reactivate" : "Suspend Account",
      cancelText: "Cancel",
      isDanger: !isSuspended,
      icon: isSuspended ? "question" : "warning",
    });

    if (!confirmed) return;

    try {
      const res = await toggleUserSuspension(user.id, !isSuspended);
      if (res.success) {
        showToast.success("Success", res.message || "Status updated");
        onUserUpdated();
      } else {
        showToast.error("Failed", res.error || "Failed to update status");
      }
    } catch {
      showToast.error("Error", "Error updating account status");
    }
  };

  return (
    <Card className="border-hairline bg-surface shadow-xs overflow-hidden">
      {/* Search & Filter Header Bar */}
      <div className="p-4 border-b border-hairline flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={filters.search || ""}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            placeholder="Search by user name or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-hairline bg-canvas text-xs text-ink placeholder:text-ink-muted focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Plan Filter */}
          <select
            value={filters.plan || "all"}
            onChange={(e) =>
              onFilterChange({
                plan: e.target.value as AdminUsersFilterParams["plan"],
                page: 1,
              })
            }
            className="px-3 py-2 rounded-xl border border-hairline bg-canvas font-semibold text-ink focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Plans</option>
            <option value="FREE">Free Tier (40 Limit)</option>
            <option value="MONTHLY">Monthly Pro</option>
            <option value="YEARLY">Annual Pro</option>
            <option value="LIFETIME_VIP">Lifetime VIP Pro</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status || "all"}
            onChange={(e) =>
              onFilterChange({
                status: e.target.value as AdminUsersFilterParams["status"],
                page: 1,
              })
            }
            className="px-3 py-2 rounded-xl border border-hairline bg-canvas font-semibold text-ink focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          {/* Role Filter */}
          <select
            value={filters.role || "all"}
            onChange={(e) =>
              onFilterChange({
                role: e.target.value as AdminUsersFilterParams["role"],
                page: 1,
              })
            }
            className="px-3 py-2 rounded-xl border border-hairline bg-canvas font-semibold text-ink focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="user">Users</option>
            <option value="admin">Admins</option>
            <option value="superadmin">Super Admins</option>
          </select>

          {/* Sort By */}
          <select
            value={filters.sortBy || "createdAt"}
            onChange={(e) =>
              onFilterChange({
                sortBy: e.target.value as AdminUsersFilterParams["sortBy"],
                page: 1,
              })
            }
            className="px-3 py-2 rounded-xl border border-hairline bg-canvas font-semibold text-ink focus:outline-hidden focus:ring-1 focus:ring-primary cursor-pointer"
          >
            <option value="createdAt">Newest Joined</option>
            <option value="lastLoginAt">Last Active / Login</option>
            <option value="loginCount">Most Logins</option>
            <option value="transactionCount">Most Transactions</option>
            <option value="aiTokens">Most AI Tokens</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>
      </div>


      {/* Interactive Users Data Table */}
      <div className="overflow-x-auto no-scrollbar">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-canvas border-b border-hairline text-ink-muted uppercase font-bold text-[10px] tracking-wider select-none">
            <tr>
              <th className="p-3.5 px-4 font-bold">User Identity</th>
              <th className="p-3.5 px-4 font-bold">Role & Status</th>
              <th className="p-3.5 px-4 font-bold">Subscription Tier</th>
              <th className="p-3.5 px-4 font-bold">Ledger Usage</th>
              <th className="p-3.5 px-4 font-bold">AI Prompts</th>
              <th className="p-3.5 px-4 font-bold">Last Activity</th>
              <th className="p-3.5 px-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-ink-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading users directory...</span>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-ink-muted">
                  <div className="max-w-xs mx-auto space-y-1">
                    <p className="font-bold text-ink">No users match your criteria</p>
                    <p className="text-xs">Try adjusting your search keywords or filter dropdowns.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSuper = user.isSuperAdmin;
                const isVip = user.subscription.isVip;

                return (
                  <tr
                    key={user.id}
                    onClick={() => handleOpenDetail(user.id)}
                    className="hover:bg-canvas/60 transition-colors cursor-pointer group"
                  >
                    {/* 1. Identity */}
                    <td className="p-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-canvas border border-hairline flex items-center justify-center font-bold text-primary shrink-0 shadow-2xs overflow-hidden">
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-ink truncate max-w-[140px] sm:max-w-[180px] group-hover:text-primary transition-colors">
                              {user.name}
                            </span>
                            {isSuper && (
                              <span title="Super Admin">
                                <Shield className="w-3.5 h-3.5 text-primary shrink-0" />
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-ink-muted block truncate max-w-[150px] sm:max-w-[200px]">
                            {user.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Role & Status */}
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <Badge
                          variant={
                            user.role === "superadmin" || user.role === "admin"
                              ? "primary"
                              : "neutral"
                          }
                          size="sm"
                          className="font-bold text-[10px]"
                        >
                          {user.role}
                        </Badge>
                        {user.status === "suspended" ? (
                          <Badge variant="expense" size="sm" className="font-bold text-[9px]">
                            Suspended
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-income font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-income inline-block" /> Active
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Subscription */}
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        {isVip ? (
                          <Badge variant="investment" size="sm" className="font-bold text-[10px]">
                            <Sparkles className="w-2.5 h-2.5 mr-1" /> Lifetime VIP
                          </Badge>
                        ) : user.subscription.plan === "MONTHLY" ? (
                          <Badge variant="income" size="sm" className="font-bold text-[10px]">
                            Monthly Pro
                          </Badge>
                        ) : user.subscription.plan === "YEARLY" ? (
                          <Badge variant="income" size="sm" className="font-bold text-[10px]">
                            Annual Pro
                          </Badge>
                        ) : (
                          <Badge variant="neutral" size="sm" className="text-[10px]">
                            Free Tier
                          </Badge>
                        )}
                        {user.subscription.currentPeriodEnd && (
                          <span className="block text-[10px] text-ink-muted">
                            Exp: {new Date(user.subscription.currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 4. Ledger Usage */}
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-ink-muted" />
                          <span className="font-bold text-ink">
                            {user.usage.transactionCount} entries
                          </span>
                        </div>
                        <span className="block text-[10px] text-ink-muted">
                          Vol: ${(user.usage.totalExpense + user.usage.totalIncome).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* 5. AI Consumption */}
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Brain className="w-3.5 h-3.5 text-investment" />
                          <span className="font-bold text-investment">
                            {user.usage.aiRequests} prompts
                          </span>
                        </div>
                        <span className="block text-[10px] text-ink-muted">
                          {(user.usage.aiTokens / 1000).toFixed(1)}k tokens (${user.usage.aiCost.toFixed(3)})
                        </span>
                      </div>
                    </td>

                    {/* 6. Last Activity */}
                    <td className="p-3.5 px-4 whitespace-nowrap">
                      <div className="space-y-0.5 text-[11px]">
                        <span className="text-ink font-medium block">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })
                            : "Never logged in"}
                        </span>
                        <span className="text-[10px] text-ink-muted block">
                          {user.loginCount} login{user.loginCount === 1 ? "" : "s"}
                        </span>
                      </div>
                    </td>

                    {/* 7. Quick Actions */}
                    <td className="p-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Deep Dive */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenDetail(user.id)}
                          title="View User Intelligence & Controls"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>

                        {/* Quick VIP Toggle */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleQuickVip(user, e)}
                          title={user.isVipOverride ? "Revoke VIP Pro" : "Grant Lifetime VIP Pro"}
                          className={`h-8 w-8 p-0 ${user.isVipOverride ? "text-investment" : "text-ink-muted"}`}
                        >
                          <Sparkles className="w-4 h-4" />
                        </Button>

                        {/* Quick Suspend Toggle */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => handleQuickSuspend(user, e)}
                          title={user.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
                          className={`h-8 w-8 p-0 ${user.status === "suspended" ? "text-expense" : "text-ink-muted hover:text-expense"}`}
                        >
                          {user.status === "suspended" ? <Unlock className="w-4 h-4 text-expense" /> : <Lock className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-4 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-ink-muted bg-surface">
        <div>
          Showing{" "}
          <strong className="text-ink">
            {users.length > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0}
          </strong>{" "}
          to{" "}
          <strong className="text-ink">
            {Math.min(pagination.page * pagination.limit, pagination.total)}
          </strong>{" "}
          of <strong className="text-ink">{pagination.total}</strong> users
        </div>

        <div className="flex items-center gap-2">
          {/* Page Limit Selector */}
          <select
            value={pagination.limit}
            onChange={(e) => onFilterChange({ limit: Number(e.target.value), page: 1 })}
            className="px-2 py-1.5 rounded-lg border border-hairline bg-canvas font-semibold text-ink focus:outline-hidden"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Prev / Next buttons */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onFilterChange({ page: Math.max(1, pagination.page - 1) })}
            disabled={pagination.page <= 1 || isLoading}
            className="h-8 px-2.5"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="font-bold text-ink px-1">
            {pagination.page} / {pagination.totalPages}
          </span>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onFilterChange({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
            disabled={pagination.page >= pagination.totalPages || isLoading}
            className="h-8 px-2.5"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* User Detail Slide-over / Modal */}
      <AdminUserDetailModal
        userId={selectedUserId}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onUserUpdated={onUserUpdated}
      />
    </Card>
  );
}
