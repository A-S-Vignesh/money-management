import Transaction from "@/models/Transaction";
import { getUserId } from "@/lib/mobileAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import { updateTransactionSchema } from "@/validations/transaction";
import { syncGoalCompletion } from "@/lib/recomputeBalance";
import mongoose from "mongoose";

const isProd = process.env.NODE_ENV === "production";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserId(req);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  try {
    await connectToDatabase();
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return Response.json(
        { message: "Transaction not found", type: "error" },
        { status: 404 },
      );
    }
    return Response.json({
      message: "Transaction Fetched Successfully",
      type: "success",
      data: transaction,
    });
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to fetch transaction", type: "error" },
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
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // Validate with Zod
  const parsed = updateTransactionSchema.safeParse(body);
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

  const updatedData = parsed.data;

  try {
    await connectToDatabase();

    // Fetch old transaction
    const oldTransaction = await Transaction.findOne({ _id: id, userId });
    if (!oldTransaction) {
      return Response.json(
        { message: "Transaction not found", type: "error" },
        { status: 404 },
      );
    }

    const {
      type: oldType,
      amount: oldAmount,
      fromAccountId: oldFrom,
      toAccountId: oldTo,
    } = oldTransaction;

    // MongoDB sessions/transactions only work on replica sets (not local standalone MongoDB)
    let dbSession: mongoose.ClientSession | undefined = undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // 🔹 Step 1: Undo old transaction (skip if account was soft-deleted)
      if (oldType === "income") {
        if (oldTo) {
          const acc = await Account.findOne({ _id: oldTo, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              oldTo,
              { $inc: { balance: -oldAmount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      } else if (oldType === "expense") {
        if (oldFrom) {
          const acc = await Account.findOne({ _id: oldFrom, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              oldFrom,
              { $inc: { balance: oldAmount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      } else if (oldType === "transfer") {
        if (oldFrom) {
          const acc = await Account.findOne({ _id: oldFrom, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              oldFrom,
              { $inc: { balance: oldAmount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
        if (oldTo) {
          const acc = await Account.findOne({ _id: oldTo, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              oldTo,
              { $inc: { balance: -oldAmount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      }

      // 🔹 Step 2: Apply new transaction (block if new account is soft-deleted)
      const {
        type: newType,
        amount: newAmount = 0,
        fromAccountId: newFrom,
        toAccountId: newTo,
      } = updatedData;

      // Validate new accounts are active
      const newAccIds = [newFrom, newTo].filter(Boolean);
      if (newAccIds.length > 0) {
        const activeNewAccs = await Account.find({
          _id: { $in: newAccIds },
          isDeleted: { $ne: true },
        }).select("_id");
        const activeNewIds = activeNewAccs.map((a) => a._id.toString());
        for (const accId of newAccIds) {
          if (!activeNewIds.includes(accId!)) {
            if (isProd && dbSession) {
              await dbSession.abortTransaction();
              dbSession.endSession();
            }
            return Response.json(
              { message: "One or more selected accounts are no longer available (deleted).", type: "error" },
              { status: 400 },
            );
          }
        }
      }

      if (newType === "income") {
        if (newTo) {
          await Account.findByIdAndUpdate(
            newTo,
            { $inc: { balance: newAmount } },
            isProd ? { session: dbSession } : undefined,
          );
        }
      } else if (newType === "expense") {
        if (newFrom) {
          await Account.findByIdAndUpdate(
            newFrom,
            { $inc: { balance: -newAmount } },
            isProd ? { session: dbSession } : undefined,
          );
        }
      } else if (newType === "transfer") {
        if (newFrom) {
          await Account.findByIdAndUpdate(
            newFrom,
            { $inc: { balance: -newAmount } },
            isProd ? { session: dbSession } : undefined,
          );
        }
        if (newTo) {
          await Account.findByIdAndUpdate(
            newTo,
            { $inc: { balance: newAmount } },
            isProd ? { session: dbSession } : undefined,
          );
        }
      }

      // 🔹 Step 3: Save updated transaction
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId },
        updatedData,
        isProd ? { new: true, session: dbSession } : { new: true },
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      // Re-sync goal completion for every account this edit touched
      // (old + new). Bidirectional, so reducing the amount can un-complete.
      const goalSyncTargets = Array.from(
        new Set(
          [oldFrom, oldTo, newFrom, newTo]
            .filter((id): id is NonNullable<typeof id> => !!id)
            .map((id) => id.toString()),
        ),
      );
      Promise.allSettled(
        goalSyncTargets.map((id) => syncGoalCompletion(id)),
      ).catch(() => {});

      return Response.json(
        {
          message: "Transaction Updated Successfully",
          type: "success",
          data: transaction,
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
    console.error("PUT /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to update transaction", type: "error" },
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
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;

  try {
    await connectToDatabase();

    // Find the transaction first
    const transaction = await Transaction.findOne({ _id: id, userId });

    if (!transaction) {
      return Response.json(
        { message: "Transaction not found", type: "error" },
        { status: 404 },
      );
    }

    const { type, amount, fromAccountId, toAccountId } = transaction;

    // MongoDB sessions/transactions only work on replica sets (not local standalone MongoDB)
    let dbSession: mongoose.ClientSession | undefined = undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // 🔹 Reverse balance effect (skip if account is soft-deleted)
      if (type === "income") {
        if (toAccountId) {
          const acc = await Account.findOne({ _id: toAccountId, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              toAccountId,
              { $inc: { balance: -amount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      } else if (type === "expense") {
        if (fromAccountId) {
          const acc = await Account.findOne({ _id: fromAccountId, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              fromAccountId,
              { $inc: { balance: amount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      } else if (type === "transfer") {
        if (fromAccountId) {
          const acc = await Account.findOne({ _id: fromAccountId, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              fromAccountId,
              { $inc: { balance: amount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
        if (toAccountId) {
          const acc = await Account.findOne({ _id: toAccountId, isDeleted: { $ne: true } });
          if (acc) {
            await Account.findByIdAndUpdate(
              toAccountId,
              { $inc: { balance: -amount } },
              isProd ? { session: dbSession } : undefined,
            );
          }
        }
      }

      // 🔹 Now delete the transaction
      await Transaction.findByIdAndDelete(
        id,
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      // Re-sync goal completion for any goal accounts this deletion touched.
      // Removing money from a goal account may bring it back below target.
      const goalSyncTargets = [fromAccountId, toAccountId]
        .filter((id): id is NonNullable<typeof id> => !!id)
        .map((id) => id.toString());
      Promise.allSettled(
        goalSyncTargets.map((id) => syncGoalCompletion(id)),
      ).catch(() => {});

      return Response.json(
        {
          message: "Transaction deleted and balances updated",
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
    console.error("DELETE /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to delete transaction", type: "error" },
      { status: 500 },
    );
  }
}
