// utils/netWorthHistory.ts
import dayjs from "dayjs";

// ----- types ---------------------------------------------------

export type AccountType =
  | "cash"
  | "bank"
  | "wallet"
  | "goal"
  | "investment"
  | "other"
  | "system"
  | "loan"
  | "credit"
  | "liability";

export interface Account {
  _id: string;
  type: AccountType;
  [key: string]: any; // allow extra props like name, balance, etc.
}

export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "goal"
  | "investment";

export interface Transaction {
  _id: string;
  type: TransactionType;
  amount: number;
  date: string | Date;
  accountId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  [key: string]: any;
}

interface BalanceMap {
  [accountId: string]: number;
}

interface AccountsById {
  [accountId: string]: Account;
}

interface HistoryPoint {
  date: string;
  value: number;
}

// ----- helpers -------------------------------------------------

function calcNetWorthFromBalances(
  balancesMap: BalanceMap,
  accountsById: AccountsById
): number {
  const assetTypes: AccountType[] = [
    "cash",
    "bank",
    "wallet",
    "goal",
    "investment",
    "other",
    "system",
  ];
  const liabilityTypes: AccountType[] = ["loan", "credit", "liability"];

  return Object.keys(balancesMap).reduce((sum, id) => {
    const acc = accountsById[id];
    const bal = balancesMap[id] || 0;
    if (!acc) return sum;

    if (assetTypes.includes(acc.type)) return sum + bal;
    if (liabilityTypes.includes(acc.type)) return sum - bal;

    return sum;
  }, 0);
}

function getTimePoints(range: "week" | "month" | "year") {
  const now = dayjs();
  const points: { label: string; end: Date }[] = [];

  if (range === "week") {
    for (let i = 6; i >= 0; i--) {
      const d = now.subtract(i, "day");
      points.push({
        label: d.format("ddd"),
        end: d.endOf("day").toDate(),
      });
    }
  } else if (range === "month") {
    for (let i = 5; i >= 0; i--) {
      const d = now.subtract(i, "week").startOf("week");
      points.push({
        label: d.format("MMM DD"),
        end: d.endOf("week").toDate(),
      });
    }
  } else if (range === "year") {
    for (let i = 11; i >= 0; i--) {
      const d = now.subtract(i, "month").startOf("month");
      points.push({
        label: d.format("MMM"),
        end: d.endOf("month").toDate(),
      });
    }
  }

  return points;
}

// ----- main ----------------------------------------------------

export function generateNetWorthHistory(
  transactions: Transaction[],
  accounts: Account[],
  range: "week" | "month" | "year" = "month"
): HistoryPoint[] {
  const points = getTimePoints(range);

  const accountsById: AccountsById = accounts.reduce((m, a) => {
    m[a._id.toString()] = a;
    return m;
  }, {} as AccountsById);

  const balances: BalanceMap = accounts.reduce((m, a) => {
    m[a._id.toString()] = 0;
    return m;
  }, {} as BalanceMap);

  const txns = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const history: HistoryPoint[] = [];
  let cursor = 0;

  for (const point of points) {
    while (cursor < txns.length && new Date(txns[cursor].date) <= point.end) {
      const txn = txns[cursor];

      const accId = txn.accountId?.toString?.();
      const from = txn.fromAccountId?.toString?.();
      const to = txn.toAccountId?.toString?.();

      if (txn.type === "income") {
        const creditAcc = to || accId;
        if (creditAcc)
          balances[creditAcc] = (balances[creditAcc] || 0) + txn.amount;
      } else if (txn.type === "expense") {
        const debitAcc = to || accId;
        if (debitAcc)
          balances[debitAcc] = (balances[debitAcc] || 0) - txn.amount;
      } else if (
        txn.type === "transfer" ||
        txn.type === "goal" ||
        txn.type === "investment"
      ) {
        if (from) balances[from] = (balances[from] || 0) - txn.amount;
        if (to) balances[to] = (balances[to] || 0) + txn.amount;
      }

      cursor++;
    }

    const netWorth = calcNetWorthFromBalances(balances, accountsById);
    history.push({ date: point.label, value: netWorth });
  }

  return history;
}
