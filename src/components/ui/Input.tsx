import React, { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3 text-[#a39e98] pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-md border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#202020] px-3 py-2 text-sm text-[#171717] dark:text-[#f7f7f7] placeholder-[#a39e98] transition-all focus:border-[#0075de] focus:outline-none focus:ring-1 focus:ring-[#0075de] disabled:opacity-50 disabled:bg-[#f6f5f4] dark:disabled:bg-[#191919]",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              error && "border-[#e11d48] focus:border-[#e11d48] focus:ring-[#e11d48]",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 text-[#a39e98] flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-[#e11d48] font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          className={cn(
            "w-full rounded-md border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#202020] p-3 text-sm text-[#171717] dark:text-[#f7f7f7] placeholder-[#a39e98] transition-all focus:border-[#0075de] focus:outline-none focus:ring-1 focus:ring-[#0075de] min-h-[80px]",
            error && "border-[#e11d48] focus:border-[#e11d48] focus:ring-[#e11d48]",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-[#e11d48] font-medium">{error}</span>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
