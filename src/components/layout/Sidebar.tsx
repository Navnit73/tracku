"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
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
  X,
  Sparkles,
  Brain,
  CreditCard,
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
  { name: "Plans & Pricing", href: "/pricing", icon: CreditCard },
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
      {/* Mobile Backdrop with smooth fade in/out */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ease-in-out",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Container: Deep Executive Midnight Styling (Not white in light theme) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-sidebar-canvas border-r border-sidebar-hairline text-sidebar-ink flex flex-col transition-[width,transform,translate] duration-300 ease-in-out lg:shadow-none select-none overflow-hidden will-change-[width,transform,translate]",
          mobileOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between border-b border-sidebar-hairline shrink-0 px-3.5 bg-sidebar-canvas">
          <Link
            href="/"
            className="flex items-center group min-w-0 flex-1 overflow-hidden"
            title="Expenseliy"
          >
            <div className="w-10 h-10 flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/asset-management.png"
                alt="Expenseliy Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain drop-shadow"
                priority
              />
            </div>
            <div
              className={cn(
                "flex flex-col min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                isCollapsed
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[170px] ml-2.5"
              )}
            >
              <span className="font-extrabold text-[15px] tracking-tight text-sidebar-ink leading-tight truncate">
                Expenseliy
              </span>
              <span className="text-[10px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                Personal Ledger <Sparkles className="w-2.5 h-2.5 text-primary shrink-0" />
              </span>
            </div>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-sidebar-ink-muted hover:text-sidebar-ink hover:bg-sidebar-surface-hover lg:hidden cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors shrink-0"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 no-scrollbar bg-sidebar-canvas">
          <div
            className={cn(
              "px-3 text-[10px] font-bold uppercase tracking-wider text-sidebar-ink-faint select-none transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
              isCollapsed
                ? "opacity-0 max-h-0 mb-0 pointer-events-none"
                : "opacity-100 max-h-6 mb-2"
            )}
          >
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
                  "relative flex items-center w-full h-11 px-3.5 rounded-xl transition-colors duration-200 group overflow-hidden",
                  isActive
                    ? "bg-sidebar-active-bg text-sidebar-active-text font-bold border border-sidebar-active-border shadow-xs"
                    : "text-sidebar-ink-muted hover:bg-sidebar-surface-hover hover:text-sidebar-ink border border-transparent"
                )}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-transform duration-200 shrink-0",
                      isActive
                        ? "text-sidebar-active-text scale-105"
                        : "text-sidebar-ink-muted group-hover:text-sidebar-ink group-hover:scale-105"
                    )}
                  />
                </div>

                <span
                  className={cn(
                    "truncate text-sm font-medium tracking-tight transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                    isCollapsed
                      ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                      : "opacity-100 max-w-[170px] ml-3"
                  )}
                >
                  {item.name}
                </span>

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-sidebar-surface text-sidebar-ink text-xs font-semibold rounded-lg shadow-lg border border-sidebar-hairline whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-sidebar-surface" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer with Toggle & System Status */}
        <div className="p-3 border-t border-sidebar-hairline text-xs text-sidebar-ink-muted bg-sidebar-surface/60 shrink-0 flex flex-col gap-2">
          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden lg:flex items-center w-full h-11 px-3.5 rounded-xl border border-sidebar-hairline bg-sidebar-surface hover:bg-sidebar-surface-hover text-sidebar-ink-muted hover:text-sidebar-ink transition-all cursor-pointer active:scale-95 group relative overflow-hidden"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-primary" />
                ) : (
                  <PanelLeftClose className="w-4 h-4 text-sidebar-ink-muted group-hover:text-sidebar-ink transition-colors" />
                )}
              </div>

              <div
                className={cn(
                  "flex items-center justify-between flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                  isCollapsed
                    ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                    : "opacity-100 max-w-[170px] ml-3"
                )}
              >
                <span className="text-xs font-semibold text-sidebar-ink truncate">Collapse Menu</span>
              </div>

              {/* Tooltip for Collapse Toggle */}
              {isCollapsed && (
                <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-sidebar-surface text-sidebar-ink text-xs font-semibold rounded-lg shadow-lg border border-sidebar-hairline whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                  Expand Sidebar
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-sidebar-surface" />
                </div>
              )}
            </button>
          )}

          {/* System status */}
          <div className="flex items-center w-full h-7 px-3.5 text-[11px] font-medium text-sidebar-ink-muted relative group">
            <div className="w-5 h-5 flex items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-income inline-block animate-pulse" />
            </div>

            <div
              className={cn(
                "flex items-center justify-between flex-1 min-w-0 transition-all duration-300 ease-in-out overflow-hidden whitespace-nowrap",
                isCollapsed
                  ? "opacity-0 max-w-0 ml-0 pointer-events-none"
                  : "opacity-100 max-w-[170px] ml-3"
              )}
            >
              <span>System Status</span>
              <span className="text-income font-semibold">Online</span>
            </div>

            {/* Tooltip for System Status in Collapsed Mode */}
            {isCollapsed && (
              <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-sidebar-surface text-sidebar-ink text-xs font-semibold rounded-lg shadow-lg border border-sidebar-hairline whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                System Online
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-sidebar-surface" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
