// AddTransactionSheet — the full add/edit flow as a single bottom sheet.
// Composes: TypeSegment, AmountDisplay, Keypad, Description input,
// CategoryPicker, AccountPicker(s), DateStrip, Save button.

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { ArrowRight, Check } from "lucide-react-native";
import dayjs from "dayjs";

import { Tokens } from "@/lib/design";
import { useAccounts } from "@/hooks/useAccounts";
import {
  useAddTransaction,
  useUpdateTransaction,
  type TransactionDoc,
} from "@/hooks/useTransactions";
import { BottomSheet } from "@/components/ui/BottomSheet";

import { AccountPicker } from "./AccountPicker";
import { AmountDisplay } from "./AmountDisplay";
import { CategoryPicker } from "./CategoryPicker";
import { DateStrip } from "./DateStrip";
import { Keypad } from "./Keypad";
import { SheetHeader } from "./SheetHeader";
import { TypeSegment, type TxType } from "./TypeSegment";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pass an existing transaction to switch to edit mode. */
  editing?: TransactionDoc | null;
  /** Initial type when adding (e.g. Dashboard "Send" → "expense"). */
  initialType?: TxType;
}

const EXPENSE_CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Lifestyle",
  "Shopping",
  "Learning",
  "Personal",
  "Other",
];

const INCOME_CATEGORIES = ["Salary", "Other"];

