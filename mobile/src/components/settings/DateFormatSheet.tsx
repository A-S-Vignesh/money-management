// components/settings/DateFormatSheet.tsx
// Bottom sheet that lets the user pick their preferred date format.
// Persists to the Zustand date-format store and closes on selection.
//
// Each row shows: format-shape label (DD MMM YYYY) + a live preview
// rendered with today's date so the user can see what they'll get
// without leaving Settings. Mirrors CurrencySheet visually.

import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";
import dayjs from "dayjs";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";
import { hapticSelection } from "@/lib/haptics";
import { DATE_FORMATS, useDateFormat } from "@/lib/dateFormat";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DateFormatSheet({ visible, onClose }: Props) {
  const dark = useColorScheme() === "dark";
  const currentCode = useDateFormat((s) => s.code);
  const setCode = useDateFormat((s) => s.setCode);

  const today = dayjs();

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeightFraction={0.55}>
      <Text
        style={{
          fontSize: 17,
          fontWeight: "800",
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
          letterSpacing: -0.3,
          marginBottom: 4,
        }}
      >
        Date format
      </Text>
      <Text
        style={{
          fontSize: 12.5,
          color: dark ? Tokens.textMutedDark : Tokens.textMuted,
          marginBottom: 14,
        }}
      >
        Used across transactions, reports, and exports.
      </Text>

      {/* Plain map (not FlatList) — small static list, nesting a
          VirtualizedList inside BottomSheet's internal ScrollView trips
          a runtime warning. Same pattern as CurrencySheet. */}
      <View>
        {DATE_FORMATS.map((f) => {
          const selected = f.code === currentCode;
          return (
            <Pressable
              key={f.code}
              onPress={() => {
                hapticSelection();
                setCode(f.code);
                onClose();
              }}
              android_ripple={{
                color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                paddingVertical: 14,
                paddingHorizontal: 4,
                borderBottomWidth: 1,
                borderBottomColor: dark ? Tokens.borderDark : Tokens.border,
              }}
            >
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
                  {f.name}
                </Text>
                <Text
                  style={{
                    fontSize: 11.5,
                    color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                    marginTop: 2,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {today.format(f.sampleFormat)}
                </Text>
              </View>

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
