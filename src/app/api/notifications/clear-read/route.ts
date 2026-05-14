// app/api/notifications/clear-read/route.ts
//
// DELETE → bulk-delete every READ notification for the user. Unread alerts
// are kept. Complements the TTL on Notification.createdAt (which auto-purges
// read entries after 30 days) with an immediate user-driven option.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();
    const result = await Notification.deleteMany({
      userId: session.user._id,
      isRead: true,
    });
    return Response.json({
      message:
        result.deletedCount > 0
          ? `Cleared ${result.deletedCount} read notification${result.deletedCount > 1 ? "s" : ""}`
          : "No read notifications to clear",
      type: "success",
      success: true,
      data: { deletedCount: result.deletedCount },
    });
  } catch (error) {
    console.error("DELETE /api/notifications/clear-read error:", error);
    return Response.json(
      {
        message: "Failed to clear notifications",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
