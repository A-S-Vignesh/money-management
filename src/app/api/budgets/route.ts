import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Budget from "@/models/Budget";
import { connectToDatabase } from "@/lib/mongodb";

interface BudgetBody {
  name: string;
  category: string;
  allocated: number;
  period: string;
  startDate: string;
  endDate: string;
}

// ✅ GET: Fetch all budgets for logged-in user
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const budgets = await Budget.find({ userId }).sort({ createdAt: -1 });

    if (!budgets || budgets.length === 0) {
      return Response.json(
        { message: "No budgets found", type: "info", success: true, data: [] },
        { status: 200 }
      );
    }

    return Response.json(
      {
        message: "Budgets fetched successfully",
        type: "success",
        success: true,
        data: budgets,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching budget:", error);
    return Response.json(
      { message: "Internal Server Error", type: "error", success: false },
      { status: 500 }
    );
  }
}

// ✅ POST: Create a new budget
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 }
    );
  }

  try {
    await connectToDatabase();
    const body: BudgetBody = await req.json();

    const newBudget = await Budget.create({
      userId: userId,
      ...body,
      createdAt: new Date(),
    });

    return Response.json(
      {
        message: "Budget created successfully",
        type: "success",
        success: true,
        data: newBudget,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Budget creation failed:", error);
    return Response.json(
      { message: "Failed to create budget", type: "error", success: false },
      { status: 500 }
    );
  }
}
