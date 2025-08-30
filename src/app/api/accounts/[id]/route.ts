// app/api/accounts/route.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";

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

  await connectToDatabase();

  try {
    const accounts = await Account.findById(id);
    return Response.json(accounts);
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return Response.json(
      { error: "Failed to fetch accounts" },
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
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id }).select("type");

    if (account?.type === "system") {
      return new Response("Cannot edit System accounts", { status: 403 });
    } else if (account?.type === "goal" || account?.type === "investment") {
      return new Response(`Cannot edit ${account.type} accounts here`, {
        status: 403,
      });
    }

    const body = await req.json();
    const update = await Account.findByIdAndUpdate(id, body, { new: true });

    return Response.json(update);
  } catch (error) {
    console.error("POST /api/accounts error:", error);
    return Response.json(
      { error: "Failed to create account" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await Account.findOne({ _id: id }).select("type");

  if (account?.type === "system") {
    return new Response("Cannot delete System accounts", { status: 403 });
  } else if (account?.type === "goal" || account?.type === "investment") {
    return new Response(`Cannot delete ${account.type} accounts here`, {
      status: 403,
    });
  }

  try {
    await connectToDatabase();
    await Account.findByIdAndDelete(id);
    return new Response("Account Deleted Successfully", { status: 200 });
  } catch (error) {
    console.error("Error deleting account:", error);
    return new Response("Failed to delete account", { status: 500 });
  }
}
