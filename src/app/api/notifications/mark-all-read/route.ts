import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// PATCH: Mark all notifications as read
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const result = await Notification.updateMany(
      { userId: session.user._id, isRead: false },
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
