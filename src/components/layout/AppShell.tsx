"use client";

import React, { useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { Loader2, Wallet } from "lucide-react";

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
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
      <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#191919] flex flex-col items-center justify-center gap-3 text-[#171717] dark:text-[#f7f7f7]">
        <div className="p-3 rounded-2xl bg-[#0075de] text-white shadow-md animate-pulse">
          <Wallet className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-[#615d59] dark:text-[#9b9b9b]">
          <Loader2 className="w-4 h-4 animate-spin text-[#0075de]" />
          Verifying session...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#191919] text-[#171717] dark:text-[#f7f7f7] flex">
      {/* Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <Navbar onOpenMobileMenu={() => setMobileOpen(true)} title={title} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
