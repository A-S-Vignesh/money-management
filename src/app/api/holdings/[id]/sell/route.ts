// app/api/holdings/[id]/sell/route.ts
//
// POST → reduce quantity. Records realized P&L = (sellPrice − avgCost) × qty.
//        Linked transfer transaction: investment account → cash account.
//        Holding stays in DB (isActive=false when fully sold) so realized P&L
//        is preserved for reporting.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { sellHoldingSchema } from "@/validations/holding";
import mongoose from "mongoose";

const isProd = process.env.NODE_ENV === "production";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;
  const body = await req.json();
  const parsed = sellHoldingSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Validation failed",
        type: "error",
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  const { toAccountId, quantity, pricePerUnit, date } = parsed.data;

  try {
    await connectToDatabase();

    const holding = await Holding.findOne({ _id: id, userId });
    if (!holding) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }
    if (quantity > holding.quantity) {
      return Response.json(
        {
          message: `Cannot sell ${quantity}; only ${holding.quantity} held`,
          type: "error",
          success: false,
        },
        { status: 400 },
      );
    }

    const cashAccount = await Account.findOne({
      _id: toAccountId,
      userId,
      isDeleted: { $ne: true },
    });
    if (!cashAccount) {
      return Response.json(
        {
          message: "Destination account not found",
          type: "error",
          success: false,
        },
        { status: 400 },
      );
    }

    const proceeds = +(quantity * pricePerUnit).toFixed(2);
    const realizedDelta = +((pricePerUnit - holding.avgCostPrice) * quantity).toFixed(2);

    let dbSession: mongoose.ClientSession | undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      holding.quantity = +(holding.quantity - quantity).toFixed(6);
      holding.realizedPnL = +(holding.realizedPnL + realizedDelta).toFixed(2);
      holding.currentPrice = pricePerUnit;
      holding.priceUpdatedAt = new Date();
      if (holding.quantity === 0) {
        holding.isActive = false;
      }
      await holding.save(isProd ? { session: dbSession } : undefined);

      await Transaction.create(
        [
          {
            userId,
            type: "transfer",
            description: `Sell ${quantity} ${holding.symbol || holding.name}`,
            category: "Investment Sell",
            amount: proceeds,
            date: date ? new Date(date) : new Date(),
            fromAccountId: holding.accountId,
            toAccountId,
            holdingId: holding._id,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      await Account.findByIdAndUpdate(
        holding.accountId,
        { $inc: { balance: -proceeds } },
        isProd ? { session: dbSession } : undefined,
      );
      await Account.findByIdAndUpdate(
        toAccountId,
        { $inc: { balance: proceeds } },
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json({
        message:
          realizedDelta >= 0
            ? `Sold — realized gain ₹${realizedDelta.toLocaleString("en-IN")}`
            : `Sold — realized loss ₹${Math.abs(realizedDelta).toLocaleString("en-IN")}`,
        type: "success",
        success: true,
        data: { holding, realizedDelta },
      });
    } catch (txErr) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txErr;
    }
  } catch (error) {
    console.error("POST /api/holdings/[id]/sell error:", error);
    return Response.json(
      { message: "Failed to record sell", type: "error", success: false },
      { status: 500 },
    );
  }
}
