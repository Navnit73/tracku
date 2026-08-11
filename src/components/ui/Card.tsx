import React, { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "flat" | "elevated" | "hero";
}

export function Card({ className, variant = "default", children, ...props }: CardProps) {
  const base = "rounded-xl p-5 transition-all";
  const variants = {
    default:
      "bg-[#ffffff] dark:bg-[#202020] border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xs",
    flat:
      "bg-[#f6f5f4] dark:bg-[#191919] border border-[#e6e6e6] dark:border-[#2f2f2f]",
    elevated:
      "bg-[#ffffff] dark:bg-[#202020] border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-md",
    hero:
      "bg-[#213183] text-white rounded-xl shadow-lg border border-[#2d3e9c]",
  };

  return (
    <div className={cn(base, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-1 mb-4", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight",
        className
      )}
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
    <p
      className={cn("text-xs text-[#615d59] dark:text-[#9b9b9b]", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-4 pt-3 border-t border-[#e6e6e6] dark:border-[#2f2f2f] flex items-center justify-between", className)}
      {...props}
    >
      {children}
    </div>
  );
}
