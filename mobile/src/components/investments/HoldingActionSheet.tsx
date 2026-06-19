// HoldingActionSheet — buy / sell / update-price / edit-metadata in one
// sheet driven by a `mode` prop. Lives on the HoldingDetailScreen.
//
// Why one sheet, not four: all four flows share the same skeleton
// (header + amount inputs + account picker + submit) and they're
// mutually exclusive — the detail screen only ever opens ONE of them at
// a time. Combining keeps the code surface small and the sheet's
// animation/lifecycle state in one place.

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Check, Pencil, RefreshCw, TrendingDown, TrendingUp } from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useAccounts, type AccountDoc } from "@/hooks/useAccounts";
import {
  useBuyHolding,
  useSellHolding,
  useUpdateHoldingMeta,
  useUpdatePrice,
  type HoldingDoc,
} from "@/hooks/useHoldings";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { hapticMedium } from "@/lib/haptics";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";

export type HoldingActionMode = "buy" | "sell" | "price" | "edit";

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: HoldingActionMode;
  holding: HoldingDoc;
  /** Accent colour for the submit button — usually the type's color. */
  accent?: string;
}

const TITLES: Record<HoldingActionMode, string> = {
  buy: "Buy more",
  sell: "Sell units",
  price: "Update price",
  edit: "Edit holding",
};

