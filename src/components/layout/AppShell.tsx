"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { BottomNav } from "./BottomNav";
import { Loader2, Wallet } from "lucide-react";

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center gap-3 text-ink">
        <div className="p-3 rounded-2xl bg-primary text-white  animate-pulse">
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
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} title={title} />
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
