"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  RefreshCw,
  Download,
  Users,
  Activity,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { exportAdminUsersCsv } from "@/app/actions/admin";
import { showToast } from "@/lib/toast";

interface AdminHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  totalUsers?: number;
  activeToday?: number;
}

export function AdminHeader({
  onRefresh,
  isLoading,
  totalUsers = 0,
  activeToday = 0,
}: AdminHeaderProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCsv = async () => {
    try {
      setIsExporting(true);
      const res = await exportAdminUsersCsv();
      if (!res.success || !res.csv) {
        showToast.error("Export Failed", res.error || "Failed to generate CSV export.");
        return;
      }

      // Create download link
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", res.filename || "users_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast.success("Success", "User metrics exported successfully!");
    } catch {
      showToast.error("Export Error", "An unexpected error occurred during CSV export.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-hairline">
      {/* Title & Badge */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-ink tracking-tight">
                Super Admin Center
              </h1>
              <Badge variant="primary" size="sm" className="font-extrabold tracking-wide uppercase text-[10px]">
                <Sparkles className="w-3 h-3 mr-1" /> Root Access
              </Badge>
            </div>
            <p className="text-xs text-ink-muted">
              Live platform monitoring, user ledger metrics, subscription health, and AI workload.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons & Quick Stats */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Real-time users badge */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border border-hairline bg-canvas text-xs font-semibold text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <strong className="text-ink">{totalUsers.toLocaleString()}</strong> Users
          </span>
          <span className="w-1 h-1 rounded-full bg-hairline-strong" />
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-income" />
            <strong className="text-income">{activeToday}</strong> Active Today
          </span>
        </div>

        {/* Refresh button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-primary" : ""}`} />}
          className="h-9 text-xs"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </Button>

        {/* CSV Export Button */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleExportCsv}
          disabled={isExporting}
          leftIcon={<Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />}
          className="h-9 text-xs font-bold"
        >
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
      </div>
    </div>
  );
}
