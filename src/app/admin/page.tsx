"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Users,
  LayoutDashboard,
  CreditCard,
  Brain,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminStatsOverview } from "@/components/admin/AdminStatsOverview";
import { AdminChartsSection } from "@/components/admin/AdminChartsSection";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminSubscriptionsTab } from "@/components/admin/AdminSubscriptionsTab";
import { AdminAIUsageTab } from "@/components/admin/AdminAIUsageTab";
import {
  getAdminOverviewStats,
  getAdminUsers,
  type AdminOverviewStats,
  type AdminUsersResponse,
  type AdminUsersFilterParams,
} from "@/app/actions/admin";
import { showToast } from "@/lib/toast";

export default function SuperAdminPage() {
  const { data: session, status } = useSession();

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "subscriptions" | "ai"
  >("overview");

  const [overviewStats, setOverviewStats] = useState<AdminOverviewStats | null>(null);
  const [usersData, setUsersData] = useState<AdminUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsersLoading, setIsUsersLoading] = useState(false);

  const [filters, setFilters] = useState<AdminUsersFilterParams>({
    search: "",
    plan: "all",
    status: "all",
    role: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    page: 1,
    limit: 10,
  });

  const isSuperAdmin =
    session?.user?.isSuperAdmin ||
    session?.user?.role === "superadmin" ||
    session?.user?.role === "admin" ||
    session?.user?.email?.toLowerCase() === "navnitrai5389@gmail.com";

  // Fetch overview stats
  const fetchOverview = useCallback(async () => {
    try {
      const res = await getAdminOverviewStats();
      if (res.success && res.data) {
        setOverviewStats(res.data);
      } else if (res.error) {
        showToast.error("Failed", res.error);
      }
    } catch {
      showToast.error("Error", "Failed to load overview metrics");
    }
  }, []);

  // Fetch users table
  const fetchUsers = useCallback(async (currentFilters: AdminUsersFilterParams) => {
    setIsUsersLoading(true);
    try {
      const res = await getAdminUsers(currentFilters);
      if (res.success && res.data) {
        setUsersData(res.data);
      } else if (res.error) {
        showToast.error("Failed", res.error);
      }
    } catch {
      showToast.error("Error", "Failed to load users list");
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  // Initial load
  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchOverview(), fetchUsers(filters)]);
    setIsLoading(false);
  }, [fetchOverview, fetchUsers, filters]);

  useEffect(() => {
    if (status === "authenticated" && isSuperAdmin) {
      loadAll();
    }
  }, [status, isSuperAdmin, loadAll]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<AdminUsersFilterParams>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    fetchUsers(updated);
  };

  // If loading session
  if (status === "loading") {
    return (
      <AppShell title="Super Admin">
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-ink-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-semibold">Verifying administrative security credentials...</p>
        </div>
      </AppShell>
    );
  }

  // Access Denied guard for non-superadmins
  if (!isSuperAdmin) {
    return (
      <AppShell title="Access Denied">
        <div className="py-20 max-w-md mx-auto text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-expense/10 text-expense mx-auto flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-ink">Super Admin Access Required</h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              This area is restricted to root system administrators. Your account (
              <strong className="text-ink">{session?.user?.email}</strong>) does not have elevated permissions.
            </p>
          </div>
          <Link href="/">
            <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Super Admin Command Center">
      <div className="space-y-6">
        {/* Header with quick stats & CSV export */}
        <AdminHeader
          onRefresh={loadAll}
          isLoading={isLoading || isUsersLoading}
          totalUsers={overviewStats?.users.total}
          activeToday={overviewStats?.users.activeToday}
        />

        {/* Primary View Switcher Navigation */}
        <div className="flex items-center gap-2 border-b border-hairline overflow-x-auto no-scrollbar pb-px text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink hover:border-hairline"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Platform Overview & KPIs
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "users"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink hover:border-hairline"
            }`}
          >
            <Users className="w-4 h-4" /> Users Directory & Usage ({overviewStats?.users.total || 0})
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "subscriptions"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink hover:border-hairline"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Subscriptions & Billing ({overviewStats?.subscriptions.totalPaidActive || 0})
          </button>
          <button
            onClick={() => setActiveTab("ai")}
            className={`px-4 py-2.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === "ai"
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink hover:border-hairline"
            }`}
          >
            <Brain className="w-4 h-4" /> DeepSeek AI Platform
          </button>
        </div>

        {/* Tab 1: Overview & Executive Charts */}
        {activeTab === "overview" && overviewStats && (
          <div className="space-y-6">
            <AdminStatsOverview stats={overviewStats} />
            <AdminChartsSection stats={overviewStats} />

            {/* Quick snapshot of latest users */}
            {usersData && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-ink">Recent Users & Activity</h3>
                    <p className="text-xs text-ink-muted">Quick preview of latest registered platform users</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("users")}
                    className="h-8 text-xs font-bold"
                  >
                    View All Users ({overviewStats.users.total})
                  </Button>
                </div>

                <AdminUsersTable
                  users={usersData.users.slice(0, 5)}
                  pagination={{ ...usersData.pagination, limit: 5, totalPages: 1 }}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onUserUpdated={loadAll}
                  isLoading={isUsersLoading}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Users Management & Directory */}
        {activeTab === "users" && usersData && (
          <div className="space-y-4">
            <AdminUsersTable
              users={usersData.users}
              pagination={usersData.pagination}
              filters={filters}
              onFilterChange={handleFilterChange}
              onUserUpdated={loadAll}
              isLoading={isUsersLoading}
            />
          </div>
        )}

        {/* Tab 3: Subscriptions & Razorpay Webhook Logs */}
        {activeTab === "subscriptions" && (
          <AdminSubscriptionsTab />
        )}

        {/* Tab 4: AI Usage Analytics */}
        {activeTab === "ai" && overviewStats && (
          <AdminAIUsageTab stats={overviewStats} />
        )}
      </div>
    </AppShell>
  );
}
