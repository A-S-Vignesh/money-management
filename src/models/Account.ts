// models/Account.ts
import { Schema, models, model, Document, Model, Types } from "mongoose";

// 1. Define Account interface
export interface IAccount extends Document {
  _id: string;
  userId: Types.ObjectId; // reference to User
  name: string;
  balance: number;
  isSystem?: boolean;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
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
    type: {
      type: String,
      enum: ["bank", "cash", "credit", "investment", "system", "goal", "other"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 3. Export model with type safety
const Account: Model<IAccount> =
  models.Account || model<IAccount>("Account", AccountSchema);

export default Account;
