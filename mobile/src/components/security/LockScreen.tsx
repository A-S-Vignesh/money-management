// components/security/LockScreen.tsx
// Full-screen overlay shown when the app is in `locked` state (set by
// AppLockGate when the user resumes after the configured timeout). The
// only way past it is a successful biometric / device-passcode prompt
// from `expo-local-authentication`, or signing out.
//
// We auto-trigger the prompt once on mount so the user lands directly
// in the system biometric sheet — they don't have to tap "Unlock" first
// in the common case. The button is there as a fallback if they dismiss
// the system sheet by accident.

import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import { Fingerprint, LogOut } from "lucide-react-native";

import { Tokens } from "@/lib/design";
import { useAuth } from "@/lib/auth";
import { useColorScheme } from "@/hooks/useAppColorScheme";
import { useSecurity } from "@/lib/security";

export function LockScreen() {
  const dark = useColorScheme() === "dark";
  const unlock = useSecurity((s) => s.unlock);
  const signOut = useAuth((s) => s.signOut);
  const userName = useAuth((s) => s.user?.name);
  const userEmail = useAuth((s) => s.user?.email);

  const [authing, setAuthing] = useState(false);
  // Prevent double-prompt: useEffect under StrictMode / fast-refresh can
  // run twice, and `authenticateAsync` enqueues prompts on iOS.
  const didAutoPromptRef = useRef(false);

  const promptUnlock = async () => {
    if (authing) return;
    setAuthing(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock Money Nest",
        cancelLabel: "Cancel",
        // Falls back to device passcode/PIN automatically if biometric
        // hardware is unavailable, not enrolled, or repeatedly fails —
        // matches every banking app on the platform.
        disableDeviceFallback: false,
      });
      if (result.success) {
        unlock();
      }
    } catch (e) {
      console.warn("[lock] biometric prompt failed", e);
    } finally {
      setAuthing(false);
    }
  };

  useEffect(() => {
    if (didAutoPromptRef.current) return;
    didAutoPromptRef.current = true;
    // Tiny delay so the overlay paints before the system sheet animates
    // in on top — without this Android sometimes shows the sheet over a
    // blank surface for one frame.
    const id = setTimeout(promptUnlock, 120);
    return () => clearTimeout(id);
  }, []);

  const confirmSignOut = () => {
    Alert.alert(
      "Sign out?",
      "You'll need to sign in with Google again to use Money Nest.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            await signOut();
            unlock();
          },
        },
      ],
    );
  };

  const bg = dark ? "#0a0b0e" : "#f5f6fa";

  return (
    <View
      collapsable={false}
      pointerEvents="auto"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      {/* Brand gradient badge */}
      <LinearGradient
        colors={[Tokens.brand, Tokens.brand3]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 88,
          height: 88,
          borderRadius: 26,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: Tokens.brand,
          shadowOpacity: 0.45,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 14 },
          elevation: 10,
        }}
      >
        <Fingerprint size={42} color="#fff" strokeWidth={2.2} />
      </LinearGradient>

      <Text
        style={{
          marginTop: 22,
          fontSize: 22,
          fontWeight: "800",
          letterSpacing: -0.6,
          color: dark ? Tokens.textDarkPrimary : Tokens.text,
        }}
      >
        Money Nest is locked
      </Text>
      {userName || userEmail ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 13,
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
            textAlign: "center",
          }}
        >
          {userName ? `Welcome back, ${userName}.` : userEmail}
        </Text>
      ) : null}
      <Text
        style={{
          marginTop: 4,
          fontSize: 12.5,
          color: dark ? Tokens.textDimDark : Tokens.textDim,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        Authenticate to continue.
      </Text>

      <Pressable
        onPress={promptUnlock}
        disabled={authing}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={{
          marginTop: 28,
          backgroundColor: Tokens.brand,
          paddingHorizontal: 28,
          paddingVertical: 14,
          borderRadius: 16,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          shadowColor: Tokens.brand,
          shadowOpacity: 0.32,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          opacity: authing ? 0.7 : 1,
          overflow: "hidden",
        }}
      >
        <Fingerprint size={18} color="#fff" strokeWidth={2.4} />
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14.5 }}>
          {authing ? "Authenticating…" : "Unlock"}
        </Text>
      </Pressable>

      <Pressable
        onPress={confirmSignOut}
        hitSlop={10}
        android_ripple={{
          color: dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        }}
        style={{
          marginTop: 18,
          paddingHorizontal: 14,
          paddingVertical: 10,
          borderRadius: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          overflow: "hidden",
        }}
      >
        <LogOut size={14} color={dark ? Tokens.textMutedDark : Tokens.textMuted} strokeWidth={2.2} />
        <Text
          style={{
            fontSize: 12.5,
            fontWeight: "600",
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
          }}
        >
          Sign out instead
        </Text>
      </Pressable>
    </View>
  );
}
