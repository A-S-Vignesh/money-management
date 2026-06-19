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

// Accept any 3/4/6/8-digit hex with leading #. The UI picker constrains
// users to a small palette, but we don't enforce that here — the model is
// happy to store any valid hex.
const hexColor = z
  .string()
  .regex(/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, "Invalid color")
  .optional();

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
  color: hexColor,
});

// Schema for updating an account — balance is intentionally excluded.
// Balance is always derived from transactions and must never be edited directly.
export const updateAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Account name must be at least 2 characters")
    .max(50, "Account name must be at most 50 characters")
    .trim()
    .optional(),
  type: z.enum(accountTypes, {
    message: "Please select a valid account type",
  }).optional(),
  color: hexColor,
});

// Schema for adjusting an account's balance. The caller sends the *target*
// balance they want the account to read; the server books an `adjustment`
// transaction for the difference. This keeps balance derivable while still
// letting users fix a mistyped opening amount or reconcile drift.
export const adjustBalanceSchema = z.object({
  balance: z
    .number({ message: "Balance must be a number" })
    .min(0, "Balance cannot be negative"),
  note: z
    .string()
    .max(200, "Note must be at most 200 characters")
    .trim()
    .optional(),
});

// TypeScript types inferred from schemas
export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
