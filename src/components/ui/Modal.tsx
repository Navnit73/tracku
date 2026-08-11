"use client";

import React, { useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = "md",
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog Surface */}
      <div
        className={cn(
          "relative w-full rounded-t-3xl sm:rounded-2xl bg-[#ffffff] dark:bg-[#202020] border-t sm:border border-[#e6e6e6] dark:border-[#2f2f2f] shadow-2xl transition-all animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh] sm:max-h-[90vh]",
          maxWidths[maxWidth]
        )}
      >
        {/* Mobile Pull Indicator */}
        <div className="w-12 h-1 bg-[#e6e6e6] dark:bg-[#3a3a3a] rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-5 sm:px-6 pt-2 sm:pt-6 pb-3 sm:pb-4 border-b border-[#e6e6e6] dark:border-[#2f2f2f]">
            <div>
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-[#171717] dark:text-[#f7f7f7] tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] mt-0.5">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full sm:rounded-lg text-[#615d59] dark:text-[#9b9b9b] hover:bg-[#f6f5f4] dark:hover:bg-[#2e2e2e] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-[#e6e6e6] dark:border-[#2f2f2f] bg-[#f6f5f4]/60 dark:bg-[#191919]/60 rounded-b-none sm:rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}
