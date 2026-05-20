

import { connectToDatabase } from "@/lib/mongodb";
import PushSubscription from "@/models/PushSubscription";
import { getUserId } from "@/lib/mobileAuth";

// POST: Subscribe to push notifications
export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();
    const { subscription } = await req.json();

    if (!subscription?.endpoint || !subscription?.keys) {
      return Response.json(
        { message: "Invalid subscription data", type: "error", success: false },
        { status: 400 },
      );
    }

    // Upsert subscription (update if endpoint exists, create if not)
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        userId: userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      { upsert: true, new: true },
    );

    return Response.json({
      message: "Subscribed to push notifications",
      type: "success",
      success: true,
    });
  } catch (error) {
    console.error("POST /api/notifications/subscribe error:", error);
    return Response.json(
      { message: "Failed to subscribe", type: "error", success: false },
      { status: 500 },
    );
  }
}

// DELETE: Unsubscribe from push notifications
export async function DELETE(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();
    const { endpoint } = await req.json();

    await PushSubscription.deleteOne({
      userId: userId,
      endpoint,
    });

    return Response.json({
      message: "Unsubscribed from push notifications",
      type: "success",
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/notifications/subscribe error:", error);
    return Response.json(
      { message: "Failed to unsubscribe", type: "error", success: false },
      { status: 500 },
    );
  }
}