export function HoldingActionSheet({
  visible,
  onClose,
  mode,
  holding,
  accent = Tokens.brand,
}: Props) {
  const dark = useColorScheme() === "dark";

  // Shared input state. Different modes consume different subsets.
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset / pre-fill whenever the sheet opens with new context.
  useEffect(() => {
    if (!visible) return;
    setUnits("");
    setPrice(mode === "price" ? String(holding.currentPrice) : "");
    setAccountId("");
    setName(holding.name);
    setSymbol(holding.symbol ?? "");
    setNotes(holding.notes ?? "");
  }, [visible, mode, holding]);

  const { data: accounts = [] } = useAccounts({ includeGoals: false });
  // Cash-like accounts only — buy needs a source, sell needs a destination.
  const cashAccounts = accounts.filter(
    (a) =>
      !a.isSystem &&
      !a.isDeleted &&
      (a.type === "bank" || a.type === "cash" || a.type === "other" || a.type === "credit"),
  );
  useEffect(() => {
    if (!accountId && cashAccounts[0]) setAccountId(cashAccounts[0]._id);
  }, [accountId, cashAccounts]);

  const buyMut = useBuyHolding(holding._id);
  const sellMut = useSellHolding(holding._id);
  const priceMut = useUpdatePrice(holding._id);
  const editMut = useUpdateHoldingMeta(holding._id);

  const numUnits = Number(units);
  const numPrice = Number(price);

  const canSubmit = (() => {
    if (mode === "buy" || mode === "sell") {
      if (!(numUnits > 0) || !(numPrice > 0) || !accountId) return false;
      if (mode === "sell" && numUnits > holding.quantity) return false;
      return true;
    }
    if (mode === "price") return numPrice >= 0;
    if (mode === "edit") return name.trim().length >= 1;
    return false;
  })();

  const submit = async () => {
    if (!canSubmit || submitting) return;
    hapticMedium();
    setSubmitting(true);
    try {
      const today = dayjs().format("YYYY-MM-DD");
      if (mode === "buy") {
        await buyMut.mutateAsync({
          fromAccountId: accountId,
          quantity: numUnits,
          pricePerUnit: numPrice,
          date: today,
        });
      } else if (mode === "sell") {
        await sellMut.mutateAsync({
          toAccountId: accountId,
          quantity: numUnits,
          pricePerUnit: numPrice,
          date: today,
        });
      } else if (mode === "price") {
        await priceMut.mutateAsync({ currentPrice: numPrice });
      } else if (mode === "edit") {
        await editMut.mutateAsync({
          name: name.trim(),
          symbol: symbol.trim() || null,
          notes: notes.trim() || null,
        });
      }
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(`Couldn't ${mode}`, firstField ?? e.message ?? "Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title={TITLES[mode]} onClose={onClose} />

      {/* Position summary card — always shown so the user knows which
          holding they're acting on. */}
      <View
        style={{
          padding: 14,
          borderRadius: 16,
          marginBottom: 20,
          backgroundColor: dark ? Tokens.cardSoftDark : Tokens.cardSoft,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
        }}
      >
        <Text
          style={{
            fontSize: 10.5,
            fontWeight: "800",
            color: dark ? Tokens.textDimDark : Tokens.textDim,
            letterSpacing: 0.8,
          }}
        >
          {(holding.symbol || holding.name).toUpperCase()}
        </Text>
        <Text
          className="text-fg dark:text-fg-dark text-[15px] font-bold mt-1"
          style={{ letterSpacing: -0.2 }}
          numberOfLines={1}
        >
          {holding.name}
        </Text>
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] mt-1"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {holding.quantity} units · avg {formatCurrency(holding.avgCostPrice)}
          {" · "}now {formatCurrency(holding.currentPrice)}
        </Text>
      </View>

      {/* ── Buy / Sell ──────────────────────────────────────────── */}
      {mode === "buy" || mode === "sell" ? (
        <>
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <Label dark={dark}>Units</Label>
              <AmountInput
                dark={dark}
                value={units}
                onChange={(v) => setUnits(v.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                prefix=""
              />
            </View>
            <View style={{ flex: 1 }}>
              <Label dark={dark}>Price / unit</Label>
              <AmountInput
                dark={dark}
                value={price}
                onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
                placeholder="0"
                prefix="₹"
              />
            </View>
          </View>

          {/* Estimated total */}
          {numUnits > 0 && numPrice > 0 ? (
            <View
              style={{
                marginBottom: 16,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
              }}
            >
              <Text className="text-fg-muted dark:text-fg-dark-muted text-[11px] font-semibold">
                {mode === "buy" ? "Will debit" : "Will credit"}
              </Text>
              <Text
                className="text-fg dark:text-fg-dark text-[16px] font-bold mt-0.5"
                style={{ fontVariant: ["tabular-nums"], letterSpacing: -0.3 }}
              >
                {formatCurrency(numUnits * numPrice)}
              </Text>
            </View>
          ) : null}

          <Label dark={dark}>
            {mode === "buy" ? "Pay from" : "Deposit to"}
          </Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 12 }}
            style={{ marginBottom: 22 }}
          >
            {cashAccounts.length === 0 ? (
              <Text
                style={{
                  fontSize: 12,
                  color: dark ? Tokens.textDimDark : Tokens.textDim,
                  fontStyle: "italic",
                }}
              >
                Add a Bank / Cash / Wallet account first.
              </Text>
            ) : (
              cashAccounts.map((a) => (
                <AccountChip
                  key={a._id}
                  dark={dark}
                  account={a}
                  active={a._id === accountId}
                  accentColor={accent}
                  onPress={() => setAccountId(a._id)}
                />
              ))
            )}
          </ScrollView>

          {mode === "sell" && numUnits > holding.quantity ? (
            <Text
              style={{
                marginTop: -10,
                marginBottom: 12,
                fontSize: 11.5,
                color: Tokens.rose,
              }}
            >
              You only hold {holding.quantity} units.
            </Text>
          ) : null}
        </>
      ) : null}

      {/* ── Update price ────────────────────────────────────────── */}
      {mode === "price" ? (
        <>
          <Label dark={dark}>Current price per unit</Label>
          <AmountInput
            dark={dark}
            value={price}
            onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            prefix="₹"
          />
          <Text
            style={{
              marginTop: 8,
              fontSize: 11.5,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              marginBottom: 22,
            }}
          >
            Mark-to-market. Doesn't create a transaction — just updates the
            number used to compute market value and P&L.
          </Text>
        </>
      ) : null}

      {/* ── Edit metadata ───────────────────────────────────────── */}
      {mode === "edit" ? (
        <>
          <Label dark={dark}>Name</Label>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Apple Inc."
            placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
            style={textInputStyle(dark)}
          />
          <View style={{ height: 14 }} />
          <Label dark={dark}>Symbol</Label>
          <TextInput
            value={symbol}
            onChangeText={(v) => setSymbol(v.toUpperCase())}
            placeholder="AAPL"
            placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
            autoCapitalize="characters"
            style={textInputStyle(dark)}
          />
          <View style={{ height: 14 }} />
          <Label dark={dark}>Notes</Label>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Optional"
            placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
            multiline
            style={{ ...textInputStyle(dark), height: 80, paddingTop: 12, textAlignVertical: "top" }}
          />
          <Text
            style={{
              marginTop: 8,
              fontSize: 11.5,
              color: dark ? Tokens.textDimDark : Tokens.textDim,
              marginBottom: 22,
            }}
          >
            Financial fields (avg cost, quantity, realized P&L) can't be
            edited directly — they're derived from buys/sells. To correct
            a wrong initial price: delete and re-add the holding.
          </Text>
        </>
      ) : null}

      {/* Submit — colored surface on inner View so it repaints reliably
          when accent changes (NativeWind Pressable memo). */}
      <Pressable
        onPress={submit}
        disabled={!canSubmit || submitting}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={{
          borderRadius: 14,
          overflow: "hidden",
          opacity: !canSubmit || submitting ? 0.5 : 1,
          shadowColor: accent,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <View
          style={{
            height: 52,
            borderRadius: 14,
            backgroundColor: mode === "sell" ? Tokens.rose : accent,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              {mode === "buy" ? (
                <TrendingUp size={16} color="#fff" strokeWidth={2.5} />
              ) : mode === "sell" ? (
                <TrendingDown size={16} color="#fff" strokeWidth={2.5} />
              ) : mode === "price" ? (
                <RefreshCw size={16} color="#fff" strokeWidth={2.5} />
              ) : (
                <Pencil size={15} color="#fff" strokeWidth={2.5} />
              )}
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                {mode === "buy"
                  ? "Buy more"
                  : mode === "sell"
                    ? "Confirm sell"
                    : mode === "price"
                      ? "Update price"
                      : "Save changes"}
              </Text>
              {mode !== "buy" && mode !== "sell" ? (
                <Check size={16} color="#fff" strokeWidth={2.5} />
              ) : null}
            </>
          )}
        </View>
      </Pressable>
    </BottomSheet>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Label({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10.5,
        fontWeight: "800",
        color: dark ? Tokens.textDimDark : Tokens.textDim,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function textInputStyle(dark: boolean) {
  return {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
    borderWidth: 1,
    borderColor: dark ? Tokens.borderDark : Tokens.border,
    color: dark ? Tokens.textDarkPrimary : Tokens.text,
    fontSize: 14.5,
  };
}

function AmountInput({
  dark,
  value,
  onChange,
  placeholder,
  prefix,
}: {
  dark: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  prefix: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        borderRadius: 14,
        backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
        paddingHorizontal: 14,
      }}
    >
      {prefix ? (
        <Text
          style={{
            fontSize: 16,
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
            marginRight: 6,
          }}
        >
          {prefix}
        </Text>
      ) : null}
      <TextInput
        keyboardType="numeric"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
        style={{
          flex: 1,
          fontSize: 16,
          fontWeight: "700",
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          fontVariant: ["tabular-nums"],
          letterSpacing: -0.3,
        }}
      />
    </View>
  );
}

function AccountChip({
  dark,
  account,
  active,
  accentColor,
  onPress,
}: {
  dark: boolean;
  account: AccountDoc;
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        minWidth: 150,
        backgroundColor: active
          ? dark
            ? "#1e3a8a55"
            : "rgba(37,99,235,0.08)"
          : dark
            ? Tokens.cardSoftDark
            : Tokens.card,
        borderWidth: 1.5,
        borderColor: active ? accentColor : dark ? Tokens.borderDark : Tokens.border,
        overflow: "hidden",
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12.5,
          fontWeight: "600",
          color: active ? accentColor : dark ? Tokens.textDarkPrimary : Tokens.text,
        }}
      >
        {account.name}
      </Text>
      <Text
        style={{
          fontSize: 10.5,
          color: dark ? Tokens.textMutedDark : Tokens.textMuted,
          marginTop: 1,
          fontVariant: ["tabular-nums"],
        }}
      >
        •• {account._id.slice(-4)}
      </Text>
    </Pressable>
  );
}
