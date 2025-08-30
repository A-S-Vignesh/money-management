import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
        return new Response("Unauthorized", { status: 401 });
    }
    try {
        await connectToDatabase();
        const transactions = await Transaction.find({ userId }).sort({ date: -1 });
        
        return Response.json(transactions);
    }
    catch (error) {
        console.error("GET /api/transactions error:", error);
        return Response.json({ error: "Failed to fetch transactions" }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = session?.user?._id;

    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }
    try {
        await connectToDatabase();
        const body = await req.json();
        const newTransaction = await Transaction.create({ ...body, userId });
        return Response.json(newTransaction);
    }
    catch (error) {
        console.error("POST /api/transactions error:", error);
        return Response.json({ error: "Failed to create transactions" }, { status: 500 });
    }
}