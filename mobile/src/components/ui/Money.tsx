// components/ui/Money.tsx
// Currency display with tabular-number font feature so digits align in
// columns. Subtle thing but it's the difference between "app" and "polished
// financial app" — every fintech in production uses it.

import { Text, type TextStyle, type TextProps } from "react-native";
import { formatCurrency } from "@/lib/format";
import { useCurrency } from "@/lib/currency";

interface Props extends Omit<TextProps, "children"> {
  value: number;
  /** Force a leading +/- regardless of sign — useful in transaction rows. */
  prefix?: "" | "+" | "-";
  className?: string;
  style?: TextStyle;
}

export function Money({ value, prefix = "", className, style, ...rest }: Props) {
  // Subscribe to the active currency so a Settings → Currency change
  // re-renders every <Money /> in the tree immediately. formatCurrency
  // itself reads the store via getState() (non-reactive), so without this
  // subscription the screen would still show the old symbol/locale until
  // some other state change forced a re-render.
  useCurrency((s) => s.code);
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
