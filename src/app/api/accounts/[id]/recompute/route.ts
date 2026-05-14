// app/api/accounts/[id]/recompute/route.ts
//
// POST → recompute one account's balance from its transactions.
// Use when a user notices their balance looks wrong, or after a manual fix.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import { recomputeAccountBalance } from "@/lib/recomputeBalance";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;

  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { id } = await params;

  try {
    await connectToDatabase();

    // Authorize: user can only recompute their own accounts.
    const account = await Account.findOne({ _id: id, userId });
    if (!account) {
      return Response.json(
        { message: "Account not found", type: "error", success: false },
        { status: 404 },
      );
    }

    const result = await recomputeAccountBalance(id);

    return Response.json({
      message: result.updated
        ? `Balance corrected by ${result.drift >= 0 ? "+" : ""}${result.drift}`
        : "Balance is already correct",
      type: "success",
      success: true,
      data: result,
    });
  } catch (error) {
    console.error(`POST /api/accounts/${id}/recompute error:`, error);
    return Response.json(
      {
        message: "Failed to recompute balance",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
