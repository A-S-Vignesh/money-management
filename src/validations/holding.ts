import { z } from "zod";

export const holdingTypes = [
  "stock",
  "mutual_fund",
  "etf",
  "fd",
  "gold",
  "ppf",
  "crypto",
  "real_estate",
  "other",
] as const;

export type HoldingType = (typeof holdingTypes)[number];

export const holdingTypeLabels: Record<HoldingType, string> = {
  stock: "Stock",
  mutual_fund: "Mutual Fund",
  etf: "ETF",
  fd: "Fixed Deposit",
  gold: "Gold",
  ppf: "PPF",
  crypto: "Crypto",
  real_estate: "Real Estate",
  other: "Other",
};

const ymd = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// ── Create initial holding (also records the first buy as a transaction) ──
export const createHoldingSchema = z.object({
  accountId: z.string().min(1, "Investment account is required"),
  fromAccountId: z.string().min(1, "Source account (cash) is required"),
  name: z.string().min(1, "Name is required").max(120).trim(),
  type: z.enum(holdingTypes),
  symbol: z.string().max(20).trim().optional().nullable(),
  quantity: z.number().positive("Quantity must be > 0"),
  pricePerUnit: z.number().positive("Price per unit must be > 0"),
  date: ymd.optional(), // defaults to today on the server
  maturityDate: ymd.optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  notes: z.string().max(500).trim().optional().nullable(),
});
export type CreateHoldingInput = z.infer<typeof createHoldingSchema>;

// ── Edit non-financial fields only ──
export const updateHoldingSchema = z.object({
  name: z.string().min(1).max(120).trim().optional(),
  symbol: z.string().max(20).trim().optional().nullable(),
  notes: z.string().max(500).trim().optional().nullable(),
  maturityDate: ymd.optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
});
export type UpdateHoldingInput = z.infer<typeof updateHoldingSchema>;

// ── Buy more (adds quantity, recomputes weighted avg cost) ──
export const buyHoldingSchema = z.object({
  fromAccountId: z.string().min(1, "Source account (cash) is required"),
  quantity: z.number().positive("Quantity must be > 0"),
  pricePerUnit: z.number().positive("Price per unit must be > 0"),
  date: ymd.optional(),
});
export type BuyHoldingInput = z.infer<typeof buyHoldingSchema>;

// ── Sell (reduces quantity, computes realized P&L) ──
export const sellHoldingSchema = z.object({
  toAccountId: z.string().min(1, "Destination account (cash) is required"),
  quantity: z.number().positive("Quantity must be > 0"),
  pricePerUnit: z.number().positive("Price per unit must be > 0"),
  date: ymd.optional(),
});
export type SellHoldingInput = z.infer<typeof sellHoldingSchema>;

// ── Quick price update (no transaction, just refresh current price) ──
export const updatePriceSchema = z.object({
  currentPrice: z.number().min(0, "Price must be ≥ 0"),
});
export type UpdatePriceInput = z.infer<typeof updatePriceSchema>;
