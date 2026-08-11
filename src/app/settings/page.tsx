"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { seedSampleTransactions } from "@/app/actions/transactions";
import { showToast, confirmDialog } from "@/lib/toast";
import { Settings as SettingsIcon, Moon, Sun, Database, Shield, Globe, User } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("USD");
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    const confirmed = await confirmDialog({
      title: "Populate Sample Financial Data?",
      text: "This will add realistic sample income, expenses, and investments for demonstration purposes.",
      confirmText: "Seed Sample Data",
    });

    if (confirmed) {
      setSeeding(true);
      const res = await seedSampleTransactions();
      setSeeding(false);
      if (res.success) {
        showToast.success("Sample Data Seeded", "Updated workspace with rich transactions.");
      } else {
        showToast.error("Seeding Failed", res.error);
      }
    }
  };

  return (
    <AppShell title="Settings & Preferences">
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0075de]" />
            Application Preferences
          </h2>
          <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
            Configure currency formatting, theme appearance, and database seeds
          </p>
        </div>

        {/* User Account Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0075de]" />
              Account Profile
            </CardTitle>
            <CardDescription>Server session identity details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-4 p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]">
              {session?.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.user.image}
                  alt={session.user.name || "User"}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[#0075de] text-white flex items-center justify-center font-bold">
                  U
                </div>
              )}
              <div>
                <div className="text-base font-bold text-[#171717] dark:text-[#f7f7f7]">
                  {session?.user?.name || "Demo Account"}
                </div>
                <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">
                  {session?.user?.email || "demo@finances.app"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Locale Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#059669]" />
              Currency & Region
            </CardTitle>
            <CardDescription>Formatting for amounts and symbols</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Primary Display Currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="CAD">CAD ($) - Canadian Dollar</option>
              <option value="AUD">AUD ($) - Australian Dollar</option>
              <option value="JPY">JPY (¥) - Japanese Yen</option>
            </Select>
          </CardContent>
        </Card>

        {/* Data Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#7c3aed]" />
              Workspace Data Management
            </CardTitle>
            <CardDescription>Database utilities and testing data</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[#171717] dark:text-[#f7f7f7]">
                Seed Sample Financial Records
              </div>
              <div className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
                Populate realistic transactions to preview charts and analytics immediately.
              </div>
            </div>
            <Button
              onClick={handleSeed}
              isLoading={seeding}
              leftIcon={<Database className="w-4 h-4" />}
            >
              Seed Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
