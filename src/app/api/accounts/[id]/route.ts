// app/api/accounts/[id]/route.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";

// ------------------ GET ------------------
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 }
      );
    }

    return Response.json(
      {
        message: "Account fetched successfully",
        type: "success",
        data: account,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/accounts error:", error);
    return Response.json(
      { message: "Failed to fetch account", type: "error" },
      { status: 500 }
    );
  }
}

// ------------------ PUT ------------------
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  const { id } = await params;
  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId }).select("type");
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 }
      );
    }

    if (account.type === "system") {
      return Response.json(
        { message: "Cannot edit system accounts", type: "warning" },
        { status: 403 }
      );
    }

    if (account.type === "goal" || account.type === "investment") {
      return Response.json(
        {
          message: `Cannot edit ${account.type} accounts here`,
          type: "warning",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const updated = await Account.findByIdAndUpdate(id, body, { new: true });

    return Response.json(
      {
        message: "Account updated successfully",
        type: "success",
        data: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("PUT /api/accounts error:", error);
    return Response.json(
      { message: "Failed to update account", type: "error" },
      { status: 500 }
    );
  }
}

// ------------------ DELETE ------------------
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error" },
      { status: 401 }
    );
  }

  await connectToDatabase();

  try {
    const account = await Account.findOne({ _id: id, userId }).select("type");

    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error" },
        { status: 404 }
      );
    }

    if (account.type === "system") {
      return Response.json(
        { message: "Cannot delete system accounts", type: "warning" },
        { status: 403 }
      );
    }

    if (account.type === "goal" || account.type === "investment") {
      return Response.json(
        {
          message: `Cannot delete ${account.type} accounts here`,
          type: "warning",
        },
        { status: 403 }
      );
    }

    // delete all related transactions
    await Transaction.deleteMany({
      userId,
      $or: [{ fromAccountId: id }, { toAccountId: id }],
    });

    await Account.findByIdAndDelete(id);

    return Response.json(
      {
        message: "Account and related transactions deleted successfully",
        type: "success",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("DELETE /api/accounts error:", error);
    return Response.json(
      { message: "Failed to delete account", type: "error" },
      { status: 500 }
    );
  }
}
