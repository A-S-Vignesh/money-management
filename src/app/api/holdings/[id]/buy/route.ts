// app/api/holdings/[id]/buy/route.ts
//
// POST → add quantity to an existing holding. Recomputes weighted average
//        cost basis and creates a linked transfer transaction.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { buyHoldingSchema } from "@/validations/holding";
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
  const parsed = buyHoldingSchema.safeParse(body);
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

  const { fromAccountId, quantity, pricePerUnit, date } = parsed.data;
  const totalCost = +(quantity * pricePerUnit).toFixed(2);

  try {
    await connectToDatabase();

    const holding = await Holding.findOne({ _id: id, userId });
    if (!holding) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }

    const cashAccount = await Account.findOne({
      _id: fromAccountId,
      userId,
      isDeleted: { $ne: true },
    });
    if (!cashAccount) {
      return Response.json(
        { message: "Source account not found", type: "error", success: false },
        { status: 400 },
      );
    }

    // Weighted average cost basis:
    //   newAvg = (oldQty × oldAvg + buyQty × buyPrice) / (oldQty + buyQty)
    const newQuantity = holding.quantity + quantity;
    const newAvgCost =
      newQuantity > 0
        ? (holding.quantity * holding.avgCostPrice + quantity * pricePerUnit) /
          newQuantity
        : pricePerUnit;

    let dbSession: mongoose.ClientSession | undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      holding.quantity = newQuantity;
      holding.avgCostPrice = +newAvgCost.toFixed(4);
      // If the holding had been fully sold and now we're buying back, reactivate it
      holding.isActive = true;
      // Refresh current price to the latest buy price unless user updates it later
      holding.currentPrice = pricePerUnit;
      holding.priceUpdatedAt = new Date();
      await holding.save(isProd ? { session: dbSession } : undefined);

      await Transaction.create(
        [
          {
            userId,
            type: "transfer",
            description: `Buy ${quantity} ${holding.symbol || holding.name}`,
            category: "Investment Buy",
            amount: totalCost,
            date: date ? new Date(date) : new Date(),
            fromAccountId,
            toAccountId: holding.accountId,
            holdingId: holding._id,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      await Account.findByIdAndUpdate(
        fromAccountId,
        { $inc: { balance: -totalCost } },
        isProd ? { session: dbSession } : undefined,
      );
      await Account.findByIdAndUpdate(
        holding.accountId,
        { $inc: { balance: totalCost } },
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json({
        message: "Buy recorded",
        type: "success",
        success: true,
        data: holding,
      });
    } catch (txErr) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txErr;
    }
  } catch (error) {
    console.error("POST /api/holdings/[id]/buy error:", error);
    return Response.json(
      { message: "Failed to record buy", type: "error", success: false },
      { status: 500 },
    );
  }
}
