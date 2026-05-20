// app/api/accounts/recompute-all/route.ts
//
// POST → recompute every account's balance.
//
// Two ways to call this:
//   1. Logged-in user → recomputes only their own accounts (UI "fix all" action).
//   2. Cron / external job → send `Authorization: Bearer ${CRON_SECRET}` header
//      to recompute every account for every user. Run nightly to catch any drift.
//
// Set CRON_SECRET in .env to enable the cron path.
import { connectToDatabase } from "@/lib/mongodb";
import Account from "@/models/Account";
import {
  recomputeAccountBalance,
  recomputeAllBalancesForUser,
  type RecomputeResult,
} from "@/lib/recomputeBalance";
import { getUserId } from "@/lib/mobileAuth";

export async function POST(req: Request) {
  try {
    await connectToDatabase();

    // ── Path A: cron-secret bearer for system-wide sweep ──
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
      const allAccounts = await Account.find({}).select("_id").lean();
      const results: RecomputeResult[] = [];
      for (const acc of allAccounts) {
        try {
          results.push(await recomputeAccountBalance(acc._id));
        } catch (err) {
          console.error(`Cron recompute failed for ${acc._id}`, err);
        }
      }

      const drifted = results.filter((r) => r.updated);
      return Response.json({
        message: `Recomputed ${results.length} accounts; ${drifted.length} drifted`,
        type: "success",
        success: true,
        scope: "all-users",
        data: { total: results.length, drifted: drifted.length, results },
      });
    }

    // ── Path B: logged-in user, only their accounts ──
  const userId = await getUserId(req);
    if (!userId) {
      return Response.json(
        { message: "Unauthorized", type: "error", success: false },
        { status: 401 },
      );
    }

    const results = await recomputeAllBalancesForUser(userId);
    const drifted = results.filter((r) => r.updated);

    return Response.json({
      message: drifted.length
        ? `Corrected ${drifted.length} of ${results.length} accounts`
        : `All ${results.length} accounts already correct`,
      type: "success",
      success: true,
      scope: "user",
      data: { total: results.length, drifted: drifted.length, results },
    });
  } catch (error) {
    console.error("POST /api/accounts/recompute-all error:", error);
    return Response.json(
      { message: "Failed to recompute balances", type: "error", success: false },
      { status: 500 },
    );
  }
}
