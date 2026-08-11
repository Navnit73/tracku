import React, { ReactNode } from "react";
import { FolderOpen } from "lucide-react";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl bg-[#f6f5f4]/50 dark:bg-[#191919]/50 border border-dashed border-[#e6e6e6] dark:border-[#2f2f2f] min-h-[220px]">
      <div className="p-3 rounded-full bg-[#ffffff] dark:bg-[#252525] border border-[#e6e6e6] dark:border-[#2f2f2f] text-[#0075de] mb-3 shadow-xs">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-[#171717] dark:text-[#f7f7f7]">{title}</h3>
      <p className="text-xs text-[#615d59] dark:text-[#9b9b9b] max-w-sm mt-1 mb-4">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
