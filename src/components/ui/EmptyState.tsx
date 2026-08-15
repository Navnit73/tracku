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
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 text-center rounded-2xl bg-surface/50 border border-dashed border-hairline min-h-[200px] w-full">
      <div className="p-3.5 rounded-2xl bg-canvas border border-hairline text-primary mb-3 shadow-xs">
        {icon || <FolderOpen className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
      <p className="text-xs text-ink-muted max-w-sm mt-1 mb-4 leading-relaxed">
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

