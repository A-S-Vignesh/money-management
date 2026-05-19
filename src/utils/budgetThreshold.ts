// utils/budgetThreshold.ts
//
// Pure helpers for the post-expense budget alert flow.
// Kept transport-agnostic so they can be unit-tested without Mongo.

export interface BudgetWindow {
  _id: unknown;
  name: string;
  allocated: number;
  startDate: Date;
  endDate: Date;
}

export interface DatedAmount {
  date: Date;
  amount: number;
}

export interface BudgetAlert {
  budgetId: unknown;
  name: string;
  allocated: number;
  spent: number;
  pct: number;
  level: "warning" | "exceeded";
}

// Sum amounts whose `date` falls inside [start, end] (inclusive).
export function sumSpentInWindow(
  txns: DatedAmount[],
  start: Date,
  end: Date,
): number {
  let total = 0;
  for (const t of txns) {
    if (t.date >= start && t.date <= end) total += t.amount;
  }
  return total;
}

// Given the budgets active for a (user, category) and the relevant expense
// transactions covering the union of their windows, return one alert per
// budget that has crossed the 80% warning or 100% exceeded threshold.
export function getBudgetAlerts(
  budgets: BudgetWindow[],
  txns: DatedAmount[],
): BudgetAlert[] {
  const alerts: BudgetAlert[] = [];
  for (const b of budgets) {
    const spent = sumSpentInWindow(txns, b.startDate, b.endDate);
    if (b.allocated <= 0) continue;
    const pct = Math.round((spent / b.allocated) * 100);
    if (pct >= 100) {
      alerts.push({
        budgetId: b._id,
        name: b.name,
        allocated: b.allocated,
        spent,
        pct,
        level: "exceeded",
      });
    } else if (pct >= 80) {
      alerts.push({
        budgetId: b._id,
        name: b.name,
        allocated: b.allocated,
        spent,
        pct,
        level: "warning",
      });
    }
  }
  return alerts;
}

// Tightest (min start, max end) bounding window across budgets — used to
// fetch the smallest slice of transactions that can satisfy every budget.
export function budgetUnionWindow(
  budgets: BudgetWindow[],
): { start: Date; end: Date } | null {
  if (budgets.length === 0) return null;
  let start = budgets[0].startDate;
  let end = budgets[0].endDate;
  for (let i = 1; i < budgets.length; i++) {
    if (budgets[i].startDate < start) start = budgets[i].startDate;
    if (budgets[i].endDate > end) end = budgets[i].endDate;
  }
  return { start, end };
}
