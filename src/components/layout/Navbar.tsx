"use client";

import React, { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { Menu, Sun, Moon, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Navbar({
  onOpenMobileMenu,
  title = "Dashboard",
}: {
  onOpenMobileMenu: () => void;
  title?: string;
}) {
  const { data: session } = useSession();
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check saved theme in localStorage or OS preference
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else if (savedTheme === "light") {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove("dark");
        setIsDarkMode(false);
      }
    }
  }, []);

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
    <header className="h-14 sm:h-16 sticky top-0 z-30 bg-[#ffffff]/85 dark:bg-[#202020]/85 backdrop-blur-md border-b border-[#e6e6e6] dark:border-[#2f2f2f] px-3.5 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 rounded-xl text-[#615d59] dark:text-[#9b9b9b] hover:bg-[#f6f5f4] dark:hover:bg-[#2e2e2e] active:scale-95 transition-transform lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#f6f5f4] dark:bg-[#191919] text-[#171717] dark:text-[#f7f7f7] hover:bg-[#e6e6e6] dark:hover:bg-[#2c2c2c] transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-[#eab308]" />
          ) : (
            <Moon className="w-4 h-4 text-[#0075de]" />
          )}
        </button>

        {/* User Account / Auth */}
        {session?.user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#f6f5f4] dark:bg-[#191919]">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-[#0075de]" />
              )}
              <span className="text-xs font-semibold text-[#171717] dark:text-[#f7f7f7] hidden sm:inline">
                {session.user.name || session.user.email}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              title="Sign Out"
              className="px-2.5 h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
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
