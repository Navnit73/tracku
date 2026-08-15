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
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-200"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Fixed Sleek Dark Executive Styling (immune to light/dark canvas switches) */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 bg-[#0d1714] border-r border-[#1a2d26] text-white flex flex-col transition-all duration-300 ease-in-out shadow-2xl lg:shadow-none select-none",
          mobileOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
          isCollapsed ? "lg:w-20" : "lg:w-64"
        )}
      >
        {/* Brand Header */}
        <div
          className={cn(
            "h-16 flex items-center border-b border-[#1a2d26] shrink-0 transition-all duration-300",
            isCollapsed ? "px-3 justify-center" : "px-5 justify-between"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-3 group transition-all",
              isCollapsed && "justify-center"
            )}
            title="FinanceTrack"
          >
            <div className="w-10 h-10  flex items-center justify-center p-1.5 group-hover:scale-105 transition-transform shrink-0">
              <Image
                src="/asset-management.png"
                alt="FinanceTrack Logo"
                width={28}
                height={28}
                className="w-7 h-7 object-contain drop-shadow"
                priority
              />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0 animate-in fade-in duration-200">
                <span className="font-extrabold text-[15px] tracking-tight text-white leading-tight truncate">
                  FinanceTrack
                </span>
                <span className="text-[10px] text-[#00D27B] font-semibold flex items-center gap-1 mt-0.5">
                  Personal Ledger <Sparkles className="w-2.5 h-2.5 text-[#00D27B] shrink-0" />
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-[#8fa89b] hover:text-white hover:bg-white/10 lg:hidden cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1.5 no-scrollbar">
          {!isCollapsed && (
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-[#527063] select-none animate-in fade-in duration-200">
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
                className={cn(
                  "relative flex items-center rounded-xl transition-all group",
                  isCollapsed
                    ? "justify-center w-11 h-11 mx-auto my-1"
                    : "gap-3 px-3.5 py-2.5 min-h-[42px]",
                  isActive
                    ? "bg-[#00D27B]/15 text-[#00D27B] font-bold border border-[#00D27B]/30 shadow-[0_0_15px_rgba(0,210,123,0.12)]"
                    : "text-[#8fa89b] hover:bg-white/[0.08] hover:text-white border border-transparent"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 transition-transform duration-200 shrink-0",
                    isActive ? "text-[#00D27B] scale-105" : "text-[#8fa89b] group-hover:text-white group-hover:scale-105"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate text-sm font-medium tracking-tight animate-in fade-in duration-200">
                    {item.name}
                  </span>
                )}

                {/* Floating Tooltip in Collapsed Mode */}
                {isCollapsed && (
                  <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-[#14231e] text-white text-xs font-semibold rounded-lg shadow-2xl border border-[#233d32] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                    {item.name}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#14231e]" />
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer with Toggle & System Status */}
        <div
          className={cn(
            "p-3 border-t border-[#1a2d26] text-xs text-[#8fa89b] bg-[#0a1210] shrink-0 flex flex-col gap-2 transition-all duration-300",
            isCollapsed && "items-center px-2"
          )}
        >
          {/* Desktop Collapse / Expand Toggle Button */}
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className={cn(
                "hidden lg:flex items-center gap-2 rounded-xl border border-[#1e342c] bg-white/[0.04] hover:bg-white/[0.09] text-[#8fa89b] hover:text-white transition-all cursor-pointer active:scale-95 group relative",
                isCollapsed ? "w-11 h-11 justify-center p-0" : "w-full justify-between p-2.5"
              )}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {!isCollapsed ? (
                <>
                  <span className="text-xs font-semibold text-white/90">Collapse Menu</span>
                  <PanelLeftClose className="w-4 h-4 text-[#8fa89b] group-hover:text-white transition-colors" />
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4 text-[#00D27B]" />
                  {/* Tooltip for Collapse Toggle */}
                  <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-[#14231e] text-white text-xs font-semibold rounded-lg shadow-2xl border border-[#233d32] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                    Expand Sidebar
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#14231e]" />
                  </div>
                </>
              )}
            </button>
          )}

          {/* System status */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between text-[11px] font-medium px-1 pt-1 text-[#6e8d80]">
              <span>System Status</span>
              <span className="flex items-center gap-1.5 text-[#00D27B] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#00D27B] animate-pulse shadow-[0_0_8px_#00D27B]" />
                Online
              </span>
            </div>
          ) : (
            <div
              className="p-1 text-center relative group cursor-pointer"
              aria-label="System Online"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#00D27B] inline-block animate-pulse shadow-[0_0_8px_#00D27B]" />
              <div className="hidden lg:block absolute left-full ml-3 px-2.5 py-1.5 bg-[#14231e] text-white text-xs font-semibold rounded-lg shadow-2xl border border-[#233d32] whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-1 transition-all duration-150 z-50">
                System Online
                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-[#14231e]" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
