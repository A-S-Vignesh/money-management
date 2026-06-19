// BudgetSheet — create + edit a budget in a single bottom sheet.
// 1:1 with the Mobile UI mock "New budget" sheet:
//   - Preview card (category icon + name + monthly limit)
//   - Horizontal category chips
//   - Allocation amount input with quick-amount chips
//   - Period segment (Weekly / Monthly / Yearly)
//   - Create/Save button + Delete (edit mode only)
//
// Note: the mock's "alert at %" slider isn't in the backend Budget model
// yet, so it's omitted here. When the schema picks up an `alertThreshold`
// field, drop the slider in just above the action button.

import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import dayjs from "dayjs";
import { Check, Trash2 } from "lucide-react-native";

import { getCategoryPalette } from "@/_shared";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { hapticMedium } from "@/lib/haptics";
import {
  useAddBudget,
  useDeleteBudget,
  useUpdateBudget,
  type BudgetDoc,
} from "@/hooks/useBudgets";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When set, sheet opens in edit mode pre-filled with this budget. */
  editing?: BudgetDoc | null;
}

type Period = "Weekly" | "Monthly" | "Yearly";

// Categories the user can pick. Matches the validation list (minus Salary
// and Transfer which are income/transfer-only and don't belong in budgets).
const CATEGORIES = [
  "Food",
  "Housing",
  "Transport",
  "Lifestyle",
  "Shopping",
  "Learning",
  "Personal",
  "Other",
];

const QUICK_AMOUNTS: Array<{ label: string; value: number }> = [
  { label: "₹2k", value: 2000 },
  { label: "₹5k", value: 5000 },
  { label: "₹10k", value: 10000 },
  { label: "₹25k", value: 25000 },
];

// Convert a period to its [startDate, endDate] window relative to today.
// The backend requires both; we compute them so the user doesn't have to
// pick dates manually.
function periodWindow(period: Period): { startDate: string; endDate: string } {
  const now = dayjs();
  if (period === "Weekly") {
    return {
      startDate: now.startOf("week").toISOString(),
      endDate: now.endOf("week").toISOString(),
    };
  }
  if (period === "Yearly") {
    return {
      startDate: now.startOf("year").toISOString(),
      endDate: now.endOf("year").toISOString(),
    };
  }
  return {
    startDate: now.startOf("month").toISOString(),
    endDate: now.endOf("month").toISOString(),
  };
}

