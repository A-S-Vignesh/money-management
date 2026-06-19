// app/(tabs)/notifications.tsx — Notifications
// 1:1 port of the Mobile UI mock's NotificationsScreen:
//   - Top bar with "Mark all read" trailing action
//   - "NEW · N" section (unread items, brand-tinted)
//   - "EARLIER" section (read items)
//   - Each row: tone-tinted icon tile + title (with optional unread dot) +
//     body + relative time
//   - Tap to mark read; long-press to delete
//
// Lives inside (tabs) so it inherits the tab bar + drawer chrome but
// isn't a bottom tab — reached via the side drawer's "Notifications"
// link, the Profile More section, and the bell button on the Dashboard.

import { useMemo } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import {
  Bell,
  CheckCheck,
  CreditCard,
  Inbox,
  Target,
  Trash2,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";

import { useColorScheme } from "@/hooks/useAppColorScheme";
import {
  useClearReadNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  type NotificationDoc,
  type NotificationType,
} from "@/hooks/useNotifications";
import { useDrawer } from "@/lib/stores";
import { Tokens, tonePalette, type Tone } from "@/lib/design";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Skeleton } from "@/components/ui/Skeleton";

dayjs.extend(relativeTime);

// Map backend notification type → visual tone + Lucide icon. Keeps
// notifications visually consistent with the rest of the app (Budget
// alerts amber, Goal milestones brand-blue, etc.).
const TYPE_META: Record<
  NotificationType,
  { Icon: LucideIcon; tone: Tone }
> = {
  budget: { Icon: CreditCard, tone: "amber" },
  goal: { Icon: Target, tone: "brand" },
  transaction: { Icon: TrendingUp, tone: "emerald" },
  system: { Icon: Bell, tone: "rose" },
};

