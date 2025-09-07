import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!session) {
    return Response.json(
      { message: "Unauthorized", type: "Error", success: false },
      { status: 401 }
    );
  }

  await connectToDatabase();

  try {
    const accounts = await Account.find({ userId }).sort({ createdAt: -1 });

    return Response.json(
      {
        message: "Accounts fetched successfully",
        type: "Success",
        success: true,
        data: accounts,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching accounts:", error);

    return Response.json(
      { message: "Failed to fetch accounts", type: "Error", success: false },
      { status: 500 }
    );
  }
}


export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "Error", success: false },
      { status: 401 }
    );
  }

  await connectToDatabase();

  try {
    const body = await req.json();
    const newAccount = await Account.create({
      ...body,
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
      { status: 201 } // Created
    );
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return Response.json(
      { message: "Failed to create account", type: "Error", success: false },
      { status: 500 }
    );
  }
}

