// DateStrip — "Today" + "Yesterday" chips plus a 7-day strip ending today.
// Selected date is highlighted with the brand color. Returns ISO YYYY-MM-DD.

import { Pressable, Text, View, useColorScheme } from "react-native";
import dayjs from "dayjs";
import { Tokens } from "@/lib/design";

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (next: string) => void;
}

function isoToday(): string {
  return dayjs().format("YYYY-MM-DD");
}
function isoYesterday(): string {
  return dayjs().subtract(1, "day").format("YYYY-MM-DD");
}

export function DateStrip({ value, onChange }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";

  const today = isoToday();
  const yesterday = isoYesterday();

  // 7-day strip ending today.
  const days = Array.from({ length: 7 }, (_, i) =>
    dayjs().subtract(6 - i, "day"),
  );

  return (
    <View>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase mb-2"
        style={{ letterSpacing: 0.5 }}
      >
        Date
      </Text>

      {/* Quick chips */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
        {[
          { label: "Today", iso: today },
          { label: "Yesterday", iso: yesterday },
        ].map((p) => {
          const active = value === p.iso;
          return (
            <Pressable
              key={p.label}
              onPress={() => onChange(p.iso)}
              style={{
                paddingHorizontal: 12,
                height: 32,
                borderRadius: 999,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active
                  ? dark
                    ? Tokens.textDarkPrimary
                    : Tokens.text
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1,
                borderColor: active
                  ? dark
                    ? Tokens.textDarkPrimary
                    : Tokens.text
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: active
                    ? dark
                      ? Tokens.text
                      : Tokens.card
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted,
                }}
              >
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 7-day strip */}
      <View style={{ flexDirection: "row", gap: 6 }}>
        {days.map((d) => {
          const iso = d.format("YYYY-MM-DD");
          const active = value === iso;
          const isToday = iso === today;
          return (
            <Pressable
              key={iso}
              onPress={() => onChange(iso)}
              style={{
                flex: 1,
                paddingVertical: 8,
                borderRadius: 12,
                alignItems: "center",
                backgroundColor: active
                  ? Tokens.brand
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1,
                borderColor: active
                  ? Tokens.brand
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
                position: "relative",
              }}
            >
              <Text
                style={{
                  fontSize: 9.5,
                  fontWeight: "700",
                  opacity: active ? 0.85 : 0.6,
                  letterSpacing: 0.5,
                  color: active ? "#fff" : dark ? Tokens.textDarkPrimary : Tokens.text,
                }}
              >
                {d.format("dd").charAt(0).toUpperCase()}
              </Text>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "700",
                  marginTop: 2,
                  color: active ? "#fff" : dark ? Tokens.textDarkPrimary : Tokens.text,
                  fontVariant: ["tabular-nums"],
                }}
              >
                {d.format("D")}
              </Text>
              {isToday && !active ? (
                <View
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: "50%",
                    transform: [{ translateX: -2 }],
                    width: 4,
                    height: 4,
                    borderRadius: 99,
                    backgroundColor: Tokens.brand,
                  }}
                />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
