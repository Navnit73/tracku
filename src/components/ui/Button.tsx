import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0075de] focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.98]";

    const variants = {
      primary:
        "bg-[#0075de] hover:bg-[#005bab] text-white rounded-full shadow-sm",
      secondary:
        "bg-[#ffffff] dark:bg-[#252525] hover:bg-[#f6f5f4] dark:hover:bg-[#303030] text-[#171717] dark:text-[#f7f7f7] border border-[#e6e6e6] dark:border-[#2f2f2f] rounded-full shadow-xs",
      outline:
        "bg-transparent hover:bg-[#f6f5f4] dark:hover:bg-[#252525] text-[#171717] dark:text-[#f7f7f7] border border-[#e6e6e6] dark:border-[#2f2f2f] rounded-md",
      ghost:
        "bg-transparent hover:bg-[#f6f5f4] dark:hover:bg-[#252525] text-[#31302e] dark:text-[#d3d3d3] rounded-md",
      danger:
        "bg-[#e11d48] hover:bg-[#be123c] text-white rounded-md shadow-sm",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 h-8 gap-1.5",
      md: "text-sm px-4 py-2 h-9 gap-2",
      lg: "text-base px-5 py-2.5 h-11 gap-2.5",
      icon: "h-9 w-9 p-0 flex items-center justify-center rounded-md",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = "Button";
