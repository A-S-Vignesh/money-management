// AccountSheet — create + edit an account in one sheet.
// 1:1 with the Mobile UI mock:
//   - Big gradient preview card (account type + name + balance + icon chip)
//   - Account type chips: Bank / Card / Wallet / Cash
//   - Account name input
//   - Opening balance input (create only — backend disallows balance edits)
//   - Card colour swatches
//   - Save changes / Add account button (+ Delete in edit mode)

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Banknote,
  Check,
  CreditCard,
  Trash2,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import {
  useAddAccount,
  useDeleteAccount,
  useUpdateAccount,
  type AccountDoc,
} from "@/hooks/useAccounts";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When set, sheet opens in edit mode pre-filled with this account. */
  editing?: AccountDoc | null;
}

// The mock's four "Bank / Card / Wallet / Cash" UI types map to backend
// account types like so. "credit" is what the backend stores for a card.
type UiType = "bank" | "card" | "wallet" | "cash";
const UI_TYPES: Array<{ id: UiType; label: string; Icon: LucideIcon }> = [
  { id: "bank", label: "Bank", Icon: CreditCard },
  { id: "card", label: "Card", Icon: CreditCard },
  { id: "wallet", label: "Wallet", Icon: Wallet },
  { id: "cash", label: "Cash", Icon: Banknote },
];

function backendType(ui: UiType): AccountDoc["type"] {
  if (ui === "card") return "credit";
  if (ui === "wallet") return "other";
  return ui; // bank, cash
}
function uiType(backend: AccountDoc["type"]): UiType {
  if (backend === "credit") return "card";
  if (backend === "other") return "wallet";
  if (backend === "cash") return "cash";
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
  const deleteMut = useDeleteAccount();

  const canSubmit =
    name.trim().length >= 2 && (editing || Number(balance) >= 0);

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      if (editing) {
        // Backend rejects balance on update — only send the editable fields.
        await updateMut.mutateAsync({
          name: name.trim(),
          type: backendType(type),
          color,
        });
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

      {/* Account type chips */}
      <Label dark={dark}>Account type</Label>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
        {UI_TYPES.map((t) => {
          const active = type === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setType(t.id)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                flex: 1,
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

      {/* Opening balance — create only. Backend rejects balance on update. */}
      {!editing ? (
        <>
          <Label dark={dark}>Opening balance</Label>
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
              marginBottom: 18,
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
        </>
      ) : null}

      {/* Card colour swatches */}
      <Label dark={dark}>Card colour</Label>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingRight: 12 }}
        style={{ marginBottom: 22 }}
      >
        {CARD_COLORS.map((c) => {
          const active = c === color;
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
                style={{ width: "100%", height: "100%", borderRadius: 10 }}
              />
            </Pressable>
          );
        })}
      </ScrollView>

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
        <Pressable
          onPress={submit}
          disabled={!canSubmit || submitting}
          android_ripple={{ color: "rgba(255,255,255,0.18)" }}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            backgroundColor: color,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: !canSubmit || submitting ? 0.5 : 1,
            shadowColor: color,
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
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
                {editing ? "Save changes" : "Add account"}
              </Text>
              <Check size={16} color="#fff" strokeWidth={2.5} />
            </>
          )}
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
