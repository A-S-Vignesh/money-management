// lib/recomputeBalance.ts
//
// Single source of truth for deriving Account.balance from Transactions.
// Account.balance is a denormalized cache that gets incremented on every
// transaction write. If any write path skips that increment (a future feature,
// a manual DB edit, a partial failure), the balance drifts.
//
// This utility re-derives the cache from the transaction log. Use it from:
// - User-triggered "fix my balance" actions in the UI
// - A periodic job that runs nightly across all accounts
// - After bulk imports / migrations / data fixes
//
// The conventions match POST /api/transactions:
//   income   → toAccountId   gets +amount
//   expense  → fromAccountId gets -amount
//   transfer → fromAccountId gets -amount AND toAccountId gets +amount

import mongoose from "mongoose";
import Account from "@/models/Account";
import Transaction from "@/models/Transaction";
import Goal from "@/models/Goal";

export interface RecomputeResult {
  accountId: string;
  previous: number;
  computed: number;
  drift: number;
  updated: boolean;
  goalId?: string;
  goalCompletionChanged?: boolean;
}

// Compute the canonical balance for one account from its transactions.
// Does not write — pure derivation. Useful when you want to dry-run.
export async function deriveAccountBalance(
  accountId: string | mongoose.Types.ObjectId,
): Promise<number> {
  const _id = new mongoose.Types.ObjectId(accountId.toString());

  const [agg] = await Transaction.aggregate<{ total: number }>([
    {
      $match: {
        $or: [{ fromAccountId: _id }, { toAccountId: _id }],
      },
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $switch: {
              branches: [
                {
                  case: {
                    $and: [
                      { $eq: ["$type", "income"] },
                      { $eq: ["$toAccountId", _id] },
                    ],
                  },
                  then: "$amount",
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$type", "expense"] },
                      { $eq: ["$fromAccountId", _id] },
                    ],
                  },
                  then: { $multiply: ["$amount", -1] },
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$type", "transfer"] },
                      { $eq: ["$toAccountId", _id] },
                    ],
                  },
                  then: "$amount",
                },
                {
                  case: {
                    $and: [
                      { $eq: ["$type", "transfer"] },
                      { $eq: ["$fromAccountId", _id] },
                    ],
                  },
                  then: { $multiply: ["$amount", -1] },
                },
              ],
              default: 0,
            },
          },
        },
      },
    },
  ]);

  return agg?.total ?? 0;
}

// Recompute one account's balance from transactions, write the corrected
// value, and sync any linked goal's `isCompleted` flag.
export async function recomputeAccountBalance(
  accountId: string | mongoose.Types.ObjectId,
): Promise<RecomputeResult> {
  const account = await Account.findById(accountId);
  if (!account) {
    throw new Error(`Account ${accountId} not found`);
  }

  const previous = account.balance ?? 0;
  const computed = await deriveAccountBalance(accountId);
  const drift = computed - previous;
  const needsUpdate = drift !== 0;

  if (needsUpdate) {
    account.balance = computed;
    await account.save();
  }

  // If this account backs a goal, re-sync the goal's completion status.
  // Goal completion is bidirectional: complete when balance >= target,
  // un-complete when balance falls back below target (e.g., money pulled out).
  let goalCompletionChanged = false;
  let goalId: string | undefined;

  if (account.type === "goal") {
    const goal = await Goal.findOne({ accountId: account._id });
    if (goal) {
      goalId = String(goal._id);
      const shouldBeComplete = computed >= goal.target;
      if (goal.isCompleted !== shouldBeComplete) {
        goal.isCompleted = shouldBeComplete;
        await goal.save();
        goalCompletionChanged = true;
      }
    }
  }

  return {
    accountId: account._id.toString(),
    previous,
    computed,
    drift,
    updated: needsUpdate,
    goalId,
    goalCompletionChanged,
  };
}

// Sync a goal's `isCompleted` flag to its linked account's current balance.
// Bidirectional: marks complete when balance >= target, un-completes when
// balance falls back below target (e.g., money transferred out of the goal).
//
// Reads the account's *current* stored balance — call this AFTER you've
// applied the balance change for the transaction. Trusts the cache; use
// recomputeAccountBalance() if you suspect drift.
//
// Returns whether the completion flag changed (useful for notification logic).
export async function syncGoalCompletion(
  accountId: string | mongoose.Types.ObjectId | null | undefined,
): Promise<{ changed: boolean; isNowComplete?: boolean; goalName?: string }> {
  if (!accountId) return { changed: false };

  const account = await Account.findById(accountId).select("type balance");
  if (!account || account.type !== "goal") return { changed: false };

  const goal = await Goal.findOne({ accountId: account._id });
  if (!goal) return { changed: false };

  const shouldBeComplete = (account.balance ?? 0) >= goal.target;
  if (goal.isCompleted === shouldBeComplete) return { changed: false };

  goal.isCompleted = shouldBeComplete;
  await goal.save();
  return {
    changed: true,
    isNowComplete: shouldBeComplete,
    goalName: goal.name,
  };
}

// Recompute every account belonging to a user.
// Returns per-account results so the caller can report drift summaries.
export async function recomputeAllBalancesForUser(
  userId: string | mongoose.Types.ObjectId,
): Promise<RecomputeResult[]> {
  const accounts = await Account.find({ userId }).select("_id").lean();

  const results: RecomputeResult[] = [];
  for (const acc of accounts) {
    try {
      const result = await recomputeAccountBalance(acc._id);
      results.push(result);
    } catch (err) {
      console.error(`Recompute failed for account ${acc._id}`, err);
    }
  }
  return results;
}