export function BudgetSheet({ visible, onClose, editing }: Props) {
  const dark = useColorScheme() === "dark";

  const [category, setCategory] = useState<string>(editing?.category ?? "Food");
  const [name, setName] = useState<string>(editing?.name ?? "");
  const [amount, setAmount] = useState<string>(
    editing ? String(editing.allocated) : "",
  );
  const [period, setPeriod] = useState<Period>(
    (editing?.period as Period) ?? "Monthly",
  );
  const [submitting, setSubmitting] = useState(false);

  // Reset form when opening fresh.
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setCategory(editing.category);
      setName(editing.name);
      setAmount(String(editing.allocated));
      setPeriod((editing.period as Period) ?? "Monthly");
      return;
    }
    setCategory("Food");
    setName("");
    setAmount("");
    setPeriod("Monthly");
  }, [visible, editing]);

  // If the category changes and the name is still the default-ish, sync the
  // name to the category so the preview header reads sensibly.
  useEffect(() => {
    if (!name || CATEGORIES.includes(name)) setName(category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const addMut = useAddBudget();
  const updateMut = useUpdateBudget(editing?._id ?? "");
  const deleteMut = useDeleteBudget();

  const palette = useMemo(() => getCategoryPalette(category), [category]);
  const Icon = useMemo(() => getCategoryIcon(category), [category]);

  const numericAmount = Number(amount);
  const canSubmit = !!category && numericAmount > 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    hapticMedium();
    setSubmitting(true);
    try {
      const win = periodWindow(period);
      const body = {
        name: (name || category).trim(),
        category,
        allocated: numericAmount,
        period,
        startDate: win.startDate,
        endDate: win.endDate,
      };
      if (editing) {
        await updateMut.mutateAsync(body);
      } else {
        await addMut.mutateAsync(body);
      }
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(
        editing ? "Couldn't update budget" : "Couldn't create budget",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert("Delete budget?", `Remove the ${editing.category} budget?`, [
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
    ]);
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title={editing ? "Edit budget" : "New budget"} onClose={onClose} />

      {/* Preview card — mirrors the mock's pill at top of the sheet. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 14,
          paddingVertical: 14,
          borderRadius: 16,
          backgroundColor: dark ? palette.bgDark : palette.bgLight,
          marginBottom: 18,
        }}
      >
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color={palette.textLight} strokeWidth={2} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text
            style={{
              fontSize: 14.5,
              fontWeight: "700",
              color: dark ? palette.textDark : palette.textLight,
              letterSpacing: -0.2,
            }}
          >
            {name || category}
          </Text>
          <Text
            style={{
              fontSize: 11.5,
              color: dark ? palette.textDark : palette.textLight,
              opacity: 0.8,
              marginTop: 2,
            }}
          >
            {period} limit
          </Text>
        </View>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "800",
            color: dark ? palette.textDark : palette.textLight,
            fontVariant: ["tabular-nums"],
            letterSpacing: -0.3,
          }}
        >
          {numericAmount > 0 ? formatCurrency(numericAmount) : "₹0"}
        </Text>
      </View>

      {/* Category chips */}
      <Label dark={dark}>Category</Label>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        style={{ marginBottom: 16 }}
      >
        {CATEGORIES.map((c) => {
          const active = c === category;
          const p = getCategoryPalette(c);
          const CIcon = getCategoryIcon(c);
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                height: 36,
                borderRadius: 999,
                backgroundColor: active
                  ? dark
                    ? p.bgDark
                    : p.bgLight
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1,
                borderColor: active
                  ? p.accent
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
                overflow: "hidden",
              }}
            >
              <CIcon
                size={13}
                color={
                  active
                    ? p.accent
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted
                }
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "600",
                  color: active
                    ? p.accent
                    : dark
                      ? Tokens.textDarkPrimary
                      : Tokens.text,
                }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Allocation amount */}
      <Label dark={dark}>{period} limit</Label>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          height: 52,
          borderRadius: 14,
          backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
          paddingHorizontal: 14,
          marginBottom: 8,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
            fontWeight: "500",
            marginRight: 6,
          }}
        >
          ₹
        </Text>
        <TextInput
          keyboardType="numeric"
          value={amount}
          onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
          placeholder="0"
          placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
          style={{
            flex: 1,
            fontSize: 20,
            fontWeight: "700",
            color: dark ? Tokens.textDarkPrimary : Tokens.text,
            fontVariant: ["tabular-nums"],
            letterSpacing: -0.4,
          }}
        />
      </View>

      {/* Quick amount chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 18 }}>
        {QUICK_AMOUNTS.map((q) => (
          <Pressable
            key={q.value}
            onPress={() => setAmount(String(q.value))}
            android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
            style={{
              flex: 1,
              height: 36,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
              borderWidth: 1,
              borderColor: dark ? Tokens.borderDark : Tokens.border,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                fontSize: 12.5,
                fontWeight: "600",
                color: dark ? Tokens.textDarkPrimary : Tokens.text,
              }}
            >
              {q.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Period segment — active state uses a contrasting bg + raised
          shadow + bolder text so the chosen option is unambiguously
          distinct from the unselected ones. Previously they all sat on
          near-identical greys in dark mode, which looked like two could
          be active at once. */}
      <Label dark={dark}>Period</Label>
      <View
        style={{
          flexDirection: "row",
          padding: 4,
          backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
          borderRadius: 12,
          marginBottom: 22,
        }}
      >
        {(["Weekly", "Monthly", "Yearly"] as Period[]).map((p) => {
          const active = period === p;
          return (
            <Pressable
              key={p}
              onPress={() => setPeriod(p)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                flex: 1,
                paddingVertical: 10,
                alignItems: "center",
                borderRadius: 9,
                backgroundColor: active
                  ? dark
                    ? "#2c3140"
                    : "#ffffff"
                  : "transparent",
                shadowColor: "#000",
                shadowOpacity: active ? 0.15 : 0,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
                elevation: active ? 2 : 0,
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: active ? "700" : "500",
                  color: active
                    ? dark
                      ? "#ffffff"
                      : Tokens.text
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted,
                }}
              >
                {p}
              </Text>
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
        <Pressable
          onPress={submit}
          disabled={!canSubmit || submitting}
          android_ripple={{ color: "rgba(255,255,255,0.18)" }}
          style={{
            flex: 1,
            height: 52,
            borderRadius: 14,
            backgroundColor: Tokens.brand,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: !canSubmit || submitting ? 0.5 : 1,
            shadowColor: Tokens.brand,
            shadowOpacity: 0.35,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 6 },
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
                {editing ? "Save changes" : "Create budget"}
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
