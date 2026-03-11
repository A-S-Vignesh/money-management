import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import webpush from "web-push";

// Lazy VAPID init — ensures env vars are loaded
function initVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@moneynest.app";

  if (!publicKey || !privateKey) {
    throw new Error(
      "VAPID keys not configured. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY in .env",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

// POST: Send push notification to current user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    // Init VAPID inside handler (not module-level)
    initVapid();

    await connectToDatabase();
    const { title, body, url } = await req.json();

    if (!title || !body) {
      return Response.json(
        {
          message: "Title and body are required",
          type: "error",
          success: false,
        },
        { status: 400 },
      );
    }

    // Find all subscriptions for this user
    const subscriptions = await PushSubscription.find({
      userId: session.user._id,
    }).lean();

    if (subscriptions.length === 0) {
      return Response.json(
        {
          message: "No push subscriptions found. Enable notifications first.",
          type: "warning",
          success: false,
        },
        { status: 404 },
      );
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/web-app-manifest-192x192.png",
      badge: "/web-app-manifest-192x192.png",
      url: url || "/dashboard",
    });

    // Send to all user's subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.keys.p256dh,
                auth: sub.keys.auth,
              },
            },
            payload,
          );
        } catch (error: unknown) {
          console.error("Push send error for endpoint:", sub.endpoint, error);
          // Remove invalid/expired subscriptions
          if (
            error instanceof webpush.WebPushError &&
            (error.statusCode === 410 || error.statusCode === 404)
          ) {
            await PushSubscription.deleteOne({ _id: sub._id });
          }
          throw error;
        }
      }),
    );

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    // Log failures for debugging
    results.forEach((r, i) => {
      if (r.status === "rejected") {
        console.error(
          `Push to sub[${i}] failed:`,
          r.reason?.message || r.reason,
        );
      }
    });

    return Response.json({
      message: `Notification sent to ${sent} device(s)${failed > 0 ? `, ${failed} failed` : ""}`,
      type: sent > 0 ? "success" : "error",
      success: sent > 0,
      data: { sent, failed },
    });
  } catch (error) {
    console.error("POST /api/notifications/send error:", error);
    return Response.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Failed to send notification",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
