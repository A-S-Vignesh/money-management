import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import Goal from "@/models/Goal";
import Budget from "@/models/Budget";
import mongoose from "mongoose";

// GET /api/dashboard — aggregated dashboard metrics
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?._id) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  try {
    await connectToDatabase();

    const userId = new mongoose.Types.ObjectId(session.user._id);

    // ── Run all queries in parallel ────────────────────────────
    const [
      incomeExpenseAgg,
      categoryAgg,
      accounts,
      recentTransactions,
      goals,
      budgetCount,
      thisMonthAgg,
      lastMonthAgg,
    ] = await Promise.all([
      // 1. Total income & expense (all time)
      Transaction.aggregate([
        { $match: { userId, type: { $in: ["income", "expense"] } } },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 2. Category breakdown for expenses
      Transaction.aggregate([
        { $match: { userId, type: "expense" } },
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
            date: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth(),
                1,
              ),
              $lt: new Date(
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                1,
              ),
            },
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
            date: {
              $gte: new Date(
                new Date().getFullYear(),
                new Date().getMonth() - 1,
                1,
              ),
              $lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
          },
        },
      ]),
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

    // Category breakdown with percentages
    const expenseGrandTotal = categoryAgg.reduce(
      (sum: number, c: { total: number }) => sum + c.total,
      0,
    );
    const categoryBreakdown = categoryAgg.map(
      (c: { _id: string; total: number }) => ({
        category: c._id,
        amount: c.total,
        percentage: expenseGrandTotal
          ? ((c.total / expenseGrandTotal) * 100).toFixed(1)
          : "0",
      }),
    );

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

    // Savings rate = (income - expense) / income * 100
    const savingsRate = incomeTotal
      ? (((incomeTotal - expenseTotal) / incomeTotal) * 100).toFixed(1)
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
        // Summary metrics
        totalBalance,
        totalIncome: incomeTotal,
        totalExpense: expenseTotal,
        netChange: incomeTotal - expenseTotal,

        // Month-over-month changes
        incomeChange,
        expenseChange,
        savingsRate,

        // Breakdowns
        categoryBreakdown,
        recentTransactions,
        goals: goalsWithProgress,
        activeBudgets: budgetCount,
        totalGoals: goals.length,
        totalAccounts: accounts.filter(
          (a) => a.name !== "Deleted Account" && !a.isSystem,
        ).length,
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
