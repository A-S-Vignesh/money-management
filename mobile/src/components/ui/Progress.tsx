// Progress — slim linear bar. RN-native (no SVG) for the common solid case.
// The percent is the visible fill width; the track is a muted rectangle.

import { View } from "react-native";

interface Props {
  value: number; // 0-100 (clamped)
  height?: number;
  color?: string;
  trackColor?: string;
}

export function Progress({
  value,
  height = 6,
  color = "#2563eb",
  trackColor = "#eef0f6",
}: Props) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <View
      style={{
        height,
        backgroundColor: trackColor,
        borderRadius: 999,
        overflow: "hidden",
      }}
    >
      <View
        style={{
          width: `${pct}%`,
          height: "100%",
          backgroundColor: color,
          borderRadius: 999,
        }}
      />
    </View>
  );
}
