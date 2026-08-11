"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Wallet, Sparkles, ShieldCheck } from "lucide-react";

export default function SignInPage() {
  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[#f6f5f4] dark:bg-[#191919] flex items-center justify-center p-4">
      <div className="w-full max-w-md flex flex-col gap-6">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-2xl bg-[#0075de] text-white shadow-md mb-3">
            <Wallet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-[#171717] dark:text-[#f7f7f7] tracking-tight">
            FinanceTrack
          </h1>
          <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-1 flex items-center gap-1">
            Personal Expense, Income & Investment Tracker <Sparkles className="w-3 h-3 text-[#0075de]" />
          </p>
        </div>

        {/* Google Auth Card */}
        <Card className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="text-center">
            <h2 className="text-lg font-bold text-[#171717] dark:text-[#f7f7f7]">
              Welcome Back
            </h2>
            <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-1">
              Sign in with your Google account to access your personal financial dashboard and records.
            </p>
          </div>

          {/* Google OAuth Button */}
          <Button
            type="button"
            variant="secondary"
            onClick={handleGoogleSignIn}
            className="w-full h-12 text-sm font-bold border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs flex items-center justify-center gap-3 hover:border-[#0075de] transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="p-3 rounded-xl bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f] text-[11px] text-[#615d59] dark:text-[#9b9b9b] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#059669] shrink-0" />
            <span>
              All financial records are encrypted and strictly isolated to your authenticated account.
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
