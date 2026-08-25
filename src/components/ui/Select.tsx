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
      <div className="w-full flex flex-col gap-1.5 font-sans">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center w-full">
          <select
            id={selectId}
            ref={ref}
            className={cn(
              "w-full appearance-none rounded-xl border border-hairline bg-surface px-3.5 py-2.5 sm:py-2 pr-10 text-base sm:text-sm font-medium text-ink font-sans transition-all duration-200 hover:border-hairline-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-h-[44px] sm:min-h-[40px] disabled:opacity-50 disabled:bg-canvas",
              error && "border-expense focus:border-expense focus:ring-expense/20",
              className
            )}
            {...props}
          >
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    className="bg-surface text-ink font-sans py-1"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <div className="absolute right-3.5 text-ink-muted pointer-events-none flex items-center justify-center">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && <span className="text-xs text-expense font-medium animate-in fade-in duration-150">{error}</span>}
      </div>
    );
  }
);

Select.displayName = "Select";

