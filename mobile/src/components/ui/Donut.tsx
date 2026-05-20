// Donut — stroke-dasharray donut chart in pure react-native-svg.
// 1:1 port of the Mobile UI mock's <Donut/>. No native dependency beyond
// react-native-svg (already in deps), so it runs in Expo Go cleanly.

import { View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

interface Slice {
  value: number;
  color: string;
  label?: string;
}

interface Props {
  slices: Slice[];
  size?: number;
  thickness?: number;
  trackColor?: string;
  /** Centered content (label, total amount, etc.). */
  center?: React.ReactNode;
}

export function Donut({
  slices,
  size = 150,
  thickness = 22,
  trackColor = "#eef0f6",
  center,
}: Props) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = size / 2 - thickness / 2;
  const c = 2 * Math.PI * r;

  // Compute cumulative offsets so each slice starts where the previous ended.
  let cumulative = 0;

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      <Svg width={size} height={size}>
        {/* Rotate -90° so slices begin at 12 o'clock instead of 3. */}
        <G rotation="-90" originX={size / 2} originY={size / 2}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          {slices.map((s, i) => {
            const frac = s.value / total;
            const dash = c * frac;
            const offset = -(cumulative * c);
            cumulative += frac;
            return (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
              />
            );
          })}
        </G>
      </Svg>
      {center ? (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {center}
        </View>
      ) : null}
    </View>
  );
}
