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
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
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
  isCollapsed = false,
  onToggleCollapse,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
          "fixed top-0 bottom-0 left-0 z-50 bg-canvas border-r border-hairline flex flex-col transition-all duration-300 ease-in-out shadow-xl lg:shadow-none",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-hairline shrink-0 transition-all duration-300",
            isCollapsed ? "px-3 justify-center" : "px-5 justify-between"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2.5 group transition-all",
              isCollapsed && "justify-center"
            )}
            title="FinanceTrack"
          >
            <div className="p-2 rounded-xl bg-primary text-white  group-hover:scale-105 transition-transform shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
                <span className="font-extrabold text-base tracking-tight text-ink leading-tight truncate">
                  FinanceTrack
                </span>
                <span className="text-[10px] text-ink-muted font-semibold flex items-center gap-1">
                  Personal Ledger <Sparkles className="w-2.5 h-2.5 text-primary shrink-0" />
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
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
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted select-none animate-in fade-in duration-200">
              Navigation
            </div>
          )}
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
                title={item.name}
                className={cn(
                  "flex items-center rounded-xl transition-all group min-h-[44px] relative",
                  isCollapsed
                    ? "justify-center px-2.5 py-2.5"
                    : "gap-3 px-3.5 py-2.5",
                  isActive
                    ? "bg-surface text-primary border border-hairline  font-bold"
                    : "text-ink-muted hover:bg-surface/60 hover:text-ink"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-colors shrink-0",
                    isActive
                      ? "text-primary"
                      : "text-ink-muted group-hover:text-ink"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate text-sm font-semibold animate-in fade-in duration-200">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer with Toggle & System Status */}
        <div
          className={cn(
            "p-3 border-t border-hairline text-xs text-ink-muted bg-surface/50 shrink-0 flex flex-col gap-2 transition-all duration-300",
            isCollapsed && "items-center"
          )}
        >
          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex items-center gap-2 p-2.5 rounded-xl border border-hairline bg-canvas hover:bg-surface text-ink-muted hover:text-ink transition-all cursor-pointer  active:scale-95",
                isCollapsed ? "w-10 h-10 justify-center p-0" : "w-full justify-between"
              )}
              title={isCollapsed ? "Expand sidebar (shortcut)" : "Collapse sidebar"}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {!isCollapsed ? (
                <>
                  <span className="text-xs font-bold text-ink">Collapse Menu</span>
                  <PanelLeftClose className="w-4 h-4 text-ink-muted" />
                </>
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-primary" />
              )}
            </button>
          )}

          {/* System status */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] font-semibold px-1 pt-1">
              <span>System Status</span>
              <span className="flex items-center gap-1.5 text-income font-bold">
                <span className="w-2 h-2 rounded-full bg-income animate-pulse" />
                Connected
              </span>
            </div>
          ) : (
            <div
              className="p-1 text-center"
              title="System Connected"
              aria-label="System Connected"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-income inline-block animate-pulse" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}


