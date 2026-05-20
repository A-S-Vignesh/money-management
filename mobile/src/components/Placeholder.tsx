// Placeholder — used by tabs that haven't been built out yet (Transactions,
// Budgets, Investments). Visually consistent with the rest of the app so it
// looks intentional, not unfinished.

import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type LucideIcon, Sparkles } from "lucide-react-native";

import { Card } from "@/components/ui/Card";
import { IconTile } from "@/components/ui/IconTile";
import { ScreenHead } from "@/components/ui/ScreenHead";
import { type Tone } from "@/lib/design";

interface Props {
  title: string;
  subtitle?: string;
  Icon?: LucideIcon;
  tone?: Tone;
}

export function Placeholder({
  title,
  subtitle = "Coming next — the rest of the UI is being built.",
  Icon = Sparkles,
  tone = "brand",
}: Props) {
  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1 bg-surface-muted dark:bg-surface-dark-elev"
    >
      <View style={{ paddingHorizontal: 16, flex: 1, paddingBottom: 140 }}>
        <ScreenHead title={title} subtitle="In progress" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Card style={{ padding: 28, width: "100%", alignItems: "center" }}>
            <IconTile Icon={Icon} tone={tone} size="lg" style={{ marginBottom: 16 }} />
            <Text
              className="text-fg dark:text-fg-dark text-[18px] font-bold tracking-tight"
              style={{ marginBottom: 6, textAlign: "center" }}
            >
              {title} is on the way
            </Text>
            <Text
              className="text-fg-muted dark:text-fg-dark-muted text-[13px]"
              style={{ textAlign: "center", lineHeight: 19 }}
            >
              {subtitle}
            </Text>
          </Card>
        </View>
      </View>
    </SafeAreaView>
  );
}
