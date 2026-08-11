import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

export function getDateRangeBounds(dateRange: string, customStart?: string, customEnd?: string) {
  const now = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  let startDate: Date | null = null;
  let endDate: Date | null = endOfDay(now);

  switch (dateRange) {
    case "Today":
      startDate = startOfDay(now);
      break;

    case "This Week": {
      const dayOfWeek = now.getDay();
      const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Monday start
      const monday = new Date(now.setDate(diff));
      startDate = startOfDay(monday);
      endDate = endOfDay(new Date());
      break;
    }

    case "This Month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      break;

    case "Last Month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;

    case "Last 3 Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1, 0, 0, 0, 0);
      break;

    case "Last 6 Months":
      startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1, 0, 0, 0, 0);
      break;

    case "This Year":
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      break;

    case "Custom Range":
      if (customStart) startDate = startOfDay(new Date(customStart));
      if (customEnd) endDate = endOfDay(new Date(customEnd));
      break;

    case "All Time":
    default:
      startDate = null;
      endDate = null;
      break;
  }

  return { startDate, endDate };
}
