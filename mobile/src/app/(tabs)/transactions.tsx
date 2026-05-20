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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import { Inbox, Search } from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { formatCurrency } from "@/lib/format";
import { useDrawer, useTransactionSheet } from "@/lib/stores";
import {
  useTransactions,
  type TransactionDoc,
} from "@/hooks/useTransactions";

import { TxDetailSheet } from "@/components/transactions/TxDetailSheet";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { IconTile } from "@/components/ui/IconTile";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";
import { TxRow } from "@/components/ui/TxRow";
import { useColorScheme } from "@/hooks/useAppColorScheme";

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

  // Detail sheet stays local (carries a transaction). Add/Edit sheet lives
  // globally in (tabs)/_layout — we just dispatch via the store.
  const openEditSheet = useTransactionSheet((s) => s.openEdit);
  const openDrawer = useDrawer((s) => s.toggle);
  const [detailTx, setDetailTx] = useState<TransactionDoc | null>(null);
  const [showDetail, setShowDetail] = useState(false);

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
    // Slight delay so the detail sheet finishes its slide-out before the
    // add/edit sheet slides in.
    setTimeout(() => openEditSheet(tx), 280);
  };

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      {/* Fixed top bar — see Dashboard for rationale. */}
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Transactions"
          subtitle={`${list.length} entries · net ${netFlow >= 0 ? "+" : "−"}${formatCurrency(Math.abs(netFlow))}`}
          onMenu={openDrawer}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 140, paddingTop: 4 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            tintColor={Tokens.brand}
          />
        }
        showsVerticalScrollIndicator={false}
      >
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

      {/* FAB + AddTransactionSheet are both mounted globally in
          (tabs)/_layout — we don't render them here. */}
      <TxDetailSheet
        visible={showDetail}
        onClose={closeDetail}
        transaction={detailTx}
        onEdit={startEditFromDetail}
      />
    </SafeAreaView>
  );
}
