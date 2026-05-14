import mongoose, { Document, Schema, Model } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  fromAccountId?: mongoose.Types.ObjectId | null;
  toAccountId?: mongoose.Types.ObjectId | null;
  type: "income" | "expense" | "transfer";
  description: string;
  category: string;
  amount: number;
  date: Date;
  // Optional link to an investment Holding. Set on buy/sell/dividend transactions
  // so reports can roll up activity per holding without recomputing from scratch.
  holdingId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fromAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    toAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },
    type: {
      type: String,
      enum: ["income", "expense", "transfer"],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    holdingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Holding",
      default: null,
    },
  },
  { timestamps: true },
);

// Bug #10 fix: Compound indexes for common query patterns
TransactionSchema.index({ userId: 1, date: -1 });
TransactionSchema.index({ userId: 1, type: 1, date: -1 });
TransactionSchema.index({ userId: 1, category: 1, date: -1 });
// Account-scoped queries: filter-by-account on the Transactions page,
// the recompute aggregation in lib/recomputeBalance.ts, and net-worth derivation.
TransactionSchema.index({ fromAccountId: 1, date: -1 });
TransactionSchema.index({ toAccountId: 1, date: -1 });
// Holding-scoped queries: per-holding activity feeds, P&L rollups.
TransactionSchema.index({ holdingId: 1, date: -1 }, { sparse: true });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
