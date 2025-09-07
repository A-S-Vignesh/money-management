import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Account from "@/models/Account";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    await connectToDatabase();
    const transactions = await Transaction.find({ userId }).sort({
      updatedAt: -1,
    });

    return Response.json({
      message: "Transaction Fetched Successfully",
      type: "success",
      data: transactions,
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return Response.json(
      { message: "Failed to fetch transactions", type: "error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { fromAccountId, amount, date, toAccountId, type } = body;

    // basic validation
    if (amount <= 0) {
      return Response.json(
        { message: "Amount must be greater than zero", type: "warning" },
        { status: 400 }
      );
    }

    if (type === "transfer" && fromAccountId === toAccountId) {
      return Response.json(
        {
          message: "From and To accounts must be different for transfers",
          type: "warning",
        },
        { status: 400 }
      );
    }

    const newTransaction = await Transaction.create({ ...body, userId });

    if (type === "transfer") {
      // deduct from source
      await Account.findByIdAndUpdate(fromAccountId, {
        $inc: { balance: -amount },
        $set: { lastUpdated: new Date(date) },
      });

      // add to target
      await Account.findByIdAndUpdate(toAccountId, {
        $inc: { balance: amount },
        $set: { lastUpdated: new Date(date) },
      });
    } else if (type === "income") {
      // add money into account
      await Account.findByIdAndUpdate(toAccountId, {
        $inc: { balance: amount },
        $set: { lastUpdated: new Date(date) },
      });
    } else if (type === "expense") {
      // deduct money from account
      await Account.findByIdAndUpdate(fromAccountId, {
        $inc: { balance: -amount },
        $set: { lastUpdated: new Date(date) },
      });
    }

    return Response.json(
      {
        message: "Transaction Created Successfully",
        type: "success",
        data: newTransaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return Response.json(
      { message: "Failed to create transaction", type: "error" },
      { status: 500 }
    );
  }
}
