// components/settings/CurrencySheet.tsx
// Bottom sheet that lets the user pick their display currency.
// Persists the selection to the Zustand currency store and closes.

import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";
import { hapticSelection } from "@/lib/haptics";
import { CURRENCIES, useCurrency } from "@/lib/currency";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function CurrencySheet({ visible, onClose }: Props) {
  const dark = useColorScheme() === "dark";
  const currentCode = useCurrency((s) => s.code);
  const setCode = useCurrency((s) => s.setCode);

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightFraction={0.6}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          marginBottom: 16,
          letterSpacing: -0.3,
        }}
      >
        Select currency
      </Text>

      {/* Plain map — only ~10 currencies, so virtualization (FlatList)
          would be both unnecessary AND wrong here: nesting a
          VirtualizedList inside BottomSheet's internal ScrollView with
          the same orientation breaks windowing and trips a runtime
          warning. */}
      <View>
        {CURRENCIES.map((c) => {
          const selected = c.code === currentCode;
          return (
            <Pressable
              key={c.code}
              onPress={() => {
                hapticSelection();
                setCode(c.code);
                onClose();
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 13,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
              }}
            >
              {/* Flag emoji */}
              <Text style={{ fontSize: 22 }}>{c.flag}</Text>

              {/* Code + name */}
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                  style={{
                    fontSize: 14.5,
                    fontWeight: "700",
                    color: selected
                      ? Tokens.brand
                      : dark
                        ? Tokens.textDarkPrimary
                        : Tokens.text,
                    letterSpacing: -0.1,
                  }}
                >
                  {c.code}{" "}
                  <Text style={{ fontWeight: "400", fontSize: 13 }}>
                    {c.symbol}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                    marginTop: 1,
                  }}
                >
                  {c.name}
                </Text>
              </View>

              {/* Checkmark */}
              {selected ? (
                <View
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 99,
                    backgroundColor: `${Tokens.brand}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={14} color={Tokens.brand} strokeWidth={2.5} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
