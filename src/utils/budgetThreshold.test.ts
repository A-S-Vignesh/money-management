import { describe, it, expect } from "vitest";
import {
  budgetUnionWindow,
  getBudgetAlerts,
  sumSpentInWindow,
  type BudgetWindow,
  type DatedAmount,
} from "./budgetThreshold";

const d = (iso: string) => new Date(iso);

const budget = (
  id: string,
  allocated: number,
  start: string,
  end: string,
): BudgetWindow => ({
  _id: id,
  name: `Budget ${id}`,
  allocated,
  startDate: d(start),
  endDate: d(end),
});

const tx = (date: string, amount: number): DatedAmount => ({
  date: d(date),
  amount,
});

describe("sumSpentInWindow", () => {
  it("returns 0 for an empty list", () => {
    expect(sumSpentInWindow([], d("2026-01-01"), d("2026-01-31"))).toBe(0);
  });

  it("sums only amounts whose date is inside [start, end]", () => {
    const txns = [
      tx("2026-01-05", 100),
      tx("2026-01-15", 250),
      tx("2026-02-10", 999), // outside
      tx("2025-12-31", 999), // outside
    ];
    expect(
      sumSpentInWindow(txns, d("2026-01-01"), d("2026-01-31")),
    ).toBe(350);
  });

  it("treats both ends as inclusive", () => {
    const txns = [tx("2026-01-01", 50), tx("2026-01-31", 70)];
    expect(
      sumSpentInWindow(txns, d("2026-01-01"), d("2026-01-31")),
    ).toBe(120);
  });
});

describe("budgetUnionWindow", () => {
  it("returns null for no budgets", () => {
    expect(budgetUnionWindow([])).toBeNull();
  });

  it("returns the min start and max end across all budgets", () => {
    const result = budgetUnionWindow([
      budget("a", 1000, "2026-01-01", "2026-01-31"),
      budget("b", 500, "2025-12-15", "2026-02-15"),
      budget("c", 200, "2026-01-10", "2026-01-20"),
    ]);
    expect(result?.start).toEqual(d("2025-12-15"));
    expect(result?.end).toEqual(d("2026-02-15"));
  });
});

describe("getBudgetAlerts", () => {
  it("produces no alerts under 80% usage", () => {
    const budgets = [budget("a", 1000, "2026-01-01", "2026-01-31")];
    const txns = [tx("2026-01-05", 100), tx("2026-01-10", 500)]; // 60%
    expect(getBudgetAlerts(budgets, txns)).toEqual([]);
  });

  it("flags a 'warning' between 80% and 99%", () => {
    const budgets = [budget("a", 1000, "2026-01-01", "2026-01-31")];
    const txns = [tx("2026-01-05", 850)]; // 85%
    const alerts = getBudgetAlerts(budgets, txns);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("warning");
    expect(alerts[0].pct).toBe(85);
    expect(alerts[0].spent).toBe(850);
  });

  it("flags 'exceeded' at >= 100%", () => {
    const budgets = [budget("a", 500, "2026-01-01", "2026-01-31")];
    const txns = [tx("2026-01-05", 600)]; // 120%
    const alerts = getBudgetAlerts(budgets, txns);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].level).toBe("exceeded");
    expect(alerts[0].pct).toBe(120);
  });

  it("rolls up each budget independently from the same transaction list", () => {
    // A monthly budget and a weekly sub-budget overlap; one transaction
    // sits inside both and should count toward both totals.
    const budgets = [
      budget("month", 1000, "2026-01-01", "2026-01-31"),
      budget("week", 300, "2026-01-05", "2026-01-11"),
    ];
    const txns = [
      tx("2026-01-03", 200), // monthly only
      tx("2026-01-08", 280), // both — pushes weekly to 93%
      tx("2026-01-20", 100), // monthly only
    ];
    const alerts = getBudgetAlerts(budgets, txns);
    // monthly spent = 580 / 1000 = 58% → no alert
    // weekly spent = 280 / 300 = 93% → warning
    expect(alerts).toHaveLength(1);
    expect(alerts[0].name).toBe("Budget week");
    expect(alerts[0].level).toBe("warning");
    expect(alerts[0].spent).toBe(280);
  });

  it("skips budgets with non-positive allocated to avoid div-by-zero", () => {
    const budgets = [budget("bad", 0, "2026-01-01", "2026-01-31")];
    const txns = [tx("2026-01-05", 100)];
    expect(getBudgetAlerts(budgets, txns)).toEqual([]);
  });
});
