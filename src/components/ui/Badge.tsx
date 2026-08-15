import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "expense" | "income" | "investment" | "neutral" | "outline" | "sky" | "orange" | "warning" | "primary";
  size?: "sm" | "md" | "lg";
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  children,
  ...props
}: BadgeProps) {
  const base = "inline-flex items-center font-semibold rounded-full transition-colors shrink-0";

  const variants = {
    expense:
      "bg-expense-bg text-expense border border-expense-border",
    income:
      "bg-income-bg text-income border border-income-border",
    investment:
      "bg-investment-bg text-investment border border-investment-border",
    neutral:
      "bg-canvas text-ink-secondary border border-hairline",
    outline:
      "bg-transparent text-ink-muted border border-hairline",
    sky:
      "bg-sky-brand-bg text-sky-brand border border-sky-brand-border",
    orange:
      "bg-warning-brand-bg text-warning-brand border border-warning-brand-border",
    warning:
      "bg-warning-brand-bg text-warning-brand border border-warning-brand-border",
    primary:
      "bg-primary/10 text-primary border border-primary/20",
  };

  const sizes = {
    sm: "text-[10px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-1 gap-1.5",
    lg: "text-sm px-3 py-1.5 gap-2",
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
}

