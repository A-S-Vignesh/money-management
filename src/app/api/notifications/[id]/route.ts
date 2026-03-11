import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// PATCH: Mark single notification as read
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: session.user._id },
      { isRead: true },
      { new: true },
    );

    if (!notification) {
      return Response.json(
        { message: "Notification not found", type: "error", success: false },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Notification marked as read",
      type: "success",
      success: true,
      data: notification,
    });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return Response.json(
      {
        message: "Failed to update notification",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}

// DELETE: Delete single notification
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: session.user._id,
    });

    if (!notification) {
      return Response.json(
        { message: "Notification not found", type: "error", success: false },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Notification deleted",
      type: "success",
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return Response.json(
      {
        message: "Failed to delete notification",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
