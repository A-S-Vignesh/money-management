// app/api/account/export/route.ts
//
// GET → return all of the logged-in user's data as a single JSON file.
// GDPR right-of-access compliance.
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Budget from "@/models/Budget";
import Goal from "@/models/Goal";
import Holding from "@/models/Holding";
import Notification from "@/models/Notification";
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
    const filter = { userId: userObjectId };

    const [user, accounts, transactions, budgets, goals, holdings, notifications] =
      await Promise.all([
        // Strip the password hash from the user record before exporting
        User.findById(userObjectId).select("-password").lean(),
        Account.find(filter).lean(),
        Transaction.find(filter).sort({ date: -1 }).lean(),
        Budget.find(filter).lean(),
        Goal.find(filter).lean(),
        Holding.find(filter).lean(),
        Notification.find(filter).sort({ createdAt: -1 }).lean(),
      ]);

    const payload = {
      meta: {
        exportedAt: new Date().toISOString(),
        userId: String(userObjectId),
        schemaVersion: 1,
        source: "Money Nest",
      },
      profile: user,
      accounts,
      transactions,
      budgets,
      goals,
      holdings,
      notifications,
      counts: {
        accounts: accounts.length,
        transactions: transactions.length,
        budgets: budgets.length,
        goals: goals.length,
        holdings: holdings.length,
        notifications: notifications.length,
      },
    };

    const filename = `money-nest-export-${new Date().toISOString().split("T")[0]}.json`;

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("GET /api/account/export error:", error);
    return Response.json(
      { message: "Failed to export data", type: "error", success: false },
      { status: 500 },
    );
  }
}
