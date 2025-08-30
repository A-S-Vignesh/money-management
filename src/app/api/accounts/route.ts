import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!session) {
        return new Response("Unauthorized",{status:401})
    }

    await connectToDatabase();

    try {
        const accounts = await Account.find({ userId: userId }).sort({ createdAt: -1 });
        return new Response(JSON.stringify(accounts), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    }
    catch (error) {
        console.error("Error fetching accounts:", error);
        return new Response("Failed to fetch accounts", { status: 500 });
    }
}

export async function POST(req:Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  try {
    const body = await req.json();
    const newAccount = await Account.create({
      ...body,
      userId: userId,
      lastUpdated: new Date(),
    });
    return Response.json(newAccount);
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return Response.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}