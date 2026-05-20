// DateStrip — "Today" + "Yesterday" chips plus a calendar button (opens the
// native Android date picker so the user can pick ANY past month) plus a
// 7-day strip ending today. Selected date is highlighted with the brand
// color. Returns ISO YYYY-MM-DD.

import { useState } from "react";
import { Pressable, Text, View, useColorScheme } from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Calendar } from "lucide-react-native";
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
  const [pickerOpen, setPickerOpen] = useState(false);

  const today = isoToday();
  const yesterday = isoYesterday();
  const isQuickPick = value === today || value === yesterday;

  // 7-day strip that always contains the selected date.
  // Ideally we centre the selected day, but we clamp the right edge at
  // today so we never show future dates. So:
  //   - today selected      → [today-6 … today]
  //   - Mar 12 selected     → [Mar 9 … Mar 15]   (selected sits in middle)
  //   - 3 days ago selected → [today-6 … today]  (clamped)
  const selected = dayjs(value);
  const todayDay = dayjs().startOf("day");
  const idealEnd = selected.add(3, "day");
  const stripEnd = idealEnd.isAfter(todayDay) ? todayDay : idealEnd;
  const days = Array.from({ length: 7 }, (_, i) =>
    stripEnd.subtract(6 - i, "day"),
  );

  // Display the picked date in the calendar pill — for Today/Yesterday show
  // those words; otherwise show "DD MMM YYYY" so the user can confirm what's
  // selected without scrolling the day strip.
  const calendarLabel = isQuickPick
    ? dayjs(value).format("DD MMM YYYY")
    : dayjs(value).format("DD MMM YYYY");

  const onPickerChange = (event: DateTimePickerEvent, picked?: Date) => {
    // On Android the picker dismisses on its own — close our flag either way.
    setPickerOpen(false);
    if (event.type === "set" && picked) {
      onChange(dayjs(picked).format("YYYY-MM-DD"));
    }
  };

  return (
    <View>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase mb-2"
        style={{ letterSpacing: 0.5 }}
      >
        Date
      </Text>

      {/* Quick chips + calendar picker */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10, alignItems: "center" }}>
        {[
          { label: "Today", iso: today },
          { label: "Yesterday", iso: yesterday },
        ].map((p) => {
          const active = value === p.iso;
          return (
            <Pressable
              key={p.label}
              onPress={() => onChange(p.iso)}
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
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
                overflow: "hidden",
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

        {/* Calendar pill — tap to open native date picker for any past month. */}
        <Pressable
          onPress={() => setPickerOpen(true)}
          android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            paddingHorizontal: 10,
            height: 32,
            borderRadius: 999,
            backgroundColor: !isQuickPick
              ? dark
                ? Tokens.brandSoft + "" // light fallback unused
                : Tokens.brandSoft
              : dark
                ? Tokens.cardSoftDark
                : Tokens.card,
            borderWidth: 1,
            borderColor: !isQuickPick
              ? Tokens.brand
              : dark
                ? Tokens.borderDark
                : Tokens.border,
            overflow: "hidden",
          }}
        >
          <Calendar
            size={13}
            color={!isQuickPick ? Tokens.brand : dark ? Tokens.textMutedDark : Tokens.textMuted}
            strokeWidth={2.2}
          />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: !isQuickPick
                ? Tokens.brand
                : dark
                  ? Tokens.textMutedDark
                  : Tokens.textMuted,
              fontVariant: ["tabular-nums"],
            }}
          >
            {calendarLabel}
          </Text>
        </Pressable>
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
              android_ripple={{ color: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}
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
                overflow: "hidden",
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

      {/* Native Android date picker — opens as a modal dialog when the
          calendar pill is tapped. Max date is today (can't log future txns). */}
      {pickerOpen ? (
        <DateTimePicker
          value={dayjs(value).toDate()}
          mode="date"
          maximumDate={new Date()}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}
