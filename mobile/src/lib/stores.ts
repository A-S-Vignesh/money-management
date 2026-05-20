// lib/stores.ts
// Tiny zustand stores for things controlled from anywhere in the app:
//
//   - useDrawer            : the side-menu (hamburger) drawer
//   - useTransactionSheet  : the global Add/Edit Transaction bottom sheet
//
// Keeping these in one file avoids the mental tax of remembering five
// different `useFooStore` paths.

import { create } from "zustand";
import type { TxType } from "@/components/transactions/TypeSegment";
import type { TransactionDoc } from "@/hooks/useTransactions";

// ─── Side drawer ────────────────────────────────────────────────────────

interface DrawerState {
  open: boolean;
  setOpen: (next: boolean) => void;
  toggle: () => void;
}

export const useDrawer = create<DrawerState>((set, get) => ({
  open: false,
  setOpen: (next) => set({ open: next }),
  toggle: () => set({ open: !get().open }),
}));

// ─── Global Add/Edit Transaction sheet ──────────────────────────────────

interface TransactionSheetState {
  open: boolean;
  /** When non-null, the sheet opens in edit mode for this transaction. */
  editing: TransactionDoc | null;
  /** Initial type for new transactions (Add → expense, Income → income, …). */
  initialType: TxType;
  openAdd: (initialType?: TxType) => void;
  openEdit: (tx: TransactionDoc) => void;
  close: () => void;
}

export const useTransactionSheet = create<TransactionSheetState>((set) => ({
  open: false,
  editing: null,
  initialType: "expense",
  openAdd: (initialType: TxType = "expense") =>
    set({ open: true, editing: null, initialType }),
  openEdit: (tx) => set({ open: true, editing: tx, initialType: tx.type }),
  close: () => set({ open: false }),
  // We don't clear `editing` here on close — the sheet's slide-out
  // animation still references the old transaction. Callers that need a
  // clean state should call openAdd() the next time they open.
}));
