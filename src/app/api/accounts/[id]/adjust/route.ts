// app/api/accounts/[id]/adjust/route.ts
//
// POST → set an account's balance to a target value by booking an
// `adjustment` transaction for the difference (target − current).
//
// Why a transaction instead of writing Account.balance directly:
// balance is derived from the transaction log (see lib/recomputeBalance.ts),
// so a bare field write would be wiped by the next recompute. An adjustment
// row keeps the value derivable and leaves an audit trail of the correction.
// Adjustments are excluded from income/expense reports.
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { adjustBalanceSchema } from "@/validations/account";
import { getUserId } from "@/lib/mobileAuth";
import mongoose from "mongoose";

export async function POST(
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

  const { id } = await params;
  await connectToDatabase();

  try {
    const account = await Account.findOne({
      _id: id,
      userId,
      isDeleted: { $ne: true },
    });
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 },
      );
    }

    // Mirror the PUT restrictions: system/goal/investment balances are owned
    // by dedicated flows (goal contributions, holding buys/sells) and must not
    // be hand-adjusted here.
    if (account.type === "system") {
      return Response.json(
        { message: "Cannot adjust system accounts", type: "warning" },
        { status: 403 },
      );
    }
    if (account.type === "goal" || account.type === "investment") {
      return Response.json(
        {
          message: `Cannot adjust ${account.type} accounts here`,
          type: "warning",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const parsed = adjustBalanceSchema.safeParse(body);
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

    const current = account.balance ?? 0;
    const target = parsed.data.balance;
    const delta = target - current;

    if (delta === 0) {
      return Response.json(
        {
          message: "Balance is already at that amount",
          type: "info",
          data: account,
        },
        { status: 200 },
      );
    }

    const isProd = process.env.NODE_ENV === "production";
    let dbSession: mongoose.ClientSession | undefined = undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // delta > 0 → credit this account (toAccountId); delta < 0 → debit it.
      // amount is always positive; the sign lives in which side is set.
      const isCredit = delta > 0;
      await Transaction.create(
        [
          {
            userId,
            type: "adjustment",
            toAccountId: isCredit ? account._id : null,
            fromAccountId: isCredit ? null : account._id,
            amount: Math.abs(delta),
            category: "Balance Adjustment",
            description: parsed.data.note || "Balance adjustment",
            date: new Date(),
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      const updated = await Account.findByIdAndUpdate(
        id,
        { $inc: { balance: delta } },
        isProd ? { new: true, session: dbSession } : { new: true },
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json(
        {
          message: "Balance adjusted successfully",
          type: "success",
          data: updated,
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
    console.error("POST /api/accounts/[id]/adjust error:", error);
    return Response.json(
      { message: "Failed to adjust balance", type: "error" },
      { status: 500 },
    );
  }
}
