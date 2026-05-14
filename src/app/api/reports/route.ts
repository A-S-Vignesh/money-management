// app/api/reports/route.ts
//
// GET /api/reports?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD[&compare=1]
//
// Returns everything the Reports page needs in a single round-trip:
//   - summary       totals + savings rate for the requested window
//   - comparison    same metrics for the immediately preceding equal-length window
//                   (only included when ?compare=1)
//   - timeSeries    income/expense/net bucketed by day/week/month depending on range
//   - byCategory    expense + income totals per category, sorted desc
//   - topExpenses   top 5 individual expense transactions
//   - topIncomes    top 5 individual income transactions
//   - byAccount     income + expense per account (transfers excluded)
//
// All aggregations are userId-scoped and run in parallel.
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { connectToDatabase } from "@/lib/mongodb";
import Transaction from "@/models/Transaction";
import Account from "@/models/Account";
import mongoose from "mongoose";

type BucketUnit = "day" | "week" | "month";

function pickBucketUnit(start: Date, end: Date): BucketUnit {
  const days = (end.getTime() - start.getTime()) / 86_400_000;
  if (days <= 31) return "day";
  if (days <= 92) return "week"; // ~3 months
  return "month";
}

function bucketLabel(date: Date, unit: BucketUnit): string {
  if (unit === "day") {
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  if (unit === "week") {
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  }
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

interface SummaryRow {
  _id: "income" | "expense";
  total: number;
  count: number;
}

interface BucketRow {
  _id: { bucket: Date; type: "income" | "expense" };
  total: number;
}

interface CategoryRow {
  _id: { category: string; type: "income" | "expense" };
  total: number;
  count: number;
}

interface TopRow {
  _id: mongoose.Types.ObjectId;
  description: string;
  category: string;
  amount: number;
  date: Date;
}

interface AccountRow {
  _id: { accountId: mongoose.Types.ObjectId; type: "income" | "expense" };
  total: number;
}

function summarize(rows: SummaryRow[]) {
  const income = rows.find((r) => r._id === "income")?.total ?? 0;
  const expense = rows.find((r) => r._id === "expense")?.total ?? 0;
  const incomeCount = rows.find((r) => r._id === "income")?.count ?? 0;
  const expenseCount = rows.find((r) => r._id === "expense")?.count ?? 0;
  const net = income - expense;
  const savingsRate = income > 0 ? (net / income) * 100 : 0;
  return {
    income,
    expense,
    net,
    savingsRate: Number(savingsRate.toFixed(1)),
    incomeCount,
    expenseCount,
    totalTransactions: incomeCount + expenseCount,
  };
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null; // null = N/A
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?._id;
  if (!userId) {
    return Response.json(
      { message: "Unauthorized", type: "error", success: false },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(req.url);
  const startDateRaw = searchParams.get("startDate");
  const endDateRaw = searchParams.get("endDate");
  const wantCompare = searchParams.get("compare") === "1";

  if (!startDateRaw || !endDateRaw) {
    return Response.json(
      {
        message: "startDate and endDate are required (YYYY-MM-DD)",
        type: "error",
        success: false,
      },
      { status: 400 },
    );
  }

  const startDate = new Date(startDateRaw);
  const endDateInclusive = new Date(endDateRaw);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDateInclusive.getTime())
  ) {
    return Response.json(
      { message: "Invalid date format", type: "error", success: false },
      { status: 400 },
    );
  }
  if (startDate > endDateInclusive) {
    return Response.json(
      { message: "startDate must be ≤ endDate", type: "error", success: false },
      { status: 400 },
    );
  }

  // Treat endDate as inclusive: aggregate up to (but not including) the day after.
  const endExclusive = new Date(endDateInclusive);
  endExclusive.setDate(endExclusive.getDate() + 1);

  // Previous equal-length window for comparison (back-to-back, no overlap).
  const rangeMs = endExclusive.getTime() - startDate.getTime();
  const prevEndExclusive = new Date(startDate);
  const prevStart = new Date(startDate.getTime() - rangeMs);

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const bucketUnit = pickBucketUnit(startDate, endDateInclusive);

  try {
    await connectToDatabase();

    const baseMatch = {
      userId: userObjectId,
      type: { $in: ["income", "expense"] as const },
      date: { $gte: startDate, $lt: endExclusive },
    };

    const queries: Promise<unknown>[] = [
      // 1. Summary
      Transaction.aggregate<SummaryRow>([
        { $match: baseMatch },
        {
          $group: {
            _id: "$type",
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]),

      // 2. Time series — bucketed by day/week/month
      Transaction.aggregate<BucketRow>([
        { $match: baseMatch },
        {
          $group: {
            _id: {
              bucket: {
                $dateTrunc: { date: "$date", unit: bucketUnit },
              },
              type: "$type",
            },
            total: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.bucket": 1 } },
      ]),

      // 3. By category
      Transaction.aggregate<CategoryRow>([
        { $match: baseMatch },
        {
          $group: {
            _id: { category: "$category", type: "$type" },
            total: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),

      // 4. Top expenses
      Transaction.find({
        ...baseMatch,
        type: "expense",
      })
        .sort({ amount: -1, date: -1 })
        .limit(5)
        .select("description category amount date")
        .lean<TopRow[]>(),

      // 5. Top incomes
      Transaction.find({
        ...baseMatch,
        type: "income",
      })
        .sort({ amount: -1, date: -1 })
        .limit(5)
        .select("description category amount date")
        .lean<TopRow[]>(),

      // 6. By account — split by type so we can stack income vs expense per account
      Transaction.aggregate<AccountRow>([
        { $match: baseMatch },
        {
          $project: {
            type: 1,
            amount: 1,
            accountId: {
              $cond: [
                { $eq: ["$type", "income"] },
                "$toAccountId",
                "$fromAccountId",
              ],
            },
          },
        },
        { $match: { accountId: { $ne: null } } },
        {
          $group: {
            _id: { accountId: "$accountId", type: "$type" },
            total: { $sum: "$amount" },
          },
        },
      ]),

      // 7. Comparison summary (only fetched when requested — saves one round trip)
      wantCompare
        ? Transaction.aggregate<SummaryRow>([
            {
              $match: {
                userId: userObjectId,
                type: { $in: ["income", "expense"] as const },
                date: { $gte: prevStart, $lt: prevEndExclusive },
              },
            },
            {
              $group: {
                _id: "$type",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([] as SummaryRow[]),

      // 8. Account name lookup — needed to label by-account chart
      Account.find({ userId: userObjectId })
        .select("_id name type")
        .lean<{ _id: mongoose.Types.ObjectId; name: string; type: string }[]>(),
    ];

    const [
      summaryRows,
      bucketRows,
      categoryRows,
      topExpenses,
      topIncomes,
      accountRows,
      compareRows,
      accountList,
    ] = (await Promise.all(queries)) as [
      SummaryRow[],
      BucketRow[],
      CategoryRow[],
      TopRow[],
      TopRow[],
      AccountRow[],
      SummaryRow[],
      { _id: mongoose.Types.ObjectId; name: string; type: string }[],
    ];

    // ── Shape time series: merge income+expense rows per bucket, fill gaps ──
    const bucketMap = new Map<
      string,
      { bucket: Date; income: number; expense: number }
    >();
    for (const row of bucketRows) {
      const key = row._id.bucket.toISOString();
      const existing = bucketMap.get(key) || {
        bucket: row._id.bucket,
        income: 0,
        expense: 0,
      };
      existing[row._id.type] = row.total;
      bucketMap.set(key, existing);
    }
    const timeSeries = Array.from(bucketMap.values())
      .sort((a, b) => a.bucket.getTime() - b.bucket.getTime())
      .map((b) => ({
        bucket: b.bucket.toISOString(),
        label: bucketLabel(b.bucket, bucketUnit),
        income: b.income,
        expense: b.expense,
        net: b.income - b.expense,
      }));

    // ── Shape category breakdown: split into income vs expense lists ──
    const expenseTotal = categoryRows
      .filter((r) => r._id.type === "expense")
      .reduce((s, r) => s + r.total, 0);
    const incomeTotal = categoryRows
      .filter((r) => r._id.type === "income")
      .reduce((s, r) => s + r.total, 0);

    const byCategory = {
      expense: categoryRows
        .filter((r) => r._id.type === "expense")
        .map((r) => ({
          category: r._id.category,
          amount: r.total,
          count: r.count,
          percentage:
            expenseTotal > 0
              ? Number(((r.total / expenseTotal) * 100).toFixed(1))
              : 0,
        })),
      income: categoryRows
        .filter((r) => r._id.type === "income")
        .map((r) => ({
          category: r._id.category,
          amount: r.total,
          count: r.count,
          percentage:
            incomeTotal > 0
              ? Number(((r.total / incomeTotal) * 100).toFixed(1))
              : 0,
        })),
    };

    // ── Shape by-account: merge income+expense per account, attach name ──
    const accountNameMap = new Map(
      accountList.map((a) => [a._id.toString(), { name: a.name, type: a.type }]),
    );
    const accountMap = new Map<
      string,
      { name: string; type: string; income: number; expense: number }
    >();
    for (const row of accountRows) {
      const id = row._id.accountId.toString();
      const meta = accountNameMap.get(id);
      if (!meta) continue;
      const existing = accountMap.get(id) || {
        name: meta.name,
        type: meta.type,
        income: 0,
        expense: 0,
      };
      existing[row._id.type] = row.total;
      accountMap.set(id, existing);
    }
    const byAccount = Array.from(accountMap.entries())
      .map(([id, v]) => ({
        accountId: id,
        name: v.name,
        type: v.type,
        income: v.income,
        expense: v.expense,
        net: v.income - v.expense,
      }))
      .sort((a, b) => b.income + b.expense - (a.income + a.expense));

    // ── Build summary + optional comparison block ──
    const summary = summarize(summaryRows);
    const comparison = wantCompare
      ? (() => {
          const prev = summarize(compareRows);
          return {
            previous: prev,
            deltas: {
              income: pctDelta(summary.income, prev.income),
              expense: pctDelta(summary.expense, prev.expense),
              net: pctDelta(summary.net, prev.net),
              savingsRate: Number(
                (summary.savingsRate - prev.savingsRate).toFixed(1),
              ),
            },
            window: {
              startDate: prevStart.toISOString(),
              endDate: prevEndExclusive.toISOString(),
            },
          };
        })()
      : null;

    return Response.json({
      message: "Report generated successfully",
      type: "success",
      success: true,
      data: {
        window: {
          startDate: startDate.toISOString(),
          endDate: endDateInclusive.toISOString(),
          bucketUnit,
        },
        summary,
        comparison,
        timeSeries,
        byCategory,
        topExpenses,
        topIncomes,
        byAccount,
      },
    });
  } catch (error) {
    console.error("GET /api/reports error:", error);
    return Response.json(
      { message: "Failed to generate report", type: "error", success: false },
      { status: 500 },
    );
  }
}
