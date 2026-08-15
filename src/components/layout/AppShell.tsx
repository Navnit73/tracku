"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  title,
  onOpenNewTransaction,
}: {
  children: ReactNode;
  title?: string;
  onOpenNewTransaction?: () => void;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Initialize and persist collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebarCollapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebarCollapsed", String(next));
      return next;
    });
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink">
        <div className="p-3 rounded-2xl bg-primary text-white shadow-lg animate-pulse">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-ink-muted">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          Verifying session...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-canvas text-ink flex relative">
      {/* Collapsible Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main Content Workspace with dynamic left padding */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
          isCollapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <Navbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          title={title}
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenSidebar={() => setMobileOpen(true)}
        onOpenNewTransaction={onOpenNewTransaction}
      />
    </div>
  );
}

