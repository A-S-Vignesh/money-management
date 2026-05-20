// LineChart — smooth (quadratic) area-fill line chart in pure SVG.
// Used on Reports → Net worth trend. Mirrors the Mobile UI mock's bezier
// smoothing so the curve doesn't look jagged on small mobile widths.

import { Text, View } from "react-native";
import Svg, { Defs, LinearGradient, Line, Path, Stop, Circle } from "react-native-svg";

interface Props {
  values: number[];
  width: number;
  height?: number;
  stroke?: string;
  /** Fill color for the gradient under the line. */
  fill?: string;
  /** X-axis labels (rendered below the SVG; spaced evenly). */
  labels?: string[];
  /** Number of horizontal grid lines (excluding top/bottom edges). */
  gridLines?: number;
}

export function LineChart({
  values,
  width,
  height = 140,
  stroke = "#2563eb",
  fill,
  labels,
  gridLines = 3,
}: Props) {
  if (values.length < 2) {
    return (
      <View style={{ width, height }}>
        <Text className="text-fg-dim dark:text-fg-dark-dim text-[12px] text-center">
          Not enough data yet.
        </Text>
      </View>
    );
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padX = 10;
  const padY = 14;
  const w = width - padX * 2;
  const h = height - padY * 2;
  const stepX = w / (values.length - 1);

  const pts = values.map((v, i): [number, number] => {
    const x = padX + i * stepX;
    const y = padY + (1 - (v - min) / range) * h;
    return [x, y];
  });

  // Quadratic-bezier smoothing (T command continues control point of previous Q).
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1];
    const [x2, y2] = pts[i];
    const cx = (x1 + x2) / 2;
    d += ` Q ${cx} ${y1} ${cx} ${(y1 + y2) / 2} T ${x2} ${y2}`;
  }

  const fillColor = fill ?? stroke;
  const fillD = `${d} L ${pts[pts.length - 1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  const lastPt = pts[pts.length - 1];

  return (
    <View>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="lc" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={fillColor} stopOpacity={0.25} />
            <Stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        {/* Horizontal grid */}
        {Array.from({ length: gridLines }).map((_, i) => {
          const t = (i + 1) / (gridLines + 1);
          const y = padY + h * t;
          return (
            <Line
              key={i}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="#ececf2"
              strokeWidth={1}
              strokeDasharray="3 4"
            />
          );
        })}
        <Path d={fillD} fill="url(#lc)" />
        <Path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* End-of-line dot — common in fintech line charts to call out the latest value. */}
        <Circle cx={lastPt[0]} cy={lastPt[1]} r={4} fill={stroke} />
      </Svg>
      {labels ? (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: 12,
            paddingTop: 4,
          }}
        >
          {labels.map((l, i) => (
            <Text
              key={i}
              className="text-fg-dim dark:text-fg-dark-dim text-[10px] font-semibold"
            >
              {l}
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
