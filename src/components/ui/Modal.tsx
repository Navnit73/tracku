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
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl";
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

    let pushedState = false;

    const handlePopState = () => {
      // If mobile user hits back button, close modal
      onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("popstate", handlePopState);

      // Push history state so back button closes modal rather than leaving the page
      try {
        window.history.pushState({ modalOpen: true }, "");
        pushedState = true;
      } catch {}
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("popstate", handlePopState);

      if (pushedState && window.history.state?.modalOpen) {
        try {
          window.history.back();
        } catch {}
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
  };

  const content = (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Surface */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full rounded-t-3xl sm:rounded-2xl bg-surface border-t sm:border border-hairline  transition-all animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 z-10 flex flex-col max-h-[85vh] sm:max-h-[90vh]",
          maxWidths[maxWidth]
        )}
      >
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1 bg-hairline-strong rounded-full mx-auto mt-3 mb-1 sm:hidden shrink-0" />

        {/* Header */}
        {(title || description) && (
          <div className="flex items-start justify-between px-5 sm:px-6 pt-2 sm:pt-5 pb-3.5 sm:pb-4 border-b border-hairline shrink-0">
            <div className="pr-4">
              {title && (
                <h2 className="text-base sm:text-lg font-bold text-ink tracking-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-muted hover:bg-canvas active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 border-t border-hairline bg-canvas/60 rounded-b-none sm:rounded-b-2xl shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof window !== "undefined" ? createPortal(content, document.body) : null;
}

