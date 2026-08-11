"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  TrendingDown,
  Tag,
  Menu,
  TrendingUp,
  LineChart,
  FileSpreadsheet,
  Settings,
  X,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Expenses", href: "/expenses", icon: TrendingDown },
  { name: "Categories", href: "/categories", icon: Tag },
];

const MORE_NAV = [
  { name: "Income", href: "/income", icon: TrendingUp },
  { name: "Investments", href: "/investments", icon: LineChart },
  { name: "Reports", href: "/reports", icon: FileSpreadsheet },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function BottomNav({
  onOpenSidebar,
  onOpenNewTransaction,
}: {
  onOpenSidebar: () => void;
  onOpenNewTransaction?: () => void;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isMoreActive = MORE_NAV.some(
    (item) => pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
  );

  return (
    <>
      {/* Quick Access Slide-Up Sheet for "More" */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setMoreOpen(false)}
          />

          <div className="relative bg-[#ffffff] dark:bg-[#202020] border-t border-[#e6e6e6] dark:border-[#2f2f2f] rounded-t-3xl p-5 shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-[#e6e6e6] dark:border-[#2f2f2f] pb-3">
              <span className="font-bold text-base text-[#171717] dark:text-[#f7f7f7]">
                More Navigation
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1 rounded-full text-[#615d59] dark:text-[#9b9b9b] hover:bg-[#f6f5f4] dark:hover:bg-[#2a2a2a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {MORE_NAV.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all active:scale-98",
                      isActive
                        ? "bg-[#0075de]/10 border-[#0075de] text-[#0075de] dark:text-[#3894ec] font-semibold"
                        : "border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#f6f5f4] dark:bg-[#191919] text-[#171717] dark:text-[#f7f7f7] hover:bg-[#e6e6e6] dark:hover:bg-[#252525]"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl",
                        isActive
                          ? "bg-[#0075de] text-white"
                          : "bg-white dark:bg-[#282828] text-[#615d59] dark:text-[#9b9b9b]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#e6e6e6] dark:border-[#2f2f2f] flex gap-2">
              <button
                onClick={() => {
                  setMoreOpen(false);
                  onOpenSidebar();
                }}
                className="flex-1 py-3 rounded-xl border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#f6f5f4] dark:bg-[#191919] text-xs font-semibold text-[#615d59] dark:text-[#9b9b9b] flex items-center justify-center gap-2"
              >
                <Menu className="w-4 h-4" /> Open Full Sidebar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for New Transaction (Mobile) */}
      {onOpenNewTransaction && (
        <div className="fixed bottom-20 right-4 z-30 lg:hidden">
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-[#0075de] hover:bg-[#005bab] text-white font-semibold shadow-lg shadow-[#0075de]/30 active:scale-95 transition-all cursor-pointer"
            aria-label="New Transaction"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs tracking-wide">Add</span>
          </button>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#ffffff]/90 dark:bg-[#1c1c1c]/90 backdrop-blur-md border-t border-[#e6e6e6] dark:border-[#2f2f2f] h-16 px-2 flex items-center justify-around shadow-lg">
        {PRIMARY_NAV.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors relative",
                isActive
                  ? "text-[#0075de] dark:text-[#3894ec] font-bold"
                  : "text-[#615d59] dark:text-[#9b9b9b] hover:text-[#171717] dark:hover:text-[#f7f7f7]"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#0075de] rounded-full" />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors relative cursor-pointer",
            isMoreActive || moreOpen
              ? "text-[#0075de] dark:text-[#3894ec] font-bold"
              : "text-[#615d59] dark:text-[#9b9b9b] hover:text-[#171717] dark:hover:text-[#f7f7f7]"
          )}
        >
          {(isMoreActive || moreOpen) && (
            <span className="absolute top-0 w-8 h-0.5 bg-[#0075de] rounded-full" />
          )}
          <Menu className={cn("w-5 h-5", (isMoreActive || moreOpen) && "scale-110")} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
