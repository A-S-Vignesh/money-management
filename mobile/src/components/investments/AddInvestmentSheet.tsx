// AddInvestmentSheet — create a new holding from the Investments page.
// Mirrors the Mobile UI mock 1:1:
//   - Color-tinted gradient preview card up top (Stocks=indigo,
//     Mutual=emerald, Crypto=amber, Gold=amber-gold)
//   - Asset type chips (4): Stocks / Mutual / Crypto / Gold
//   - Symbol input + per-type quick-pick chips (AAPL/TSLA/... for Stocks,
//     NIFTYBEES/PPFCF/... for Mutual, etc.)
//   - Units + Avg price inputs side-by-side
//   - "Today" date chip + cash-source account chip (Zerodha •• 4421 style)
//   - "Add to portfolio ✓" submit button
//
// Mapping: the mock's "Stocks/Mutual/Crypto/Gold" map to backend types
// `stock` / `mutual_fund` / `crypto` / `gold`. Backend also supports
// `etf`, `fd`, `ppf`, `real_estate`, `other` but those aren't in the
// mock's chip set.

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
import { LinearGradient } from "expo-linear-gradient";
import {
  Banknote,
  Calendar,
  Check,
  CreditCard,
  Layers,
  LineChart,
  Medal,
  TrendingUp,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react-native";
import dayjs from "dayjs";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useAccounts } from "@/hooks/useAccounts";
import { useAddHolding, type HoldingType } from "@/hooks/useHoldings";
import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { hapticMedium } from "@/lib/haptics";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";

interface Props {
  visible: boolean;
  onClose: () => void;
}

// UI chip ↔ backend HoldingType + visual properties per category.
type UiType = "stock" | "mutual_fund" | "crypto" | "gold";
interface AssetMeta {
  id: UiType;
  label: string;
  heroLabel: string;
  Icon: LucideIcon;
  color: string;
  /** Quick symbol pills shown under the symbol input. */
  symbols: string[];
}

const ASSETS: AssetMeta[] = [
  {
    id: "stock",
    label: "Stocks",
    heroLabel: "STOCKS VALUE",
    Icon: TrendingUp,
    color: "#6366f1",
    symbols: ["AAPL", "TSLA", "GOOGL", "NVDA", "INFY", "TCS"],
  },
  {
    id: "mutual_fund",
    label: "Mutual",
    heroLabel: "MUTUAL VALUE",
    Icon: Layers,
    color: "#10b981",
    symbols: ["NIFTYBEES", "PPFCF", "AXISBLUE", "MIRAEELS"],
  },
  {
    id: "crypto",
    label: "Crypto",
    heroLabel: "CRYPTO VALUE",
    Icon: Zap,
    color: "#f59e0b",
    symbols: ["BTC", "ETH", "SOL", "MATIC", "DOGE"],
  },
  {
    id: "gold",
    label: "Gold",
    heroLabel: "GOLD VALUE",
    Icon: Medal,
    color: "#eab308",
    symbols: ["GOLDBEES", "GOLDETF", "SGB-2024"],
  },
];

