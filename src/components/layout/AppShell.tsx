"use client";

import React, { useState, ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

export function AppShell({
  children,
  title,
}: {
  children: ReactNode;
  title?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

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
