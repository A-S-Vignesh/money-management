// app/(tabs)/profile.tsx — Profile + Appearance + Sign out
// Matches the Mobile UI mock's "header card with avatar bubble + name + email
// + plan pill", quick stats row, and settings rows.

import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Edit,
  LogOut,
  Monitor,
  Moon,
  Sun,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useTheme, type ThemePref } from "@/lib/theme";
import { Tokens } from "@/lib/design";

import { Card } from "@/components/ui/Card";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { Section } from "@/components/ui/Section";

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const pref = useTheme((s) => s.pref);
  const setPref = useTheme((s) => s.setPref);

  const initials = (user?.name ?? "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHead title="Profile" />

        {/* Header card — avatar bubble + name + email */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 99,
                backgroundColor: Tokens.brand,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: Tokens.brand,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 14,
                elevation: 6,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: "700",
                  letterSpacing: -0.6,
                }}
              >
                {initials || "U"}
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text
                numberOfLines={1}
                className="text-fg dark:text-fg-dark text-[18px] font-bold tracking-tight"
              >
                {user?.name ?? "—"}
              </Text>
              <Text
                numberOfLines={1}
                className="text-fg-muted dark:text-fg-dark-muted text-[12.5px] mt-0.5"
              >
                {user?.email ?? ""}
              </Text>
              <View
                style={{
                  marginTop: 8,
                  alignSelf: "flex-start",
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 99,
                  backgroundColor: Tokens.brandSoft,
                }}
              >
                <Text
                  style={{
                    color: Tokens.brand,
                    fontSize: 10.5,
                    fontWeight: "800",
                    letterSpacing: 0.4,
                  }}
                >
                  FREE PLAN
                </Text>
              </View>
            </View>
            <Pressable
              className="bg-surface-subtle dark:bg-surface-dark-subtle border border-edge dark:border-edge-dark"
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Edit size={16} color={Tokens.text} strokeWidth={2} />
            </Pressable>
          </View>
        </Card>

        {/* Appearance — System / Light / Dark */}
        <Section title="Appearance">
          <Card
            style={{
              padding: 12,
              flexDirection: "row",
              gap: 8,
            }}
          >
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
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    alignItems: "center",
                    backgroundColor: active ? Tokens.brandSoft : "transparent",
                    borderWidth: 1,
                    borderColor: active ? Tokens.brand : Tokens.border,
                  }}
                >
                  <Icon
                    size={18}
                    color={active ? Tokens.brand : Tokens.textMuted}
                    strokeWidth={2}
                  />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "600",
                      marginTop: 4,
                      color: active ? Tokens.brand : Tokens.text,
                    }}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </Card>
        </Section>

        {/* Sign out */}
        <Section title=" ">
          <Pressable
            onPress={async () => {
              await signOut();
              router.replace("/(auth)/login");
            }}
            className="bg-surface dark:bg-surface-dark border border-rose/30 dark:border-rose/30"
            style={{
              borderRadius: 18,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 14,
                backgroundColor: Tokens.roseBg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={18} color={Tokens.rose} strokeWidth={2} />
            </View>
            <Text className="text-rose text-[14px] font-semibold">Sign out</Text>
          </Pressable>
        </Section>

        <Text className="text-fg-dim dark:text-fg-dark-dim text-[11px] text-center mt-3">
          Money Nest · v0.1.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
