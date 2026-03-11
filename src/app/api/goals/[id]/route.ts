import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { updateGoalSchema } from "@/validations/goal";

// GET: /api/goals/:id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
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
      userId: session.user._id,
    });

    if (!goal) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 },
      );
    }

    return Response.json({
      message: "Goal fetched successfully",
      type: "success",
      data: goal,
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  await connectToDatabase();
  const { id } = await params;

  try {
    const body = await req.json();

    // Validate with Zod
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
      { _id: id, userId: session.user._id },
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
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
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
      userId: session.user._id,
    });

    if (!goal) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 },
      );
    }

    // Get associated account
    const account = await Account.findOne({
      _id: goal.accountId,
      userId: session.user._id,
    });

    if (account && !goal.isCompleted && account.balance > 0) {
      // Bug #8 fix: Auto-create "Deleted Account" if it doesn't exist
      let deletedAccount = await Account.findOne({
        userId: session.user._id,
        name: "Deleted Account",
        isSystem: true,
      });

      if (!deletedAccount) {
        deletedAccount = await Account.create({
          userId: session.user._id,
          name: "Deleted Account",
          type: "system",
          isSystem: true,
          balance: 0,
        });
      }

      deletedAccount.balance += account.balance;
      await deletedAccount.save();

      account.balance = 0;
      await account.save();
    }

    // Bug #4 fix: Use goal.accountId, not goal._id (id), to find related transactions
    if (account) {
      await Transaction.deleteMany({
        userId: session.user._id,
        $or: [
          { fromAccountId: goal.accountId },
          { toAccountId: goal.accountId },
        ],
      });
    }

    // Delete the goal and its associated account
    await Goal.deleteOne({ _id: goal._id });
    if (account) {
      await Account.deleteOne({ _id: account._id });
    }

    return Response.json({
      message: "Goal deleted and funds transferred",
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
