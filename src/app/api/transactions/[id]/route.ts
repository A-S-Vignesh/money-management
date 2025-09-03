import Transaction from "@/models/Transaction";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  try {
    await connectToDatabase();
    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return new Response("Transaction not found", { status: 404 });
    }
    return Response.json(transaction);
  } catch (error) {
    console.error("GET /api/transactions/[id] error:", error);
    return Response.json(
      { error: "Failed to fetch transaction" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const updatedData = await req.json();
  try {
    await connectToDatabase();
    console.log("Updating transaction with data:", updatedData);
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, userId },
      updatedData,
      { new: true }
    );
    if (!transaction) {
      return new Response("Transaction not found", { status: 404 });
    }
    return Response.json(transaction, { status: 200 });
  } catch (error) {
    console.error("PUT /api/transactions/[id] error:", error);
    return Response.json(
      { error: "Failed to update transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  try {
      await connectToDatabase();
    const transaction = await Transaction.findOneAndDelete({ _id: id, userId });
    if (!transaction) {
      return new Response("Transaction not found", { status: 404 });
    }
    return new Response("Transaction deleted", { status: 200 });
  } catch (error) {
    console.error("DELETE /api/transactions/[id] error:", error);
    return Response.json(
      { error: "Failed to delete transaction" },
      { status: 500 }
    );
  }
}