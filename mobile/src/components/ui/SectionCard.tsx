// components/ui/SectionCard.tsx
// A subtle elevated container used for every "section" of every screen.
// Mirrors the visual language of high-end finance apps: pure white surface
// in light, deep-charcoal in dark, soft shadow, generous padding, no border
// chrome by default.

import { View, type ViewProps } from "react-native";

interface Props extends ViewProps {
  children: React.ReactNode;
  // Tighter spacing for inline cards (stat tiles); default for hero / sections.
  density?: "compact" | "default" | "spacious";
}

export function SectionCard({ children, density = "default", className = "", style, ...rest }: Props & { className?: string }) {
  const pad = density === "compact" ? "p-4" : density === "spacious" ? "p-6" : "p-5";
  return (
    <View
      style={[
        {
          // Native shadow on iOS, elevation on Android — both subtle.
          shadowColor: "#0f172a",
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        },
        style,
      ]}
      className={`bg-white dark:bg-neutral-900 rounded-3xl border border-gray-100/80 dark:border-neutral-800 ${pad} ${className}`}
      {...rest}
    >
      {children}
    </View>
  );
}
