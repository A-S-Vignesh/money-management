import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    const user = await User.findById(session.user._id).select("-password");

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json(user);
  } catch (err) {
    console.error("GET user error:", err);
    return new Response("Failed to fetch user", { status: 500 });
  }
}

export async function POST(req:Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    const body = await req.json();
    const user = await User.findById(session.user._id);

    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    // Only allow creation of missing fields (if any)
    Object.assign(user, body);
    await user.save();

    return Response.json(user);
  } catch (err) {
    console.error("POST user update error:", err);
    return new Response("Failed to update user", { status: 500 });
  }
}

export async function PUT(req:Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    const updates = await req.json();

    const updatedUser = await User.findByIdAndUpdate(
      session.user._id,
      updates,
      { new: true }
    );

    if (!updatedUser) {
      return new Response("User not found", { status: 404 });
    }

    return Response.json(updatedUser);
  } catch (err) {
    console.error("PUT user update error:", err);
    return new Response("Failed to update user", { status: 500 });
  }
}
