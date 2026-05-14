// app/api/holdings/route.ts
//
// GET  → list user's holdings (active by default; pass ?includeInactive=1 to include sold)
// POST → create a new holding AND record the initial buy as a linked transaction.
//        Money flows: fromAccountId (cash) → accountId (investment account).
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { createHoldingSchema } from "@/validations/holding";
import mongoose from "mongoose";

const isProd = process.env.NODE_ENV === "production";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("includeInactive") === "1";

    const query: Record<string, unknown> = { userId };
    if (!includeInactive) query.isActive = true;

    const holdings = await Holding.find(query)
      .sort({ updatedAt: -1 })
      .populate("accountId", "name type")
      .lean();

    return Response.json({
      message: "Holdings fetched",
      type: "success",
      success: true,
      data: holdings,
    });
  } catch (error) {
    console.error("GET /api/holdings error:", error);
    return Response.json(
      { message: "Failed to fetch holdings", type: "error", success: false },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const body = await req.json();
  const parsed = createHoldingSchema.safeParse(body);
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

  const {
    accountId,
    fromAccountId,
    name,
    type,
    symbol,
    quantity,
    pricePerUnit,
    date,
    maturityDate,
    interestRate,
    notes,
  } = parsed.data;

  const totalCost = +(quantity * pricePerUnit).toFixed(2);

  try {
    await connectToDatabase();

    // Validate accounts: investment account must be type "investment", cash account must exist.
    const [investAccount, cashAccount] = await Promise.all([
      Account.findOne({
        _id: accountId,
        userId,
        type: "investment",
        isDeleted: { $ne: true },
      }),
      Account.findOne({
        _id: fromAccountId,
        userId,
        isDeleted: { $ne: true },
      }),
    ]);

    if (!investAccount) {
      return Response.json(
        {
          message:
            "Investment account not found. Create an account of type 'investment' first.",
          type: "error",
          success: false,
        },
        { status: 400 },
      );
    }
    if (!cashAccount) {
      return Response.json(
        { message: "Source account not found", type: "error", success: false },
        { status: 400 },
      );
    }

    let dbSession: mongoose.ClientSession | undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      // 1. Create the holding
      const [holding] = await Holding.create(
        [
          {
            userId,
            accountId,
            name,
            type,
            symbol: symbol || null,
            quantity,
            avgCostPrice: pricePerUnit,
            currentPrice: pricePerUnit, // assume cost = current at creation
            priceUpdatedAt: new Date(),
            realizedPnL: 0,
            maturityDate: maturityDate ? new Date(maturityDate) : null,
            interestRate: interestRate ?? null,
            notes: notes || null,
            isActive: true,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      // 2. Linked transfer transaction: cash → investment account
      await Transaction.create(
        [
          {
            userId,
            type: "transfer",
            description: `Buy ${quantity} ${symbol || name}`,
            category: "Investment Buy",
            amount: totalCost,
            date: date ? new Date(date) : new Date(),
            fromAccountId,
            toAccountId: accountId,
            holdingId: holding._id,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      // 3. Apply balance changes
      await Account.findByIdAndUpdate(
        fromAccountId,
        { $inc: { balance: -totalCost } },
        isProd ? { session: dbSession } : undefined,
      );
      await Account.findByIdAndUpdate(
        accountId,
        { $inc: { balance: totalCost } },
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json(
        {
          message: "Holding created successfully",
          type: "success",
          success: true,
          data: holding,
        },
        { status: 201 },
      );
    } catch (txErr) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txErr;
    }
  } catch (error) {
    console.error("POST /api/holdings error:", error);
    return Response.json(
      { message: "Failed to create holding", type: "error", success: false },
      { status: 500 },
    );
  }
}
