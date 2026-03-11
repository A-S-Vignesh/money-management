import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import { createAccountSchema } from "@/validations/account";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!session) {
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

    const [accounts, total] = await Promise.all([
      Account.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Account.countDocuments({ userId }),
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
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

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

    const newAccount = await Account.create({
      ...parsed.data,
      userId,
      lastUpdated: new Date(),
    });

    return Response.json(
      {
        message: "Account Created Successfully",
        type: "success",
        success: true,
        data: newAccount,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return Response.json(
      { message: "Failed to create account", type: "Error", success: false },
      { status: 500 },
    );
  }
}
