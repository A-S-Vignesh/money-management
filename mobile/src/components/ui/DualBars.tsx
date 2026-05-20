// DualBars — paired bar chart (income + expense per period bucket).
// Per-bucket pair sits centered with month label below. Pure RN Views, no
// chart library, no gradient peer-dep. Matches the Mobile UI mock.

import { Text, View } from "react-native";
import { Tokens } from "@/lib/design";

interface Datum {
  label: string;
  inc: number;
  exp: number;
}

interface Props {
  data: Datum[];
  height?: number;
}

export function DualBars({ data, height = 160 }: Props) {
  const max = Math.max(1, ...data.flatMap((d) => [d.inc, d.exp]));
  const trackHeight = height - 24; // reserve 24px for the bottom label
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height,
        gap: 8,
        paddingHorizontal: 2,
      }}
    >
      {data.map((d, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 6,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              gap: 3,
              height: trackHeight,
              width: "100%",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 9,
                height: Math.max(2, (d.inc / max) * trackHeight),
                backgroundColor: Tokens.emerald,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
            <View
              style={{
                width: 9,
                height: Math.max(2, (d.exp / max) * trackHeight),
                backgroundColor: Tokens.rose,
                borderTopLeftRadius: 4,
                borderTopRightRadius: 4,
                borderBottomLeftRadius: 2,
                borderBottomRightRadius: 2,
              }}
            />
          </View>
          <Text className="text-fg-dim dark:text-fg-dark-dim text-[10px] font-semibold">
            {d.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
