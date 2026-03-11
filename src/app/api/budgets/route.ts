import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import Budget from "@/models/Budget";
import { connectToDatabase } from "@/lib/mongodb";
import { createBudgetSchema } from "@/validations/budget";
import { createNotification } from "@/lib/notifications";

// ✅ GET: Fetch budgets with pagination + period filter
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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "10", 10)),
    );
    const skip = (page - 1) * limit;

    // Build filter query
    const query: Record<string, unknown> = { userId };

    const periodFilter = searchParams.get("period");
    if (periodFilter && periodFilter !== "All") {
      query.period = periodFilter;
    }

    const [budgets, total] = await Promise.all([
      Budget.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Budget.countDocuments(query),
    ]);

    return Response.json(
      {
        message: "Budgets fetched successfully",
        type: "success",
        success: true,
        data: budgets,
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
    console.error("Error fetching budgets:", error);
    return Response.json(
      { message: "Internal Server Error", type: "error", success: false },
      { status: 500 },
    );
  }
}

// ✅ POST: Create a new budget with Zod validation
export async function POST(req: Request) {
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
    const body = await req.json();

    // Validate with Zod
    const parsed = createBudgetSchema.safeParse(body);
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

    const newBudget = await Budget.create({
      userId,
      ...parsed.data,
      createdAt: new Date(),
    });

    // Fire-and-forget notification
    createNotification({
      userId,
      type: "budget",
      title: `New Budget: ${parsed.data.name}`,
      message: `₹${parsed.data.allocated.toLocaleString("en-IN")} allocated for ${parsed.data.category} (${parsed.data.period})`,
    }).catch(() => {});

    return Response.json(
      {
        message: "Budget created successfully",
        type: "success",
        success: true,
        data: newBudget,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Budget creation failed:", error);
    return Response.json(
      { message: "Failed to create budget", type: "error", success: false },
      { status: 500 },
    );
  }
}
