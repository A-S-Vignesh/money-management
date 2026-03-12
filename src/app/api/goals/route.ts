import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import { createGoalSchema } from "@/validations/goal";
import { createNotification } from "@/lib/notifications";
import mongoose from "mongoose";

// GET: /api/goals — with pagination + priority filter
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { userId: session.user._id };

    const priorityFilter = searchParams.get("priority");
    if (priorityFilter && priorityFilter !== "all") {
      query.priority = priorityFilter;
    }

    const [goals, total] = await Promise.all([
      Goal.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Goal.countDocuments(query),
    ]);

    return Response.json({
      message: "Goals fetched successfully",
      type: "success",
      success: true,
      data: goals,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return Response.json(
      { message: "Failed to fetch goals", type: "error", success: false },
      { status: 500 },
    );
  }
}

// POST: /api/goals — atomic: create account + goal in one session
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();
    const body = await req.json();

    const parsed = createGoalSchema.safeParse(body);
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

    const { deadline } = parsed.data;
    const deadlineDate = new Date(deadline);

    if (deadlineDate < new Date()) {
      return Response.json(
        {
          message: "Deadline cannot be before today",
          type: "warning",
          success: false,
        },
        { status: 400 },
      );
    }

    // Spec: Create account + goal atomically
    const isProd = process.env.NODE_ENV === "production";
    let dbSession: mongoose.ClientSession | undefined = undefined;

    if (isProd) {
      dbSession = await mongoose.startSession();
      dbSession.startTransaction();
    }

    let newGoal;
    try {
      // Step 1: Create linked goal account
      const [newAccount] = await Account.create(
        [
          {
            userId: session.user._id,
            name: parsed.data.name,
            type: "goal",
            balance: 0,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      // Step 2: Create goal and link the new account
      [newGoal] = await Goal.create(
        [
          {
            ...parsed.data,
            userId: session.user._id,
            accountId: newAccount._id,
          },
        ],
        isProd ? { session: dbSession } : undefined,
      );

      if (isProd && dbSession) {
        await dbSession.commitTransaction();
        dbSession.endSession();
      }
    } catch (txError) {
      if (isProd && dbSession) {
        await dbSession.abortTransaction();
        dbSession.endSession();
      }
      throw txError;
    }

    // Fire-and-forget notification
    const deadlineStr = deadlineDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    createNotification({
      userId: session.user._id,
      type: "goal",
      title: `New Goal: ${parsed.data.name}`,
      message: `Target ₹${parsed.data.target.toLocaleString("en-IN")} by ${deadlineStr}`,
    }).catch(() => {});

    return Response.json(
      {
        message: "Goal created successfully",
        type: "success",
        success: true,
        data: newGoal,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating goal:", error);
    return Response.json(
      { message: "Failed to create goal", type: "error", success: false },
      { status: 500 },
    );
  }
}
