"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { Menu, Sun, Moon, LogIn, LogOut, User as UserIcon, PanelLeft, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

export function Navbar({
  onOpenMobileMenu,
  title = "Dashboard",
  isCollapsed = false,
  onToggleCollapse,
}: {
  onOpenMobileMenu: () => void;
  title?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { data: session } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isPremium, setIsPremium] = useState<boolean | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    // Check premium status
    if (session?.user) {
      fetch("/api/billing/status")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setIsPremium(data.isPremium);
          }
        })
        .catch(() => {});
    }
  }, [session]);

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDarkMode(true);
    }
  };

  return (
    <header className="h-14 sm:h-16 sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-hairline px-3.5 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile menu trigger */}
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas active:scale-95 transition-transform lg:hidden cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Sidebar Collapse / Expand Trigger */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas active:scale-95 transition-all cursor-pointer min-w-[40px] min-h-[40px] items-center justify-center border border-hairline"
            title={isCollapsed ? "Expand Sidebar (w-64)" : "Collapse Sidebar (w-20)"}
            aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <PanelLeft className={cn("w-4 h-4 transition-transform", isCollapsed && "text-primary")} />
          </button>
        )}

        <h1 className="text-base sm:text-lg font-bold text-ink tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Plan status / Upgrade link */}
        {session?.user && (
          <>
            {isPremium === true ? (
              <Badge variant="income" size="sm" className="hidden sm:inline-flex items-center gap-1 font-bold">
                <Sparkles className="w-3 h-3" /> PRO
              </Badge>
            ) : isPremium === false ? (
              <Link href="/pricing">
                <Button
                  size="sm"
                  variant="primary"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold py-1.5 h-8.5"
                >
                  <Zap className="w-3.5 h-3.5" /> Upgrade
                </Button>
              </Link>
            ) : null}
          </>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-hairline bg-canvas text-ink hover:bg-surface active:scale-95 transition-all cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4 text-primary" />
          )}
        </button>

        {/* User Account / Auth */}
        {session?.user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-hairline bg-canvas">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs font-bold text-ink hidden sm:inline max-w-[120px] truncate">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              title="Sign Out"
              aria-label="Sign Out"
              className="px-2.5 h-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            onClick={() => signIn()}
            leftIcon={<LogIn className="w-4 h-4" />}
          >
            Sign In
          </Button>
        )}
      </div>
    </header>
  );
}
