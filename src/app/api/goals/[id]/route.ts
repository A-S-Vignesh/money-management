import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";

// GET: /api/goals/:id
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
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
        { status: 404 }
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
      { status: 500 }
    );
  }
}

// PUT: /api/goals/:id
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  await connectToDatabase();
  const { id } = await params;

  try {
    const body = await req.json();
    const { deadline } = body;
    const updated = await Goal.findOneAndUpdate(
      { _id: id, userId: session.user._id },
      body,
      { new: true }
    );

    if (!updated) {
      return Response.json(
        { message: "Goal not found", type: "error" },
        { status: 404 }
      );
    }
    const deadlineDate = new Date(deadline);

    if (deadlineDate < new Date()) {
      return Response.json(
        {
          message: "Deadline cannot be before today",
          type: "warning",
        },
        { status: 400 }
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
      { status: 500 }
    );
  }
}

// DELETE: /api/goals/:id
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
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
        { status: 404 }
      );
    }

    // Get associated account
    const account = await Account.findOne({
      _id: goal.accountId,
      userId: session.user._id,
    });

    if (account && !goal.isCompleted && account.balance > 0) {
      const deletedAccount = await Account.findOne({
        userId: session.user._id,
        name: "Deleted Account",
        isSystem: true,
      });

      if (deletedAccount) {
        deletedAccount.balance += account.balance;
        await deletedAccount.save();

        account.balance = 0;
        await account.save();
      }

      await Transaction.deleteMany({
        userId: session.user._id,
        $or: [{ fromAccountId: id }, { toAccountId: id }],
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
      { status: 500 }
    );
  }
}
