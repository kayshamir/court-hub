import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";
import { Image } from "expo-image";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  if (Platform.OS === "android") {
    return (
      <Tabs
        tabBar={(props) => (
          <CustomTabBar {...props} colors={colors} scheme={scheme} />
        )}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Dashboard",
          }}
        />
        <Tabs.Screen
          name="score"
          options={{
            title: "Score",
          }}
        />
        <Tabs.Screen
          name="queue"
          options={{
            title: "Queue",
          }}
        />
        <Tabs.Screen
          name="players"
          options={{
            title: "Players",
          }}
        />
      </Tabs>
    );
  }

  // DONT CHANGE THIS BLOCK THIS IS FOR IOS
  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{
        selected: { color: colors.primary },
        default: { color: colors.textSecondary },
      }}
      iconColor={{
        selected: colors.primary,
        default: colors.textSecondary,
      }}
    >
      <NativeTabs.Trigger name="(dashboard)">
        <Label>Dashboard</Label>
        <Icon src={require("@/assets/images/tabIcons/home.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="score">
        <Label>Score</Label>
        <Icon src={require("@/assets/images/tabIcons/score.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="queue">
        <Label>Queue</Label>
        <Icon src={require("@/assets/images/tabIcons/queue.png")} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="players">
        <Label>Players</Label>
        <Icon src={require("@/assets/images/tabIcons/players.png")} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
  // DONT CHANGE THIS BLOCK THIS IS FOR IOS
}

function CustomTabBar({ state, descriptors, navigation, colors, scheme }: any) {
  const insets = useSafeAreaInsets();

  const tabIcons: Record<string, any> = {
    index: require("@/assets/images/tabIcons/home.png"),
    score: require("@/assets/images/tabIcons/score.png"),
    queue: require("@/assets/images/tabIcons/queue.png"),
    players: require("@/assets/images/tabIcons/players.png"),
  };

  return (
    <View
      style={{
        position: "absolute",
        bottom: insets.bottom > 0 ? insets.bottom : 16,
        left: 20,
        right: 20,
        alignItems: "center",
      }}
      pointerEvents="box-none"
    >
      <View
        style={{
          flexDirection: "row",
          backgroundColor:
            scheme === "dark"
              ? "rgba(28, 26, 26, 0.95)"
              : "rgba(255, 255, 255, 0.95)",
          borderWidth: 1,
          borderColor:
            scheme === "dark"
              ? "rgba(255, 255, 255, 0.08)"
              : "rgba(0, 0, 0, 0.06)",
          borderRadius: 32,
          paddingVertical: 10,
          paddingHorizontal: 16,
          maxWidth: 420,
          width: "100%",
          justifyContent: "space-around",
          alignItems: "center",
        }}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.title ?? route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={{
                alignItems: "center",
                justifyContent: "center",
                flex: 1,
              }}
            >
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isFocused
                    ? scheme === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.05)"
                    : "transparent",
                  borderRadius: 9999,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  width: "90%",
                }}
              >
                <Image
                  source={tabIcons[route.name]}
                  style={{
                    width: 20,
                    height: 20,
                    marginBottom: 2,
                  }}
                  tintColor={
                    isFocused
                      ? colors.primary
                      : scheme === "dark"
                        ? "#ffffff"
                        : "#000000"
                  }
                  contentFit="contain"
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: isFocused ? "800" : "500",
                    color: isFocused
                      ? colors.primary
                      : scheme === "dark"
                        ? "#ffffff"
                        : "#000000",
                  }}
                >
                  {label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
