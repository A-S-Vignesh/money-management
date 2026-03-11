import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import { updateTransactionSchema } from "@/validations/transaction";
import mongoose from "mongoose";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
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
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

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

    // Bug #1 fix: Use MongoDB transaction for atomic undo + redo
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 🔹 Step 1: Undo old transaction
      if (oldType === "income") {
        if (oldTo) {
          await Account.findByIdAndUpdate(
            oldTo,
            { $inc: { balance: -oldAmount } },
            { session: dbSession },
          );
        }
      } else if (oldType === "expense") {
        if (oldFrom) {
          await Account.findByIdAndUpdate(
            oldFrom,
            { $inc: { balance: oldAmount } },
            { session: dbSession },
          );
        }
      } else if (oldType === "transfer") {
        if (oldFrom) {
          await Account.findByIdAndUpdate(
            oldFrom,
            { $inc: { balance: oldAmount } },
            { session: dbSession },
          );
        }
        if (oldTo) {
          await Account.findByIdAndUpdate(
            oldTo,
            { $inc: { balance: -oldAmount } },
            { session: dbSession },
          );
        }
      }

      // 🔹 Step 2: Apply new transaction
      const {
        type: newType,
        amount: newAmount = 0,
        fromAccountId: newFrom,
        toAccountId: newTo,
      } = updatedData;

      if (newType === "income") {
        if (newTo) {
          await Account.findByIdAndUpdate(
            newTo,
            { $inc: { balance: newAmount } },
            { session: dbSession },
          );
        }
      } else if (newType === "expense") {
        if (newFrom) {
          await Account.findByIdAndUpdate(
            newFrom,
            { $inc: { balance: -newAmount } },
            { session: dbSession },
          );
        }
      } else if (newType === "transfer") {
        if (newFrom) {
          await Account.findByIdAndUpdate(
            newFrom,
            { $inc: { balance: -newAmount } },
            { session: dbSession },
          );
        }
        if (newTo) {
          await Account.findByIdAndUpdate(
            newTo,
            { $inc: { balance: newAmount } },
            { session: dbSession },
          );
        }
      }

      // 🔹 Step 3: Save updated transaction
      const transaction = await Transaction.findOneAndUpdate(
        { _id: id, userId },
        updatedData,
        { new: true, session: dbSession },
      );

      await dbSession.commitTransaction();
      dbSession.endSession();

      return Response.json(
        {
          message: "Transaction Updated Successfully",
          type: "success",
          data: transaction,
        },
        { status: 200 },
      );
    } catch (txError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
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
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

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

    // Bug #1 fix: Use MongoDB transaction for atomic delete + balance reversal
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      // 🔹 Reverse balance effect
      if (type === "income") {
        if (toAccountId) {
          await Account.findByIdAndUpdate(
            toAccountId,
            { $inc: { balance: -amount } },
            { session: dbSession },
          );
        }
      } else if (type === "expense") {
        if (fromAccountId) {
          await Account.findByIdAndUpdate(
            fromAccountId,
            { $inc: { balance: amount } },
            { session: dbSession },
          );
        }
      } else if (type === "transfer") {
        if (fromAccountId) {
          await Account.findByIdAndUpdate(
            fromAccountId,
            { $inc: { balance: amount } },
            { session: dbSession },
          );
        }
        if (toAccountId) {
          await Account.findByIdAndUpdate(
            toAccountId,
            { $inc: { balance: -amount } },
            { session: dbSession },
          );
        }
      }

      // 🔹 Now delete the transaction
      await Transaction.findByIdAndDelete(id, { session: dbSession });

      await dbSession.commitTransaction();
      dbSession.endSession();

      return Response.json(
        {
          message: "Transaction deleted and balances updated",
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
    console.error("DELETE /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to delete transaction", type: "error" },
      { status: 500 },
    );
  }
}
