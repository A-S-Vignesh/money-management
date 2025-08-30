import { Types, Document } from "mongoose";

// ✅ Full MongoDB document (for backend / DB use only)
export interface IAccount extends Document {
  _id: string;
  userId: Types.ObjectId;
  name: string;
  balance: number;
  isSystem?: boolean;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  createdAt: Date;
  updatedAt: Date;
}

// ✅ For creating a new account (frontend → backend)
export interface NewAccount {
  name: string;
  balance?: number; // Optional, defaults to 0
  isSystem?: boolean; // Optional, defaults to false
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
}

// ✅ For updating an account (frontend → backend)
export type UpdateAccount = Partial<NewAccount>;
