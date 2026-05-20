// Keypad — 4x3 numeric keypad used by the AddTransaction sheet to update
// the amount string. Pure RN; no native dep. Matches the Mobile UI mock's
// behavior: max 8 chars, single decimal, delete on '⌫'.

import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Delete } from "lucide-react-native";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  value: string;
  onChange: (next: string) => void;
  /** Max characters allowed in the amount string. */
  maxLength?: number;
}

const KEYS: Array<string | "del"> = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  ".",
  "0",
  "del",
];

export function Keypad({ value, onChange, maxLength = 8 }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const press = (k: string | "del") => {
    if (k === "del") return onChange(value.slice(0, -1));
    if (k === "." && value.includes(".")) return;
    if (value.length >= maxLength) return;
    // Prevent leading zeros like "01"
    if (k !== "." && value === "0") return onChange(k);
    onChange(value + k);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        marginHorizontal: -4,
      }}
    >
      {KEYS.map((k, i) => (
        <View
          key={i}
          style={{
            width: "33.3333%",
            paddingHorizontal: 4,
            paddingVertical: 4,
          }}
        >
          <Pressable
            onPress={() => press(k)}
            android_ripple={{
              color: dark ? Tokens.borderDark : Tokens.bgElev,
            }}
            // Flat style — function-style is dropped by NativeWind's
            // Pressable wrapper, leaving keys as bare numbers with no
            // button shape. Press feedback via android_ripple.
            style={{
              height: 56,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: dark ? Tokens.cardSoftDark : Tokens.cardSoft,
              borderWidth: 1,
              borderColor: dark ? Tokens.borderDark : Tokens.border,
              overflow: "hidden",
            }}
          >
            {k === "del" ? (
              <Delete
                size={20}
                color={dark ? Tokens.textDarkPrimary : Tokens.text}
                strokeWidth={2}
              />
            ) : (
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: dark ? Tokens.textDarkPrimary : Tokens.text,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {k}
              </Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
