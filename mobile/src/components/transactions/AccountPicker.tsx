// AccountPicker — horizontal card rail of accounts to choose from. Used
// for single-account selection (income/expense) and inside the transfer
// "From → To" pair.

import {
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import {
  Banknote,
  CreditCard,
  Wallet,
  type LucideIcon,
} from "lucide-react-native";

import { formatCurrency } from "@/lib/format";
import { Tokens } from "@/lib/design";
import { type AccountDoc } from "@/hooks/useAccounts";
import { useColorScheme } from "@/hooks/useAppColorScheme";

function iconForType(type: AccountDoc["type"]): LucideIcon {
  if (type === "cash") return Banknote;
  if (type === "investment") return Wallet;
  return CreditCard;
}

interface Props {
  label?: string;
  value?: string;
  onChange: (id: string) => void;
  accounts: AccountDoc[];
  /** Optional account id to exclude (used by transfer to avoid same-account selection). */
  excludeId?: string;
}

export function AccountPicker({
  label,
  value,
  onChange,
  accounts,
  excludeId,
}: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  // Filter out system + soft-deleted accounts (and the explicit exclude).
  const items = accounts.filter(
    (a) =>
      !a.isSystem &&
      !a.isDeleted &&
      a._id !== excludeId &&
      a.name !== "Deleted Account",
  );

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text
          className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase"
          style={{ letterSpacing: 0.5 }}
        >
          {label}
        </Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {items.map((a) => {
          const Icon = iconForType(a.type);
          const active = value === a._id;
          return (
            <Pressable
              key={a._id}
              onPress={() => onChange(a._id)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 14,
                backgroundColor: active
                  ? Tokens.brandSoft
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1.5,
                borderColor: active
                  ? Tokens.brand
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
                minWidth: 140,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: active
                    ? "rgba(37,99,235,0.16)"
                    : dark
                      ? Tokens.bgElevDark
                      : Tokens.bgElev,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon
                  size={13}
                  color={active ? Tokens.brand : dark ? Tokens.textMutedDark : Tokens.textMuted}
                  strokeWidth={2.2}
                />
              </View>
              <View style={{ minWidth: 0 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    fontWeight: "600",
                    color: active
                      ? Tokens.brand
                      : dark
                        ? Tokens.textDarkPrimary
                        : Tokens.text,
                    maxWidth: 140,
                  }}
                >
                  {a.name}
                </Text>
                <Text
                  style={{
                    fontSize: 10.5,
                    color: dark ? Tokens.textMutedDark : Tokens.textMuted,
                    marginTop: 1,
                    fontVariant: ["tabular-nums"],
                  }}
                >
                  {formatCurrency(a.balance, { compact: true })}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {items.length === 0 ? (
          <View
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderStyle: "dashed",
              borderColor: dark ? Tokens.borderDark : Tokens.borderStrong,
            }}
          >
            <Text className="text-fg-muted dark:text-fg-dark-muted text-[12px]">
              No accounts yet
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
