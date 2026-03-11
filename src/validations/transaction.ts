import { z } from "zod";

// Transaction types
export const transactionTypes = ["income", "expense", "transfer"] as const;

// Category names (matching the app's category list)
export const categoryNames = [
  "Food",
  "Housing",
  "Transport",
  "Lifestyle",
  "Shopping",
  "Learning",
  "Personal",
  "Salary",
  "Transfer",
  "Other",
] as const;

// Base schema for shared fields
const baseTransactionSchema = z.object({
  description: z
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description must be at most 200 characters")
    .trim(),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than zero"),
  date: z.string().min(1, "Date is required"),
});

// Income: requires toAccountId + category
export const incomeTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("income"),
  category: z.enum(categoryNames, {
    message: "Please select a valid category",
  }),
  toAccountId: z.string().min(1, "Please select an account"),
  fromAccountId: z.string().optional(),
});

// Expense: requires fromAccountId + category
export const expenseTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("expense"),
  category: z.enum(categoryNames, {
    message: "Please select a valid category",
  }),
  fromAccountId: z.string().min(1, "Please select an account"),
  toAccountId: z.string().optional(),
});

// Transfer: requires both accounts, category auto-set
export const transferTransactionSchema = baseTransactionSchema.extend({
  type: z.literal("transfer"),
  fromAccountId: z.string().min(1, "Please select a source account"),
  toAccountId: z.string().min(1, "Please select a destination account"),
  category: z.string().default("Transfer"),
});

// Discriminated union for create
export const createTransactionSchema = z.discriminatedUnion("type", [
  incomeTransactionSchema,
  expenseTransactionSchema,
  transferTransactionSchema,
]);

// For update (partial — all fields optional)
export const updateTransactionSchema = z.object({
  type: z.enum(transactionTypes).optional(),
  description: z
    .string()
    .min(2, "Description must be at least 2 characters")
    .max(200, "Description must be at most 200 characters")
    .trim()
    .optional(),
  amount: z
    .number({ message: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .optional(),
  date: z.string().min(1, "Date is required").optional(),
  category: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
});

// TypeScript types
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
