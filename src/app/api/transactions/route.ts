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
    const transactions = await Transaction.find({ userId }).sort({ updatedAt: -1 });

    return Response.json(transactions);
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
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
    const newTransaction = await Transaction.create({ ...body, userId });

    if (type === "transfer" && fromAccountId === toAccountId) {
      return Response.json(
        { error: "From and To accounts must be different for transfers" },
        { status: 400 }
      );
    }
    // if (amount <= 0) {
    //   return Response.json(
    //     { error: "Amount must be greater than zero" },
    //     { status: 400 }
    //   );
    // }

    if (type === "transfer") {
      await Account.findByIdAndUpdate(fromAccountId, {
        $inc: { balance: -amount },
        $set: { lastUpdated: new Date(date) },
      });

      await Account.findByIdAndUpdate(toAccountId, {
        $inc: { balance: amount },
        $set: { lastUpdated: new Date(date) },
      });
    } else {
      const accountId = toAccountId;
      const balanceUpdate =
        type === "income"
          ? {
              $inc: { balance: amount },
              $set: { lastUpdated: new Date(date) },
            }
          : {
              $inc: { balance: -amount },
              $set: { lastUpdated: new Date(date) },
            };

      await Account.findByIdAndUpdate(accountId, balanceUpdate);
    }
    return Response.json(newTransaction);
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return Response.json(
      { error: "Failed to create transactions" },
      { status: 500 }
    );
  }
}
