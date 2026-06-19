// AccountSheet — create + edit an account in one sheet.
// 1:1 with the Mobile UI mock:
//   - Big gradient preview card (account type + name + balance + icon chip)
//   - Account type chips: Bank / Card / Wallet / Cash
//   - Account name input
//   - Balance input (opening on create; on edit it posts an adjustment txn)
//   - Card colour swatches
//   - Save changes / Add account button (+ Delete in edit mode)

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Banknote,
  Check,
  CreditCard,
  LineChart,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { hapticMedium } from "@/lib/haptics";
import {
  useAddAccount,
  useAdjustBalance,
  useDeleteAccount,
  useUpdateAccount,
  type AccountDoc,
} from "@/hooks/useAccounts";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When set, sheet opens in edit mode pre-filled with this account. */
  editing?: AccountDoc | null;
}

// UI account types — extends the mock's four (Bank/Card/Wallet/Cash)
// with "Broker" so users can create named investment accounts
// (Zerodha, Groww, Coinbase, PPF, FD, etc.) without going to the web.
type UiType = "bank" | "card" | "wallet" | "cash" | "broker";
const UI_TYPES: Array<{ id: UiType; label: string; Icon: LucideIcon }> = [
  { id: "bank", label: "Bank", Icon: CreditCard },
  { id: "card", label: "Card", Icon: CreditCard },
  { id: "wallet", label: "Wallet", Icon: Wallet },
  { id: "cash", label: "Cash", Icon: Banknote },
  { id: "broker", label: "Broker", Icon: LineChart },
];

function backendType(ui: UiType): AccountDoc["type"] {
  if (ui === "card") return "credit";
  if (ui === "wallet") return "other";
  if (ui === "broker") return "investment";
  return ui; // bank, cash
}
function uiType(backend: AccountDoc["type"]): UiType {
  if (backend === "credit") return "card";
  if (backend === "other") return "wallet";
  if (backend === "cash") return "cash";
  if (backend === "investment") return "broker";
  return "bank";
}

// Mock palette — six brand-tinted colors. Stored as the hex on the account.
const CARD_COLORS = [
  "#6366f1", // indigo (default)
  "#10b981", // emerald
  "#f43f5e", // rose
  "#f59e0b", // amber
  "#14b8a6", // teal
  "#a855f7", // purple
];

// Gradient endpoint pairs for the big preview card — slightly darker on
// top-left, brighter on bottom-right, so it reads as a polished pill.
function gradientFor(color: string): [string, string] {
  return [color, lightenHex(color, 0.22)];
}

