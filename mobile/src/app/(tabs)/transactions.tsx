// app/(tabs)/transactions.tsx — Transactions
// Full UI port from Mobile UI/screens.jsx with live API data.
//
// Flow:
//   - List groups by date (Today / Yesterday / "Sun, 12 May").
//   - Tap a row → TxDetailSheet (view + delete + edit handoff).
//   - Tap Edit on the detail sheet → swap to AddTransactionSheet (edit mode).
//   - FAB bottom-right → AddTransactionSheet (new transaction).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { Inbox, Menu, Plus, Search } from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import {
  useTransactions,
  type TransactionDoc,
} from "@/hooks/useTransactions";

import { AddTransactionSheet } from "@/components/transactions/AddTransactionSheet";
import { TxDetailSheet } from "@/components/transactions/TxDetailSheet";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";
import { TxRow } from "@/components/ui/TxRow";

type Filter = "all" | "income" | "expense" | "transfer";

export default function TransactionsScreen() {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");

  // Debounce the search query so we don't refetch on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  // Sheet visibility + selected transaction.
  const [detailTx, setDetailTx] = useState<TransactionDoc | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionDoc | null>(null);

  const { data, isLoading, isRefetching, refetch } = useTransactions({
    page: 1,
    limit: 100,
    type: filter,
    search: debouncedQ,
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  const list = data?.data ?? [];
  const netFlow = useMemo(
    () =>
      list.reduce(
        (sum, tx) =>
          sum + (tx.type === "expense" ? -tx.amount : tx.type === "income" ? tx.amount : 0),
        0,
      ),
    [list],
  );

  // Group by ISO date (descending).
  const grouped = useMemo(() => {
    const map = new Map<string, TransactionDoc[]>();
    for (const tx of list) {
      const key = dayjs(tx.date).format("YYYY-MM-DD");
      const arr = map.get(key) ?? [];
      arr.push(tx);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [list]);

  // ── Sheet handlers ──────────────────────────────────────────────
  const openDetail = (tx: TransactionDoc) => {
    setDetailTx(tx);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  const startEditFromDetail = (tx: TransactionDoc) => {
    setShowDetail(false);
    setEditingTx(tx);
    // Allow the detail sheet to finish its slide-out before opening add sheet.
    setTimeout(() => setShowAdd(true), 280);
  };

  const openAdd = () => {
    setEditingTx(null);
    setShowAdd(true);
  };
  const closeAdd = () => {
    setShowAdd(false);
    setTimeout(() => setEditingTx(null), 280);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHead
          title="Transactions"
          subtitle={`${list.length} entries · net ${netFlow >= 0 ? "+" : "−"}${formatCurrency(Math.abs(netFlow))}`}
          leading={
            <Pressable
              className="bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 4,
              }}
            >
              <Menu size={20} color={Tokens.text} strokeWidth={2} />
            </Pressable>
          }
        />

        {/* Search */}
        <View style={{ position: "relative", marginBottom: 12 }}>
          <Search
            size={16}
            color={Tokens.textMuted}
            strokeWidth={2.2}
            style={{ position: "absolute", left: 14, top: 14, zIndex: 1 }}
          />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search transactions…"
            placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
            style={{
              height: 44,
              paddingLeft: 40,
              paddingRight: 14,
              borderRadius: 14,
              backgroundColor: dark ? Tokens.cardDark : Tokens.card,
              borderWidth: 1,
              borderColor: dark ? Tokens.borderDark : Tokens.border,
              color: dark ? Tokens.textDarkPrimary : Tokens.text,
              fontSize: 14,
            }}
          />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 16 }}
          style={{ marginHorizontal: -16, marginBottom: 14 }}
        >
          <View style={{ width: 16 }} />
          {(
            [
              { id: "all", label: "All" },
              { id: "expense", label: "Expenses" },
              { id: "income", label: "Income" },
              { id: "transfer", label: "Transfers" },
            ] as Array<{ id: Filter; label: string }>
          ).map((f) => (
            <Chip
              key={f.id}
              label={f.label}
              active={filter === f.id}
              onPress={() => setFilter(f.id)}
            />
          ))}
        </ScrollView>

        {/* Body */}
        {isLoading ? (
          <Card style={{ padding: 16, gap: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <View
                key={i}
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <Skeleton width={38} height={38} radius={12} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="60%" height={14} />
                  <Skeleton width="40%" height={11} />
                </View>
                <Skeleton width={70} height={16} />
              </View>
            ))}
          </Card>
        ) : grouped.length === 0 ? (
          <Card style={{ padding: 28, alignItems: "center" }}>
            <IconTile
              Icon={Inbox}
              tone="brand"
              size="lg"
              style={{ marginBottom: 12 }}
            />
            <Text className="text-fg dark:text-fg-dark text-[15px] font-semibold">
              No transactions
            </Text>
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] text-center mt-1">
              {debouncedQ || filter !== "all"
                ? "Try clearing your filters."
                : "Tap the + button to add your first."}
            </Text>
          </Card>
        ) : (
          grouped.map(([date, items]) => {
            const dayTotal = items.reduce(
              (s, t) =>
                s + (t.type === "expense" ? -t.amount : t.type === "income" ? t.amount : 0),
              0,
            );
            const d = dayjs(date);
            const diff = dayjs().startOf("day").diff(d, "day");
            const label =
              diff === 0
                ? "Today"
                : diff === 1
                  ? "Yesterday"
                  : d.format("ddd, D MMM");
            return (
              <View key={date} style={{ marginBottom: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingHorizontal: 4,
                    paddingBottom: 6,
                  }}
                >
                  <Text
                    className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-bold uppercase"
                    style={{ letterSpacing: 0.3 }}
                  >
                    {label}
                  </Text>
                  <Text
                    className={
                      dayTotal >= 0
                        ? "text-emerald text-[11.5px] font-semibold"
                        : "text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-semibold"
                    }
                    style={{ fontVariant: ["tabular-nums"] }}
                  >
                    {dayTotal >= 0 ? "+" : "−"}
                    {formatCurrency(Math.abs(dayTotal))}
                  </Text>
                </View>
                <Card
                  style={{
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                    overflow: "hidden",
                  }}
                >
                  {items.map((tx, i) => (
                    <TxRow
                      key={tx._id}
                      tx={tx}
                      last={i === items.length - 1}
                      onPress={() => openDetail(tx)}
                    />
                  ))}
                </Card>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable
        onPress={openAdd}
        style={({ pressed }) => ({
          position: "absolute",
          right: 18,
          bottom: 84, // clear of the native tab bar
          width: 56,
          height: 56,
          borderRadius: 18,
          backgroundColor: Tokens.brand,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: Tokens.brand,
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: 0.55,
          shadowRadius: 18,
          elevation: 10,
          transform: [{ scale: pressed ? 0.94 : 1 }],
        })}
      >
        <Plus size={26} color="#fff" strokeWidth={2.4} />
      </Pressable>

      {/* Sheets */}
      <AddTransactionSheet
        visible={showAdd}
        onClose={closeAdd}
        editing={editingTx}
      />
      <TxDetailSheet
        visible={showDetail}
        onClose={closeDetail}
        transaction={detailTx}
        onEdit={startEditFromDetail}
      />
    </SafeAreaView>
  );
}
