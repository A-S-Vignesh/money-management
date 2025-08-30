import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import mongoose from "mongoose"; // Ensure mongoose is imported
import Budget from "@/models/Budget";
import Transaction from "@/models/Transaction";
import { getPeriodRange } from "@/utils/getBudgetPeriod"; // <-- utility function you’ll create

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
    }
    
    const { id } = await params;

  await connectToDatabase();

  const budget = await Budget.findOne({
    _id: id,
    userId: session.user._id,
  });

  if (!budget) {
    return new Response("Budget not found", { status: 404 });
  }

  return Response.json(budget);
}

export async function PUT(req:Request, { params }:{params:Promise<{id:string}>}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

    await connectToDatabase();
    const { id } = await params;
  const updates = await req.json();

  const existing = await Budget.findOne({
    _id: id,
    userId: session.user._id,
  });

  if (!existing) {
    return new Response("Budget not found", { status: 404 });
  }

  const updated = await Budget.findOneAndUpdate(
    { _id: id, userId: session.user._id },
    updates,
    { new: true }
  );

  if (!updated) {
    return new Response("Failed to update budget", { status: 500 });
  }

  return Response.json(updated);
}

export async function DELETE(req:Request, { params }:{params:Promise<{id:string}>}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?._id) {
    return new Response("Unauthorized", { status: 401 });
  }

    await connectToDatabase();
    
    const { id } = await params;

  const existing = await Budget.findOne({
    _id: id,
    userId: session.user._id,
  });

  if (!existing) {
    return new Response("Budget not found", { status: 404 });
  }

  await Budget.deleteOne({ _id: id });

  return new Response("Budget deleted and archived successfully", {
    status: 200,
  });
}
