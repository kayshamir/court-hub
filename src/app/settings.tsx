import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export default function SettingsScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
  const [autoRotate, setAutoRotate] = React.useState(false);

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
    },
    ios: {
      paddingBottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
    },
    default: {
      paddingBottom: Spacing.four,
    },
  });

  return (
    <ScrollView
      style={[styles.scrollView, { backgroundColor: theme.background }]}
      contentContainerStyle={[styles.contentContainer, contentPlatformStyle]}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="subtitle" style={styles.title}>Settings</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">Configure Court Hub preferences</ThemedText>
        </View>

        {/* Section 1: Notifications */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLabelContainer}>
              <SymbolView
                name="bell.fill"
                tintColor={theme.primary}
                size={20}
                style={styles.icon}
              />
              <ThemedText type="smallBold">Push Notifications</ThemedText>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: theme.primary }}
            />
          </View>
        </ThemedView>

        {/* Section 2: Court Rotation */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLabelContainer}>
              <SymbolView
                name="arrow.triangle.2.circlepath"
                tintColor={theme.primary}
                size={20}
                style={styles.icon}
              />
              <ThemedText type="smallBold">Auto Rotate Server</ThemedText>
            </View>
            <Switch
              value={autoRotate}
              onValueChange={setAutoRotate}
              trackColor={{ true: theme.primary }}
            />
          </View>
        </ThemedView>

        {/* Section 3: About */}
        <ThemedView type="backgroundElement" style={styles.section}>
          <View style={styles.row}>
            <View style={styles.rowLabelContainer}>
              <SymbolView
                name="info.circle.fill"
                tintColor={theme.primary}
                size={20}
                style={styles.icon}
              />
              <ThemedText type="smallBold">App Version</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">v1.0.0</ThemedText>
          </View>
        </ThemedView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: Spacing.four,
  },
  container: {
    width: "100%",
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
  },
  header: {
    paddingVertical: Spacing.two,
  },
  title: {
    fontWeight: "800",
  },
  section: {
    borderRadius: Spacing.four,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },
  rowLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.three,
    flex: 1,
  },
  icon: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
  },
});
