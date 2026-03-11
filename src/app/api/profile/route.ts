import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { updateProfileSchema } from "@/validations/profile";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  await connectToDatabase();

  try {
    const user = await User.findById(session.user._id)
      .select("-password -googleId -__v")
      .lean();

    if (!user) {
      return Response.json(
        { message: "User not found", type: "error", success: false },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Profile fetched successfully",
      type: "success",
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("GET profile error:", err);
    return Response.json(
      { message: "Failed to fetch profile", type: "error", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  await connectToDatabase();

  try {
    const body = await req.json();

    // Validate with Zod
    const result = updateProfileSchema.safeParse(body);
    if (!result.success) {
      return Response.json(
        {
          message: "Validation failed",
          type: "error",
          success: false,
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    // Build update object — only include fields that are actually present
    const updates: Record<string, unknown> = {};
    if (result.data.name !== undefined) updates.name = result.data.name;
    if (result.data.phoneNo !== undefined)
      updates.phoneNo = result.data.phoneNo || null;
    if (result.data.dob !== undefined)
      updates.dob = result.data.dob ? new Date(result.data.dob) : null;
    if (result.data.currency !== undefined)
      updates.currency = result.data.currency;
    if (result.data.lang !== undefined) updates.lang = result.data.lang;
    if (result.data.notifications !== undefined)
      updates.notifications = result.data.notifications;
    if (result.data.twoFactorAuth !== undefined)
      updates.twoFactorAuth = result.data.twoFactorAuth;

    const updatedUser = await User.findByIdAndUpdate(
      session.user._id,
      { $set: updates },
      { new: true },
    )
      .select("-password -googleId -__v")
      .lean();

    if (!updatedUser) {
      return Response.json(
        { message: "User not found", type: "error", success: false },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Profile updated successfully",
      type: "success",
      success: true,
      data: updatedUser,
    });
  } catch (err) {
    console.error("PUT profile error:", err);
    return Response.json(
      { message: "Failed to update profile", type: "error", success: false },
      { status: 500 },
    );
  }
}
