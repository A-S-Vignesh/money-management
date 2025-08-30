// models/Budget.ts
import mongoose, { Document, Schema, Model } from "mongoose";

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  category: string;
  allocated: number;
  period: "Weekly" | "Monthly" | "Quarterly" | "Yearly";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema: Schema<IBudget> = new Schema(
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
    category: {
      type: String,
      required: true,
    },
    allocated: {
      type: Number,
      required: true,
    },
    period: {
      type: String,
      enum: ["Weekly", "Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },
    startDate: {
      type: Date,
      required: true, // calculated from period
    },
    endDate: {
      type: Date,
      required: true, // calculated from period
    },
  },
  {
    timestamps: true,
  }
);

const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);

export default Budget;
