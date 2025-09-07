import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 404 }
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
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const updatedData = await req.json();

  try {
    await connectToDatabase();

    // Fetch old transaction
    const oldTransaction = await Transaction.findOne({ _id: id, userId });
    if (!oldTransaction) {
      return Response.json(
        { message: "Transaction not found", type: "error" },
        { status: 404 }
      );
    }

    const {
      type: oldType,
      amount: oldAmount,
      fromAccountId: oldFrom,
      toAccountId: oldTo,
    } = oldTransaction;

    // 🔹 Step 1: Undo old transaction
    if (oldType === "income") {
      if (oldTo) {
        await Account.findByIdAndUpdate(oldTo, {
          $inc: { balance: -oldAmount },
        });
      }
    } else if (oldType === "expense") {
      if (oldFrom) {
        await Account.findByIdAndUpdate(oldFrom, {
          $inc: { balance: oldAmount },
        });
      }
    } else if (oldType === "transfer") {
      if (oldFrom) {
        await Account.findByIdAndUpdate(oldFrom, {
          $inc: { balance: oldAmount },
        });
      }
      if (oldTo) {
        await Account.findByIdAndUpdate(oldTo, {
          $inc: { balance: -oldAmount },
        });
      }
    }

    // 🔹 Step 2: Apply new transaction
    const {
      type: newType,
      amount: newAmount,
      fromAccountId: newFrom,
      toAccountId: newTo,
    } = updatedData;

    if (newType === "income") {
      if (newTo) {
        await Account.findByIdAndUpdate(newTo, {
          $inc: { balance: newAmount },
        });
      }
    } else if (newType === "expense") {
      if (newFrom) {
        await Account.findByIdAndUpdate(newFrom, {
          $inc: { balance: -newAmount },
        });
      }
    } else if (newType === "transfer") {
      if (newFrom) {
        await Account.findByIdAndUpdate(newFrom, {
          $inc: { balance: -newAmount },
        });
      }
      if (newTo) {
        await Account.findByIdAndUpdate(newTo, {
          $inc: { balance: newAmount },
        });
      }
    }

    // 🔹 Step 3: Save updated transaction
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      updatedData,
      { new: true }
    );

    return Response.json(
      {
        message: "Transaction Updated Successfully",
        type: "success",
        data: transaction,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to update transaction", type: "error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
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
        { status: 404 }
      );
    }

    const { type, amount, fromAccountId, toAccountId } = transaction;

    // 🔹 Reverse balance effect
    if (type === "income") {
      // Income added to toAccountId → subtract it
      if (toAccountId) {
        await Account.findByIdAndUpdate(toAccountId, {
          $inc: { balance: -amount },
        });
      }
    } else if (type === "expense") {
      // Expense reduced from fromAccountId → add it back
      if (fromAccountId) {
        await Account.findByIdAndUpdate(fromAccountId, {
          $inc: { balance: amount },
        });
      }
    } else if (type === "transfer") {
      // Transfer moved money from → to
      if (fromAccountId) {
        await Account.findByIdAndUpdate(fromAccountId, {
          $inc: { balance: amount },
        });
      }
      if (toAccountId) {
        await Account.findByIdAndUpdate(toAccountId, {
          $inc: { balance: -amount },
        });
      }
    }

    // 🔹 Now delete the transaction
    await Transaction.findByIdAndDelete(id);

    return Response.json(
      { Message: "Transaction deleted and balances updated", type: "success" },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return Response.json(
      { message: "Failed to delete transaction", type: "error" },
      { status: 500 }
    );
  }
}
