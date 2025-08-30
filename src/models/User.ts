// models/User.ts
import mongoose, { Document, Model, Schema, Types } from "mongoose";

// 1. Define the User interface
export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  image?: string;
  googleId: string;
  phoneNo?: string;
  dob?: Date;
  currency: string;
  lang: string;
  notifications: boolean;
  twoFactorAuth: boolean;
  premium: "free" | "pro" | "family";
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create Schema
const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    image: { type: String },
    googleId: { type: String, unique: true, required: true },
    phoneNo: { type: String, unique: true, sparse: true },
    dob: { type: Date },
    currency: { type: String, default: "INR" },
    lang: { type: String, default: "en" },
    notifications: { type: Boolean, default: true },
    twoFactorAuth: { type: Boolean, default: false },
    premium: {
      type: String,
      enum: ["free", "pro", "family"],
      default: "free",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  { timestamps: true }
);

// 3. Export model with type safety
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