export function AccountSheet({ visible, onClose, editing }: Props) {
  const dark = useColorScheme() === "dark";

  const [type, setType] = useState<UiType>(
    editing ? uiType(editing.type) : "bank",
  );
  const [name, setName] = useState<string>(editing?.name ?? "");
  const [balance, setBalance] = useState<string>(
    editing ? String(editing.balance) : "",
  );
  const [color, setColor] = useState<string>(editing?.color ?? CARD_COLORS[0]);
  const [submitting, setSubmitting] = useState(false);

  // Reset when the sheet opens.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setType(uiType(editing.type));
      setName(editing.name);
      setBalance(String(editing.balance));
      setColor(editing.color ?? CARD_COLORS[0]);
      return;
    }
    setType("bank");
    setName("");
    setBalance("");
    setColor(CARD_COLORS[0]);
  }, [visible, editing]);

  const addMut = useAddAccount();
  const updateMut = useUpdateAccount(editing?._id ?? "");
  const adjustMut = useAdjustBalance(editing?._id ?? "");
  const deleteMut = useDeleteAccount();

  // Balance is only directly editable on broker/investment accounts via their
  // own flow — here it's adjustable on bank/card/wallet/cash. Hide the field
  // for broker accounts in edit mode (the backend rejects adjusting those).
  const canAdjustBalance = type !== "broker";

  const canSubmit = name.trim().length >= 2 && Number(balance) >= 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    hapticMedium();
    setSubmitting(true);
    try {
      if (editing) {
        // Name/type/color go through the normal update. Balance is derived
        // from transactions, so a changed amount is posted as an adjustment
        // transaction instead of a direct field write.
        await updateMut.mutateAsync({
          name: name.trim(),
          type: backendType(type),
          color,
        });
        const target = Number(balance) || 0;
        if (canAdjustBalance && target !== editing.balance) {
          await adjustMut.mutateAsync({ balance: target });
        }
      } else {
        await addMut.mutateAsync({
          name: name.trim(),
          type: backendType(type),
          balance: Number(balance) || 0,
          color,
        });
      }
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(
        editing ? "Couldn't update account" : "Couldn't create account",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(
      "Delete account?",
      `Remove ${editing.name}? This won't delete your past transactions.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMut.mutateAsync(editing._id);
              onClose();
            } catch (err) {
              Alert.alert("Couldn't delete", (err as Error).message ?? "Try again.");
            }
          },
        },
      ],
    );
  };

  const previewLabel = useMemo(() => {
    const t = UI_TYPES.find((u) => u.id === type);
    return t?.label.toUpperCase() ?? "BANK";
  }, [type]);
  const PreviewIcon = UI_TYPES.find((u) => u.id === type)?.Icon ?? CreditCard;
  const previewBalance = Number(balance) || 0;

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader
        title={editing ? "Edit account" : "Add account"}
        onClose={onClose}
      />

      {/* Big gradient preview card */}
      <LinearGradient
        colors={gradientFor(color)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 18,
          borderRadius: 20,
          marginBottom: 22,
          minHeight: 150,
          justifyContent: "space-between",
          shadowColor: color,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.78)",
                fontSize: 10.5,
                fontWeight: "800",
                letterSpacing: 1,
              }}
            >
              {previewLabel}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: "#fff",
                fontSize: 17,
                fontWeight: "700",
                marginTop: 4,
                letterSpacing: -0.3,
              }}
            >
              {name || "Account name"}
            </Text>
          </View>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: "rgba(255,255,255,0.20)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PreviewIcon size={18} color="#fff" strokeWidth={2.2} />
          </View>
        </View>
        <View>
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 10.5,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            BALANCE
          </Text>
          <Text
            style={{
              color: "#fff",
              fontSize: 26,
              fontWeight: "800",
              marginTop: 4,
              fontVariant: ["tabular-nums"],
              letterSpacing: -0.8,
            }}
          >
            {formatCurrency(previewBalance)}
          </Text>
        </View>
      </LinearGradient>

      {/* Account type chips — flexWrap so the 5th chip ("Broker") drops
          to a second row instead of crushing all five horizontally. */}
      <Label dark={dark}>Account type</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {UI_TYPES.map((t) => {
          const active = type === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                // 4-per-row layout: each chip is ~ (100% - 3*gap) / 4.
                width: "23%",
                paddingVertical: 12,
                borderRadius: 14,
                alignItems: "center",
                backgroundColor: active
                  ? dark
                    ? "#1e3a8a55"
                    : Tokens.brandSoft
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1.5,
                borderColor: active
                  ? Tokens.brand
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
                overflow: "hidden",
              }}
            >
              <t.Icon
                size={18}
                color={active ? Tokens.brand : dark ? Tokens.textMutedDark : Tokens.textMuted}
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: active ? "700" : "600",
                  marginTop: 6,
                  color: active ? Tokens.brand : dark ? Tokens.textDarkPrimary : Tokens.text,
                }}
              >
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Name */}
      <Label dark={dark}>Account name</Label>
      <TextInput
        placeholder="HDFC Savings, Amazon Pay, etc."
        placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
        value={name}
        onChangeText={setName}
        style={{
          height: 48,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          fontSize: 14.5,
          marginBottom: 18,
        }}
      />

      {/* Balance. On create this is the opening balance; on edit it's the
          current balance — changing it books an `adjustment` transaction for
          the difference rather than overwriting the value. Hidden for broker
          accounts, whose balance is driven by holdings. */}
      {(!editing || canAdjustBalance) ? (
        <>
          <Label dark={dark}>
            {editing ? "Current balance" : "Opening balance"}
          </Label>
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
              marginBottom: editing ? 8 : 18,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                marginRight: 6,
              }}
            >
              ₹
            </Text>
            <TextInput
              keyboardType="numeric"
              value={balance}
              onChangeText={(v) => setBalance(v.replace(/[^0-9.]/g, ""))}
              placeholder="0"
              placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
              style={{
                flex: 1,
                fontSize: 18,
                fontWeight: "700",
                color: dark ? Tokens.textDarkPrimary : Tokens.text,
                fontVariant: ["tabular-nums"],
                letterSpacing: -0.4,
              }}
            />
          </View>
          {editing ? (
            <Text
              style={{
                fontSize: 11.5,
                lineHeight: 16,
                color: dark ? Tokens.textDimDark : Tokens.textDim,
                marginBottom: 18,
              }}
            >
              Correcting a mistyped amount? We&apos;ll record the difference as
              a balance adjustment — it won&apos;t count as income or expense.
            </Text>
          ) : null}
        </>
      ) : null}

      {/* Card colour swatches — case-insensitive match so older saved
          hex strings (uppercase) still highlight, plus an explicit Check
          overlay on the active swatch so the focused colour is obvious.
          Switched from horizontal ScrollView to flexWrap because the
          scroll gesture was stealing the tap on some Android devices,
          so taps appeared to do nothing. */}
      <Label dark={dark}>Card colour</Label>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 10,
          marginBottom: 22,
        }}
      >
        {CARD_COLORS.map((c) => {
          const active = c.toLowerCase() === (color ?? "").toLowerCase();
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              hitSlop={4}
              android_ripple={{ color: "rgba(255,255,255,0.18)" }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: active ? (dark ? "#ffffff" : "#1f2937") : "transparent",
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={gradientFor(c)}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 10,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {active ? (
                  <Check size={16} color="#ffffff" strokeWidth={3} />
                ) : null}
              </LinearGradient>
            </Pressable>
          );
        })}
      </View>

      {/* Action row */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        {editing ? (
          <Pressable
            onPress={confirmDelete}
            android_ripple={{ color: "rgba(225,29,72,0.12)" }}
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: Tokens.roseSoft,
              backgroundColor: dark ? "#3a1320" : Tokens.roseBg,
              overflow: "hidden",
            }}
          >
            <Trash2 size={16} color={Tokens.rose} strokeWidth={2.2} />
          </Pressable>
        ) : null}
        {/* Save button — colored surface lives on a child View so the
            dynamic `backgroundColor: color` actually repaints when the
            user taps a new swatch. NativeWind's Pressable wrapper
            memoises its own style prop, which was eating the update. */}
        <Pressable
          onPress={submit}
          disabled={!canSubmit || submitting}
          android_ripple={{ color: "rgba(255,255,255,0.18)" }}
          style={{
            flex: 1,
            borderRadius: 14,
            overflow: "hidden",
            opacity: !canSubmit || submitting ? 0.5 : 1,
            shadowColor: color,
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
              backgroundColor: color,
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
                <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                  {editing ? "Save changes" : "Add account"}
                </Text>
                <Check size={16} color="#fff" strokeWidth={2.5} />
              </>
            )}
          </View>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

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

// Same brighten helper used in the Budgets bar gradient — duplicated here
// to keep AccountSheet standalone (avoids reaching across feature folders).
function lightenHex(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const toHex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}
