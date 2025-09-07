import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";

// ✅ GET: Fetch single budget by ID
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const budget = await Budget.findOne({ _id: id, userId: session.user._id });

    if (!budget) {
      return Response.json(
        { message: "Budget not found", type: "error", success: false },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "Budget fetched successfully",
        type: "success",
        success: true,
        data: budget,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/budget/:id error:", error);
    return Response.json(
      { message: "Failed to fetch budget", type: "error", success: false },
      { status: 500 }
    );
  }
}

// ✅ PUT: Update budget
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const updates = await req.json();

    const existing = await Budget.findOne({
      _id: id,
      userId: session.user._id,
    });
    if (!existing) {
      return Response.json(
        { message: "Budget not found", type: "error", success: false },
        { status: 404 }
      );
    }

    const updated = await Budget.findOneAndUpdate(
      { _id: id, userId: session.user._id },
      updates,
      { new: true }
    );

    if (!updated) {
      return Response.json(
        { message: "Failed to update budget", type: "error", success: false },
        { status: 500 }
      );
    }

    return Response.json(
      {
        message: "Budget updated successfully",
        type: "success",
        success: true,
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/budget/:id error:", error);
    return Response.json(
      { message: "Failed to update budget", type: "error", success: false },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Remove budget
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const existing = await Budget.findOne({
      _id: id,
      userId: session.user._id,
    });
    if (!existing) {
      return Response.json(
        { message: "Budget not found", type: "error", success: false },
        { status: 404 }
      );
    }

    await Budget.deleteOne({ _id: id, userId: session.user._id });

    return Response.json(
      {
        message: "Budget deleted successfully",
        type: "success",
        success: true,
        data: { id },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/budget/:id error:", error);
    return Response.json(
      { message: "Failed to delete budget", type: "error", success: false },
      { status: 500 }
    );
  }
}