export function AddTransactionSheet({
  visible,
  onClose,
  editing,
  initialType,
}: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  // ── Form state ──────────────────────────────────────────────────
  const [type, setType] = useState<TxType>(
    editing?.type ?? initialType ?? "expense",
  );
  const [amount, setAmount] = useState<string>(
    editing ? String(editing.amount) : "",
  );
  const [description, setDescription] = useState<string>(
    editing?.description ?? "",
  );
  const [category, setCategory] = useState<string>(editing?.category ?? "Food");
  const [fromAccountId, setFromAccountId] = useState<string>(
    editing?.fromAccountId ?? "",
  );
  const [toAccountId, setToAccountId] = useState<string>(
    editing?.toAccountId ?? "",
  );
  const [date, setDate] = useState<string>(
    editing?.date
      ? dayjs(editing.date).format("YYYY-MM-DD")
      : dayjs().format("YYYY-MM-DD"),
  );
  const [submitting, setSubmitting] = useState(false);

  // Reset form when sheet opens fresh (no editing) so previous values don't bleed.
  useEffect(() => {
    if (!visible) return;
    if (editing) return; // keep editing state
    setType(initialType ?? "expense");
    setAmount("");
    setDescription("");
    setCategory(initialType === "income" ? "Salary" : "Food");
    setFromAccountId("");
    setToAccountId("");
    setDate(dayjs().format("YYYY-MM-DD"));
  }, [visible, editing, initialType]);

  // ── Hooks ───────────────────────────────────────────────────────
  const { data: accounts = [] } = useAccounts({ includeGoals: true });
  const addMut = useAddTransaction();
  const updateMut = useUpdateTransaction(editing?._id ?? "");

  // Default account selection once accounts arrive.
  useEffect(() => {
    if (!accounts.length || editing) return;
    const usable = accounts.filter(
      (a) => !a.isSystem && !a.isDeleted && a.type !== "investment",
    );
    if (type === "expense") {
      if (!fromAccountId && usable[0]) setFromAccountId(usable[0]._id);
    }
    if (type === "income") {
      if (!toAccountId && usable[0]) setToAccountId(usable[0]._id);
    }
    if (type === "transfer") {
      if (!fromAccountId && usable[0]) setFromAccountId(usable[0]._id);
      if (!toAccountId && usable[1]) setToAccountId(usable[1]._id);
    }
  }, [accounts, type, fromAccountId, toAccountId, editing]);

  const categories = useMemo(
    () => (type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES),
    [type],
  );

  // ── Submit ──────────────────────────────────────────────────────
  const canSubmit =
    !!amount &&
    Number(amount) > 0 &&
    description.trim().length >= 2 &&
    (type === "transfer"
      ? !!fromAccountId && !!toAccountId && fromAccountId !== toAccountId
      : type === "income"
        ? !!toAccountId && !!category
        : !!fromAccountId && !!category);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const baseBody = {
        amount: Number(amount),
        date,
        description: description.trim(),
      };
      let body: Record<string, unknown>;
      if (type === "transfer") {
        body = {
          ...baseBody,
          type: "transfer",
          fromAccountId,
          toAccountId,
          category: "Transfer",
        };
      } else if (type === "income") {
        body = {
          ...baseBody,
          type: "income",
          toAccountId,
          category,
        };
      } else {
        body = {
          ...baseBody,
          type: "expense",
          fromAccountId,
          category,
        };
      }
      if (editing) {
        // PUT only takes the editable fields — we send everything (server
        // ignores type changes on edit, but keeps the rest in sync).
        await updateMut.mutateAsync(body as never);
      } else {
        await addMut.mutateAsync(body as never);
      }
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(
        editing ? "Couldn't update transaction" : "Couldn't save transaction",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader
        title={editing ? "Edit transaction" : "Add transaction"}
        onClose={onClose}
      />

      <TypeSegment
        value={type}
        onChange={setType}
        disabled={!!editing}
      />

      <AmountDisplay amount={amount} />
      <View style={{ marginBottom: 18 }}>
        <Keypad value={amount} onChange={setAmount} />
      </View>

      {/* Description */}
      <TextInput
        placeholder="What was it for?"
        placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
        value={description}
        onChangeText={setDescription}
        style={{
          height: 44,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          fontSize: 14,
          marginBottom: 14,
        }}
      />

      {/* Category (hidden for transfer) */}
      {type !== "transfer" ? (
        <View style={{ marginBottom: 16 }}>
          <CategoryPicker
            value={category}
            onChange={setCategory}
            categories={categories}
          />
        </View>
      ) : null}

      {/* Accounts */}
      {type === "transfer" ? (
        <View style={{ marginBottom: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
              style={{ letterSpacing: 0.5, flex: 1 }}
            >
              Transfer between accounts
            </Text>
            <Pressable
              onPress={() => {
                const a = fromAccountId;
                setFromAccountId(toAccountId);
                setToAccountId(a);
              }}
              hitSlop={8}
              android_ripple={{ color: dark ? Tokens.borderDark : Tokens.bgElev, borderless: true }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 99,
                backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ArrowRight
                size={14}
                color={dark ? Tokens.textMutedDark : Tokens.textMuted}
                strokeWidth={2.4}
              />
            </Pressable>
          </View>
          {/* From + To stacked vertically — each is a full-width horizontal
              account rail so the user can scroll through all accounts.
              The old side-by-side layout cramped both pickers and made the
              horizontal scroll feel jammed against the swap button. */}
          <AccountPicker
            label="From"
            value={fromAccountId}
            onChange={setFromAccountId}
            accounts={accounts}
            excludeId={toAccountId}
          />
          <AccountPicker
            label="To"
            value={toAccountId}
            onChange={setToAccountId}
            accounts={accounts}
            excludeId={fromAccountId}
          />
        </View>
      ) : (
        <View style={{ marginBottom: 16 }}>
          <AccountPicker
            label={type === "income" ? "Deposit to" : "Paid from"}
            value={type === "income" ? toAccountId : fromAccountId}
            onChange={type === "income" ? setToAccountId : setFromAccountId}
            accounts={accounts}
          />
        </View>
      )}

      {/* Date */}
      <View style={{ marginBottom: 18 }}>
        <DateStrip value={date} onChange={setDate} />
      </View>

      {/* Save — flat style only. NativeWind's Pressable wrapper drops
          function-style props (the entire button shape vanished and just
          left bare text). Use android_ripple for press feedback instead. */}
      <Pressable
        onPress={submit}
        disabled={!canSubmit || submitting}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={{
          height: 52,
          borderRadius: 16,
          backgroundColor: Tokens.brand,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: !canSubmit || submitting ? 0.5 : 1,
          shadowColor: Tokens.brand,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          overflow: "hidden",
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text
              style={{
                color: "#fff",
                fontSize: 15,
                fontWeight: "600",
                letterSpacing: -0.1,
              }}
            >
              {editing ? "Save changes" : "Save transaction"}
            </Text>
            <Check size={17} color="#fff" strokeWidth={2.5} />
          </>
        )}
      </Pressable>
    </BottomSheet>
  );
}
