// components/ErrorBoundary.tsx
// Displays any uncaught render error on screen instead of letting Expo Go
// close silently. Essential during early-bringup — once the app is stable
// you can leave it in place (it only renders on actual errors).

import React from "react";
import { ScrollView, Text, View } from "react-native";

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Echo to Metro logs in case the device is connected.
    console.error("[ErrorBoundary]", error.message);
    console.error(error.stack);
    console.error(info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View style={{ flex: 1, backgroundColor: "#0a0a0a", padding: 24, paddingTop: 60 }}>
        <Text style={{ color: "#fca5a5", fontSize: 20, fontWeight: "700", marginBottom: 12 }}>
          App crashed during render
        </Text>
        <Text style={{ color: "#fee2e2", fontSize: 14, fontWeight: "600", marginBottom: 16 }}>
          {error.name}: {error.message}
        </Text>
        <ScrollView style={{ flex: 1 }}>
          <Text
            selectable
            style={{ color: "#d1d5db", fontFamily: "monospace", fontSize: 11 }}
          >
            {error.stack ?? "(no stack)"}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
