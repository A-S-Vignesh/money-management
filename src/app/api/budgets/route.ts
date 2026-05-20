import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import { connectToDatabase } from "@/lib/mongodb";
import { createBudgetSchema } from "@/validations/budget";
import { createNotification } from "@/lib/notifications";
import { getUserId } from "@/lib/mobileAuth";
import mongoose, { type PipelineStage } from "mongoose";

// ✅ GET: Fetch budgets with pagination + period filter
// Now also returns `spent` per budget (sum of expense transactions in the
// budget's category within [startDate, endDate]) so the mobile + web budget
// pages don't have to make a second round-trip per row.
export async function GET(req: Request) {
  const userId = await getUserId(req);

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

    // Batch-compute spent for every budget in a single aggregation. Each
    // budget defines its own [startDate, endDate] window, so we $facet by
    // budget id — gives O(1) round-trips instead of N+1.
    const userObjectId = new mongoose.Types.ObjectId(String(userId));
    let spentByBudgetId = new Map<string, number>();
    if (budgets.length) {
      const facet: Record<string, PipelineStage.FacetPipelineStage[]> = {};
      for (const b of budgets) {
        facet[String(b._id)] = [
          {
            $match: {
              userId: userObjectId,
              type: "expense",
              category: b.category,
              date: { $gte: b.startDate, $lte: b.endDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ];
      }
      const [agg] = await Transaction.aggregate([{ $facet: facet }]);
      if (agg) {
        for (const [bid, rows] of Object.entries(agg) as Array<
          [string, Array<{ total: number }>]
        >) {
          spentByBudgetId.set(bid, rows[0]?.total ?? 0);
        }
      }
    }

    const enriched = budgets.map((b) => {
      const obj = b.toObject ? b.toObject() : b;
      return { ...obj, spent: spentByBudgetId.get(String(b._id)) ?? 0 };
    });

    return Response.json(
      {
        message: "Budgets fetched successfully",
        type: "success",
        success: true,
        data: enriched,
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
  const userId = await getUserId(req);

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
