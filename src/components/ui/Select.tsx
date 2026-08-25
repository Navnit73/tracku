"use client";

import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  SelectHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string; name?: string } }) => void;
  children?: ReactNode;
  placeholder?: string;
  searchable?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      options: optionsProp,
      children,
      id,
      name,
      value,
      defaultValue,
      onChange,
      disabled,
      placeholder = "Select an option",
      searchable = true,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    // Extract options from either props.options or React.Children (<option> tags)
    const options: SelectOption[] = React.useMemo(() => {
      if (optionsProp && optionsProp.length > 0) {
        return optionsProp;
      }

      const extracted: SelectOption[] = [];

      const parseChildren = (nodes: ReactNode) => {
        React.Children.forEach(nodes, (child) => {
          if (!child) return;
          if (React.isValidElement(child)) {
            if (child.type === "option") {
              const childProps = child.props as any;
              extracted.push({
                value: childProps.value !== undefined ? String(childProps.value) : "",
                label: childProps.children ? String(childProps.children) : String(childProps.value || ""),
              });
            } else if (child.props && (child.props as any).children) {
              parseChildren((child.props as any).children);
            }
          }
        });
      };

      parseChildren(children);
      return extracted;
    }, [optionsProp, children]);

    // Current selected value state
    const currentValue = value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : "";
    const selectedOption = options.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption ? selectedOption.label : (options[0]?.label || placeholder);

    // Filtered options based on search query
    const filteredOptions = React.useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase().trim();
      return options.filter((opt) => opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q));
    }, [options, searchQuery]);

    // Auto-focus search input when opened
    useEffect(() => {
      if (isOpen) {
        setSearchQuery("");
        setHighlightedIndex(-1);
        setTimeout(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
          }
        }, 60);
      }
    }, [isOpen]);

    // Close on click outside or escape key
    useEffect(() => {
      const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (!isOpen) return;

        if (e.key === "Escape") {
          setIsOpen(false);
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
        } else if (e.key === "Enter" && highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
          e.preventDefault();
          handleSelect(filteredOptions[highlightedIndex].value);
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("touchstart", handleOutsideClick);
        document.addEventListener("keydown", handleGlobalKeyDown);
      }

      return () => {
        document.removeEventListener("mousedown", handleOutsideClick);
        document.removeEventListener("touchstart", handleOutsideClick);
        document.removeEventListener("keydown", handleGlobalKeyDown);
      };
    }, [isOpen, filteredOptions, highlightedIndex]);

    const handleSelect = (val: string) => {
      if (disabled) return;
      setIsOpen(false);
      setSearchQuery("");

      if (onChange) {
        onChange({
          target: {
            value: val,
            name: name,
          },
        } as any);
      }
    };

    const isSearchEnabled = searchable && options.length > 3;

    return (
      <div ref={containerRef} className="w-full flex flex-col gap-1.5 font-sans relative">
        {label && (
          <label
            htmlFor={selectId}
            className="text-xs font-bold uppercase tracking-wider text-ink-muted select-none flex items-center justify-between"
          >
            <span>{label}</span>
          </label>
        )}

        {/* Custom Theme Dropdown Trigger Button */}
        <button
          type="button"
          id={selectId}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn(
            "w-full flex items-center justify-between rounded-xl border border-hairline bg-surface px-3.5 py-2.5 sm:py-2 text-base sm:text-sm font-medium text-ink font-sans transition-all duration-200 hover:border-hairline-strong focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer min-h-[44px] sm:min-h-[40px] text-left select-none shadow-2xs",
            isOpen && "border-primary ring-2 ring-primary/20 shadow-xs bg-surface",
            error && "border-expense focus:border-expense focus:ring-expense/20",
            disabled && "opacity-50 bg-canvas cursor-not-allowed",
            className
          )}
        >
          <span className="truncate pr-2 font-medium">{displayLabel}</span>
          <div
            className={cn(
              "text-ink-muted shrink-0 transition-transform duration-200 flex items-center justify-center",
              isOpen && "rotate-180 text-primary"
            )}
          >
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>

        {/* Custom Themed Floating Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl bg-surface/98 border border-hairline shadow-2xl p-1.5 flex flex-col gap-1 max-h-72 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
          >
            {/* Live Search Input Bar */}
            {isSearchEnabled && (
              <div className="p-1 border-b border-hairline/80 mb-0.5">
                <div className="relative flex items-center w-full">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 text-ink-muted pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    className="w-full pl-8 pr-7 py-1.5 text-xs font-sans font-medium rounded-xl bg-canvas border border-hairline/70 text-ink placeholder-ink-faint focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-h-[32px] transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 p-0.5 text-ink-muted hover:text-ink cursor-pointer rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Options List */}
            <div
              ref={listRef}
              className="overflow-y-auto touch-scroll flex-1 p-0.5 space-y-0.5 no-scrollbar max-h-56"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-xs text-ink-muted text-center flex flex-col items-center gap-1.5">
                  <span>No options matching &ldquo;{searchQuery}&rdquo;</span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "w-full text-left px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium font-sans flex items-center justify-between transition-all cursor-pointer select-none min-h-[38px]",
                        isSelected
                          ? "bg-primary/15 text-primary font-bold shadow-2xs"
                          : isHighlighted
                          ? "bg-canvas text-ink"
                          : "text-ink hover:bg-canvas hover:text-primary"
                      )}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-primary shrink-0 animate-in zoom-in-75 duration-100" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Hidden native select for standard form refs & accessibility */}
        <select
          ref={ref}
          name={name}
          value={currentValue}
          disabled={disabled}
          onChange={(e) => handleSelect(e.target.value)}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error && (
          <span className="text-xs text-expense font-medium animate-in fade-in duration-150">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

