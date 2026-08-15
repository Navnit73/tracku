import React from "react";
import { Button } from "./Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Select } from "./Select";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 py-3.5 px-1 text-xs text-ink-muted w-full">
      <div className="flex items-center justify-between w-full sm:w-auto gap-3 flex-wrap">
        <span>
          Showing <strong className="text-ink">{startItem}</strong>–<strong className="text-ink">{endItem}</strong> of{" "}
          <strong className="text-ink">{totalItems}</strong> entries
        </span>
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-auto sm:ml-2">
            <span className="text-[11px] text-ink-faint">Rows:</span>
            <Select
              value={pageSize.toString()}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="py-1 px-2 text-xs min-h-[32px] w-18"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </Select>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
          className="flex-1 sm:flex-none"
        >
          Previous
        </Button>
        <span className="px-3 font-semibold text-ink whitespace-nowrap text-center">
          {currentPage} / {Math.max(1, totalPages)}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          rightIcon={<ChevronRight className="w-4 h-4" />}
          className="flex-1 sm:flex-none"
        >
          Next
        </Button>
      </div>
    </div>
  );
}

