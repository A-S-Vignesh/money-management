// MetricCard — labelled value tile with optional delta badge.
// Used in pairs/triples below the hero on Dashboard.
// Layout matches the Mobile UI mock 1:1.

import { Text, View } from "react-native";
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react-native";

import { Card } from "./Card";
import { IconTile } from "./IconTile";
import { type Tone } from "@/lib/design";

interface Props {
  label: string;
  value: string;
  Icon?: LucideIcon;
  tone?: Tone;
  /** Delta % shown as a small pill. */
  delta?: number | null;
  /** Whether the delta direction is "good" (green) or "bad" (red). */
  deltaUp?: boolean;
}

export function MetricCard({
  label,
  value,
  Icon,
  tone = "brand",
  delta = null,
  deltaUp = true,
}: Props) {
  return (
    <Card style={{ flex: 1, padding: 14, minWidth: 0 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
        }}
      >
        {Icon ? (
          <IconTile Icon={Icon} tone={tone} size="md" />
        ) : (
          <View style={{ width: 38, height: 38 }} />
        )}
        {delta != null && (
          <View
            className={
              deltaUp ? "bg-emerald-bg dark:bg-emerald-bg" : "bg-rose-bg dark:bg-rose-bg"
            }
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 2,
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 99,
            }}
          >
            {deltaUp ? (
              <ArrowUp size={9} color="#059669" strokeWidth={3} />
            ) : (
              <ArrowDown size={9} color="#e11d48" strokeWidth={3} />
            )}
            <Text
              className={
                deltaUp ? "text-emerald text-[10.5px] font-bold" : "text-rose text-[10.5px] font-bold"
              }
            >
              {Math.abs(delta)}%
            </Text>
          </View>
        )}
      </View>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-semibold uppercase"
        style={{ letterSpacing: 0.5 }}
      >
        {label}
      </Text>
      <Text
        className="text-fg dark:text-fg-dark text-[19px] font-bold mt-1"
        style={{ letterSpacing: -0.4, fontVariant: ["tabular-nums"] }}
      >
        {value}
      </Text>
    </Card>
  );
}
