import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function QueueScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [queueMode, setQueueMode] = React.useState<"singles" | "doubles">(
    "doubles",
  );

  // Mock queue data
  const nextMatch = {
    teamA:
      queueMode === "singles"
        ? ["Alex Rivera"]
        : ["Alex Rivera", "Jordan Chen"],
    teamB:
      queueMode === "singles"
        ? ["Sarah Thompson"]
        : ["Sarah Thompson", "Marcus Weber"],
    court: "Court 02",
  };

  const waitingPool = [
    {
      id: 1,
      players:
        queueMode === "singles"
          ? ["Elena Rodriguez"]
          : ["Elena Rodriguez", "David Kim"],
      position: 1,
      status: "Next Up",
    },
    {
      id: 2,
      players:
        queueMode === "singles"
          ? ["Chris Evans"]
          : ["Chris Evans", "Tom Holland"],
      position: 2,
      status: "Waiting",
    },
    {
      id: 3,
      players:
        queueMode === "singles"
          ? ["Jessica Alba"]
          : ["Jessica Alba", "Scarlett J."],
      position: 3,
      status: "Waiting",
    },
    {
      id: 4,
      players:
        queueMode === "singles"
          ? ["Taylor Swift"]
          : ["Taylor Swift", "Travis Kelce"],
      position: 4,
      status: "Waiting",
    },
  ];

  // Combine tab bar spacing
  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: {
      paddingBottom: insets.bottom,
    },
    ios: {
      paddingBottom: insets.bottom,
    },
    default: {
      paddingBottom: Spacing.four,
    },
  });

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={[
          { paddingTop: safeAreaInsets.top + Spacing.two },
          contentPlatformStyle,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 max-w-[800px] w-full self-center gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                Court Queue
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Queue Management
              </Text>
            </View>
            <Pressable className="bg-secondary px-4 py-2 rounded-full flex-row items-center gap-1.5 border border-black/5 active:opacity-70">
              <SymbolView
                name="shuffle"
                tintColor={theme.foreground}
                size={12}
              />
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                Shuffle
              </Text>
            </Pressable>
          </View>

          {/* Queue Mode Toggles */}
          <View className="flex-row bg-secondary p-1.5 rounded-full border border-black/5">
            <Pressable
              onPress={() => setQueueMode("singles")}
              className={`flex-1 py-2.5 rounded-full items-center ${queueMode === "singles" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${queueMode === "singles" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Singles
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setQueueMode("doubles")}
              className={`flex-1 py-2.5 rounded-full items-center ${queueMode === "doubles" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${queueMode === "doubles" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Doubles
              </Text>
            </Pressable>
          </View>

          {/* Court Mini Graphic */}
          <View className="bg-secondary/40 rounded-3xl p-4 border border-black/5 items-center">
            <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3">
              Live Rotation Map
            </Text>
            <View className="w-full aspect-[2/1] max-w-[340px] bg-[#2D5A27] rounded-2xl border-2 border-white relative p-1 overflow-hidden">
              {/* Center Net Line */}
              <View className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/70 border-dashed border-r border-white/50" />
              {/* Internal Court Markings */}
              <View className="absolute top-2 bottom-2 left-2 right-2 border border-white/40" />

              {/* Team A Players Representation */}
              <View className="absolute left-4 top-0 bottom-0 justify-center gap-3">
                {nextMatch.teamA.map((player, idx) => (
                  <View
                    key={idx}
                    className="bg-primary px-2.5 py-1 rounded-full"
                  >
                    <Text className="text-[8px] font-bold text-white uppercase">
                      {player.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Team B Players Representation */}
              <View className="absolute right-4 top-0 bottom-0 justify-center gap-3 items-end">
                {nextMatch.teamB.map((player, idx) => (
                  <View
                    key={idx}
                    className="bg-foreground px-2.5 py-1 rounded-full"
                  >
                    <Text className="text-[8px] font-bold text-background uppercase">
                      {player.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="absolute bottom-2 left-1/2 -ml-8 bg-black/40 px-2 py-0.5 rounded-full">
                <Text className="text-[7px] font-bold text-white/80 uppercase tracking-widest text-center">
                  {nextMatch.court}
                </Text>
              </View>
            </View>
          </View>

          {/* Next Match Section */}
          <View className="bg-secondary rounded-[32px] p-5 border border-black/5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                Next Matchup
              </Text>
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-[9px] font-black text-white uppercase tracking-wider">
                  1st in Queue
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-primary uppercase">
                  Team A
                </Text>
                <Text className="text-sm font-extrabold text-foreground mt-0.5">
                  {nextMatch.teamA.join(" & ")}
                </Text>
              </View>
              <View className="px-3">
                <Text className="text-xs font-black text-muted-foreground/30">
                  VS
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-[10px] font-bold text-foreground uppercase">
                  Team B
                </Text>
                <Text className="text-sm font-extrabold text-foreground mt-0.5 text-right">
                  {nextMatch.teamB.join(" & ")}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/score",
                  params: {
                    teamA: JSON.stringify(nextMatch.teamA),
                    teamB: JSON.stringify(nextMatch.teamB),
                  },
                })
              }
              className="bg-primary py-4 rounded-full items-center justify-center active:scale-[0.98] transition-transform"
            >
              <Text className="text-white text-base font-bold">
                Start Match
              </Text>
            </Pressable>
          </View>

          {/* Waiting Pool Section */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-extrabold text-foreground">
                Waiting Pool
              </Text>
              <Text className="text-xs font-bold text-primary">
                {waitingPool.length} Teams
              </Text>
            </View>

            <View className="gap-3">
              {waitingPool.map((item) => (
                <View
                  key={item.id}
                  className="bg-secondary rounded-3xl p-4 border border-black/5 flex-row justify-between items-center"
                >
                  <View className="flex-row items-center gap-4 flex-1">
                    <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                      <Text className="text-xs font-black text-primary">
                        #{item.position}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-bold text-foreground">
                        {item.players.join(" & ")}
                      </Text>
                      <Text className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
                        {item.status}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <Pressable className="p-1 active:opacity-50">
                      <SymbolView
                        name="line.3.horizontal"
                        tintColor={theme.foreground}
                        size={16}
                      />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Player FAB */}
      <Pressable
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center active:scale-90 transition-transform"
        style={{ zIndex: 100 }}
      >
        <SymbolView name="person.badge.plus" tintColor="#fff" size={22} />
      </Pressable>
    </View>
  );
}
