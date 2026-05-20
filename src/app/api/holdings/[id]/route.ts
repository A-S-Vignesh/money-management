// app/api/holdings/[id]/route.ts
//
// GET    → fetch one holding
// PUT    → edit non-financial metadata (name, symbol, notes, FD fields)
// DELETE → remove the holding row entirely (does NOT touch the linked
//          transactions or account balances — those stay as historical record)
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import { updateHoldingSchema } from "@/validations/holding";
import { getUserId } from "@/lib/mobileAuth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  try {
    await connectToDatabase();
    const holding = await Holding.findOne({ _id: id, userId })
      .populate("accountId", "name type")
      .lean();
    if (!holding) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }
    return Response.json({
      message: "Holding fetched",
      type: "success",
      success: true,
      data: holding,
    });
  } catch (error) {
    console.error("GET /api/holdings/[id] error:", error);
    return Response.json(
      { message: "Failed to fetch holding", type: "error", success: false },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = updateHoldingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Validation failed",
        type: "error",
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    await connectToDatabase();
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.maturityDate !== undefined) {
      update.maturityDate = parsed.data.maturityDate
        ? new Date(parsed.data.maturityDate)
        : null;
    }
    const holding = await Holding.findOneAndUpdate(
      { _id: id, userId },
      update,
      { new: true },
    );
    if (!holding) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }
    return Response.json({
      message: "Holding updated",
      type: "success",
      success: true,
      data: holding,
    });
  } catch (error) {
    console.error("PUT /api/holdings/[id] error:", error);
    return Response.json(
      { message: "Failed to update holding", type: "error", success: false },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  try {
    await connectToDatabase();
    const deleted = await Holding.findOneAndDelete({ _id: id, userId });
    if (!deleted) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }
    // We deliberately do NOT delete linked transactions or reverse balances —
    // the historical buys/sells are still valid cash-flow events.
    return Response.json({
      message: "Holding deleted (linked transactions preserved)",
      type: "success",
      success: true,
    });
  } catch (error) {
    console.error("DELETE /api/holdings/[id] error:", error);
    return Response.json(
      { message: "Failed to delete holding", type: "error", success: false },
      { status: 500 },
    );
  }
}
