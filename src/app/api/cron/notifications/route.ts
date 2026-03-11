import { connectToDatabase } from "@/lib/mongodb";
import Budget from "@/models/Budget";
import Goal from "@/models/Goal";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import User from "@/models/User";
import mongoose from "mongoose";
import {
  createNotification,
  isDuplicateNotification,
} from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/notifications
 *
 * Scheduled notification check. Scans all users for:
 * 1. Budget warnings (≥80%) and exceeded (≥100%)
 * 2. Goal deadline approaching (within 7 days)
 * 3. Overdrawn accounts (balance < 0)
 *
 * Protected by CRON_SECRET header. Call from Vercel Cron or manual trigger.
 */
export async function GET(req: Request) {
  // Auth check
  const authHeader = req.headers.get("authorization");
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return Response.json(
      { message: "Unauthorized", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const users = await User.find({}, { _id: 1 }).lean();
    let totalNotifications = 0;

    for (const user of users) {
      const userId = user._id.toString();

      // ── 1. Budget Alerts ──
      const now = new Date();
      const activeBudgets = await Budget.find({
        userId: user._id,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }).lean();

      for (const budget of activeBudgets) {
        const spent = await Transaction.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              type: "expense",
              category: budget.category,
              date: { $gte: budget.startDate, $lte: budget.endDate },
            },
          },
          { $group: { _id: null, total: { $sum: "$amount" } } },
        ]);
        const totalSpent = spent[0]?.total || 0;
        const pct = Math.round((totalSpent / budget.allocated) * 100);

        if (pct >= 100) {
          const title = `Budget Exceeded: ${budget.name}`;
          const isDupe = await isDuplicateNotification(
            userId,
            "budget",
            title,
            24,
          );
          if (!isDupe) {
            await createNotification({
              userId,
              type: "budget",
              title,
              message: `You've spent ₹${totalSpent.toLocaleString("en-IN")} of ₹${budget.allocated.toLocaleString("en-IN")} (${pct}%) on ${budget.category}`,
            });
            totalNotifications++;
          }
        } else if (pct >= 80) {
          const title = `Budget Warning: ${budget.name}`;
          const isDupe = await isDuplicateNotification(
            userId,
            "budget",
            title,
            24,
          );
          if (!isDupe) {
            await createNotification({
              userId,
              type: "budget",
              title,
              message: `You've used ${pct}% of your ${budget.category} budget (₹${totalSpent.toLocaleString("en-IN")} / ₹${budget.allocated.toLocaleString("en-IN")})`,
            });
            totalNotifications++;
          }
        }
      }

      // ── 2. Goal Deadline Approaching ──
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const approachingGoals = await Goal.find({
        userId: user._id,
        isCompleted: false,
        deadline: { $lte: sevenDaysFromNow, $gte: now },
      }).lean();

      for (const goal of approachingGoals) {
        const account = await Account.findById(goal.accountId).lean();
        const saved = account?.balance || 0;
        const remaining = goal.target - saved;
        const daysLeft = Math.ceil(
          ((goal.deadline as Date).getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        );

        const title = `Goal Deadline: ${goal.name}`;
        const isDupe = await isDuplicateNotification(userId, "goal", title, 24);
        if (!isDupe) {
          await createNotification({
            userId,
            type: "goal",
            title,
            message:
              remaining > 0
                ? `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left — ₹${remaining.toLocaleString("en-IN")} to go`
                : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} left — you've reached your target!`,
          });
          totalNotifications++;
        }
      }

      // ── 3. Overdrawn Accounts ──
      const overdrawnAccounts = await Account.find({
        userId: user._id,
        balance: { $lt: 0 },
        isSystem: { $ne: true },
      }).lean();

      for (const account of overdrawnAccounts) {
        const title = `Low Balance: ${account.name}`;
        const isDupe = await isDuplicateNotification(
          userId,
          "system",
          title,
          24,
        );
        if (!isDupe) {
          await createNotification({
            userId,
            type: "system",
            title,
            message: `Your ${account.name} account is overdrawn (₹${account.balance.toLocaleString("en-IN")})`,
          });
          totalNotifications++;
        }
      }
    }

    return Response.json({
      message: `Cron completed. ${totalNotifications} notification(s) created.`,
      success: true,
      data: { totalNotifications, usersChecked: users.length },
    });
  } catch (error) {
    console.error("Cron /api/cron/notifications error:", error);
    return Response.json(
      { message: "Cron job failed", success: false },
      { status: 500 },
    );
  }
}
