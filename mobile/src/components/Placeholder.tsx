// Placeholder for tabs not yet implemented. Keeps the navigator working and
// signals to the user that the screen is intentionally empty.

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export function Placeholder({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 text-center">
          {subtitle}
        </Text>
      </View>
    </SafeAreaView>
  );
}
