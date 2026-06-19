// lib/transactionCategories.ts
// Single source of truth for the category lists used by the
// AddTransactionSheet and the right-swipe quick-categorize action on
// SwipeableTxRow. Kept lean — the per-category color palette lives in
// the auto-generated _shared/categories.ts and is keyed by these names.

export const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Lifestyle",
  "Shopping",
  "Learning",
  "Personal",
  "Other",
] as const;

export const INCOME_CATEGORIES = ["Salary", "Other"] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];
