"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  TrendingDown,
  TrendingUp,
  LineChart,
  Tag,
  FileSpreadsheet,
  Settings,
  Wallet,
  X,
  Sparkles,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Investments", href: "/investments", icon: LineChart },
  { name: "Insights", href: "/insights", icon: Brain },
  { name: "Categories", href: "/categories", icon: Tag },
  { name: "Reports", href: "/reports", icon: FileSpreadsheet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-canvas border-r border-hairline flex flex-col transition-transform duration-250 ease-in-out lg:translate-x-0 shadow-xl lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-hairline shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-primary text-white shadow-xs group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-ink leading-tight">
                FinanceTrack
              </span>
              <span className="text-[10px] text-ink-muted font-semibold flex items-center gap-1">
                Personal Ledger <Sparkles className="w-2.5 h-2.5 text-primary" />
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface lg:hidden cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 no-scrollbar">
          <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted select-none">
            Navigation
          </div>
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all group min-h-[44px]",
                  isActive
                    ? "bg-surface text-primary border border-hairline shadow-xs font-bold"
                    : "text-ink-muted hover:bg-surface/60 hover:text-ink"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-ink-muted group-hover:text-ink"
                  )}
                />
                <span className="truncate">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-hairline text-xs text-ink-muted bg-surface/50 shrink-0">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span>System Status</span>
            <span className="flex items-center gap-1.5 text-income font-bold">
              <span className="w-2 h-2 rounded-full bg-income animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}

