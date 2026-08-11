import { z } from "zod";

export const transactionTypeSchema = z.enum(["Expense", "Income", "Investment"]);

export const categoryTypeSchema = z.enum(["Expense", "Income", "Investment", "All"]);

export const transactionSchema = z.object({
  type: transactionTypeSchema,
  categoryId: z.string().min(1, "Category is required"),
  categoryName: z.string().min(1, "Category name is required"),
  item: z.string().min(1, "Item / Source name is required").max(100),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional().default(""),
  tags: z.array(z.string()).optional().default([]),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50),
  type: categoryTypeSchema,
  icon: z.string().min(1, "Icon is required").default("Tag"),
  color: z.string().min(1, "Color is required").default("#64748b"),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const transactionFilterSchema = z.object({
  search: z.string().optional().default(""),
  type: z.enum(["All", "Expense", "Income", "Investment"]).optional().default("All"),
  categoryId: z.string().optional().default("All"),
  item: z.string().optional().default(""),
  dateRange: z
    .enum([
      "Today",
      "This Week",
      "This Month",
      "Last Month",
      "Last 3 Months",
      "Last 6 Months",
      "This Year",
      "Custom Range",
      "All Time",
    ])
    .optional()
    .default("This Month"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  sortBy: z.enum(["date", "amount", "item"]).optional().default("date"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(10),
});

export type TransactionFilterInput = z.input<typeof transactionFilterSchema>;
