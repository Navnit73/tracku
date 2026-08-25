"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/ui/Skeleton";

export const LazyIncomeExpenseChart = dynamic(
  () =>
    import("@/components/charts/IncomeExpenseChart").then(
      (mod) => mod.IncomeExpenseChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyCategoryPieChart = dynamic(
  () =>
    import("@/components/charts/CategoryPieChart").then(
      (mod) => mod.CategoryPieChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyInvestmentGrowthChart = dynamic(
  () =>
    import("@/components/charts/InvestmentGrowthChart").then(
      (mod) => mod.InvestmentGrowthChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyTopItemsChart = dynamic(
  () =>
    import("@/components/charts/TopItemsChart").then(
      (mod) => mod.TopItemsChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyExpenseTrendChart = dynamic(
  () =>
    import("@/components/charts/ExpenseTrendChart").then(
      (mod) => mod.ExpenseTrendChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyPaymentMethodChart = dynamic(
  () =>
    import("@/components/charts/PaymentMethodChart").then(
      (mod) => mod.PaymentMethodChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

export const LazyDayOfWeekChart = dynamic(
  () =>
    import("@/components/charts/DayOfWeekChart").then(
      (mod) => mod.DayOfWeekChart
    ),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);
