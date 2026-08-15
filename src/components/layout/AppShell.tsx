"use client";

import React, { useEffect, ReactNode } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { useSidebar } from "@/components/providers/SidebarProvider";
import { Loader2 } from "lucide-react";
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
  const { isCollapsed, toggleCollapse, mobileOpen, setMobileOpen } = useSidebar();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink">
        <div className="p-3  animate-pulse">
          <Image
            src="/asset-management.png"
            alt="FinanceTrack"
            width={40}
            height={40}
            className="w-10 h-10 object-contain drop-shadow"
            priority
          />
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
        onToggleCollapse={toggleCollapse}
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
          onToggleCollapse={toggleCollapse}
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

