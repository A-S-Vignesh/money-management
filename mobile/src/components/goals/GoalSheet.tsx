// GoalSheet — create + edit a goal. Mirrors the Mobile UI mock:
//   - Gradient preview card up top (icon + name + saved/target + progress)
//   - Goal name input
//   - Type chips (2×4 grid: Emergency / Travel / House / Vehicle / Gadget / Gift / Education / Other)
//   - Target + Saved-so-far inputs side by side (saved is create-only —
//     after creation the linked account balance is the source of truth)
//   - Target date quick-chips + native date picker fallback
//   - Colour swatches
//   - Save changes / Create goal button (+ Delete in edit mode)

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
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import {
  Briefcase,
  Calendar,
  Car,
  Check,
  Gift,
  GraduationCap,
  Home,
  Plane,
  ShieldCheck,
  Smartphone,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import {
  useAddGoal,
  useDeleteGoal,
  useUpdateGoal,
  type GoalDoc,
} from "@/hooks/useGoals";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";

interface Props {
  visible: boolean;
  onClose: () => void;
  editing?: GoalDoc | null;
}

const CATEGORIES: Array<{ id: string; label: string; Icon: LucideIcon }> = [
  { id: "Emergency", label: "Emergency", Icon: ShieldCheck },
  { id: "Travel", label: "Travel", Icon: Plane },
  { id: "House", label: "House", Icon: Home },
  { id: "Vehicle", label: "Vehicle", Icon: Car },
  { id: "Gadget", label: "Gadget", Icon: Smartphone },
  { id: "Gift", label: "Gift", Icon: Gift },
  { id: "Education", label: "Education", Icon: GraduationCap },
  { id: "Other", label: "Other", Icon: Briefcase },
];

const COLORS = [
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#f59e0b",
  "#14b8a6",
  "#a855f7",
  "#ec4899",
  "#3b82f6",
];

// Generates four quick-pick date chips starting from the current month
// going out 2 / 4 / 8 / 18 months — enough range to cover most goals
// without burying the year-out option behind a date-picker tap.
function quickDates(): Date[] {
  const now = dayjs();
  return [
    now.add(2, "month").endOf("month").toDate(),
    now.add(4, "month").endOf("month").toDate(),
    now.add(8, "month").endOf("month").toDate(),
    now.add(18, "month").endOf("month").toDate(),
  ];
}

function iconForCategory(id: string): LucideIcon {
  return CATEGORIES.find((c) => c.id === id)?.Icon ?? Tag;
}

export function GoalSheet({ visible, onClose, editing }: Props) {
  const dark = useColorScheme() === "dark";

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Emergency");
  const [target, setTarget] = useState("");
  const [savedInitial, setSavedInitial] = useState("");
  const [deadline, setDeadline] = useState<string>(
    dayjs().add(6, "month").endOf("month").toISOString(),
  );
  const [color, setColor] = useState(COLORS[0]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setTarget(String(editing.target));
      setSavedInitial(String(editing.saved));
      setDeadline(
        editing.deadline ?? dayjs().add(6, "month").endOf("month").toISOString(),
      );
      setColor(editing.color || COLORS[0]);
      return;
    }
    setName("");
    setCategory("Emergency");
    setTarget("");
    setSavedInitial("");
    setDeadline(dayjs().add(6, "month").endOf("month").toISOString());
    setColor(COLORS[0]);
  }, [visible, editing]);

  const addMut = useAddGoal();
  const updateMut = useUpdateGoal(editing?._id ?? "");
  const deleteMut = useDeleteGoal();

  const numericTarget = Number(target);
  const numericSaved = Number(savedInitial) || 0;
  const canSubmit =
    name.trim().length >= 2 && numericTarget > 0 && !!deadline && !!color;

  const PreviewIcon = useMemo(() => iconForCategory(category), [category]);
  const pct = numericTarget > 0 ? Math.min(100, (numericSaved / numericTarget) * 100) : 0;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        target: numericTarget,
        category,
        deadline,
        color,
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
        editing ? "Couldn't update goal" : "Couldn't create goal",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(
      "Delete goal?",
      "Removing the goal also deletes its linked savings account. Any money in it must be transferred out first.",
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
              Alert.alert(
                "Couldn't delete",
                (err as Error).message ?? "Try again.",
              );
            }
          },
        },
      ],
    );
  };

  const onPickerChange = (event: DateTimePickerEvent, picked?: Date) => {
    setPickerOpen(false);
    if (event.type === "set" && picked) {
      setDeadline(picked.toISOString());
    }
  };

  const dates = useMemo(quickDates, []);

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title={editing ? "Edit goal" : "New goal"} onClose={onClose} />

      {/* Preview card */}
      <LinearGradient
        colors={[color, lighten(color, 0.22)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 18,
          borderRadius: 20,
          marginBottom: 22,
          shadowColor: color,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 11,
              backgroundColor: "rgba(255,255,255,0.22)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PreviewIcon size={18} color="#fff" strokeWidth={2.2} />
          </View>
          <View style={{ flex: 1 }} />
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 10.5,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            {dayjs(deadline).format("MMM YYYY").toUpperCase()}
          </Text>
        </View>
        <Text
          numberOfLines={1}
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
            marginTop: 12,
            letterSpacing: -0.3,
          }}
        >
          {name || "Goal name"}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4, gap: 6 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 22,
              fontWeight: "800",
              fontVariant: ["tabular-nums"],
              letterSpacing: -0.6,
            }}
          >
            {formatCurrency(numericSaved)}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.78)", fontSize: 13 }}>
            / {formatCurrency(numericTarget || 0)}
          </Text>
        </View>
        <View
          style={{
            marginTop: 12,
            height: 6,
            borderRadius: 99,
            backgroundColor: "rgba(255,255,255,0.22)",
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: `${pct}%`,
              height: "100%",
              backgroundColor: "#fff",
              borderRadius: 99,
            }}
          />
        </View>
        <Text style={{ color: "#fff", fontSize: 11, fontWeight: "600", marginTop: 8 }}>
          {pct.toFixed(0)}% complete
        </Text>
      </LinearGradient>

      {/* Name */}
      <Label dark={dark}>Goal name</Label>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="e.g. Emergency fund"
        placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
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

      {/* Type chips — 2x4 grid */}
      <Label dark={dark}>Type</Label>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 18,
        }}
      >
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          // 4 per row → each ~ (sheet-width - 3*gap) / 4
          return (
            <Pressable
              key={c.id}
              onPress={() => setCategory(c.id)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
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
              <c.Icon
                size={16}
                color={active ? Tokens.brand : dark ? Tokens.textMutedDark : Tokens.textMuted}
                strokeWidth={2.2}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  fontWeight: active ? "700" : "600",
                  marginTop: 5,
                  color: active ? Tokens.brand : dark ? Tokens.textDarkPrimary : Tokens.text,
                }}
              >
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Target + saved-so-far side by side */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
        <View style={{ flex: 1 }}>
          <Label dark={dark}>Target</Label>
          <AmountInput
            dark={dark}
            value={target}
            onChange={(v) => setTarget(v.replace(/[^0-9.]/g, ""))}
            placeholder="0"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Label dark={dark}>{editing ? "Saved so far" : "Initial saved"}</Label>
          <AmountInput
            dark={dark}
            value={savedInitial}
            onChange={(v) => setSavedInitial(v.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            disabled={!!editing}
          />
        </View>
      </View>

      {/* Target date — quick chips + calendar */}
      <Label dark={dark}>Target date</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
        {dates.map((d) => {
          const iso = d.toISOString();
          const active = dayjs(deadline).isSame(d, "month");
          return (
            <Pressable
              key={iso}
              onPress={() => setDeadline(iso)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 10,
                height: 32,
                borderRadius: 999,
                backgroundColor: active
                  ? dark
                    ? Tokens.textDarkPrimary
                    : Tokens.text
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1,
                borderColor: active
                  ? dark
                    ? Tokens.textDarkPrimary
                    : Tokens.text
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
                overflow: "hidden",
              }}
            >
              <Calendar
                size={12}
                color={
                  active
                    ? dark
                      ? Tokens.text
                      : Tokens.card
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted
                }
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: active
                    ? dark
                      ? Tokens.text
                      : Tokens.card
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted,
                }}
              >
                {dayjs(d).format("MMM YYYY")}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          onPress={() => setPickerOpen(true)}
          android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 999,
            backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
            borderWidth: 1,
            borderColor: Tokens.brand,
            overflow: "hidden",
          }}
        >
          <Calendar size={12} color={Tokens.brand} strokeWidth={2.2} />
          <Text style={{ fontSize: 12, fontWeight: "600", color: Tokens.brand }}>
            Pick date
          </Text>
        </Pressable>
      </View>

      {/* Colour swatches */}
      <Label dark={dark}>Colour</Label>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
        {COLORS.map((c) => {
          const active = c === color;
          return (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              hitSlop={4}
              android_ripple={{ color: "rgba(255,255,255,0.18)" }}
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 3,
                borderColor: active ? (dark ? "#ffffff" : "#1f2937") : "transparent",
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={[c, lighten(c, 0.22)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ width: "100%", height: "100%", borderRadius: 10 }}
              />
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
                {editing ? "Save changes" : "Create goal"}
              </Text>
              <Check size={16} color="#fff" strokeWidth={2.5} />
            </>
          )}
        </Pressable>
      </View>

      {pickerOpen ? (
        <DateTimePicker
          value={dayjs(deadline).toDate()}
          mode="date"
          minimumDate={new Date()}
          onChange={onPickerChange}
        />
      ) : null}
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

function AmountInput({
  dark,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  dark: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
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
        opacity: disabled ? 0.6 : 1,
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
        editable={!disabled}
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

function lighten(hex: string, amount: number): string {
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
