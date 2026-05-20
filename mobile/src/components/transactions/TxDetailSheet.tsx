// TxDetailSheet — view a transaction's full details with Edit + Delete
// affordances. "Edit" closes this sheet and re-opens the AddTransaction
// sheet in edit mode (the parent screen orchestrates the swap).

import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  View,
  useColorScheme,
} from "react-native";
import dayjs from "dayjs";
import { Edit, Trash2 } from "lucide-react-native";

import { getCategoryPalette } from "@money-nest/shared";
import {
  useDeleteTransaction,
  type TransactionDoc,
} from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { Tokens } from "@/lib/design";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { Money } from "@/components/ui/Money";

import { SheetHeader } from "./SheetHeader";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** When set, the sheet pops with this transaction loaded. */
  transaction: TransactionDoc | null;
  /** Called when the user taps Edit — parent swaps to the AddTransaction sheet. */
  onEdit: (tx: TransactionDoc) => void;
}

export function TxDetailSheet({
  visible,
  onClose,
  transaction,
  onEdit,
}: Props) {
  const deleteMut = useDeleteTransaction();
  const [confirming, setConfirming] = useState(false);
  const { data: accounts = [] } = useAccounts();
  const dark = useColorScheme() === "dark";

  if (!transaction) {
    return <BottomSheet visible={visible} onClose={onClose}>{null}</BottomSheet>;
  }

  const palette = getCategoryPalette(transaction.category);
  const CategoryIcon = getCategoryIcon(transaction.category);
  const sign =
    transaction.type === "income" ? "+" : transaction.type === "expense" ? "-" : "";
  const amtColorClass =
    transaction.type === "income"
      ? "text-emerald"
      : transaction.type === "expense"
        ? "text-rose"
        : "text-brand";

  const fromName =
    accounts.find((a) => a._id === transaction.fromAccountId)?.name ?? "—";
  const toName =
    accounts.find((a) => a._id === transaction.toAccountId)?.name ?? "—";

  const confirmDelete = () => {
    Alert.alert(
      "Delete transaction?",
      "This will reverse the balance changes too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setConfirming(true);
              await deleteMut.mutateAsync(transaction._id);
              onClose();
            } catch (err) {
              Alert.alert(
                "Couldn't delete",
                (err as Error).message ?? "Try again.",
              );
            } finally {
              setConfirming(false);
            }
          },
        },
      ],
    );
  };

  const rows: Array<[string, string]> = [
    ["Category", transaction.category],
    ["Date", dayjs(transaction.date).format("ddd, D MMM YYYY")],
    [
      "Type",
      transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
    ],
  ];
  if (transaction.type === "transfer") {
    rows.push(["From", fromName]);
    rows.push(["To", toName]);
  } else if (transaction.type === "income") {
    rows.push(["Deposited to", toName]);
  } else {
    rows.push(["Paid from", fromName]);
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title="Transaction" onClose={onClose} />

      {/* Big amount + icon */}
      <View style={{ alignItems: "center", paddingVertical: 14 }}>
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            backgroundColor: dark ? palette.bgDark : palette.bgLight,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 14,
          }}
        >
          <CategoryIcon
            size={28}
            color={dark ? palette.textDark : palette.textLight}
            strokeWidth={2}
          />
        </View>
        <Money
          value={transaction.amount}
          prefix={sign as "" | "+" | "-"}
          className={`${amtColorClass} text-[38px] font-bold`}
          style={{ letterSpacing: -1.2 }}
        />
        <Text className="text-fg-muted dark:text-fg-dark-muted text-[14px] font-medium mt-1.5">
          {transaction.description || "(no description)"}
        </Text>
      </View>

      {/* Detail rows */}
      <Card style={{ marginBottom: 14, paddingHorizontal: 0, paddingVertical: 0, overflow: "hidden" }}>
        {rows.map(([k, v], i) => (
          <View
            key={k}
            className="border-edge dark:border-edge-dark"
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderTopWidth: i === 0 ? 0 : 1,
            }}
          >
            <Text
              className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] font-medium"
              style={{ flex: 1 }}
            >
              {k}
            </Text>
            <Text
              numberOfLines={1}
              className="text-fg dark:text-fg-dark text-[13px] font-semibold"
              style={{ maxWidth: "60%", textAlign: "right" }}
            >
              {v}
            </Text>
          </View>
        ))}
      </Card>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Pressable
          onPress={() => onEdit(transaction)}
          className="border-edge-strong dark:border-edge-dark-strong"
          style={{
            flex: 1,
            height: 48,
            borderRadius: 14,
            borderWidth: 1,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
        >
          <Edit
            size={15}
            color={dark ? Tokens.textDarkPrimary : Tokens.text}
            strokeWidth={2}
          />
          <Text className="text-fg dark:text-fg-dark text-[14px] font-semibold">
            Edit
          </Text>
        </Pressable>
        <Pressable
          onPress={confirmDelete}
          disabled={confirming}
          style={{
            flex: 1,
            height: 48,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: Tokens.roseSoft,
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
            opacity: confirming ? 0.5 : 1,
          }}
        >
          {confirming ? (
            <ActivityIndicator color={Tokens.rose} />
          ) : (
            <>
              <Trash2 size={15} color={Tokens.rose} strokeWidth={2} />
              <Text
                style={{
                  color: Tokens.rose,
                  fontSize: 14,
                  fontWeight: "600",
                }}
              >
                Delete
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}
