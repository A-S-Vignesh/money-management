import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

type NotificationType = "budget" | "goal" | "transaction" | "system";

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sendPush?: boolean;
}

/**
 * Creates an in-app notification and optionally sends a push notification.
 * Safe to call from any API route — never throws (logs errors instead).
 */
export async function createNotification({
  userId,
  type,
  title,
  message,
  sendPush = true,
}: CreateNotificationParams) {
  try {
    await connectToDatabase();

    // 1. Create in-app notification
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
    });

    // 2. Optionally send push notification
    if (sendPush) {
      await sendPushToUser(userId, title, message);
    }

    return notification;
  } catch (error) {
    console.error("createNotification error:", error);
    return null;
  }
}

/**
 * Check if a similar notification was already sent in the last `hours` hours.
 * Used by the cron job to avoid duplicate alerts.
 */
export async function isDuplicateNotification(
  userId: string,
  type: NotificationType,
  title: string,
  hours: number = 24,
): Promise<boolean> {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const existing = await Notification.findOne({
    userId,
    type,
    title,
    createdAt: { $gte: since },
  });
  return !!existing;
}

/**
 * Send push notification to all of a user's subscribed devices.
 * Silently cleans up expired subscriptions.
 */
async function sendPushToUser(userId: string, title: string, body: string) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || "mailto:admin@moneynest.app";

    if (!publicKey || !privateKey) return;

    webpush.setVapidDetails(subject, publicKey, privateKey);

    const subscriptions = await PushSubscription.find({ userId }).lean();
    if (subscriptions.length === 0) return;

    const payload = JSON.stringify({
      title,
      body,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      url: "/dashboard/notifications",
    });

    await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
            },
            payload,
          );
        } catch (error: unknown) {
          if (
            error instanceof webpush.WebPushError &&
            (error.statusCode === 410 || error.statusCode === 404)
          ) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
        }
      }),
    );
  } catch (error) {
    console.error("sendPushToUser error:", error);
  }
}
