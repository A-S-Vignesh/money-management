// app/api/accounts/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { updateAccountSchema } from "@/validations/account";

// ------------------ GET ------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 },
      );
    }

    return Response.json(
      {
        message: "Account fetched successfully",
        type: "success",
        data: account,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return Response.json(
      { message: "Failed to fetch account", type: "error" },
      { status: 500 },
    );
  }
}

// ------------------ PUT ------------------
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId }).select("type");
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 },
      );
    }

    if (account.type === "system") {
      return Response.json(
        { message: "Cannot edit system accounts", type: "warning" },
        { status: 403 },
      );
    }

    if (account.type === "goal" || account.type === "investment") {
      return Response.json(
        {
          message: `Cannot edit ${account.type} accounts here`,
          type: "warning",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    // Validate with Zod
    const parsed = updateAccountSchema.safeParse(body);
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

    const updated = await Account.findByIdAndUpdate(id, parsed.data, {
      new: true,
    });

    return Response.json(
      {
        message: "Account updated successfully",
        type: "success",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("PUT /api/accounts error:", error);
    return Response.json(
      { message: "Failed to update account", type: "error" },
      { status: 500 },
    );
  }
}

// ------------------ DELETE ------------------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 },
    );
  }

  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId }).select("type");

    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 },
      );
    }

    if (account.type === "system") {
      return Response.json(
        { message: "Cannot delete system accounts", type: "warning" },
        { status: 403 },
      );
    }

    if (account.type === "goal" || account.type === "investment") {
      return Response.json(
        {
          message: `Cannot delete ${account.type} accounts here`,
          type: "warning",
        },
        { status: 403 },
      );
    }

    // Bug #3 fix: Reverse counterparty balances before deleting transactions
    const relatedTransactions = await Transaction.find({
      userId,
      $or: [{ fromAccountId: id }, { toAccountId: id }],
    }).lean();

    const { default: mongoose } = await import("mongoose");
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // Reverse each transaction's effect on the OTHER account
      for (const txn of relatedTransactions) {
        if (txn.type === "income" && txn.toAccountId?.toString() === id) {
          // Income was deposited into this account — no counterparty to fix
        } else if (
          txn.type === "expense" &&
          txn.fromAccountId?.toString() === id
        ) {
          // Expense was deducted from this account — no counterparty to fix
        } else if (txn.type === "transfer") {
          if (txn.fromAccountId?.toString() === id && txn.toAccountId) {
            // We sent money FROM this account TO another — reverse the credit
            await Account.findByIdAndUpdate(
              txn.toAccountId,
              { $inc: { balance: -txn.amount } },
              { session: dbSession },
            );
          } else if (txn.toAccountId?.toString() === id && txn.fromAccountId) {
            // We received money INTO this account FROM another — reverse the debit
            await Account.findByIdAndUpdate(
              txn.fromAccountId,
              { $inc: { balance: txn.amount } },
              { session: dbSession },
            );
          }
        }
      }

      // Delete all related transactions
      await Transaction.deleteMany(
        { userId, $or: [{ fromAccountId: id }, { toAccountId: id }] },
        { session: dbSession },
      );

      // Delete the account itself
      await Account.findByIdAndDelete(id, { session: dbSession });

      await dbSession.commitTransaction();
      dbSession.endSession();

      return Response.json(
        {
          message: "Account and related transactions deleted successfully",
          type: "success",
        },
        { status: 200 },
      );
    } catch (txError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw txError;
    }
  } catch (error) {
    console.error("DELETE /api/accounts error:", error);
    return Response.json(
      { message: "Failed to delete account", type: "error" },
      { status: 500 },
    );
  }
}
