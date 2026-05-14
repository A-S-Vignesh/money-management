// models/Holding.ts
import mongoose, { Document, Schema, Model } from "mongoose";

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

export interface IHolding extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  name: string;
  type: HoldingType;
  symbol?: string | null;
  quantity: number;
  avgCostPrice: number;
  currentPrice: number;
  priceUpdatedAt: Date;
  realizedPnL: number;
  maturityDate?: Date | null;
  interestRate?: number | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HoldingSchema = new Schema<IHolding>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Investment-type Account this holding lives in
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: holdingTypes, required: true },
    symbol: { type: String, default: null, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    avgCostPrice: { type: Number, required: true, min: 0 },
    currentPrice: { type: Number, required: true, min: 0 },
    priceUpdatedAt: { type: Date, default: Date.now },
    // Cumulative realized P&L from sells (positive = gains, negative = losses)
    realizedPnL: { type: Number, default: 0 },
    // FD/PPF metadata
    maturityDate: { type: Date, default: null },
    interestRate: { type: Number, default: null, min: 0 },
    notes: { type: String, default: null, trim: true },
    // false when fully sold; we keep the row to preserve realized P&L history
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

HoldingSchema.index({ userId: 1, isActive: 1, type: 1 });
HoldingSchema.index({ userId: 1, accountId: 1 });

const Holding: Model<IHolding> =
  mongoose.models.Holding || mongoose.model<IHolding>("Holding", HoldingSchema);

export default Holding;
