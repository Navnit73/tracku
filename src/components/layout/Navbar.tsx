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
    // Check saved theme in localStorage (default is light)
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove("dark");
      setIsDarkMode(false);
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
    <header className="h-14 sm:h-16 sticky top-0 z-30 bg-surface/85 backdrop-blur-md border-b border-hairline px-3.5 sm:px-6 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 rounded-xl text-ink-muted hover:bg-canvas active:scale-95 transition-transform lg:hidden cursor-pointer"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base sm:text-lg font-bold text-ink tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl border border-hairline bg-canvas text-ink hover:bg-hairline transition-colors cursor-pointer"
          title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
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
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-hairline bg-canvas">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-5 h-5 rounded-full"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-primary" />
              )}
              <span className="text-xs font-semibold text-ink hidden sm:inline">
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
