// models/Account.ts
import { Schema, models, model, Document, Model, Types } from "mongoose";

// 1. Define Account interface
// Note: we override Mongoose's `Document._id: ObjectId` to `string` because
// every consumer of this type lives on the JSON side (API responses, lean()
// reads) where ObjectId has already been serialized.
export interface IAccount extends Omit<Document, "_id"> {
  _id: string;
  userId: Types.ObjectId; // reference to User
  name: string;
  balance: number;
  isSystem?: boolean;
  isDeleted?: boolean;
  deletedAt?: Date | null;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  /** User-chosen card color for the accounts page. One of the brand-tinted
   *  hex strings the mobile/web UI offers (see CARD_COLORS in the picker).
   *  Optional — falls back to a deterministic color picked from accountId. */
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create Schema
const AccountSchema = new Schema<IAccount>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    type: {
      type: String,
      enum: ["bank", "cash", "credit", "investment", "system", "goal", "other"],
      required: true,
    },
    color: {
      type: String,
      // Validated client-side / by Zod — the model just stores whatever
      // hex the picker emits. Optional; UI falls back when missing.
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for common queries
AccountSchema.index({ userId: 1, type: 1 });
AccountSchema.index({ userId: 1, createdAt: -1 });
AccountSchema.index({ userId: 1, isDeleted: 1 });

// 3. Export model with type safety
const Account: Model<IAccount> =
  models.Account || model<IAccount>("Account", AccountSchema);

export default Account;