export default function NotificationsScreen() {
  const dark = useColorScheme() === "dark";
  const openDrawer = useDrawer((s) => s.toggle);

  const { data, isLoading, isRefetching, refetch } = useNotifications();
  const items = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  const markAllRead = useMarkAllNotificationsRead();
  const clearRead = useClearReadNotifications();

  const { unread, readBuckets } = useMemo(() => {
    // Split unread vs read first — unread always shows ungrouped at the top.
    const u: NotificationDoc[] = [];
    const r: NotificationDoc[] = [];
    for (const n of items) (n.isRead ? r : u).push(n);

    // Then bucket the READ ones by recency for the "Earlier" section.
    // Buckets in order; each becomes its own card so the screen scans
    // top-to-bottom newest → oldest.
    const today = dayjs().startOf("day");
    const yesterday = today.subtract(1, "day");
    const weekStart = today.subtract(7, "day");
    const monthStart = today.subtract(30, "day");

    const buckets: Array<{ label: string; items: NotificationDoc[] }> = [
      { label: "Today", items: [] },
      { label: "Yesterday", items: [] },
      { label: "This week", items: [] },
      { label: "This month", items: [] },
      { label: "Older", items: [] },
    ];

    for (const n of r) {
      const d = dayjs(n.createdAt);
      if (d.isAfter(today)) buckets[0].items.push(n);
      else if (d.isAfter(yesterday)) buckets[1].items.push(n);
      else if (d.isAfter(weekStart)) buckets[2].items.push(n);
      else if (d.isAfter(monthStart)) buckets[3].items.push(n);
      else buckets[4].items.push(n);
    }

    return { unread: u, readBuckets: buckets.filter((b) => b.items.length > 0) };
  }, [items]);

  // Total read count is used by the "Clear" action's confirm dialog.
  const totalRead = readBuckets.reduce((s, b) => s + b.items.length, 0);

  const handleMarkAllRead = () => {
    if (unread.length === 0) return;
    markAllRead.mutate();
  };

  const handleClearRead = () => {
    if (totalRead === 0) return;
    Alert.alert(
      "Clear read notifications?",
      `${totalRead} read notification${totalRead === 1 ? "" : "s"} will be permanently removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => clearRead.mutate(),
        },
      ],
    );
  };

  // Flatten into a single FlatList-friendly array of section descriptors.
  // The "Clear all read" affordance attaches to the FIRST read bucket
  // (which is also the freshest in the timeline) so it sits in the most
  // natural place — right above the items the user is most likely to
  // sweep away.
  const sectionData: Array<{
    key: string;
    title: string;
    items: NotificationDoc[];
    trailing?: React.ReactNode;
  }> = useMemo(() => {
    const out: Array<{
      key: string;
      title: string;
      items: NotificationDoc[];
      trailing?: React.ReactNode;
    }> = [];
    if (unread.length > 0) {
      out.push({
        key: "__new__",
        title: `New · ${unread.length}`,
        items: unread,
      });
    }
    readBuckets.forEach((b, idx) => {
      out.push({
        key: b.label,
        title: b.label,
        items: b.items,
        trailing:
          idx === 0 ? (
            <Pressable
              onPress={handleClearRead}
              hitSlop={6}
              android_ripple={{
                color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              }}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Trash2 size={11} color={Tokens.rose} strokeWidth={2.4} />
              <Text
                style={{ color: Tokens.rose, fontSize: 11, fontWeight: "700" }}
              >
                Clear all read
              </Text>
            </Pressable>
          ) : undefined,
      });
    });
    return out;
    // handleClearRead identity changes per render but is cheap; including
    // it keeps the clear-button callback always pointing at the latest
    // totalRead snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unread, readBuckets, dark]);

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-surface-muted dark:bg-surface-dark-elev">
      <View style={{ paddingHorizontal: 16 }}>
        <ScreenHead
          title="Notifications"
          subtitle={
            unreadCount > 0
              ? `${unreadCount} unread`
              : "You're all caught up"
          }
          onMenu={openDrawer}
          trailing={
            unread.length > 0 ? (
              <MarkAllReadButton
                dark={dark}
                disabled={markAllRead.isPending}
                onPress={handleMarkAllRead}
              />
            ) : undefined
          }
        />
      </View>

      {/* Single FlatList over the *sections* (unread bucket + each
          read-by-date bucket). Each item is a NotificationSection card
          rendering its own rows internally. This avoids the
          "VirtualizedList nested in ScrollView" warning that the
          previous ScrollView-wrapping version triggered, and gives us
          proper virtualization at the section level once notification
          counts grow. Individual-row virtualization would require
          flattening into SectionList — overkill for realistic counts
          (<100), and it would lose the per-bucket Card wrap. */}
      <FlatList
        data={sectionData}
        keyExtractor={(s) => s.key}
        renderItem={({ item }) => (
          <NotificationSection
            title={item.title}
            items={item.items}
            dark={dark}
            trailing={item.trailing}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => refetch()}
            tintColor={Tokens.brand}
          />
        }
        ListEmptyComponent={
          isLoading ? (
            <Card style={{ padding: 14, gap: 14 }}>
              {[1, 2, 3, 4].map((i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    gap: 12,
                  }}
                >
                  <Skeleton width={38} height={38} radius={12} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width="60%" height={13} />
                    <Skeleton width="100%" height={11} />
                    <Skeleton width="30%" height={10} />
                  </View>
                </View>
              ))}
            </Card>
          ) : (
            <Card>
              <EmptyState
                Icon={Inbox}
                title="No notifications"
                subtitle="You'll get pinged here when budgets cross thresholds, goals hit milestones, and big transactions land."
                tone="indigo"
              />
            </Card>
          )
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 140,
          paddingTop: 4,
        }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────

function NotificationSection({
  title,
  items,
  dark,
  trailing,
}: {
  title: string;
  items: NotificationDoc[];
  dark: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 18 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 4,
          paddingBottom: 8,
        }}
      >
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[11px] font-bold uppercase"
          style={{ letterSpacing: 0.6 }}
        >
          {title}
        </Text>
        {trailing}
      </View>
      <Card style={{ paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
        {items.map((n, i) => (
          <NotificationRow
            key={n._id}
            notification={n}
            dark={dark}
            last={i === items.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}

function NotificationRow({
  notification,
  dark,
  last,
}: {
  notification: NotificationDoc;
  dark: boolean;
  last: boolean;
}) {
  const markRead = useMarkNotificationRead();
  const deleteMut = useDeleteNotification();
  const meta = TYPE_META[notification.type] ?? TYPE_META.system;
  const palette = tonePalette[meta.tone];

  const onPress = () => {
    if (!notification.isRead) markRead.mutate(notification._id);
  };

  const onLongPress = () => {
    Alert.alert(
      "Delete notification?",
      undefined,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMut.mutate(notification._id),
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
      }}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
        backgroundColor: notification.isRead
          ? "transparent"
          : dark
            ? "rgba(37,99,235,0.06)"
            : "rgba(37,99,235,0.04)",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: dark ? palette.bgDark : palette.bgLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <meta.Icon
          size={17}
          color={dark ? palette.fgDark : palette.fg}
          strokeWidth={2}
        />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <Text
            numberOfLines={1}
            className="text-fg dark:text-fg-dark text-[13.5px] font-semibold"
            style={{ flex: 1, letterSpacing: -0.1 }}
          >
            {notification.title}
          </Text>
          {!notification.isRead ? (
            <View
              style={{
                width: 7,
                height: 7,
                borderRadius: 99,
                backgroundColor: Tokens.brand,
              }}
            />
          ) : null}
        </View>
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[12px] mt-1"
          style={{ lineHeight: 17 }}
        >
          {notification.message}
        </Text>
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-semibold mt-1.5"
          style={{ letterSpacing: 0.3 }}
        >
          {dayjs(notification.createdAt).fromNow()}
        </Text>
      </View>
    </Pressable>
  );
}

function MarkAllReadButton({
  dark,
  disabled,
  onPress,
}: {
  dark: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      android_ripple={{
        color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        borderless: true,
      }}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        height: 40,
        paddingHorizontal: 10,
        borderRadius: 12,
        marginTop: 4,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <CheckCheck size={14} color={Tokens.brand} strokeWidth={2.4} />
      <Text style={{ color: Tokens.brand, fontSize: 12.5, fontWeight: "700" }}>
        Mark all read
      </Text>
    </Pressable>
  );
}
