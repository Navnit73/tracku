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
      "bg-expense-bg text-expense border border-expense/20",
    income:
      "bg-income-bg text-income border border-income/20",
    investment:
      "bg-investment-bg text-investment border border-investment/20",
    neutral:
      "bg-canvas text-ink-secondary border border-hairline",
    outline:
      "bg-transparent text-ink-muted border border-hairline",
    sky:
      "bg-sky-brand-bg text-sky-brand border border-sky-brand/20",
    orange:
      "bg-warning-brand-bg text-warning-brand border border-warning-brand/20",
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
