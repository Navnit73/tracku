"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  PanelLeft,
  Sparkles,
  Zap,
  ArrowLeft,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FirstTimeUserGuide } from "@/components/ui/FirstTimeUserGuide";
import { useBilling } from "@/components/providers/BillingProvider";
import { confirmDialog } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Navbar({
  onOpenMobileMenu,
  title = "Dashboard",
  isCollapsed = false,
  onToggleCollapse,
  onOpenNewTransaction,
}: {
  onOpenMobileMenu: () => void;
  title?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenNewTransaction?: () => void;
}) {
  const { data: session } = useSession();
  const { isPremium } = useBilling();
  const pathname = usePathname();
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    }

    // Auto-launch guide for first time users on dashboard
    const hasSeenGuide = localStorage.getItem("expenseliy_guide_completed");
    if (!hasSeenGuide && pathname === "/") {
      const timer = setTimeout(() => setIsGuideOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

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

  const handleSignOutClick = async () => {
    const confirmed = await confirmDialog({
      title: "Sign Out?",
      text: "Are you sure you want to log out of your Expenseliy account?",
      confirmText: "Yes, Sign Out",
      cancelText: "Stay Logged In",
      isDanger: true,
      icon: "question",
    });

    if (confirmed) {
      await signOut({ callbackUrl: "/auth/signin" });
    }
  };

  const handleMobileBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const isSubRoute = pathname !== "/";

  return (
    <>
      <header className="h-14 sm:h-16 sticky top-0 z-30 bg-surface/90 backdrop-blur-md border-b border-hairline px-3 sm:px-6 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
          {/* Mobile Back Button for Sub-routes */}
          {isSubRoute ? (
            <button
              onClick={handleMobileBack}
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas active:scale-95 transition-transform lg:hidden cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center border border-hairline"
              title="Go back"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-ink" />
            </button>
          ) : (
            /* Mobile menu trigger on home */
            <button
              onClick={onOpenMobileMenu}
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-canvas active:scale-95 transition-transform lg:hidden cursor-pointer min-w-[38px] min-h-[38px] flex items-center justify-center"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

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

          <h1 className="text-sm sm:text-lg font-bold text-ink tracking-tight truncate ml-0.5 sm:ml-0">
            {title}
          </h1>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* User Guide Tour Launcher */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="p-2 rounded-xl border border-hairline bg-canvas text-ink-muted hover:text-primary hover:bg-surface active:scale-95 transition-all cursor-pointer min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
            title="Open Quick Start Guide & App Tour"
            aria-label="Open Quick Start Guide"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          {/* Super Admin Quick Link */}
          {session?.user &&
            (session.user.isSuperAdmin ||
              session.user.role === "superadmin" ||
              session.user.role === "admin" ||
              session.user.email?.toLowerCase() === "navnitrai5389@gmail.com") && (
              <Link href="/admin">
                <Badge
                  variant="primary"
                  size="sm"
                  className="hidden sm:inline-flex items-center gap-1 font-extrabold text-[10px] tracking-wide hover:scale-105 transition-transform cursor-pointer shadow-xs"
                  title="Open Super Admin Portal"
                >
                  <ShieldAlert className="w-3 h-3" /> ADMIN
                </Badge>
              </Link>
            )}

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
            className="p-2 rounded-xl border border-hairline bg-canvas text-ink hover:bg-surface active:scale-95 transition-all cursor-pointer min-w-[36px] sm:min-w-[40px] min-h-[36px] sm:min-h-[40px] flex items-center justify-center"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-primary" />
            )}
          </button>

          {/* User Account / Auth */}
          {session?.user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border border-hairline bg-canvas">
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
                onClick={handleSignOutClick}
                title="Sign Out"
                aria-label="Sign Out"
                className="px-2.5 h-8.5 sm:h-9 hover:text-expense hover:border-expense/40"
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

      {/* Interactive Quick Start Onboarding Guide */}
      <FirstTimeUserGuide
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onOpenNewTransaction={onOpenNewTransaction}
      />
    </>
  );
}