export function AddInvestmentSheet({ visible, onClose }: Props) {
  const dark = useColorScheme() === "dark";

  const [type, setType] = useState<UiType>("stock");
  const [symbol, setSymbol] = useState("");
  const [units, setUnits] = useState("");
  const [price, setPrice] = useState("");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  // Broker / investment-account id. Optional — when empty, the backend
  // auto-creates a default "Brokerage" account on submit (Goals-style).
  const [brokerAccountId, setBrokerAccountId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  // Reset on each open.
  useEffect(() => {
    if (!visible) return;
    setType("stock");
    setSymbol("");
    setUnits("");
    setPrice("");
  }, [visible]);

  const { data: accounts = [] } = useAccounts({ includeGoals: false });
  const addMut = useAddHolding();

  // Source = any cash-like account (bank / cash / wallet / credit).
  // Destination = an investment-type "broker" account.
  const cashAccounts = useMemo(
    () =>
      accounts.filter(
        (a) =>
          !a.isSystem &&
          !a.isDeleted &&
          (a.type === "bank" || a.type === "cash" || a.type === "other" || a.type === "credit"),
      ),
    [accounts],
  );
  const brokerAccounts = useMemo(
    () =>
      accounts.filter(
        (a) => !a.isSystem && !a.isDeleted && a.type === "investment",
      ),
    [accounts],
  );

  // Default picks once accounts arrive.
  useEffect(() => {
    if (!fromAccountId && cashAccounts[0]) setFromAccountId(cashAccounts[0]._id);
  }, [fromAccountId, cashAccounts]);
  useEffect(() => {
    if (!brokerAccountId && brokerAccounts[0])
      setBrokerAccountId(brokerAccounts[0]._id);
  }, [brokerAccountId, brokerAccounts]);

  const meta = useMemo(() => ASSETS.find((a) => a.id === type) ?? ASSETS[0], [type]);
  const numUnits = Number(units);
  const numPrice = Number(price);
  const value = numUnits > 0 && numPrice > 0 ? numUnits * numPrice : 0;

  const canSubmit =
    !!symbol.trim() && numUnits > 0 && numPrice > 0 && !!fromAccountId;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    hapticMedium();
    setSubmitting(true);
    try {
      // Send accountId when the user picked a broker; omit it otherwise
      // and let the backend auto-create the default "Brokerage" account.
      await addMut.mutateAsync({
        ...(brokerAccountId ? { accountId: brokerAccountId } : {}),
        fromAccountId,
        name: symbol.trim().toUpperCase(),
        symbol: symbol.trim().toUpperCase(),
        type,
        quantity: numUnits,
        pricePerUnit: numPrice,
        date: dayjs().format("YYYY-MM-DD"),
      });
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(
        "Couldn't add investment",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title="Add investment" onClose={onClose} />

      {/* Color-tinted preview card */}
      <LinearGradient
        colors={[meta.color, lighten(meta.color, 0.22)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 18,
          borderRadius: 18,
          marginBottom: 22,
          minHeight: 100,
          flexDirection: "row",
          alignItems: "center",
          shadowColor: meta.color,
          shadowOpacity: 0.35,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 10.5,
              fontWeight: "800",
              letterSpacing: 1,
            }}
          >
            {meta.heroLabel}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "baseline", marginTop: 4 }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 24,
                fontWeight: "800",
                letterSpacing: -0.6,
                fontVariant: ["tabular-nums"],
              }}
            >
              {value > 0 ? formatCurrency(value) : "₹0"}
            </Text>
          </View>
          <Text
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 11.5,
              marginTop: 4,
            }}
          >
            {numUnits > 0 ? `${numUnits} units` : "— · 0 units"}
          </Text>
        </View>
        <View
          style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.22)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <meta.Icon size={20} color="#fff" strokeWidth={2.2} />
        </View>
      </LinearGradient>

      {/* Asset type chips */}
      <Label dark={dark}>Asset type</Label>
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 16 }}>
        {ASSETS.map((a) => {
          const active = a.id === type;
          return (
            <Pressable
              key={a.id}
              onPress={() => {
                setType(a.id);
                setSymbol("");
              }}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: active
                  ? tint(a.color, dark ? 0.22 : 0.12)
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1.5,
                borderColor: active ? a.color : dark ? Tokens.borderDark : Tokens.border,
                overflow: "hidden",
              }}
            >
              <a.Icon
                size={18}
                color={active ? a.color : dark ? Tokens.textMutedDark : Tokens.textMuted}
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontSize: 11.5,
                  fontWeight: active ? "700" : "600",
                  marginTop: 6,
                  color: active ? a.color : dark ? Tokens.textDarkPrimary : Tokens.text,
                }}
              >
                {a.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Symbol input + quick-pick chips */}
      <Label dark={dark}>Symbol</Label>
      <TextInput
        value={symbol}
        onChangeText={(v) => setSymbol(v.toUpperCase())}
        placeholder="e.g. AAPL, BTC, NIFTYBEES"
        placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
        autoCapitalize="characters"
        style={{
          height: 48,
          paddingHorizontal: 14,
          borderRadius: 14,
          backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
          borderWidth: 1,
          borderColor: dark ? Tokens.borderDark : Tokens.border,
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          fontSize: 14.5,
          fontWeight: "600",
          marginBottom: 10,
        }}
      />
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 18 }}>
        {meta.symbols.map((s) => {
          const active = symbol === s;
          return (
            <Pressable
              key={s}
              onPress={() => setSymbol(s)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
              style={{
                paddingHorizontal: 10,
                height: 28,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active
                  ? tint(meta.color, dark ? 0.22 : 0.12)
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1,
                borderColor: active ? meta.color : dark ? Tokens.borderDark : Tokens.border,
                overflow: "hidden",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: active ? "700" : "600",
                  color: active ? meta.color : dark ? Tokens.textMutedDark : Tokens.textMuted,
                  letterSpacing: 0.3,
                }}
              >
                {s}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Units + price */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
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
          <Label dark={dark}>Avg price</Label>
          <AmountInput
            dark={dark}
            value={price}
            onChange={(v) => setPrice(v.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            prefix="₹"
          />
        </View>
      </View>

      {/* ── Pay from ────────────────────────────────────────────────
          Which cash/bank account funds this buy. Horizontal rail of
          account chips so the user can scroll through their accounts
          and pick one. */}
      <Label dark={dark}>Pay from</Label>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 12 }}
        style={{ marginBottom: 16 }}
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
              active={a._id === fromAccountId}
              accentColor={Tokens.brand}
              onPress={() => setFromAccountId(a._id)}
            />
          ))
        )}
      </ScrollView>

      {/* ── Add to broker ───────────────────────────────────────────
          Which broker/investment account this holding belongs to. If the
          user has none, we skip this section entirely and the backend
          auto-creates a default "Brokerage" account on submit. */}
      {brokerAccounts.length > 0 ? (
        <>
          <Label dark={dark}>Add to broker</Label>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingRight: 12 }}
            style={{ marginBottom: 16 }}
          >
            {brokerAccounts.map((a) => (
              <AccountChip
                key={a._id}
                dark={dark}
                account={a}
                active={a._id === brokerAccountId}
                accentColor={meta.color}
                onPress={() => setBrokerAccountId(a._id)}
              />
            ))}
          </ScrollView>
        </>
      ) : (
        <Text
          style={{
            fontSize: 11.5,
            color: dark ? Tokens.textDimDark : Tokens.textDim,
            marginBottom: 16,
            fontStyle: "italic",
          }}
        >
          No broker accounts yet — we'll create one called "Brokerage" for
          you. Add named brokers (Zerodha, Groww, …) under Accounts → +.
        </Text>
      )}

      {/* Today date chip — placeholder for a future date-picker swap. */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 22 }}>
        <Chip dark={dark} Icon={Calendar} label="Today" />
      </View>

      {/* Submit — colored surface on inner View so it repaints reliably
          when meta.color changes (NativeWind's Pressable wrapper otherwise
          memoises the style). */}
      <Pressable
        onPress={submit}
        disabled={!canSubmit || submitting}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={{
          borderRadius: 14,
          overflow: "hidden",
          opacity: !canSubmit || submitting ? 0.5 : 1,
          shadowColor: meta.color,
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
            backgroundColor: meta.color,
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
                Add to portfolio
              </Text>
              <Check size={16} color="#fff" strokeWidth={2.5} />
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

function Chip({
  dark,
  Icon,
  label,
  onPress,
}: {
  dark: boolean;
  Icon: LucideIcon;
  label: string;
  onPress?: () => void;
}) {
  const chipStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 999,
    backgroundColor: dark ? Tokens.cardSoftDark : Tokens.card,
    borderWidth: 1,
    borderColor: dark ? Tokens.borderDark : Tokens.border,
    overflow: "hidden" as const,
  };
  const inner = (
    <>
      <Icon
        size={13}
        color={dark ? Tokens.textMutedDark : Tokens.textMuted}
        strokeWidth={2.2}
      />
      <Text
        numberOfLines={1}
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
        }}
      >
        {label}
      </Text>
    </>
  );
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
        style={chipStyle}
      >
        {inner}
      </Pressable>
    );
  }
  return <View style={chipStyle}>{inner}</View>;
}

