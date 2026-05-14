import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPushSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  // Bumped whenever a push lands successfully — drives the TTL of dead devices.
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema: Schema<IPushSubscription> = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true },
);

PushSubscriptionSchema.index({ userId: 1 });
// TTL: drop subscriptions we haven't successfully pushed to in 180 days.
// Combined with the 410/404 cleanup in lib/notifications.ts, this catches
// the silent-stale case where a user uninstalls the PWA without
// unsubscribing and the endpoint just stops responding.
PushSubscriptionSchema.index(
  { lastUsedAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 180 },
);

const PushSubscription: Model<IPushSubscription> =
  mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>("PushSubscription", PushSubscriptionSchema);

export default PushSubscription;
