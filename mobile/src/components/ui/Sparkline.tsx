// components/ui/Sparkline.tsx
// Tiny inline line chart for hero cards. Pure react-native-svg — no chart
// library, no gradients, no native modules. Renders the daily net flow
// trend so the user gets a "this month's shape" at a glance.

import { View } from "react-native";
import Svg, { Polyline, Defs, LinearGradient, Stop } from "react-native-svg";

interface Props {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  /** Gradient ID is required if you want the soft fill under the line. */
  gradientId?: string;
  gradientColor?: string;
}

export function Sparkline({
  values,
  width = 120,
  height = 36,
  stroke = "#ffffff",
  gradientId,
  gradientColor,
}: Props) {
  if (values.length < 2) return <View style={{ width, height }} />;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      // Invert Y because SVG origin is top-left.
      const y = height - ((v - min) / span) * height;
      return `${x},${y.toFixed(2)}`;
    })
    .join(" ");

  // Build a closed polygon for the fill underneath (line → right edge → left edge).
  const fillPoints = `${points} ${width},${height} 0,${height}`;
  const useGradient = !!gradientId && !!gradientColor;

  return (
    <Svg width={width} height={height}>
      {useGradient && (
        <Defs>
          <LinearGradient id={gradientId!} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={gradientColor!} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={gradientColor!} stopOpacity="0" />
          </LinearGradient>
        </Defs>
      )}
      {useGradient && (
        <Polyline
          points={fillPoints}
          fill={`url(#${gradientId!})`}
          stroke="none"
        />
      )}
      <Polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
