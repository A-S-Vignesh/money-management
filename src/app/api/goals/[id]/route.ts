import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import { updateGoalSchema } from "@/validations/goal";
import mongoose from "mongoose";
import { getUserId } from "@/lib/mobileAuth";

// GET: /api/goals/:id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  await connectToDatabase();
  const { id } = await params;

  try {
    const goal = await Goal.findOne({
      _id: id,
      userId: userId,
    }).lean();

    if (!goal) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 },
      );
    }

    // Enrich with `saved` (linked-account balance) so the goal detail
    // screen can render progress without a second round-trip.
    const account = await Account.findById(goal.accountId).select("balance").lean();
    const enriched = { ...goal, saved: account?.balance ?? 0 };

    return Response.json({
      message: "Goal fetched successfully",
      type: "success",
      data: enriched,
    });
  } catch (error) {
    console.error("GET goal error:", error);
    return Response.json(
      { message: "Failed to fetch goal", type: "error" },
      { status: 500 },
    );
  }
}

// PUT: /api/goals/:id
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  await connectToDatabase();
  const { id } = await params;

  try {
    const body = await req.json();

    const parsed = updateGoalSchema.safeParse(body);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      return Response.json(
        {
          message: "Validation failed",
          type: "error",
          success: false,
          errors: fieldErrors,
        },
        { status: 422 },
      );
    }

    const { deadline } = parsed.data;

    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate < new Date()) {
        return Response.json(
          {
            message: "Deadline cannot be before today",
            type: "warning",
          },
          { status: 400 },
        );
      }
    }

    const updated = await Goal.findOneAndUpdate(
      { _id: id, userId: userId },
      parsed.data,
      { new: true },
    );

    if (!updated) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Goal updated successfully",
      type: "success",
      data: updated,
    });
  } catch (error) {
    console.error("PUT goal error:", error);
    return Response.json(
      { message: "Failed to update goal", type: "error" },
      { status: 500 },
    );
  }
}

// DELETE: /api/goals/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  await connectToDatabase();
  const { id } = await params;

  try {
    const goal = await Goal.findOne({
      _id: id,
      userId: userId,
    });

    if (!goal) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 },
      );
    }

    // Get associated goal account
    const account = await Account.findOne({
      _id: goal.accountId,
      userId: userId,
    });

    // Spec: Block deletion if goal account still has money
    if (account && account.balance > 0) {
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(account.balance);
      return Response.json(
        {
          message: `This goal has ${formatted} saved. Transfer it to another account first.`,
          type: "warning",
        },
        { status: 400 },
      );
    }

    // Spec: Atomic delete — soft-delete the goal account, hard-delete only the Goal doc
    // Transactions are permanent history — DO NOT delete them
    const isProd = process.env.NODE_ENV === "production";
    let dbSession: mongoose.ClientSession | undefined = undefined;

    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // Spec: Soft-delete the goal account
      if (account) {
        await Account.findByIdAndUpdate(
          account._id,
          { isDeleted: true, deletedAt: new Date() },
          isProd ? { session: dbSession } : undefined,
        );
      }

      // Hard-delete the Goal document only
      await Goal.deleteOne(
        { _id: goal._id },
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }
    } catch (txError) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txError;
    }

    return Response.json({
      message: "Goal deleted successfully",
      type: "success",
    });
  } catch (error) {
    console.error("DELETE goal error:", error);
    return Response.json(
      { message: "Failed to delete goal", type: "error" },
      { status: 500 },
    );
  }
}
