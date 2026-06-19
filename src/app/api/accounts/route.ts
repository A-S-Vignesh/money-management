import { getUserId } from "@/lib/mobileAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import { createAccountSchema } from "@/validations/account";
import mongoose from "mongoose";

export async function GET(req: Request) {
  const userId = await getUserId(req);

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "Error", success: false },
      { status: 401 },
    );
  }

  await connectToDatabase();

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const includeGoals = searchParams.get("includeGoals") === "true";

    // Spec: Hide system accounts and soft-deleted accounts from the list
    const excludedTypes = ["system"];
    if (!includeGoals) {
      excludedTypes.push("goal");
    }

    const query = {
      userId,
      isDeleted: { $ne: true },
      type: { $nin: excludedTypes },
    };

    const [accounts, total] = await Promise.all([
      Account.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Account.countDocuments(query),
    ]);

    return Response.json(
      {
        message: "Accounts fetched successfully",
        type: "Success",
        success: true,
        data: accounts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error fetching accounts:", error);

    return Response.json(
      { message: "Failed to fetch accounts", type: "Error", success: false },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await getUserId(req);

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "Error", success: false },
      { status: 401 },
    );
  }

  await connectToDatabase();

  try {
    const body = await req.json();

    // Validate with Zod
    const parsed = createAccountSchema.safeParse(body);
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

    const openingBalance = parsed.data.balance ?? 0;

    // MongoDB sessions/transactions only work on replica sets (not local
    // standalone MongoDB) — gate on prod, matching the transactions routes.
    const isProd = process.env.NODE_ENV === "production";
    let dbSession: mongoose.ClientSession | undefined = undefined;
    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    try {
      const [newAccount] = await Account.create(
        [{ ...parsed.data, userId }],
        isProd ? { session: dbSession } : undefined,
      );

      // Book the opening balance as a transaction so Account.balance stays
      // fully derivable from the transaction log. Without this, recompute
      // (deriveAccountBalance) would wipe the opening balance to 0 since it
      // sums only transactions. Excluded from income/expense reports.
      if (openingBalance > 0) {
        await Transaction.create(
          [
            {
              userId,
              type: "opening",
              toAccountId: newAccount._id,
              amount: openingBalance,
              category: "Opening Balance",
              description: "Opening balance",
              date: new Date(),
            },
          ],
          isProd ? { session: dbSession } : undefined,
        );
      }

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }

      return Response.json(
        {
          message: "Account Created Successfully",
          type: "success",
          success: true,
          data: newAccount,
        },
        { status: 201 },
      );
    } catch (txError) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txError;
    }
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return Response.json(
      { message: "Failed to create account", type: "Error", success: false },
      { status: 500 },
    );
  }
}
