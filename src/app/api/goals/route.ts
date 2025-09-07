import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";

// GET: /api/goals
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  try {
    const goals = await Goal.find({ userId: session.user._id }).sort({
      createdAt: -1,
    });

    if (!goals || goals.length === 0) {
      return Response.json(
        { message: "No goals found", type: "info", data: [] },
        { status: 200 }
      );
    }

    return Response.json({
      message: "Goals fetched successfully",
      type: "success",
      data: goals,
    });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return Response.json(
      { message: "Failed to fetch goals", type: "error" },
      { status: 500 }
    );
  }
}

// POST: /api/goals
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  try {
    const body = await req.json();
    const { deadline } = body;
    const deadlineDate = new Date(deadline);

    if (deadlineDate < new Date()) {
      return Response.json(
        {
          message: "Deadline cannot be before today",
          type: "warning",
        },
        { status: 400 }
      );
    }

    // Step 1: Create account first
    const newAccount = await Account.create({
      userId: session.user._id,
      name: body.name,
      type: "goal",
      balance: 0,
    });

    // Step 2: Create goal and link the new account
    const newGoal = await Goal.create({
      ...body,
      userId: session.user._id,
      accountId: newAccount._id,
    });

    return Response.json({
      message: "Goal created successfully",
      type: "success",
      data: newGoal,
    });
  } catch (error) {
    console.error("Error creating goal:", error);
    return Response.json(
      { message: "Failed to create goal", type: "error" },
      { status: 500 }
    );
  }
}
