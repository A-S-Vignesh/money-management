// components/ui/Money.tsx
// Currency display with tabular-number font feature so digits align in
// columns. Subtle thing but it's the difference between "app" and "polished
// financial app" — every fintech in production uses it.

import { Text, type TextStyle, type TextProps } from "react-native";
import { formatCurrency } from "@/lib/format";

interface Props extends Omit<TextProps, "children"> {
  value: number;
  /** Force a leading +/- regardless of sign — useful in transaction rows. */
  prefix?: "" | "+" | "-";
  className?: string;
  style?: TextStyle;
}

export function Money({ value, prefix = "", className, style, ...rest }: Props) {
  return (
    <Text
      className={className}
      style={[
        {
          // Lining + tabular figures: digits same width, top-aligned baseline.
          fontVariant: ["tabular-nums"],
          letterSpacing: -0.2,
        },
        style,
      ]}
      {...rest}
    >
      {prefix}
      {formatCurrency(value)}
    </Text>
  );
}
