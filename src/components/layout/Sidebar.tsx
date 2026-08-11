"use client";

import React, { useState } from "react";
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
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Investments", href: "/investments", icon: LineChart },
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
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#f6f5f4] dark:bg-[#191919] border-r border-[#e6e6e6] dark:border-[#2f2f2f] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#e6e6e6] dark:border-[#2f2f2f]">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-[#0075de] text-white shadow-xs group-hover:scale-105 transition-transform">
              <Wallet className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[#171717] dark:text-[#f7f7f7] leading-tight">
                FinanceTrack
              </span>
              <span className="text-[10px] text-[#615d59] dark:text-[#9b9b9b] font-medium flex items-center gap-1">
                Notion Ed. <Sparkles className="w-2.5 h-2.5 text-[#0075de]" />
              </span>
            </div>
          </Link>

          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-[#615d59] hover:bg-[#e6e6e6] dark:hover:bg-[#252525] lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#a39e98]">
            Main Menu
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
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all group",
                  isActive
                    ? "bg-[#ffffff] dark:bg-[#252525] text-[#0075de] dark:text-[#3894ec] shadow-xs border border-[#e6e6e6] dark:border-[#2f2f2f]"
                    : "text-[#31302e] dark:text-[#d3d3d3] hover:bg-[#eae9e8] dark:hover:bg-[#222222] hover:text-[#171717] dark:hover:text-[#f7f7f7]"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 transition-colors",
                    isActive
                      ? "text-[#0075de] dark:text-[#3894ec]"
                      : "text-[#615d59] dark:text-[#9b9b9b] group-hover:text-[#171717] dark:group-hover:text-[#f7f7f7]"
                  )}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Footer Status */}
        <div className="p-4 border-t border-[#e6e6e6] dark:border-[#2f2f2f] text-xs text-[#615d59] dark:text-[#9b9b9b]">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span>Server Status</span>
            <span className="flex items-center gap-1.5 text-[#059669]">
              <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
