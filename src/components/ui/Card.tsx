import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "hero";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const base = "rounded-2xl p-4 sm:p-5 lg:p-6 transition-all duration-200";
  const variants = {
    default: "bg-surface border border-hairline ",
    flat: "bg-canvas border border-hairline",
    elevated: "bg-surface-raised border border-hairline ",
    hero: "bg-gradient-to-br from-[#00874C] to-[#005c33] dark:from-emerald-700 dark:to-emerald-950 text-white rounded-2xl border border-primary/30",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 mb-3.5 sm:mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base sm:text-lg font-bold text-ink tracking-tight", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-ink-muted leading-relaxed", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("w-full", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 pt-3.5 border-t border-hairline flex items-center justify-between gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

