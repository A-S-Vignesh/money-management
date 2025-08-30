import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define the Notification interface extending mongoose.Document
export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "budget" | "goal" | "transaction" | "system";
  message: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 2. Define schema with types
const NotificationSchema: Schema<INotification> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["budget", "goal", "transaction", "system"],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// 3. Define model with types
const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
