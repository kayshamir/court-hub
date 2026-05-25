import { CourtPreview } from "@/components/court-preview";
import { MatchTypeToggle } from "@/components/match-type-toggle";
import { SportTypeSelector } from "@/components/sport-type-selector";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { addCourt } from "@/services/database";
import { MatchType, SPORT_CONFIGS, SportType } from "@/types/court";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
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
      {/* Header is OUTSIDE KAV — so keyboardVerticalOffset = headerHeight is correct */}
      <View
        className="flex-row items-center justify-between px-5 border-b border-black/5 bg-background"
        style={{ paddingTop: safeAreaInsets.top, paddingBottom: Spacing.two }}
      >
        <Pressable
          onPress={() => router.back()}
          className="w-9 h-9 rounded-full bg-secondary items-center justify-center active:opacity-70 border border-black/5"
        >
          <SymbolView name="xmark" tintColor={theme.foreground} size={14} />
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
                <Text className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">
                  Court Name
                </Text>
                <TextInput
                  value={courtName}
                  onChangeText={setCourtName}
                  placeholder="e.g., Center Court"
                  placeholderTextColor={theme.textSecondary}
                  className="bg-background rounded-2xl px-4 py-3 text-foreground text-sm font-semibold border border-black/5"
                  returnKeyType="done"
                  maxLength={40}
                />
              </View>
              <SportTypeSelector selected={sportType} onSelect={setSportType} />
              <MatchTypeToggle value={matchType} onChange={setMatchType} />
            </View>

            {/* Action Buttons moved into scroll flow */}
            <View className="flex-row gap-3 pt-2">
              <Pressable
                onPress={() => router.back()}
                className="flex-1 py-4 bg-secondary rounded-full items-center justify-center border border-black/5 active:opacity-70"
              >
                <Text className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
                  Discard
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={saving}
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
