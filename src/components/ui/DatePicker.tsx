"use client";

import React, { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { cn } from "@/lib/utils";

export type DateRangePreset =
  | "Today"
  | "This Week"
  | "This Month"
  | "Last Month"
  | "Last 3 Months"
  | "Last 6 Months"
  | "This Year"
  | "Custom Range"
  | "All Time";

export interface DatePickerProps {
  selectedPreset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  onChange: (preset: DateRangePreset, start?: string, end?: string) => void;
  className?: string;
}

const PRESETS: DateRangePreset[] = [
  "Today",
  "This Week",
  "This Month",
  "Last Month",
  "Last 3 Months",
  "Last 6 Months",
  "This Year",
  "All Time",
  "Custom Range",
];

export function DatePicker({
  selectedPreset,
  startDate,
  endDate,
  onChange,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || "");
  const [customEnd, setCustomEnd] = useState(endDate || "");

  const handleSelectPreset = (preset: DateRangePreset) => {
    if (preset !== "Custom Range") {
      onChange(preset);
      setIsOpen(false);
    } else {
      onChange("Custom Range", customStart, customEnd);
    }
  };

  const handleApplyCustom = () => {
    onChange("Custom Range", customStart, customEnd);
    setIsOpen(false);
  };

  return (
    <div className={cn("relative inline-block text-left", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        leftIcon={<Calendar className="w-4 h-4 text-[#0075de]" />}
        rightIcon={<ChevronDown className="w-3.5 h-3.5 opacity-60" />}
      >
        <span>{selectedPreset}</span>
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-72 rounded-xl bg-[#ffffff] dark:bg-[#202020] border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-xl z-40 p-3 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-xs font-bold uppercase tracking-wider text-[#615d59] dark:text-[#9b9b9b] px-2 py-1">
              Select Time Horizon
            </div>
            <div className="grid grid-cols-2 gap-1">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={cn(
                    "text-left px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer",
                    selectedPreset === preset
                      ? "bg-[#0075de] text-white"
                      : "text-[#171717] dark:text-[#f7f7f7] hover:bg-[#f6f5f4] dark:hover:bg-[#2e2e2e]"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>

            {selectedPreset === "Custom Range" && (
              <div className="mt-2 pt-2 border-t border-[#e6e6e6] dark:border-[#2f2f2f] flex flex-col gap-2">
                <Input
                  type="date"
                  label="Start Date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="py-1 text-xs"
                />
                <Input
                  type="date"
                  label="End Date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="py-1 text-xs"
                />
                <Button size="sm" onClick={handleApplyCustom} className="mt-1 w-full">
                  Apply Custom Range
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
