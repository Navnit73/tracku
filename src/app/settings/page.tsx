"use client";

import React, { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Settings as SettingsIcon, Globe, User, LogOut, ShieldCheck } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [currency, setCurrency] = useState("USD");

  return (
    <AppShell title="Settings & Preferences">
      <div className="flex flex-col gap-6 max-w-4xl">
        <div className="bg-[#ffffff] dark:bg-[#202020] p-4 rounded-2xl border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs">
          <h2 className="text-xl font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#0075de]" />
            Application Settings
          </h2>
          <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
            Configure currency formatting, region preferences, and authenticated user account
          </p>
        </div>

        {/* User Account Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0075de]" />
              Google Account Profile
            </CardTitle>
            <CardDescription>Authenticated user session details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]">
              <div className="flex items-center gap-4">
                {session?.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Google User"}
                    className="w-12 h-12 rounded-full border border-[#0075de]"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#0075de] text-white flex items-center justify-center font-bold text-lg">
                    {session?.user?.name?.[0] || "U"}
                  </div>
                )}
                <div>
                  <div className="text-base font-bold text-[#171717] dark:text-[#f7f7f7]">
                    {session?.user?.name || "Google Authenticated User"}
                  </div>
                  <div className="text-xs text-[#615d59] dark:text-[#9b9b9b]">
                    {session?.user?.email || "No email associated"}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut()}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency & Locale Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-[#059669]" />
              Currency Formatting
            </CardTitle>
            <CardDescription>Formatting for transaction amounts and display symbols</CardDescription>
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

        {/* Data Security Note */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#059669]" />
              Data Isolation & Security
            </CardTitle>
            <CardDescription>Database security protocol</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-[#615d59] dark:text-[#9b9b9b] leading-relaxed">
            Your transactions and custom categories are associated directly with your Google user ID in MongoDB Atlas. No other user can read or modify your financial data.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
