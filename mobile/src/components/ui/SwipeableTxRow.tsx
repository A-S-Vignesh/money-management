// components/ui/SwipeableTxRow.tsx
// Wraps TxRow with two swipe gestures:
//   - swipe-LEFT (reveals on right side) → red Delete button
//   - swipe-RIGHT (reveals on left side) → brand-blue Categorize button
//     that opens a quick category-picker sheet (expense/income only;
//     transfers don't have a meaningful category beyond "Transfer").
//
// Uses react-native-gesture-handler's ReanimatedSwipeable — already
// installed for expo-router back-gesture navigation.

import { useRef, useState } from "react";
import { Alert, Text } from "react-native";
import { RectButton } from "react-native-gesture-handler";
import Swipeable, {
  type SwipeableMethods,
} from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { FolderInput, Trash2 } from "lucide-react-native";

import { TxRow } from "./TxRow";
import {
  useDeleteTransaction,
  type TransactionDoc,
} from "@/hooks/useTransactions";
import { hapticHeavy, hapticLight } from "@/lib/haptics";
import { Tokens } from "@/lib/design";
import { QuickCategorySheet } from "@/components/transactions/QuickCategorySheet";

interface Props {
  tx: TransactionDoc;
  last?: boolean;
  onPress?: () => void;
}

// ── Action renderers ────────────────────────────────────────────────────
// `drag.value` runs negative for a left swipe (right action revealed) and
// positive for a right swipe (left action revealed). We anchor each
// action's translateX so it reveals at the edge of the row as the user
// drags, matching native iOS list-row swipe physics.

function DeleteAction(
  _prog: SharedValue<number>,
  drag: SharedValue<number>,
  onDelete: () => void,
) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));
  return (
    <Animated.View style={[{ width: 80 }, animStyle]}>
      <RectButton
        onPress={onDelete}
        style={{
          flex: 1,
          backgroundColor: Tokens.rose,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Trash2 size={18} color="#fff" strokeWidth={2.2} />
        <Text
          style={{
            color: "#fff",
            fontSize: 10.5,
            fontWeight: "700",
            marginTop: 4,
            letterSpacing: 0.2,
          }}
        >
          Delete
        </Text>
      </RectButton>
    </Animated.View>
  );
}

function CategorizeAction(
  _prog: SharedValue<number>,
  drag: SharedValue<number>,
  onPress: () => void,
) {
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value - 88 }],
  }));
  return (
    <Animated.View style={[{ width: 88 }, animStyle]}>
      <RectButton
        onPress={onPress}
        style={{
          flex: 1,
          backgroundColor: Tokens.brand,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <FolderInput size={18} color="#fff" strokeWidth={2.2} />
        <Text
          style={{
            color: "#fff",
            fontSize: 10.5,
            fontWeight: "700",
            marginTop: 4,
            letterSpacing: 0.2,
          }}
        >
          Categorize
        </Text>
      </RectButton>
    </Animated.View>
  );
}

export function SwipeableTxRow({ tx, last, onPress }: Props) {
  const swipeableRef = useRef<SwipeableMethods>(null);
  const { mutate: deleteTx } = useDeleteTransaction();
  const [categorizeOpen, setCategorizeOpen] = useState(false);

  // Transfers have no meaningful category — disable the right-swipe
  // categorize affordance for them.
  const canCategorize = tx.type !== "transfer";

  const handleDelete = () => {
    hapticHeavy();
    swipeableRef.current?.close();
    Alert.alert(
      "Delete transaction?",
      `"${tx.description}" for ₹${tx.amount.toLocaleString()} will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteTx(tx._id),
        },
      ],
    );
  };

  const handleCategorize = () => {
    hapticLight();
    swipeableRef.current?.close();
    setCategorizeOpen(true);
  };

  return (
    <>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        overshootFriction={8}
        leftThreshold={40}
        rightThreshold={40}
        renderRightActions={(prog, drag) =>
          DeleteAction(prog, drag, handleDelete)
        }
        renderLeftActions={
          canCategorize
            ? (prog, drag) => CategorizeAction(prog, drag, handleCategorize)
            : undefined
        }
      >
        <TxRow tx={tx} last={last} onPress={onPress} />
      </Swipeable>

      <QuickCategorySheet
        visible={categorizeOpen}
        onClose={() => setCategorizeOpen(false)}
        transaction={tx}
      />
    </>
  );
}