// Per-account chip — used by both the "Pay from" and "Add to broker"
// horizontal rails. Type-aware icon + last-4 mask + name; active state
// uses the caller's accent color so brokers light up in the asset's
// color (indigo for stocks, emerald for mutual, etc.) while cash
// accounts use brand-blue.
function AccountChip({
  dark,
  account,
  active,
  accentColor,
  onPress,
}: {
  dark: boolean;
  account: { _id: string; name: string; type: string };
  active: boolean;
  accentColor: string;
  onPress: () => void;
}) {
  const Icon: LucideIcon =
    account.type === "cash"
      ? Banknote
      : account.type === "other"
        ? Wallet
        : account.type === "investment"
          ? LineChart
          : CreditCard;
  const tail = account._id.slice(-4);
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        minWidth: 150,
        backgroundColor: active
          ? dark
            ? "#1e3a8a55"
            : tint(accentColor, 0.1)
          : dark
            ? Tokens.cardSoftDark
            : Tokens.card,
        borderWidth: 1.5,
        borderColor: active ? accentColor : dark ? Tokens.borderDark : Tokens.border,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: active
            ? tint(accentColor, 0.18)
            : dark
              ? Tokens.bgElevDark
              : Tokens.bgElev,
        }}
      >
        <Icon
          size={14}
          color={active ? accentColor : dark ? Tokens.textMutedDark : Tokens.textMuted}
          strokeWidth={2.2}
        />
      </View>
      <View style={{ minWidth: 0 }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            fontWeight: "600",
            color: active ? accentColor : dark ? Tokens.textDarkPrimary : Tokens.text,
            maxWidth: 110,
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
          •• {tail}
        </Text>
      </View>
    </Pressable>
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
function tint(hex: string, alpha: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}
