// app/(tabs)/profile.tsx — minimal profile + theme picker + sign out.
// Stub for now; full profile editing will mirror the web's ProfilePage.

import { Pressable, Text, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogOut, Moon, Sun, Monitor } from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useTheme, type ThemePref } from "@/lib/theme";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const pref = useTheme((s) => s.pref);
  const setPref = useTheme((s) => s.setPref);

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-950" edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 mb-4">
          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Signed in as
          </Text>
          <Text className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {user?.name ?? "Unknown"}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400">
            {user?.email}
          </Text>
        </View>

        <Text className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 mb-2">
          Appearance
        </Text>
        <View className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-3 mb-6 flex-row gap-2">
          {(
            [
              { value: "system", label: "System", Icon: Monitor },
              { value: "light", label: "Light", Icon: Sun },
              { value: "dark", label: "Dark", Icon: Moon },
            ] as const
          ).map(({ value, label, Icon }) => {
            const active = pref === value;
            return (
              <Pressable
                key={value}
                onPress={() => setPref(value as ThemePref)}
                className={`flex-1 py-3 rounded-xl items-center ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500"
                    : "border border-gray-200 dark:border-gray-700"
                }`}
              >
                <Icon size={18} color={active ? "#4f46e5" : "#6b7280"} />
                <Text
                  className={`text-xs font-medium mt-1 ${
                    active
                      ? "text-indigo-700 dark:text-indigo-300"
                      : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          onPress={async () => {
            await signOut();
            router.replace("/(auth)/login");
          }}
          className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/50 p-4 flex-row items-center active:opacity-70"
        >
          <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center mr-3">
            <LogOut size={18} color="#dc2626" />
          </View>
          <Text className="text-red-600 dark:text-red-300 font-semibold">
            Sign Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
