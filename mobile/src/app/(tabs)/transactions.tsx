// app/(tabs)/transactions.tsx — Transactions
// Full UI port from Mobile UI/screens.jsx with live API data.
//
// Flow:
//   - SectionList groups by date (Today / Yesterday / "Sun, 12 May").
//   - Infinite scroll loads 20 items at a time.
//   - Tap a row → TxDetailSheet (view + delete + edit handoff).
//   - Tap Edit on the detail sheet → swap to AddTransactionSheet (edit mode).
//   - FAB bottom-right → AddTransactionSheet (new transaction).

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
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
  useInfiniteTransactions,
  type TransactionDoc,
} from "@/hooks/useTransactions";

import { TxDetailSheet } from "@/components/transactions/TxDetailSheet";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";
import { SwipeableTxRow } from "@/components/ui/SwipeableTxRow";
import { useColorScheme } from "@/hooks/useAppColorScheme";

type Filter = "all" | "income" | "expense" | "transfer";

interface DateSection {
  date: string;
  label: string;
  dayTotal: number;
  data: TransactionDoc[];
}

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

  const {
    data,
    isLoading,
    isRefetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteTransactions({
    type: filter,
    search: debouncedQ,
  });

  const onRefresh = useCallback(() => refetch(), [refetch]);

  // Flatten all pages into a single list
  const list = useMemo(
    () => data?.pages.flatMap((p) => p.data) ?? [],
    [data],
  );

  // Total count from the first page's pagination
  const totalCount = data?.pages[0]?.pagination.total ?? 0;

  const netFlow = useMemo(
    () =>
      list.reduce(
        (sum, tx) =>
          sum + (tx.type === "expense" ? -tx.amount : tx.type === "income" ? tx.amount : 0),
        0,
      ),
    [list],
  );

  // Group by ISO date (descending) → SectionList sections
  const sections: DateSection[] = useMemo(() => {
    const map = new Map<string, TransactionDoc[]>();
    for (const tx of list) {
      const key = dayjs(tx.date).format("YYYY-MM-DD");
      const arr = map.get(key) ?? [];
      arr.push(tx);
      map.set(key, arr);
    }
    return [...map.entries()]
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => {
        const d = dayjs(date);
        const diff = dayjs().startOf("day").diff(d, "day");
        const label =
          diff === 0
            ? "Today"
            : diff === 1
              ? "Yesterday"
              : d.format("ddd, D MMM");
        const dayTotal = items.reduce(
          (s, t) =>
            s + (t.type === "expense" ? -t.amount : t.type === "income" ? t.amount : 0),
          0,
        );
        return { date, label, dayTotal, data: items };
      });
  }, [list]);

  // ── Sheet handlers ──────────────────────────────────────────────
  const openDetail = useCallback((tx: TransactionDoc) => {
    setDetailTx(tx);
    setShowDetail(true);
  }, []);
  const closeDetail = () => setShowDetail(false);
  const startEditFromDetail = (tx: TransactionDoc) => {
    setShowDetail(false);
    // Slight delay so the detail sheet finishes its slide-out before the
    // add/edit sheet slides in.
    setTimeout(() => openEditSheet(tx), 280);
  };

  // ── Infinite scroll trigger ─────────────────────────────────────
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Render items ────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item, index, section }: { item: TransactionDoc; index: number; section: DateSection }) => (
      <SwipeableTxRow
        tx={item}
        last={index === section.data.length - 1}
        onPress={() => openDetail(item)}
      />
    ),
    [openDetail],
  );

  const renderSectionHeader = useCallback(
    ({ section }: { section: DateSection }) => (
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 4,
          paddingBottom: 6,
          paddingTop: 4,
        }}
      >
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-bold uppercase"
          style={{ letterSpacing: 0.3 }}
        >
          {section.label}
        </Text>
        <Text
          className={
            section.dayTotal >= 0
              ? "text-emerald text-[11.5px] font-semibold"
              : "text-fg-muted dark:text-fg-dark-muted text-[11.5px] font-semibold"
          }
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {section.dayTotal >= 0 ? "+" : "−"}
          {formatCurrency(Math.abs(section.dayTotal))}
        </Text>
      </View>
    ),
    [],
  );

  const renderSectionFooter = useCallback(
    () => <View style={{ height: 14 }} />,
    [],
  );

  const keyExtractor = useCallback((item: TransactionDoc) => item._id, []);

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      {/* Fixed top bar */}
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Transactions"
          subtitle={`${totalCount} entries · net ${netFlow >= 0 ? "+" : "−"}${formatCurrency(Math.abs(netFlow))}`}
          onMenu={openDrawer}
        />
      </View>

      {/* Search + Filters (fixed, not scrollable) */}
      <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
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
          style={{ marginHorizontal: -16, marginBottom: 10 }}
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
      </View>

      {/* Body */}
      {isLoading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
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
        </View>
      ) : sections.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 4 }}>
          <Card>
            <EmptyState
              Icon={Inbox}
              title="No transactions"
              subtitle={
                debouncedQ || filter !== "all"
                  ? "Try clearing your filters."
                  : "Start tracking your spending and income."
              }
              tone="indigo"
              actionLabel={
                debouncedQ || filter !== "all" ? undefined : "Add transaction"
              }
              onAction={
                debouncedQ || filter !== "all"
                  ? undefined
                  : () => openEditSheet(undefined as any)
              }
            />
          </Card>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          renderSectionFooter={renderSectionFooter}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 140,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              tintColor={Tokens.brand}
            />
          }
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          stickySectionHeadersEnabled={false}
          // Wrap each section's items in a Card
          SectionSeparatorComponent={() => null}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={Tokens.brand} />
              </View>
            ) : null
          }
        />
      )}

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
