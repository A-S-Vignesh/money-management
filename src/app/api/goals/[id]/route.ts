import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";

// GET: /api/goals/:id
export async function GET(req:Request, { params }:{params:Promise<{id:string}>}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

    await connectToDatabase();
    const {id} = await params;
  try {
    const goal = await Goal.findOne({
      _id: id,
      userId: session.user._id,
    });
    if (!goal) {
      return new Response("Goal not found", { status: 404 });
    }
    return Response.json(goal);
  } catch (error) {
    return new Response("Failed to fetch goal", { status: 500 });
  }
}

// PUT: /api/goals/:id
export async function PUT(req:Request, { params }:{params:Promise<{id:string}>}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();
  const {id} = await params;
  try {
    const body = await req.json();
    const updated = await Goal.findOneAndUpdate(
      { _id: id, userId: session.user._id },
      body,
      { new: true }
    );
    if (!updated) {
      return new Response("Goal not found", { status: 404 });
    }
    return Response.json(updated);
  } catch (error) {
    return new Response("Failed to update goal", { status: 500 });
  }
}

// DELETE: /api/goals/:id
export async function DELETE(req:Request, { params }:{params:Promise<{id:string}>}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();
  const {id} = await params;

  try {
    const goal = await Goal.findOne({
      _id: id,
      userId: session.user._id,
    });

    if (!goal) {
      return new Response("Goal not found", { status: 404 });
    }

    // Get associated account
    const account = await Account.findOne({
      _id: goal.accountId,
      userId: session.user._id,
    });

    if (account && !goal?.isCompleted && account.balance > 0) {
      const deletedAccount = await Account.findOne({
        userId: session.user._id,
        name: "Deleted Account",
        isSystem: true,
      });

      if (deletedAccount) {
        deletedAccount.balance += account.balance;
        await deletedAccount.save();

        account.balance = 0;
        await account.save(); // ✅ Persist the cleared balance
      }
    }

    // Delete the goal and its associated account
    await Goal.deleteOne({ _id: goal._id });
    if (account) {
      await Account.deleteOne({ _id: account._id });
    }

    return new Response("Goal deleted and funds transferred.", { status: 200 });
  } catch (error) {
    console.error("Goal Deletion Error:", error);
    return new Response("Failed to delete goal", { status: 500 });
  }
}
