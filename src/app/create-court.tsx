import { CourtPreview } from "@/components/court-preview";
import { MatchTypeToggle } from "@/components/match-type-toggle";
import { SportTypeSelector } from "@/components/sport-type-selector";
import { AppIcon } from "@/components/ui/icon";
import { TextInput } from "@/components/ui/text-input";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { addCourt } from "@/services/database";
import { MatchType, SPORT_CONFIGS, SportType } from "@/types/court";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CreateCourtScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const [sportType, setSportType] = React.useState<SportType>("tennis");
  const [matchType, setMatchType] = React.useState<MatchType>("singles");
  const [courtName, setCourtName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const sportConfig = SPORT_CONFIGS[sportType];
  const headerHeight = safeAreaInsets.top + 52;

  async function handleCreate() {
    if (!courtName.trim()) {
      Alert.alert("Court Name Required", "Please enter a name for this court.");
      return;
    }
    try {
      setSaving(true);
      await addCourt(courtName.trim(), sportType, matchType);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save the court. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen
        options={{ presentation: "modal", animation: "slide_from_bottom" }}
      />
      {/* Header is OUTSIDE KAV — so keyboardVerticalOffset = headerHeight is correct */}
      <View
        className="flex-row items-center justify-between px-5 border-b border-black/5 bg-background"
        style={{ paddingTop: safeAreaInsets.top, paddingBottom: Spacing.two }}
      >
        <Pressable
          onPress={() => router.back()}
          android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: true }}
          className="w-9 h-9 rounded-full bg-secondary items-center justify-center active:opacity-70 border border-black/5"
        >
          <AppIcon name="xmark" tintColor={theme.foreground} size={14} />
        </Pressable>
        <Text className="text-base font-extrabold tracking-tight text-foreground uppercase">
          New {sportConfig.label} Court
        </Text>
        <View className="w-9 h-9" />
      </View>

      {/* KAV wraps only the scroll content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: Spacing.four,
            paddingBottom: safeAreaInsets.bottom + Spacing.six,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          // iOS: native API — automatically scrolls focused input above keyboard
          automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
        >
          <View className="px-5 max-w-[800px] w-full self-center gap-6">
            <CourtPreview sportType={sportType} />
            <View className="bg-secondary rounded-3xl p-5 border border-black/5 gap-5">
              <View className="gap-2">
                <TextInput
                  label="Court Name"
                  placeholder="Enter full name"
                  value={courtName}
                  onChangeText={setCourtName}
                />
              </View>
              <SportTypeSelector selected={sportType} onSelect={setSportType} />
              <MatchTypeToggle value={matchType} onChange={setMatchType} />
            </View>

            {/* Action Buttons moved into scroll flow */}
            <View className="flex-row gap-3 pt-2">
              <Pressable
                onPress={() => router.back()}
                android_ripple={{ color: "rgba(0,0,0,0.1)", borderless: false }}
                className="flex-1 py-4 bg-secondary rounded-full items-center justify-center border border-black/5 active:opacity-70"
              >
                <Text className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Discard
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={saving}
                android_ripple={{
                  color: "rgba(193, 18, 31, 0.25)",
                  borderless: false,
                }}
                className="flex-[2] py-4 bg-primary rounded-full items-center justify-center active:opacity-80"
                style={{ opacity: saving ? 0.6 : 1 }}
              >
                <Text className="text-xs font-extrabold uppercase tracking-widest text-white">
                  {saving ? "Saving…" : "Create Court"}
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
