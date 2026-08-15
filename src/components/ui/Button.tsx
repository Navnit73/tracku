import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  fullWidth?: boolean;
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
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none select-none cursor-pointer active:scale-[0.98]";

    const variants = {
      primary:
        "bg-primary hover:bg-primary-active text-white shadow-xs",
      secondary:
        "bg-surface hover:bg-canvas text-ink border border-hairline shadow-xs",
      outline:
        "bg-transparent hover:bg-canvas text-ink border border-hairline",
      ghost:
        "bg-transparent hover:bg-canvas text-ink-secondary hover:text-ink",
      danger:
        "bg-expense hover:bg-expense/90 text-white shadow-xs",
    };

    const sizes = {
      sm: "text-xs px-3 py-1.5 min-h-[36px] sm:min-h-[32px] gap-1.5 rounded-lg",
      md: "text-sm px-4 py-2 min-h-[42px] sm:min-h-[38px] gap-2 rounded-xl",
      lg: "text-base px-5 py-2.5 min-h-[48px] sm:min-h-[44px] gap-2.5 rounded-xl font-semibold",
      icon: "min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px] p-0 flex items-center justify-center rounded-xl",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

