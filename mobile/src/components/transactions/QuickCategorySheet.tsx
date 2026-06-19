// components/transactions/QuickCategorySheet.tsx
// Small bottom sheet triggered by the right-swipe "Categorize" action on
// SwipeableTxRow. Lets the user move a transaction to a different
// category in two taps — useful for rapid clean-up of miscategorised
// imports without opening the full edit sheet.

import { Pressable, Text, View } from "react-native";
import { Check } from "lucide-react-native";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Tokens } from "@/lib/design";
import { useColorScheme } from "@/hooks/useAppColorScheme";
import { hapticSelection } from "@/lib/haptics";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { getCategoryPalette } from "@/_shared";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
} from "@/lib/transactionCategories";
import {
  useUpdateTransaction,
  type TransactionDoc,
} from "@/hooks/useTransactions";

interface Props {
  visible: boolean;
  onClose: () => void;
  transaction: TransactionDoc | null;
}

export function QuickCategorySheet({ visible, onClose, transaction }: Props) {
  const dark = useColorScheme() === "dark";

  // Hook must be unconditional, so we always call it; the mutation key is
  // an empty string when no transaction is selected (which means the
  // sheet is invisible anyway — the mutation never fires in that state).
  const updateMut = useUpdateTransaction(transaction?._id ?? "");

  // Transfers don't have meaningful categories — they're always
  // "Transfer" — so the right-swipe action is hidden on transfer rows.
  // Defensive fallback in case it's reached anyway.
  const categories =
    transaction?.type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSelect = (cat: string) => {
    if (!transaction || cat === transaction.category) {
      onClose();
      return;
    }
    hapticSelection();
    updateMut.mutate(
      { category: cat },
      { onSettled: onClose },
    );
  };

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
        Move to category
      </Text>
      {transaction ? (
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12.5,
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
            marginBottom: 14,
          }}
        >
          {transaction.description}
        </Text>
      ) : null}

      <View style={{ gap: 6 }}>
        {categories.map((c) => {
          const Icon = getCategoryIcon(c);
          const palette = getCategoryPalette(c);
          const selected = transaction?.category === c;
          return (
            <Pressable
              key={c}
              onPress={() => handleSelect(c)}
              android_ripple={{
                color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
              }}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 6,
                paddingVertical: 12,
                borderRadius: 12,
              }}
            >
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
              <Text
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  fontWeight: "600",
                  color: dark ? Tokens.textDarkPrimary : Tokens.text,
                  letterSpacing: -0.1,
                }}
              >
                {c}
              </Text>
              {selected ? (
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 99,
                    backgroundColor: `${Tokens.brand}20`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={13} color={Tokens.brand} strokeWidth={2.5} />
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}
