// EditProfileSheet — edit name and phone. Email is locked (Google
// OAuth identity), shown disabled with a lock icon.
//
// Currency lives in Settings → Currency (CurrencySheet) — single source
// of truth. We deliberately do NOT expose a currency control here to
// avoid two divergent surfaces; the Settings sheet uses flags + the
// full INR/USD/EUR/GBP/JPY/AUD/CAD/SGD/AED/CHF list.
//
// Layout:
//   - Big gradient avatar + camera overlay (TODO: image picker)
//   - "Tap to change photo" caption
//   - Full name, Email (locked), Phone — labeled, icon-prefixed inputs
//   - "Save changes ✓" button

import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Activity,
  Camera,
  Check,
  Lock,
  Mail,
  User as UserIcon,
} from "lucide-react-native";

import { useAuth } from "@/lib/auth";
import { useUpdateProfile, type ProfileDoc } from "@/hooks/useProfile";
import { Tokens } from "@/lib/design";
import { hapticMedium } from "@/lib/haptics";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { SheetHeader } from "@/components/transactions/SheetHeader";
import { useColorScheme } from "@/hooks/useAppColorScheme";

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill source. Falls back to useAuth user when omitted. */
  profile?: ProfileDoc | null;
}

export function EditProfileSheet({ visible, onClose, profile }: Props) {
  const dark = useColorScheme() === "dark";
  const authUser = useAuth((s) => s.user);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prime form when the sheet opens. Prefer the fresh /api/profile data,
  // fall back to the auth user (name/email cached at sign-in).
  useEffect(() => {
    if (!visible) return;
    const src = profile ?? authUser ?? {};
    setName((src as ProfileDoc).name ?? "");
    setPhone((src as ProfileDoc).phoneNo ?? "");
  }, [visible, profile, authUser]);

  const email = profile?.email ?? authUser?.email ?? "";
  const image = profile?.image ?? authUser?.image;
  const initials = (name || authUser?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  const updateMut = useUpdateProfile();

  const canSubmit = name.trim().length >= 2;

  const submit = async () => {
    if (!canSubmit || submitting) return;
    hapticMedium();
    setSubmitting(true);
    try {
      await updateMut.mutateAsync({
        name: name.trim(),
        phoneNo: phone.trim(),
      });
      onClose();
    } catch (err) {
      const e = err as { message?: string; fields?: Record<string, string[]> };
      const firstField = e.fields ? Object.values(e.fields)[0]?.[0] : undefined;
      Alert.alert(
        "Couldn't save profile",
        firstField ?? e.message ?? "Try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <SheetHeader title="Edit profile" onClose={onClose} />

      {/* Avatar + change photo caption */}
      <View style={{ alignItems: "center", marginBottom: 22 }}>
        <Pressable
          onPress={() => {
            /* TODO: expo-image-picker → upload → setImage */
            Alert.alert("Coming soon", "Photo upload will land soon.");
          }}
          hitSlop={4}
          style={{ position: "relative" }}
        >
          {image ? (
            <ExpoImage
              source={{ uri: image }}
              style={{
                width: 90,
                height: 90,
                borderRadius: 99,
              }}
              contentFit="cover"
              transition={120}
            />
          ) : (
            <LinearGradient
              colors={[Tokens.brand, Tokens.brand3]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 90,
                height: 90,
                borderRadius: 99,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: Tokens.brand,
                shadowOpacity: 0.5,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 10 },
                elevation: 10,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: "800",
                  letterSpacing: -0.8,
                }}
              >
                {initials || "U"}
              </Text>
            </LinearGradient>
          )}
          {/* Camera overlay — bottom-right of the avatar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 4,
              width: 28,
              height: 28,
              borderRadius: 99,
              backgroundColor: dark ? Tokens.textDarkPrimary : Tokens.text,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 3,
              borderColor: dark ? Tokens.cardDark : Tokens.card,
            }}
          >
            <Camera
              size={13}
              color={dark ? Tokens.text : Tokens.card}
              strokeWidth={2.2}
            />
          </View>
        </Pressable>
        <Text
          style={{
            marginTop: 8,
            fontSize: 12,
            color: dark ? Tokens.textMutedDark : Tokens.textMuted,
            fontWeight: "500",
          }}
        >
          Tap to change photo
        </Text>
      </View>

      {/* Full name */}
      <Label dark={dark}>Full name</Label>
      <InputBox dark={dark} Icon={UserIcon}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Your name"
          placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
          style={inputStyle(dark)}
        />
      </InputBox>

      {/* Email — locked */}
      <Label dark={dark}>Email</Label>
      <InputBox dark={dark} Icon={Mail} disabled>
        <Text
          numberOfLines={1}
          style={{ ...inputStyle(dark), color: dark ? Tokens.textMutedDark : Tokens.textMuted }}
        >
          {email}
        </Text>
        <Lock
          size={14}
          color={dark ? Tokens.textDimDark : Tokens.textDim}
          strokeWidth={2}
          style={{ marginLeft: 8 }}
        />
      </InputBox>
      <Text
        style={{
          marginTop: -10,
          marginBottom: 14,
          fontSize: 11,
          color: dark ? Tokens.textDimDark : Tokens.textDim,
          fontStyle: "italic",
        }}
      >
        Email is tied to your Google account and can't be changed here.
      </Text>

      {/* Phone */}
      <Label dark={dark}>Phone</Label>
      <InputBox dark={dark} Icon={Activity}>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+91 98765 43210"
          placeholderTextColor={dark ? Tokens.textDimDark : Tokens.textDim}
          keyboardType="phone-pad"
          style={inputStyle(dark)}
        />
      </InputBox>

      <View style={{ height: 8 }} />

      {/* Save */}
      <Pressable
        onPress={submit}
        disabled={!canSubmit || submitting}
        android_ripple={{ color: "rgba(255,255,255,0.18)" }}
        style={{
          height: 52,
          borderRadius: 16,
          backgroundColor: Tokens.brand,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: !canSubmit || submitting ? 0.5 : 1,
          shadowColor: Tokens.brand,
          shadowOpacity: 0.4,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: 6,
          overflow: "hidden",
        }}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "600" }}>
              Save changes
            </Text>
            <Check size={16} color="#fff" strokeWidth={2.5} />
          </>
        )}
      </Pressable>
    </BottomSheet>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────

function Label({ children, dark }: { children: React.ReactNode; dark: boolean }) {
  return (
    <Text
      style={{
        fontSize: 10.5,
        fontWeight: "800",
        color: dark ? Tokens.textDimDark : Tokens.textDim,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
      }}
    >
      {children}
    </Text>
  );
}

function InputBox({
  children,
  dark,
  Icon,
  disabled,
}: {
  children: React.ReactNode;
  dark: boolean;
  Icon: typeof UserIcon;
  disabled?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 14,
        marginBottom: 16,
        backgroundColor: disabled
          ? dark
            ? Tokens.bgElevDark
            : Tokens.bgElev
          : dark
            ? Tokens.cardSoftDark
            : Tokens.card,
        borderWidth: 1,
        borderColor: dark ? Tokens.borderDark : Tokens.border,
        opacity: disabled ? 0.85 : 1,
      }}
    >
      <Icon
        size={16}
        color={dark ? Tokens.textMutedDark : Tokens.textMuted}
        strokeWidth={2}
        style={{ marginRight: 10 }}
      />
      {children}
    </View>
  );
}

function inputStyle(dark: boolean) {
  return {
    flex: 1,
    fontSize: 14.5,
    color: dark ? Tokens.textDarkPrimary : Tokens.text,
    paddingVertical: 0,
  };
}
