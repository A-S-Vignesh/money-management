import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Notification from "@/models/Notification";

// GET: Fetch notifications with pagination + unread count
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    // Build filter
    const query: Record<string, unknown> = { userId };

    const typeFilter = searchParams.get("type");
    if (typeFilter && typeFilter !== "all") {
      query.type = typeFilter;
    }

    const readFilter = searchParams.get("read");
    if (readFilter === "true") query.isRead = true;
    else if (readFilter === "false") query.isRead = false;

    // Run queries in parallel
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return Response.json({
      message: "Notifications fetched successfully",
      type: "success",
      success: true,
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return Response.json(
      {
        message: "Failed to fetch notifications",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
