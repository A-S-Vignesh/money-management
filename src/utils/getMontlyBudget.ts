import dayjs, { Dayjs } from "dayjs";

interface Transaction {
  type: string; // e.g. "expense" | "income"
  date: string | Date;
  category?: string;
  amount: number;
}

interface PieData {
  name: string;
  value: number;
}

type Range = "thisMonth" | "lastMonth";

export function getCategoryExpensePieData(
  transactions: Transaction[],
  range: Range = "thisMonth"
): PieData[] {
  const now: Dayjs = dayjs();

  let start: Dayjs, end: Dayjs;
  if (range === "thisMonth") {
    start = now.startOf("month");
    end = now.endOf("month");
  } else if (range === "lastMonth") {
    const last = now.subtract(1, "month");
    start = last.startOf("month");
    end = last.endOf("month");
  } else {
    throw new Error("Invalid range: use 'thisMonth' or 'lastMonth'");
  }

  const expenseByCategory: Record<string, number> = {};

  for (const txn of transactions) {
    if (txn.type !== "expense") continue;

    const date = dayjs(txn.date);
    if (date.isBefore(start) || date.isAfter(end)) continue;

    const category = txn.category || "Uncategorized";
    expenseByCategory[category] =
      (expenseByCategory[category] || 0) + txn.amount;
  }

  // Convert to chart format
  return Object.entries(expenseByCategory).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));
}
