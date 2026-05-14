// app/api/holdings/[id]/price/route.ts
//
// POST → just update currentPrice + priceUpdatedAt. No transaction is created
//        and no balances change — this is purely a market-value refresh.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import { updatePriceSchema } from "@/validations/holding";

export async function POST(
  req: Request,
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
  const body = await req.json();
  const parsed = updatePriceSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message: "Validation failed",
        type: "error",
        success: false,
        errors: parsed.error.flatten().fieldErrors,
      },
      { status: 422 },
    );
  }

  try {
    await connectToDatabase();
    const holding = await Holding.findOneAndUpdate(
      { _id: id, userId },
      {
        currentPrice: parsed.data.currentPrice,
        priceUpdatedAt: new Date(),
      },
      { new: true },
    );
    if (!holding) {
      return Response.json(
        { message: "Holding not found", type: "error", success: false },
        { status: 404 },
      );
    }
    return Response.json({
      message: "Price updated",
      type: "success",
      success: true,
      data: holding,
    });
  } catch (error) {
    console.error("POST /api/holdings/[id]/price error:", error);
    return Response.json(
      { message: "Failed to update price", type: "error", success: false },
      { status: 500 },
    );
  }
}
