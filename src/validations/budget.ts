import { z } from "zod";

// Budget periods
export const budgetPeriods = [
  "Weekly",
  "Monthly",
  "Quarterly",
  "Yearly",
] as const;

// Category names (matching the app's category list)
export const budgetCategoryNames = [
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

// Schema for creating a new budget
export const createBudgetSchema = z.object({
  name: z
    .string()
    .min(2, "Budget name must be at least 2 characters")
    .max(50, "Budget name must be at most 50 characters")
    .trim(),
  category: z.enum(budgetCategoryNames, {
    message: "Please select a valid category",
  }),
  allocated: z
    .number({ message: "Allocated amount must be a number" })
    .positive("Allocated amount must be greater than zero"),
  period: z.enum(budgetPeriods, {
    message: "Please select a valid period",
  }),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Schema for updating a budget (all fields optional)
export const updateBudgetSchema = createBudgetSchema.partial();

// TypeScript types
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
