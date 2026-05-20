// TypeSegment — expense / income / transfer segmented control inside the
// AddTransaction sheet. Mirrors the design's `.bg-elev` track + raised
// active pill with shadow.

import { Pressable, Text, View, useColorScheme } from "react-native";
import { Tokens } from "@/lib/design";

export type TxType = "expense" | "income" | "transfer";

interface Props {
  value: TxType;
  onChange: (next: TxType) => void;
  /** Some flows force the type and shouldn't let the user change it (edit). */
  disabled?: boolean;
}

const OPTS: { id: TxType; label: string }[] = [
  { id: "expense", label: "Expense" },
  { id: "income", label: "Income" },
  { id: "transfer", label: "Transfer" },
];

export function TypeSegment({ value, onChange, disabled }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return (
    <View
      style={{
        flexDirection: "row",
        padding: 4,
        backgroundColor: dark ? Tokens.bgElevDark : Tokens.bgElev,
        borderRadius: 12,
        marginBottom: 18,
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {OPTS.map((o) => {
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            disabled={disabled}
            onPress={() => onChange(o.id)}
            style={{
              flex: 1,
              paddingVertical: 10,
              alignItems: "center",
              borderRadius: 9,
              backgroundColor: active
                ? dark
                  ? Tokens.cardDark
                  : Tokens.card
                : "transparent",
              shadowColor: "#000",
              shadowOpacity: active ? 0.08 : 0,
              shadowRadius: 3,
              shadowOffset: { width: 0, height: 1 },
              elevation: active ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: active
                  ? dark
                    ? Tokens.textDarkPrimary
                    : Tokens.text
                  : dark
                    ? Tokens.textMutedDark
                    : Tokens.textMuted,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
