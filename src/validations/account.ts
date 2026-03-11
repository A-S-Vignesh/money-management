import { z } from "zod";

// Account types enum
export const accountTypes = [
  "bank",
  "cash",
  "credit",
  "investment",
  "system",
  "goal",
  "other",
] as const;

// Schema for creating a new account
export const createAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Account name must be at least 2 characters")
    .max(50, "Account name must be at most 50 characters")
    .trim(),
  type: z.enum(accountTypes, {
    message: "Please select a valid account type",
  }),
  balance: z
    .number({ message: "Balance must be a number" })
    .min(0, "Balance cannot be negative")
    .default(0),
});

// Schema for updating an account (all fields optional)
export const updateAccountSchema = createAccountSchema.partial();

// TypeScript types inferred from schemas
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
