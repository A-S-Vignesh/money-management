import { Types, Document } from "mongoose";

// ✅ Full MongoDB document (for backend / DB use only)
// `_id` is the string form returned after lean()/JSON, not the raw ObjectId.
export interface IAccount extends Omit<Document, "_id"> {
  _id: string;
  userId: Types.ObjectId;
  name: string;
  balance: number;
  isSystem?: boolean;
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  /** User-chosen card colour (hex). Optional — UI falls back when missing. */
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ For creating a new account (frontend → backend)
export interface NewAccount {
  name: string;
  balance?: number; // Optional, defaults to 0
  isSystem?: boolean; // Optional, defaults to false
  type: "bank" | "cash" | "credit" | "investment" | "system" | "goal" | "other";
  color?: string;
}

// ✅ For updating an account (frontend → backend)
export type UpdateAccount = Partial<NewAccount>;
