import { getUserId } from "@/lib/mobileAuth";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Goal from "@/models/Goal";
import Budget from "@/models/Budget";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/dashboard — aggregated dashboard metrics.
// Accepts both NextAuth session cookies (web) and Bearer JWT (mobile) via
// the unified `getUserId` helper.
export async function GET(req: Request) {
  const uid = await getUserId(req);
  if (!uid) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(uid);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // ── Run all queries in parallel ────────────────────────────
    const [
      incomeExpenseAgg,
      monthCategoryAgg,
      accounts,
      recentTransactions,
      goals,
      budgetCount,
      thisMonthAgg,
      lastMonthAgg,
      monthDailyAgg,
      transactionsCount,
      userDoc,
    ] = await Promise.all([
      // 1. Total income & expense (all time, used for net worth context)
      Transaction.aggregate([
        { $match: { userId, type: { $in: ["income", "expense"] } } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 2. Category breakdown for expenses (current month only)
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: "expense",
            date: { $gte: monthStart, $lt: nextMonthStart },
          },
        },
        {
          $group: {
            _id: "$category",
            total: { $sum: "$amount" },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 3. All accounts with balances
      Account.find({ userId }).lean(),

      // 4. Recent 5 transactions
      Transaction.find({ userId })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .lean(),

      // 5. Goals with linked account balances
      Goal.find({ userId }).lean(),

      // 6. Active budget count
      Budget.countDocuments({ userId }),

      // 7. This month income/expense
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: { $in: ["income", "expense"] },
            date: { $gte: monthStart, $lt: nextMonthStart },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 8. Last month income/expense (for % change)
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: { $in: ["income", "expense"] },
            date: { $gte: lastMonthStart, $lt: monthStart },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 9. Daily income/expense for current month (chart trend)
      Transaction.aggregate([
        {
          $match: {
            userId,
            type: { $in: ["income", "expense"] },
            date: { $gte: monthStart, $lt: nextMonthStart },
          },
        },
        {
          $group: {
            _id: {
              day: { $dayOfMonth: "$date" },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]),

      // 10. Total transaction count (drives the onboarding checklist)
      Transaction.countDocuments({ userId }),

      // 11. The user's onboardingDismissed flag
      User.findById(userId).select("onboardingDismissed").lean(),
    ]);

    // ── Process aggregation results ───────────────────────────
    const incomeTotal =
      incomeExpenseAgg.find((a: { _id: string }) => a._id === "income")
        ?.total || 0;
    const expenseTotal =
      incomeExpenseAgg.find((a: { _id: string }) => a._id === "expense")
        ?.total || 0;

    // Account totals (exclude system/deleted accounts from net worth)
    const totalBalance = accounts
      .filter((a) => a.name !== "Deleted Account" && !a.isSystem)
      .reduce((sum, a) => sum + (a.balance || 0), 0);

    // Month-over-month percentage changes
    const thisMonthIncome =
      thisMonthAgg.find((a: { _id: string }) => a._id === "income")?.total || 0;
    const thisMonthExpense =
      thisMonthAgg.find((a: { _id: string }) => a._id === "expense")?.total ||
      0;
    const lastMonthIncome =
      lastMonthAgg.find((a: { _id: string }) => a._id === "income")?.total || 0;
    const lastMonthExpense =
      lastMonthAgg.find((a: { _id: string }) => a._id === "expense")?.total ||
      0;

    const incomeChange = lastMonthIncome
      ? (((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(
          1,
        )
      : null;
    const expenseChange = lastMonthExpense
      ? (
          ((thisMonthExpense - lastMonthExpense) / lastMonthExpense) *
          100
        ).toFixed(1)
      : null;

    // Category breakdown for current month with percentages
    const monthExpenseTotal = monthCategoryAgg.reduce(
      (sum: number, c: { total: number }) => sum + c.total,
      0,
    );
    const categoryBreakdown = monthCategoryAgg.map(
      (c: { _id: string; total: number }) => ({
        category: c._id,
        amount: c.total,
        percentage: monthExpenseTotal
          ? ((c.total / monthExpenseTotal) * 100).toFixed(1)
          : "0",
      }),
    );

    // Daily trend for current month (cumulative net flow per day)
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const dailyMap = new Map<number, { income: number; expense: number }>();
    for (const row of monthDailyAgg as {
      _id: { day: number; type: "income" | "expense" };
      total: number;
    }[]) {
      const day = row._id.day;
      const existing = dailyMap.get(day) || { income: 0, expense: 0 };
      existing[row._id.type] = row.total;
      dailyMap.set(day, existing);
    }
    const today = now.getDate();
    let runningNet = 0;
    const monthlyTrend = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const entry = dailyMap.get(day) || { income: 0, expense: 0 };
      runningNet += entry.income - entry.expense;
      return {
        day,
        label: String(day).padStart(2, "0"),
        income: entry.income,
        expense: entry.expense,
        net: day <= today ? runningNet : null,
      };
    });

    // Savings rate (current month) = (income - expense) / income * 100
    const savingsRate = thisMonthIncome
      ? (((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100).toFixed(
          1,
        )
      : "0";

    // Goals with progress (use the linked account balance)
    const accountMap = new Map(
      accounts.map((a) => [a._id.toString(), a.balance || 0]),
    );
    const goalsWithProgress = goals.map((g) => ({
      _id: g._id,
      name: g.name,
      target: g.target,
      current: accountMap.get(g.accountId?.toString()) || 0,
      color: g.color,
      priority: g.priority,
      deadline: g.deadline,
      isCompleted: g.isCompleted,
    }));

    return Response.json({
      message: "Dashboard data fetched successfully",
      type: "success",
      success: true,
      data: {
        // Net worth (all-time)
        totalBalance,
        totalIncome: incomeTotal,
        totalExpense: expenseTotal,
        netChange: incomeTotal - expenseTotal,

        // Current month metrics
        monthLabel: now.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        }),
        monthIncome: thisMonthIncome,
        monthExpense: thisMonthExpense,
        monthNet: thisMonthIncome - thisMonthExpense,

        // Month-over-month changes
        incomeChange,
        expenseChange,
        savingsRate,

        // Breakdowns
        categoryBreakdown,
        monthlyTrend,
        recentTransactions,
        goals: goalsWithProgress,
        activeBudgets: budgetCount,
        totalGoals: goals.length,
        totalAccounts: accounts.filter(
          (a) => a.name !== "Deleted Account" && !a.isSystem,
        ).length,

        // Onboarding state — drives the welcome checklist on the dashboard
        onboarding: {
          dismissed:
            (userDoc as { onboardingDismissed?: boolean } | null)
              ?.onboardingDismissed ?? false,
          totalTransactions: transactionsCount as number,
          totalAccounts: accounts.filter(
            (a) => a.name !== "Deleted Account" && !a.isSystem,
          ).length,
          totalBudgets: budgetCount as number,
          totalGoals: goals.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return Response.json(
      {
        message: "Failed to fetch dashboard data",
        type: "error",
        success: false,
      },
      { status: 500 },
    );
  }
}
