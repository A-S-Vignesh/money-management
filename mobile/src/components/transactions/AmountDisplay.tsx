// AmountDisplay — huge tabular-num amount with leading ₹.
// Used in the AddTransaction sheet above the numeric keypad.

import { Text, View } from "react-native";

interface Props {
  /** String form so we can show partial entry like "1." or empty as "0". */
  amount: string;
}

export function AmountDisplay({ amount }: Props) {
  const empty = !amount;
  return (
    <View style={{ alignItems: "center", paddingVertical: 8, marginBottom: 14 }}>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
        style={{ letterSpacing: 1.2 }}
      >
        Amount
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 6,
        }}
      >
        <Text
          className="text-fg-muted dark:text-fg-dark-muted"
          style={{ fontSize: 24, fontWeight: "500" }}
        >
          ₹
        </Text>
        <Text
          className={
            empty
              ? "text-fg-dim dark:text-fg-dark-dim"
              : "text-fg dark:text-fg-dark"
          }
          style={{
            fontSize: 42,
            fontWeight: "700",
            letterSpacing: -1.5,
            fontVariant: ["tabular-nums"],
            marginLeft: 2,
          }}
        >
          {empty ? "0" : amount}
        </Text>
      </View>
    </View>
  );
}
