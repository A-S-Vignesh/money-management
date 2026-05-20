// Card — the white/dark surface that holds every section's content.
// Mirrors `.card` from Mobile UI/app.css (22px radius, hairline border,
// subtle 2-layer shadow).

import { View, type ViewProps, type ViewStyle } from "react-native";

interface Props extends ViewProps {
  /** Tighter 18px radius variant (e.g. embedded rows, smaller cards). */
  tight?: boolean;
  /** Background uses card-subtle instead of card. */
  soft?: boolean;
  style?: ViewStyle;
}

export function Card({ tight, soft, style, children, ...rest }: Props) {
  return (
    <View
      className={
        soft
          ? "bg-surface-subtle dark:bg-surface-dark-subtle border border-edge dark:border-edge-dark"
          : "bg-surface dark:bg-surface-dark border border-edge dark:border-edge-dark"
      }
      style={[
        {
          borderRadius: tight ? 18 : 22,
          // Soft 2-layer shadow approximating --shadow-card from the mock.
          shadowColor: "#0f1224",
          shadowOpacity: 0.06,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}
