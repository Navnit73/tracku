import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
};

export const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  INR: "en-IN",
  EUR: "de-DE",
  GBP: "en-GB",
  CAD: "en-CA",
  AUD: "en-AU",
  JPY: "ja-JP",
};

export function getCurrencySymbol(currency: string = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  return CURRENCY_SYMBOLS[code] || "$";
}

const numberFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: string = "USD"): string {
  const code = (currency || "USD").toUpperCase();
  const locale = CURRENCY_LOCALES[code] || "en-US";
  const key = `${locale}_${code}`;

  let formatter = numberFormatters.get(key);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: code,
        maximumFractionDigits: code === "JPY" ? 0 : 2,
      });
      numberFormatters.set(key, formatter);
    } catch {
      formatter = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      });
      numberFormatters.set(key, formatter);
    }
  }
  return formatter.format(Number(amount) || 0);
}

const defaultDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function formatDate(dateInput: string | Date | number): string {
  const d = new Date(dateInput);
  return defaultDateFormatter.format(d);
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
      const monday = new Date(now);
      monday.setDate(diff);
      startDate = startOfDay(monday);
      endDate = endOfDay(now);
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
