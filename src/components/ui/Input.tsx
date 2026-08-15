import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none"
            >
              {label}
            </label>
            {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
          </div>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 text-ink-faint pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-xl border border-hairline bg-surface px-3.5 py-2.5 sm:py-2 text-base sm:text-sm text-ink placeholder-ink-faint transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:bg-canvas min-h-[44px] sm:min-h-[40px]",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-expense focus:border-expense focus:ring-expense/20",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 text-ink-faint flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-expense font-medium animate-in fade-in duration-150">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={inputId}
              className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none"
            >
              {label}
            </label>
            {hint && <span className="text-[11px] text-ink-faint">{hint}</span>}
          </div>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-xl border border-hairline bg-surface p-3.5 sm:p-3 text-base sm:text-sm text-ink placeholder-ink-faint transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[90px]",
            error && "border-expense focus:border-expense focus:ring-expense/20",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-expense font-medium animate-in fade-in duration-150">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

