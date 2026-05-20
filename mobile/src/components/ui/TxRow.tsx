// TxRow — the transaction list row used on Dashboard "Recent activity" and
// on the Transactions tab. Matches the design exactly:
//   [IconTile] {description}                  {±₹amt}
//              {category • date}
// The amount color is emerald/rose/blue based on income/expense/transfer.

import {
  Pressable,
  Text,
  View,
} from "react-native";
import { Repeat } from "lucide-react-native";
import dayjs from "dayjs";

import { getCategoryPalette } from "@money-nest/shared";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Money } from "./Money";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Tx {
  _id?: string;
  id?: string;
  description?: string;
  desc?: string;
  category: string;
  /** Either `amount` (mobile API) or `amt` (mock). */
  amount?: number;
  amt?: number;
  type: "income" | "expense" | "transfer";
  date: string;
  recurring?: boolean;
}

interface Props {
  tx: Tx;
  onPress?: () => void;
  last?: boolean;
}

export function TxRow({ tx, onPress, last }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  const desc = tx.description ?? tx.desc ?? "";
  const amt = tx.amount ?? tx.amt ?? 0;
  const palette = getCategoryPalette(tx.category);
  const Icon = getCategoryIcon(tx.category);
  const sign = tx.type === "income" ? "+" : tx.type === "expense" ? "-" : "";
  const amtColorClass =
    tx.type === "income"
      ? "text-emerald"
      : tx.type === "expense"
        ? "text-rose"
        : "text-brand";

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
      }}
      className="border-edge dark:border-edge-dark active:opacity-70"
    >
      {/* Category icon tile — Lucide icon on a category-colored bg.
          Matches the Mobile UI mock 1:1. */}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: dark ? palette.bgDark : palette.bgLight,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          size={18}
          color={dark ? palette.textDark : palette.textLight}
          strokeWidth={2}
        />
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          numberOfLines={1}
          className="text-fg dark:text-fg-dark text-[14px] font-semibold"
          style={{ letterSpacing: -0.1 }}
        >
          {desc}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            marginTop: 2,
          }}
        >
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px]">
            {tx.category}
          </Text>
          <View
            style={{
              width: 2,
              height: 2,
              borderRadius: 99,
              backgroundColor: "#8a90a0",
            }}
          />
          <Text className="text-fg-muted dark:text-fg-dark-muted text-[11.5px]">
            {dayjs(tx.date).format("D MMM")}
          </Text>
          {tx.recurring ? (
            <>
              <View
                style={{
                  width: 2,
                  height: 2,
                  borderRadius: 99,
                  backgroundColor: "#8a90a0",
                }}
              />
              <Repeat size={11} color="#8a90a0" strokeWidth={2.2} />
            </>
          ) : null}
        </View>
      </View>

      <Money
        value={amt}
        prefix={sign as "" | "+" | "-"}
        className={`text-[14.5px] font-bold ${amtColorClass}`}
      />
    </Pressable>
  );
}
