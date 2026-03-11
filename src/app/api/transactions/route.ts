import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Account from "@/models/Account";
import { createTransactionSchema } from "@/validations/transaction";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "7", 10)),
    );
    const skip = (page - 1) * limit;

    // Build filter query
    const query: Record<string, unknown> = { userId };
    const andConditions: Record<string, unknown>[] = [];

    // Type filter
    const typeFilter = searchParams.get("type");
    if (typeFilter && typeFilter !== "all") {
      query.type = typeFilter;
    }

    // Search filter (description or category)
    const search = searchParams.get("search");
    if (search) {
      andConditions.push({
        $or: [
          { description: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ],
      });
    }

    // Account filter
    const accountFilter = searchParams.get("account");
    if (accountFilter && accountFilter !== "all") {
      andConditions.push({
        $or: [{ fromAccountId: accountFilter }, { toAccountId: accountFilter }],
      });
    }

    // Combine $and conditions (fixes Bug #5: $or collision)
    if (andConditions.length > 0) {
      query.$and = andConditions;
    }

    // Date range filter
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    if (startDate && endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include end date
      query.date = { $gte: new Date(startDate), $lt: end };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      query.date = { $lt: end };
    }

    // Fix Bug #7: Use ObjectId for aggregation $match
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Run paginated query + count + summary in parallel
    const [transactions, total, summaryResult] = await Promise.all([
      Transaction.find(query)
        .sort({ date: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(query),
      Transaction.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] },
            },
            totalExpense: {
              $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] },
            },
          },
        },
      ]),
    ]);

    const summary = summaryResult[0] || {
      totalIncome: 0,
      totalExpense: 0,
    };

    return Response.json({
      message: "Transactions fetched successfully",
      type: "success",
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        netFlow: summary.totalIncome - summary.totalExpense,
      },
    });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return Response.json(
      { message: "Failed to fetch transactions", type: "error" },
      { status: 500 },
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

    // Validate with Zod
    const parsed = createTransactionSchema.safeParse(body);
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

    const { fromAccountId, amount, toAccountId, type } = parsed.data;

    // Business validation
    if (type === "transfer" && fromAccountId === toAccountId) {
      return Response.json(
        {
          message: "From and To accounts must be different for transfers",
          type: "warning",
        },
        { status: 400 },
      );
    }

    // Bug #1 fix: Use MongoDB transaction for atomic balance updates
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      const [newTransaction] = await Transaction.create(
        [{ ...parsed.data, userId }],
        { session: dbSession },
      );

      if (type === "transfer") {
        await Account.findByIdAndUpdate(
          fromAccountId,
          { $inc: { balance: -amount } },
          { session: dbSession },
        );
        await Account.findByIdAndUpdate(
          toAccountId,
          { $inc: { balance: amount } },
          { session: dbSession },
        );
      } else if (type === "income") {
        await Account.findByIdAndUpdate(
          toAccountId,
          { $inc: { balance: amount } },
          { session: dbSession },
        );
      } else if (type === "expense") {
        await Account.findByIdAndUpdate(
          fromAccountId,
          { $inc: { balance: -amount } },
          { session: dbSession },
        );
      }

      await dbSession.commitTransaction();
      dbSession.endSession();

      return Response.json(
        {
          message: "Transaction Created Successfully",
          type: "success",
          data: newTransaction,
        },
        { status: 201 },
      );
    } catch (txError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw txError;
    }
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return Response.json(
      { message: "Failed to create transaction", type: "error" },
      { status: 500 },
    );
  }
}
