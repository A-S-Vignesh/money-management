// app/api/accounts/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { updateAccountSchema } from "@/validations/account";
import mongoose from "mongoose";

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

    // Spec: Balance is derived from transactions — never allow direct edits.
    // Strip balance even if somehow sent in the request body.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { balance: _ignored, ...safeUpdate } = parsed.data as Record<string, unknown>;

    const updated = await Account.findByIdAndUpdate(id, safeUpdate, {
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
    const account = await Account.findOne({ _id: id, userId });

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

    // Spec: Block deletion if balance is not zero
    if (account.balance !== 0) {
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }).format(Math.abs(account.balance));
      return Response.json(
        {
          message: `This account has a balance of ${formatted}. Transfer or withdraw all funds before deleting.`,
          type: "warning",
        },
        { status: 400 },
      );
    }

    // Spec: Transactions are permanent history — DO NOT delete them.
    // Only reverse counterparty balances for transfer transactions that touched OTHER accounts.
    const relatedTransactions = await Transaction.find({
      userId,
      $or: [{ fromAccountId: id }, { toAccountId: id }],
    }).lean();

    const isProd = process.env.NODE_ENV === "production";
    let dbSession: mongoose.ClientSession | undefined = undefined;

    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // Reverse counterparty balances for transfer transactions (only active accounts)
      for (const txn of relatedTransactions) {
        if (txn.type === "transfer") {
          if (txn.fromAccountId?.toString() === id && txn.toAccountId) {
            // We sent FROM this account → the counterparty received; reverse that credit
            const counterparty = await Account.findOne({
              _id: txn.toAccountId,
              isDeleted: { $ne: true },
            });
            if (counterparty) {
              await Account.findByIdAndUpdate(
                txn.toAccountId,
                { $inc: { balance: -txn.amount } },
                isProd ? { session: dbSession } : undefined,
              );
            }
          } else if (txn.toAccountId?.toString() === id && txn.fromAccountId) {
            // We received INTO this account → the counterparty was debited; reverse that debit
            const counterparty = await Account.findOne({
              _id: txn.fromAccountId,
              isDeleted: { $ne: true },
            });
            if (counterparty) {
              await Account.findByIdAndUpdate(
                txn.fromAccountId,
                { $inc: { balance: txn.amount } },
                isProd ? { session: dbSession } : undefined,
              );
            }
          }
        }
      }

      // Spec: Soft-delete the account — keep all transactions intact
      await Account.findByIdAndUpdate(
        id,
        { isDeleted: true, deletedAt: new Date() },
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json(
        {
          message: "Account deleted successfully",
          type: "success",
        },
        { status: 200 },
      );
    } catch (txError) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
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
