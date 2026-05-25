import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { useColorScheme } from "react-native";

import { Colors } from "@/constants/theme";

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === "dark" ? "dark" : "light"];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}
    >
      <NativeTabs.Trigger name="index">
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
}
