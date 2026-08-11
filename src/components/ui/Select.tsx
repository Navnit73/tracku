import React, { SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, children, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-semibold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-md border border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#ffffff] dark:bg-[#202020] px-3 py-2 pr-8 text-sm text-[#171717] dark:text-[#f7f7f7] transition-all focus:border-[#0075de] focus:outline-none focus:ring-1 focus:ring-[#0075de] cursor-pointer",
              error && "border-[#e11d48] focus:border-[#e11d48] focus:ring-[#e11d48]",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3 text-[#a39e98] pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span className="text-xs text-[#e11d48] font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";
