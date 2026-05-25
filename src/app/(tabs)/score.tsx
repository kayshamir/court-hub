import React from "react";
import { View, Text, ScrollView, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { useTheme } from "@/hooks/use-theme";
import { BottomTabInset, MaxContentWidth, Spacing } from "@/constants/theme";

export default function ScoreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [matchMode, setMatchMode] = React.useState<"singles" | "doubles">("doubles");
  const [scoreRed, setScoreRed] = React.useState(12);
  const [scoreWhite, setScoreWhite] = React.useState(10);
  const [recentPlays, setRecentPlays] = React.useState([
    { id: 1, player: "J. Miller", action: "Spike Winner", points: "+1 PT" },
    { id: 2, player: "A. Chen", action: "Service Error", points: "0 PT" },
  ]);

  const incrementRed = () => {
    setScoreRed(scoreRed + 1);
    setRecentPlays([
      { id: Date.now(), player: matchMode === "singles" ? "Red Player" : "J. Miller", action: "Point Won", points: "+1 PT" },
      ...recentPlays.slice(0, 4),
    ]);
  };

  const decrementRed = () => {
    if (scoreRed > 0) setScoreRed(scoreRed - 1);
  };

  const incrementWhite = () => {
    setScoreWhite(scoreWhite + 1);
    setRecentPlays([
      { id: Date.now(), player: matchMode === "singles" ? "White Player" : "A. Chen", action: "Point Won", points: "+1 PT" },
      ...recentPlays.slice(0, 4),
    ]);
  };

  const decrementWhite = () => {
    if (scoreWhite > 0) setScoreWhite(scoreWhite - 1);
  };

  const resetMatch = () => {
    setScoreRed(0);
    setScoreWhite(0);
    setRecentPlays([]);
  };

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
        contentContainerStyle={[{ paddingTop: safeAreaInsets.top + Spacing.two }, contentPlatformStyle]}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-5 max-w-[800px] w-full self-center gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">Live Score</Text>
              <Text className="text-sm font-medium text-muted-foreground">Scoring Dashboard</Text>
            </View>
            <View className="bg-primary/10 px-3.5 py-1 rounded-full flex-row items-center gap-1.5">
              <View className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <Text className="text-xs font-bold text-primary uppercase">Court 04 • Live</Text>
            </View>
          </View>

          {/* Mode Switcher */}
          <View className="flex-row bg-secondary p-1.5 rounded-full border border-black/5">
            <Pressable
              onPress={() => setMatchMode("singles")}
              className={`flex-1 py-2.5 rounded-full items-center ${matchMode === "singles" ? "bg-white" : ""}`}
            >
              <Text className={`text-xs font-extrabold uppercase tracking-wider ${matchMode === "singles" ? "text-foreground" : "text-muted-foreground"}`}>Singles</Text>
            </Pressable>
            <Pressable
              onPress={() => setMatchMode("doubles")}
              className={`flex-1 py-2.5 rounded-full items-center ${matchMode === "doubles" ? "bg-white" : ""}`}
            >
              <Text className={`text-xs font-extrabold uppercase tracking-wider ${matchMode === "doubles" ? "text-foreground" : "text-muted-foreground"}`}>Doubles</Text>
            </Pressable>
          </View>

          {/* Main Scoreboard Display */}
          <View className="bg-secondary rounded-[32px] p-6 border border-black/5 gap-6">
            <View className="flex-row justify-between items-center">
              {/* Red Team Card */}
              <View className="items-center flex-1">
                <View className="bg-primary/10 px-3 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-primary uppercase tracking-wide">Red Team</Text>
                </View>
                <Text className="text-xs font-bold text-foreground mb-1">
                  {matchMode === "singles" ? "J. Miller" : "Miller / King"}
                </Text>
                <View className="my-2 bg-white/70 dark:bg-black/30 rounded-2xl w-24 h-24 items-center justify-center border border-black/5">
                  <Text className="text-5xl font-black text-primary">{scoreRed}</Text>
                </View>
                {/* Score Controls */}
                <View className="flex-row gap-4 mt-3">
                  <Pressable
                    onPress={decrementRed}
                    className="w-10 h-10 bg-white dark:bg-white/10 rounded-full items-center justify-center border border-black/5 active:scale-90"
                  >
                    <SymbolView name="minus" tintColor={theme.foreground} size={14} />
                  </Pressable>
                  <Pressable
                    onPress={incrementRed}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center active:scale-90"
                  >
                    <SymbolView name="plus" tintColor="#fff" size={14} />
                  </Pressable>
                </View>
              </View>

              {/* Divider */}
              <View className="px-3 items-center justify-center">
                <Text className="text-xl font-black text-muted-foreground opacity-30">VS</Text>
              </View>

              {/* White Team Card */}
              <View className="items-center flex-1">
                <View className="bg-foreground/10 px-3 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-foreground uppercase tracking-wide">White Team</Text>
                </View>
                <Text className="text-xs font-bold text-foreground mb-1">
                  {matchMode === "singles" ? "A. Chen" : "Chen / Lee"}
                </Text>
                <View className="my-2 bg-white/70 dark:bg-black/30 rounded-2xl w-24 h-24 items-center justify-center border border-black/5">
                  <Text className="text-5xl font-black text-foreground">{scoreWhite}</Text>
                </View>
                {/* Score Controls */}
                <View className="flex-row gap-4 mt-3">
                  <Pressable
                    onPress={decrementWhite}
                    className="w-10 h-10 bg-white dark:bg-white/10 rounded-full items-center justify-center border border-black/5 active:scale-90"
                  >
                    <SymbolView name="minus" tintColor={theme.foreground} size={14} />
                  </Pressable>
                  <Pressable
                    onPress={incrementWhite}
                    className="w-10 h-10 bg-foreground rounded-full items-center justify-center active:scale-90"
                  >
                    <SymbolView name="plus" tintColor="#fff" size={14} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 pt-3 border-t border-black/5 justify-center">
              <Pressable className="flex-row items-center bg-secondary px-5 py-2.5 rounded-full border border-black/5 active:opacity-70 gap-2">
                <SymbolView name="pause.fill" tintColor={theme.foreground} size={12} />
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Pause</Text>
              </Pressable>
              <Pressable onPress={resetMatch} className="flex-row items-center bg-secondary px-5 py-2.5 rounded-full border border-black/5 active:opacity-70 gap-2">
                <SymbolView name="arrow.clockwise" tintColor={theme.foreground} size={12} />
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Reset</Text>
              </Pressable>
            </View>
          </View>

          {/* Recent Plays Log */}
          <View className="gap-3">
            <Text className="text-lg font-extrabold text-foreground">Recent Plays</Text>
            {recentPlays.length === 0 ? (
              <View className="bg-secondary/40 p-6 rounded-3xl border border-dashed border-black/10 items-center justify-center">
                <Text className="text-xs text-muted-foreground">No plays recorded yet. Start updating the score!</Text>
              </View>
            ) : (
              <View className="bg-secondary rounded-3xl p-4 border border-black/5 gap-3.5">
                {recentPlays.map((play) => (
                  <View key={play.id} className="flex-row justify-between items-center pb-3 border-b border-black/5 last:border-b-0">
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                        <SymbolView name="figure.racquetball" tintColor={theme.primary} size={14} />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-foreground">{play.player}</Text>
                        <Text className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{play.action}</Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-primary">{play.points}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
