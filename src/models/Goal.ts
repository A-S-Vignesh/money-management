import mongoose, { Schema, Document, Model } from "mongoose";

export interface IGoal extends Document {
  userId: mongoose.Types.ObjectId;
  accountId: mongoose.Types.ObjectId;
  name: string;
  target: number;
  category: string;
  priority: "Low" | "Medium" | "High";
  deadline?: Date;
  color: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema: Schema<IGoal> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    target: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    deadline: {
      type: Date,
      validate: {
        validator: function (value: Date) {
          return !value || value > new Date();
        },
        message: "Deadline must be a future date",
      },
    },
    color: {
      type: String,
      default: "#3B82F6",
    },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Strongly typed model
const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);

export default Goal;
