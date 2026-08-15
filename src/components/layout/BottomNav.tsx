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
  Brain,
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
  { name: "Insights", href: "/insights", icon: Brain },
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
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />

          <div className="relative bg-surface border-t border-hairline rounded-t-3xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl z-10 space-y-4 animate-in slide-in-from-bottom duration-250">
            {/* Sheet Handle */}
            <div className="w-12 h-1 bg-ink-muted/30 rounded-full mx-auto -mt-1 mb-1" />

            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <span className="font-bold text-base text-ink">
                All Modules
              </span>
              <button
                onClick={() => setMoreOpen(false)}
                className="p-1.5 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas cursor-pointer"
                aria-label="Close menu"
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
                      "flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-98 min-h-[48px]",
                      isActive
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-xs"
                        : "border-hairline bg-canvas text-ink hover:bg-surface"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl shrink-0",
                        isActive
                          ? "bg-primary text-white"
                          : "bg-surface text-ink-muted"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-semibold truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-hairline flex gap-2">
              <button
                onClick={() => {
                  setMoreOpen(false);
                  onOpenSidebar();
                }}
                className="flex-1 py-3 rounded-xl border border-hairline bg-canvas text-xs font-bold text-ink-muted hover:text-ink flex items-center justify-center gap-2 cursor-pointer active:scale-98 min-h-[44px]"
              >
                <Menu className="w-4 h-4" /> Open Full Sidebar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button for New Transaction (Mobile) */}
      {onOpenNewTransaction && (
        <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] right-4 z-30 lg:hidden">
          <button
            onClick={onOpenNewTransaction}
            className="flex items-center gap-2 px-4 py-3 rounded-full bg-primary hover:bg-primary-active text-white font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            aria-label="New Transaction"
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs tracking-wide">Add Entry</span>
          </button>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-surface/90 backdrop-blur-md border-t border-hairline h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] px-2 flex items-center justify-around shadow-lg">
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
                "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors relative min-h-[44px]",
                isActive
                  ? "text-primary font-bold"
                  : "text-ink-muted hover:text-ink"
              )}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  isActive && "scale-110"
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-1 gap-1 text-[11px] font-medium transition-colors relative cursor-pointer min-h-[44px]",
            isMoreActive || moreOpen
              ? "text-primary font-bold"
              : "text-ink-muted hover:text-ink"
          )}
          aria-label="Open More Menu"
        >
          {(isMoreActive || moreOpen) && (
            <span className="absolute top-0 w-8 h-0.5 bg-primary rounded-full" />
          )}
          <Menu className={cn("w-5 h-5", (isMoreActive || moreOpen) && "scale-110")} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}

