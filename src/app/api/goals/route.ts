import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Goal from "@/models/Goal";
import Account from "@/models/Account";

// GET: /api/goals
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    const goals = await Goal.find({ userId: session.user._id }).sort({
      createdAt: -1,
    });
    return Response.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return new Response("Failed to fetch goals", { status: 500 });
  }
}

// POST: /api/goals
export async function POST(req:Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

  await connectToDatabase();

  try {
    const body = await req.json();

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
      accountId: newAccount._id, // link the goal to the new account
    });

    return Response.json(newGoal);
  } catch (error) {
    console.error("Error creating goal:", error);
    return new Response("Failed to create goal", { status: 500 });
  }
}
