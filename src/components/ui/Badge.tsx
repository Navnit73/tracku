import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "expense" | "income" | "investment" | "neutral" | "outline" | "sky" | "orange";
  size?: "sm" | "md";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-medium rounded-full transition-colors";

  const variants = {
    expense:
      "bg-[#fff1f2] text-[#e11d48] dark:bg-[#3f1d24] dark:text-[#fda4af] border border-[#fecdd3] dark:border-[#881337]",
    income:
      "bg-[#ecfdf5] text-[#059669] dark:bg-[#133e2b] dark:text-[#6ee7b7] border border-[#a7f3d0] dark:border-[#065f46]",
    investment:
      "bg-[#f5f3ff] text-[#7c3aed] dark:bg-[#2e1a47] dark:text-[#c4b5fd] border border-[#ddd6fe] dark:border-[#5b21b6]",
    neutral:
      "bg-[#f6f5f4] text-[#31302e] dark:bg-[#2a2a2a] dark:text-[#d3d3d3] border border-[#e6e6e6] dark:border-[#2f2f2f]",
    outline:
      "bg-transparent text-[#615d59] dark:text-[#9b9b9b] border border-[#e6e6e6] dark:border-[#2f2f2f]",
    sky:
      "bg-[#f0f9ff] text-[#0284c7] dark:bg-[#0c2a3a] dark:text-[#7dd3fc] border border-[#bae6fd] dark:border-[#075985]",
    orange:
      "bg-[#fff7ed] text-[#ea580c] dark:bg-[#3b1c0c] dark:text-[#ffedd5] border border-[#ffedd5] dark:border-[#9a3412]",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}
