"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

const DotLottieReact = dynamic(
  () => import("@lottiefiles/dotlottie-react").then((mod) => mod.DotLottieReact),
  { ssr: false }
);
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  User as UserIcon,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  KeyRound,
} from "lucide-react";

type AuthMode = "login" | "register" | "forgot-password";

export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend Countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const clearMessages = () => {
    setError(null);
    setSuccessMsg(null);
  };

  const switchMode = (newMode: AuthMode) => {
    clearMessages();
    setMode(newMode);
    if (newMode !== "forgot-password") {
      setOtpSent(false);
      setOtpCode("");
    }
  };

  // Google OAuth Handler
  const handleGoogleSignIn = () => {
    clearMessages();
    signIn("google", { callbackUrl: "/" });
  };

  // Login Handler (Credentials)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!email.trim() || !password) {
      setError("Please enter both your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Register Handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create account.");
      } else {
        setSuccessMsg("Account created successfully! Logging you in...");
        // Auto-login upon registration
        const loginRes = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
        });

        if (loginRes?.error) {
          setSuccessMsg("Account registered! Please sign in with your password.");
          switchMode("login");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch {
      setError("Failed to create account. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Send Code
  const handleSendResetCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearMessages();

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to request password reset.");
      } else {
        setOtpSent(true);
        setResendTimer(45); // 45 seconds cooldown
        if (data.devCode) {
          setSuccessMsg(
            `Verification code sent to ${email} (Dev code: ${data.devCode})`
          );
        } else {
          setSuccessMsg(`Verification code sent to ${email}`);
        }
      }
    } catch {
      setError("Failed to send reset code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password - Reset with OTP
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!otpCode.trim()) {
      setError("Please enter the 6-digit verification code.");
      return;
    }
    if (password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: otpCode.trim(),
          newPassword: password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to reset password.");
      } else {
        setSuccessMsg(
          "Password reset successfully! Please sign in with your new password."
        );
        setPassword("");
        setConfirmPassword("");
        setOtpCode("");
        setOtpSent(false);
        setMode("login");
      }
    } catch {
      setError("Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen  flex flex-col justify-between p-4 sm:p-6 lg:p-8 transition-colors selection:bg-[#00A860] selection:text-white">
      {/* Top Header / Brand Logo */}
      {/* <header className="w-full flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00A860] flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Finance <span className="text-[#00A860]">Tracker</span>
          </span>
        </div>
      </header> */}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto flex items-center justify-center my-6 lg:my-0">
        <div className="w-full flex items-center justify-center lg:justify-between gap-8 xl:gap-14">

          {/* Left Illustration: Tree */}
          <div className="hidden lg:flex flex-1 items-end justify-center self-end pb-2 xl:pb-4 translate-y-[10%] animate-in fade-in slide-in-from-left-4 duration-700 select-none pointer-events-none">
            <div className="relative w-[300px] xl:w-[360px] aspect-square">
              <Image
                src="/tree.png"
                alt="Growth and Prosperity Tree"
                fill
                priority
                className="object-contain transition-all duration-300 dark:brightness-105"
                sizes="(max-width: 1280px) 300px, 360px"
              />
            </div>
          </div>

          {/* Center Column: Lottie Animation (above card) + Auth Card */}
          <div className="w-full max-w-[430px] shrink-0 flex flex-col items-center">

            {/* Prominent Money Tree Lottie Animation - sits ABOVE the card */}
            <div className="w-60 h-60 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-72 lg:h-72 flex items-center justify-center pointer-events-none select-none -mb-8 sm:-mb-10 lg:-mb-12 relative z-10 animate-in fade-in zoom-in-95 duration-700">
              <DotLottieReact
                src="/Money%20tree.lottie"
                loop
                autoplay
                style={{ width: "100%", height: "100%" }}
              />
            </div>

            <div className="w-full bg-white dark:bg-[#1e1e1e] rounded-[28px] p-7 pt-10 sm:p-9 sm:pt-12 shadow-[0_12px_45px_-8px_rgba(0,0,0,0.06)] border border-slate-100 dark:border-zinc-800 transition-all">

              {/* Card Header */}
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-[26px] font-bold text-slate-900 dark:text-white tracking-tight">
                  {mode === "login" && "Log in to your account"}
                  {mode === "register" && "Create an account"}
                  {mode === "forgot-password" && (otpSent ? "Reset password" : "Forgot password?")}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 dark:text-zinc-400 mt-1.5">
                  {mode === "login" && "Use your email to access your account."}
                  {mode === "register" && "Enter your details to create a personal account."}
                  {mode === "forgot-password" &&
                    (otpSent
                      ? "Enter verification code and your new password."
                      : "Enter your email to receive a password reset code.")}
                </p>
              </div>

              {/* Status Notifications */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-xs text-red-700 dark:text-red-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* MODE 1: LOGIN */}
              {mode === "login" && (
                <>
                  <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    {/* Email Input */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className="w-full pl-10 pr-11 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                        tabIndex={-1}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={() => switchMode("forgot-password")}
                        className="text-[11px] sm:text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer py-1"
                      >
                        Forgot password?
                      </button>
                    </div>

                    {/* Log In Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#00a859] hover:bg-[#00924d] active:bg-[#008144] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      {loading ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Log in"
                      )}
                    </button>
                  </form>

                  {/* Or Divider */}
                  <div className="relative my-4 flex items-center justify-center">
                    <div className="w-full border-t border-slate-100 dark:border-zinc-800" />
                    <span className="absolute bg-white dark:bg-[#1e1e1e] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-3 px-4 bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99] cursor-pointer min-h-[44px]"
                  >
                    <div className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    </div>
                    <span>Log in with Google</span>
                  </button>

                  {/* Card Footer: Not Registered */}
                  <div className="text-center mt-5">
                    <p className="text-xs text-slate-400 dark:text-zinc-400">
                      Not registered?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("register")}
                        className="font-bold text-slate-800 dark:text-white hover:text-[#00a859] dark:hover:text-[#00a859] transition-colors cursor-pointer py-1"
                      >
                        Create an account
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* MODE 2: REGISTER */}
              {mode === "register" && (
                <>
                  <form onSubmit={handleRegister} className="flex flex-col gap-3.5">
                    {/* Full Name */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Full name"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                    </div>

                    {/* Email Input */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter email"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                    </div>

                    {/* Password Input */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Create password (min 6 chars)"
                        className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="relative flex items-center">
                      <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                      />
                    </div>

                    {/* Create Account Button */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-4 bg-[#00a859] hover:bg-[#00924d] active:bg-[#008144] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-1 min-h-[44px]"
                    >
                      {loading ? (
                        <RotateCw className="w-4 h-4 animate-spin" />
                      ) : (
                        "Create account"
                      )}
                    </button>
                  </form>

                  {/* Or Divider */}
                  <div className="relative my-3.5 flex items-center justify-center">
                    <div className="w-full border-t border-slate-100 dark:border-zinc-800" />
                    <span className="absolute bg-white dark:bg-[#1e1e1e] px-3 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                      or
                    </span>
                  </div>

                  {/* Google Sign In Button */}
                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    className="w-full py-2.5 px-4 bg-[#3B82F6] hover:bg-[#2563EB] active:bg-[#1D4ED8] text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-3 transition-all shadow-sm active:scale-[0.99] cursor-pointer min-h-[44px]"
                  >
                    <div className="w-5 h-5 bg-white rounded flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
                    </div>
                    <span>Sign up with Google</span>
                  </button>

                  {/* Card Footer: Back to login */}
                  <div className="text-center mt-4">
                    <p className="text-xs text-slate-400 dark:text-zinc-400">
                      Already registered?{" "}
                      <button
                        type="button"
                        onClick={() => switchMode("login")}
                        className="font-bold text-slate-800 dark:text-white hover:text-[#00a859] dark:hover:text-[#00a859] transition-colors cursor-pointer py-1"
                      >
                        Log in
                      </button>
                    </p>
                  </div>
                </>
              )}

              {/* MODE 3: FORGOT PASSWORD */}
              {mode === "forgot-password" && (
                <>
                  {!otpSent ? (
                    // Step 3A: Request Code
                    <form onSubmit={handleSendResetCode} className="flex flex-col gap-4">
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your registered email"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-[#00a859] hover:bg-[#00924d] active:bg-[#008144] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        {loading ? (
                          <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Send Reset Code"
                        )}
                      </button>

                      <div className="text-center mt-2">
                        <button
                          type="button"
                          onClick={() => switchMode("login")}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1.5 cursor-pointer py-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  ) : (
                    // Step 3B: Verify OTP & New Password with Resend
                    <form onSubmit={handleResetPassword} className="flex flex-col gap-3.5">
                      {/* OTP Code */}
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <KeyRound className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="6-digit reset code"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white font-mono tracking-widest placeholder:tracking-normal placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                        />
                      </div>

                      {/* New Password */}
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter new password (min 6 chars)"
                          className="w-full pl-10 pr-11 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer min-w-[32px] min-h-[32px] flex items-center justify-center"
                          tabIndex={-1}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Confirm New Password */}
                      <div className="relative flex items-center">
                        <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                          <Lock className="w-4 h-4" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700/80 rounded-xl text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a859]/20 focus:border-[#00a859] transition-all min-h-[44px]"
                        />
                      </div>

                      {/* Resend Option */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 pt-1">
                        <span>Didn&apos;t receive code?</span>
                        {resendTimer > 0 ? (
                          <span className="font-medium text-slate-400">
                            Resend in {resendTimer}s
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendResetCode()}
                            disabled={loading}
                            className="font-bold text-[#00a859] hover:underline cursor-pointer py-1"
                          >
                            Resend code
                          </button>
                        )}
                      </div>

                      {/* Submit New Password */}
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-[#00a859] hover:bg-[#00924d] active:bg-[#008144] disabled:opacity-60 text-white font-semibold rounded-xl text-sm transition-all shadow-sm active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 mt-2 min-h-[44px]"
                      >
                        {loading ? (
                          <RotateCw className="w-4 h-4 animate-spin" />
                        ) : (
                          "Update Password"
                        )}
                      </button>

                      {/* Back to Login */}
                      <div className="text-center mt-3">
                        <button
                          type="button"
                          onClick={() => switchMode("login")}
                          className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1.5 cursor-pointer py-1"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          Back to login
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Illustration: Man with Plant */}
          <div className="hidden lg:flex flex-1 items-end justify-center self-end pb-2 xl:pb-4 translate-y-[10%] animate-in fade-in slide-in-from-right-4 duration-700 select-none pointer-events-none">
            <div className="relative w-[260px] xl:w-[310px] aspect-[4/5]">
              <Image
                src="/auth-character-Photoroom.png"
                alt="Finance User Illustration"
                fill
                priority
                className="object-contain transition-all duration-300 dark:brightness-105"
                sizes="(max-width: 1280px) 260px, 310px"
              />
            </div>
          </div>

        </div>
      </main>

      {/* Page Footer */}
      <footer className="w-full text-center py-2 text-xs text-slate-400 dark:text-zinc-500 font-medium">
        © 2026 Finance Tracker. All rights reserved.
      </footer>
    </div>
  );
}