

import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";
import { getUserId } from "@/lib/mobileAuth";

// PATCH: Mark all notifications as read
export async function PATCH(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const result = await Notification.updateMany(
      { userId: userId, isRead: false },
      { isRead: true },
    );

    return Response.json({
      message: `${result.modifiedCount} notification(s) marked as read`,
      type: "success",
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error("PATCH /api/notifications/mark-all-read error:", error);
    return Response.json(
      { message: "Failed to mark all as read", type: "error", success: false },
      { status: 500 },
    );
  }
}
