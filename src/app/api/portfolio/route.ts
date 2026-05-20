// app/api/portfolio/route.ts
//
// GET → portfolio dashboard aggregate. Returns:
//   summary: { totalInvested, currentValue, unrealizedPnL, unrealizedPnLPct,
//              realizedPnL, totalPnL, holdingsCount, activeHoldingsCount }
//   allocationByType: [{ type, value, percentage, count }]
//   recentActivity: last 10 buy/sell/dividend transactions (linked holdings)
import { connectToDatabase } from "@/lib/mongodb";
import Holding from "@/models/Holding";
import Transaction from "@/models/Transaction";
import mongoose from "mongoose";
import { getUserId } from "@/lib/mobileAuth";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const [holdings, recentActivity] = await Promise.all([
      Holding.find({ userId: userObjectId }).lean(),
      Transaction.find({
        userId: userObjectId,
        category: { $in: ["Investment Buy", "Investment Sell", "Dividend"] },
      })
        .sort({ date: -1, createdAt: -1 })
        .limit(10)
        .populate("holdingId", "name symbol type")
        .lean(),
    ]);

    // ── Summary derived from holdings ──
    let totalInvested = 0;
    let currentValue = 0;
    let realizedPnL = 0;
    let activeCount = 0;

    for (const h of holdings) {
      const invested = (h.quantity || 0) * (h.avgCostPrice || 0);
      const market = (h.quantity || 0) * (h.currentPrice || 0);
      totalInvested += invested;
      currentValue += market;
      realizedPnL += h.realizedPnL || 0;
      if (h.isActive) activeCount += 1;
    }

    const unrealizedPnL = +(currentValue - totalInvested).toFixed(2);
    const unrealizedPnLPct =
      totalInvested > 0
        ? +(((currentValue - totalInvested) / totalInvested) * 100).toFixed(2)
        : 0;
    const totalPnL = +(unrealizedPnL + realizedPnL).toFixed(2);

    // ── Allocation by holding type (active only, by market value) ──
    const allocationMap = new Map<
      string,
      { value: number; count: number }
    >();
    for (const h of holdings) {
      if (!h.isActive) continue;
      const mv = (h.quantity || 0) * (h.currentPrice || 0);
      if (mv === 0) continue;
      const existing = allocationMap.get(h.type) || { value: 0, count: 0 };
      existing.value += mv;
      existing.count += 1;
      allocationMap.set(h.type, existing);
    }
    const totalAllocValue = Array.from(allocationMap.values()).reduce(
      (s, v) => s + v.value,
      0,
    );
    const allocationByType = Array.from(allocationMap.entries())
      .map(([type, v]) => ({
        type,
        value: +v.value.toFixed(2),
        count: v.count,
        percentage:
          totalAllocValue > 0
            ? +((v.value / totalAllocValue) * 100).toFixed(1)
            : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return Response.json({
      message: "Portfolio fetched",
      type: "success",
      success: true,
      data: {
        summary: {
          totalInvested: +totalInvested.toFixed(2),
          currentValue: +currentValue.toFixed(2),
          unrealizedPnL,
          unrealizedPnLPct,
          realizedPnL: +realizedPnL.toFixed(2),
          totalPnL,
          holdingsCount: holdings.length,
          activeHoldingsCount: activeCount,
        },
        allocationByType,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("GET /api/portfolio error:", error);
    return Response.json(
      { message: "Failed to fetch portfolio", type: "error", success: false },
      { status: 500 },
    );
  }
}
