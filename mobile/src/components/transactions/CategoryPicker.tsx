// CategoryPicker — horizontal-scrolling chip rail with icon + label.
// Active state uses the category's own bg/fg from the shared palette so
// the selection feels color-coded.

import { ScrollView, Text, View, Pressable, useColorScheme } from "react-native";
import {
  Briefcase,
  Coffee,
  Home,
  Car,
  Tv,
  Zap,
  ShoppingBag,
  Stethoscope,
  Book,
  Plane,
  Gift,
  TrendingUp,
  Tag,
  type LucideIcon,
} from "lucide-react-native";

import { getCategoryPalette } from "@money-nest/shared";
import { Tokens } from "@/lib/design";

// Map common category names to icons. Falls back to a generic Tag.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Food: Coffee,
  Housing: Home,
  Transport: Car,
  Lifestyle: Tv,
  Entertainment: Tv,
  Utilities: Zap,
  Shopping: ShoppingBag,
  Health: Stethoscope,
  Learning: Book,
  Education: Book,
  Travel: Plane,
  Personal: Gift,
  Salary: Briefcase,
  Freelance: Briefcase,
  Gift: Gift,
  Investment: TrendingUp,
  Transfer: TrendingUp,
  Other: Tag,
};

interface Props {
  value: string;
  onChange: (next: string) => void;
  categories: string[];
}

export function CategoryPicker({ value, onChange, categories }: Props) {
  const scheme = useColorScheme();
  const dark = scheme === "dark";
  return (
    <View>
      <Text
        className="text-fg-muted dark:text-fg-dark-muted text-[10.5px] font-bold uppercase mb-2"
        style={{ letterSpacing: 0.6 }}
      >
        Category
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingRight: 8 }}
      >
        {categories.map((c) => {
          const Icon = CATEGORY_ICONS[c] ?? Tag;
          const palette = getCategoryPalette(c);
          const active = value === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: active
                  ? palette.bgLight
                  : dark
                    ? Tokens.cardSoftDark
                    : Tokens.card,
                borderWidth: 1.5,
                borderColor: active
                  ? palette.accent
                  : dark
                    ? Tokens.borderDark
                    : Tokens.border,
              }}
            >
              <Icon
                size={13}
                color={
                  active
                    ? palette.accent
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted
                }
                strokeWidth={2.2}
              />
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: "600",
                  color: active
                    ? palette.accent
                    : dark
                      ? Tokens.textMutedDark
                      : Tokens.textMuted,
                }}
              >
                {c}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
