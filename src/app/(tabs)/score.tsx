import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { saveMatchResult } from "@/services/match-service";
import { useLocalSearchParams } from "expo-router";
import {
  Activity,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Trophy,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const WIN_OPTIONS = [11, 15, 21, 25];

function checkWinner(
  a: number,
  b: number,
  target: number,
  winBy2: boolean,
): "A" | "B" | null {
  if (winBy2) {
    const cap = target + 9;
    if (a >= target && a - b >= 2) return "A";
    if (b >= target && b - a >= 2) return "B";
    if (a >= cap) return "A";
    if (b >= cap) return "B";
  } else {
    if (a >= target) return "A";
    if (b >= target) return "B";
  }
  return null;
}

export default function ScoreScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{ teamA?: string; teamB?: string }>();

  const teamAFromQueue: string[] | null = params.teamA
    ? JSON.parse(params.teamA)
    : null;
  const teamBFromQueue: string[] | null = params.teamB
    ? JSON.parse(params.teamB)
    : null;
  const derivedMode = teamAFromQueue
    ? teamAFromQueue.length > 1
      ? "doubles"
      : "singles"
    : null;

  const [matchMode, setMatchMode] = React.useState<"singles" | "doubles">(
    derivedMode ?? "doubles",
  );
  const [winTarget, setWinTarget] = React.useState(21);
  const [customTarget, setCustomTarget] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const [winBy2, setWinBy2] = React.useState(true);
  const [scoreA, setScoreA] = React.useState(0);
  const [scoreB, setScoreB] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [winner, setWinner] = React.useState<"A" | "B" | null>(null);
  const [recentPlays, setRecentPlays] = React.useState<
    { id: number; player: string; action: string; points: string }[]
  >([]);

  const teamA =
    teamAFromQueue ??
    (matchMode === "singles" ? ["J. Miller"] : ["Miller", "King"]);
  const teamB =
    teamBFromQueue ?? (matchMode === "singles" ? ["A. Chen"] : ["Chen", "Lee"]);

  const matchStarted = scoreA > 0 || scoreB > 0;

  const handleSelectTarget = (val: number) => {
    setWinTarget(val);
    setShowCustomInput(false);
    setCustomTarget("");
  };

  const handleCustomConfirm = () => {
    const parsed = parseInt(customTarget);
    if (!isNaN(parsed) && parsed > 0) {
      setWinTarget(parsed);
      setShowCustomInput(false);
    }
  };

  const addPoint = (team: "A" | "B") => {
    if (isPaused || winner) return;
    const newA = team === "A" ? scoreA + 1 : scoreA;
    const newB = team === "B" ? scoreB + 1 : scoreB;

    if (team === "A") setScoreA(newA);
    else setScoreB(newB);

    setRecentPlays((prev) => [
      {
        id: Date.now(),
        player: team === "A" ? teamA[0] : teamB[0],
        action: "Point Won",
        points: "+1 PT",
      },
      ...prev.slice(0, 4),
    ]);

    const result = checkWinner(newA, newB, winTarget, winBy2);
    if (result) setWinner(result);
  };

  const removePoint = (team: "A" | "B") => {
    if (isPaused || winner) return;
    if (team === "A" && scoreA > 0) setScoreA(scoreA - 1);
    if (team === "B" && scoreB > 0) setScoreB(scoreB - 1);
  };

  const handleReset = () => {
    setScoreA(0);
    setScoreB(0);
    setWinner(null);
    setIsPaused(false);
    setRecentPlays([]);
  };

  const handleSaveMatch = async () => {
    if (!winner) return;
    setIsSaving(true);
    try {
      await saveMatchResult(teamA, teamB, scoreA, scoreB, winner);
    } catch (e) {
      console.error("Failed to save match:", e);
    } finally {
      setIsSaving(false);
      handleReset();
    }
  };

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: insets.bottom },
    ios: { paddingBottom: insets.bottom },
    default: { paddingBottom: Spacing.four },
  });

  const winningTeamName =
    winner === "A" ? teamA.join(" & ") : teamB.join(" & ");
  const isCustomSelected = !WIN_OPTIONS.includes(winTarget);

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
                Live Score
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Scoring Dashboard
              </Text>
            </View>
            <View className="bg-primary/10 px-3.5 py-1 rounded-full flex-row items-center gap-1.5">
              <View
                className={`w-2 h-2 rounded-full ${isPaused ? "bg-muted-foreground" : "bg-primary animate-pulse"}`}
              />
              <Text className="text-xs font-bold text-primary uppercase">
                {isPaused ? "Paused" : "Live"}
              </Text>
            </View>
          </View>

          {/* Mode Switcher */}
          <View className="flex-row bg-secondary p-1.5 rounded-full border border-black/5">
            <Pressable
              onPress={() => !teamAFromQueue && setMatchMode("singles")}
              className={`flex-1 py-2.5 rounded-full items-center ${matchMode === "singles" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${matchMode === "singles" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Singles
              </Text>
            </Pressable>
            <Pressable
              onPress={() => !teamAFromQueue && setMatchMode("doubles")}
              className={`flex-1 py-2.5 rounded-full items-center ${matchMode === "doubles" ? "bg-white" : ""}`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${matchMode === "doubles" ? "text-foreground" : "text-muted-foreground"}`}
              >
                Doubles
              </Text>
            </Pressable>
          </View>

          {/* Match Settings */}
          <View className="bg-secondary rounded-3xl p-4 border border-black/5 gap-4">
            {/* Win Target */}
            <View className="gap-2">
              <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                Win Target
              </Text>
              <View className="flex-row gap-2 flex-wrap">
                {WIN_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt}
                    onPress={() => !matchStarted && handleSelectTarget(opt)}
                    className={`px-4 py-2 rounded-full border ${
                      winTarget === opt && !isCustomSelected
                        ? "bg-primary border-primary"
                        : "bg-background border-black/10"
                    } ${matchStarted ? "opacity-50" : "active:opacity-70"}`}
                  >
                    <Text
                      className={`text-xs font-extrabold ${winTarget === opt && !isCustomSelected ? "text-white" : "text-foreground"}`}
                    >
                      {opt}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => {
                    if (matchStarted) return;
                    setShowCustomInput((v) => !v);
                  }}
                  className={`px-4 py-2 rounded-full border ${
                    isCustomSelected
                      ? "bg-primary border-primary"
                      : "bg-background border-black/10"
                  } ${matchStarted ? "opacity-50" : "active:opacity-70"}`}
                >
                  <Text
                    className={`text-xs font-extrabold ${isCustomSelected ? "text-white" : "text-foreground"}`}
                  >
                    {isCustomSelected ? winTarget : "Custom"}
                  </Text>
                </Pressable>
              </View>

              {showCustomInput && (
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    className="flex-1 bg-background border border-black/10 rounded-2xl px-4 py-2.5 text-sm text-foreground font-medium outline-none"
                    placeholder="Enter target score"
                    placeholderTextColor={theme.textSecondary}
                    value={customTarget}
                    onChangeText={setCustomTarget}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleCustomConfirm}
                  />
                  <Pressable
                    onPress={handleCustomConfirm}
                    className="bg-primary px-4 py-2.5 rounded-2xl active:opacity-70"
                  >
                    <Text className="text-white text-xs font-extrabold">
                      Set
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            {/* Win by 2 toggle */}
            <View className="flex-row justify-between items-center pt-3 border-t border-black/5">
              <View className="flex-1 pr-4">
                <Text className="text-xs font-extrabold text-foreground">
                  Win by 2
                </Text>
                <Text className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Must lead by 2 points at target score
                </Text>
              </View>
              <Switch
                value={winBy2}
                onValueChange={(v) => {
                  if (!matchStarted) setWinBy2(v);
                }}
                disabled={matchStarted}
                trackColor={{ false: theme.grey5, true: theme.primary }}
                thumbColor="#fff"
              />
            </View>

            {/* Live summary */}
            <View className="flex-row items-center gap-1.5 -mt-1">
              <Info size={11} color={theme.textSecondary} />
              <Text className="text-[10px] text-muted-foreground font-semibold">
                {winBy2
                  ? `First to ${winTarget}, win by 2 (cap ${winTarget + 9})`
                  : `First to ${winTarget} wins`}
              </Text>
            </View>
          </View>

          {/* Main Scoreboard */}
          <View className="bg-secondary rounded-[32px] p-6 border border-black/5 gap-6">
            <View className="flex-row justify-between items-center">
              {/* Team A */}
              <View className="items-center flex-1">
                <View className="bg-primary/10 px-3 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-primary uppercase tracking-wide">
                    {teamA.length > 1 ? "Team A" : teamA[0]}
                  </Text>
                </View>
                {teamA.length > 1 && (
                  <Text className="text-xs font-bold text-foreground mb-1">
                    {teamA.join(" & ")}
                  </Text>
                )}
                <View className="my-2 bg-white/70 dark:bg-black/30 rounded-2xl w-24 h-24 items-center justify-center border border-black/5">
                  <Text className="text-5xl font-black text-primary">
                    {scoreA}
                  </Text>
                </View>
                <View className="flex-row gap-4 mt-3">
                  <Pressable
                    onPress={() => removePoint("A")}
                    className="w-10 h-10 bg-white dark:bg-white/10 rounded-full items-center justify-center border border-black/5 active:scale-90"
                  >
                    <Minus size={14} color={theme.foreground} />
                  </Pressable>
                  <Pressable
                    onPress={() => addPoint("A")}
                    className="w-10 h-10 bg-primary rounded-full items-center justify-center active:scale-90"
                  >
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>

              <View className="px-3 items-center justify-center">
                <Text className="text-xl font-black text-muted-foreground opacity-30">
                  VS
                </Text>
              </View>

              {/* Team B */}
              <View className="items-center flex-1">
                <View className="bg-foreground/10 px-3 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-foreground uppercase tracking-wide">
                    {teamB.length > 1 ? "Team B" : teamB[0]}
                  </Text>
                </View>
                {teamB.length > 1 && (
                  <Text className="text-xs font-bold text-foreground mb-1">
                    {teamB.join(" & ")}
                  </Text>
                )}
                <View className="my-2 bg-white/70 dark:bg-black/30 rounded-2xl w-24 h-24 items-center justify-center border border-black/5">
                  <Text className="text-5xl font-black text-foreground">
                    {scoreB}
                  </Text>
                </View>
                <View className="flex-row gap-4 mt-3">
                  <Pressable
                    onPress={() => removePoint("B")}
                    className="w-10 h-10 bg-white dark:bg-white/10 rounded-full items-center justify-center border border-black/5 active:scale-90"
                  >
                    <Minus size={14} color={theme.foreground} />
                  </Pressable>
                  <Pressable
                    onPress={() => addPoint("B")}
                    className="w-10 h-10 bg-foreground rounded-full items-center justify-center active:scale-90"
                  >
                    <Plus size={14} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 pt-3 border-t border-black/5 justify-center">
              <Pressable
                onPress={() => setIsPaused((p) => !p)}
                className="flex-row items-center bg-secondary px-5 py-2.5 rounded-full border border-black/5 active:opacity-70 gap-2"
              >
                {isPaused ? (
                  <Play size={12} color={theme.foreground} />
                ) : (
                  <Pause size={12} color={theme.foreground} />
                )}
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                className="flex-row items-center bg-secondary px-5 py-2.5 rounded-full border border-black/5 active:opacity-70 gap-2"
              >
                <RotateCcw size={12} color={theme.foreground} />
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Reset
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Recent Plays Log */}
          <View className="gap-3">
            <Text className="text-lg font-extrabold text-foreground">
              Recent Plays
            </Text>
            {recentPlays.length === 0 ? (
              <View className="bg-secondary/40 p-6 rounded-3xl border border-dashed border-black/10 items-center justify-center">
                <Text className="text-xs text-muted-foreground">
                  No plays recorded yet. Start updating the score!
                </Text>
              </View>
            ) : (
              <View className="bg-secondary rounded-3xl p-4 border border-black/5 gap-3.5">
                {recentPlays.map((play) => (
                  <View
                    key={play.id}
                    className="flex-row justify-between items-center pb-3 border-b border-black/5 last:border-b-0"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center">
                        <Activity size={14} color={theme.primary} />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-foreground">
                          {play.player}
                        </Text>
                        <Text className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {play.action}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-primary">
                      {play.points}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Match Over Modal */}
      <Modal visible={!!winner} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-background rounded-[32px] p-8 w-full max-w-sm gap-5 items-center">
            <View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
              <Trophy size={32} color={theme.primary} />
            </View>
            <View className="items-center gap-1">
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Match Over
              </Text>
              <Text className="text-2xl font-black text-foreground text-center">
                {winningTeamName}
              </Text>
              <Text className="text-xs font-semibold text-muted-foreground">
                Wins!
              </Text>
            </View>
            <View className="bg-secondary rounded-2xl px-8 py-3 flex-row gap-4 items-center">
              <Text className="text-3xl font-black text-primary">{scoreA}</Text>
              <Text className="text-lg font-black text-muted-foreground opacity-40">
                –
              </Text>
              <Text className="text-3xl font-black text-foreground">
                {scoreB}
              </Text>
            </View>
            <View className="w-full gap-3">
              <Pressable
                onPress={handleSaveMatch}
                disabled={isSaving}
                className="bg-primary py-3.5 rounded-full items-center justify-center active:scale-[0.98] transition-transform"
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text className="text-white text-sm font-extrabold uppercase tracking-widest">
                    Save & Update Stats
                  </Text>
                )}
              </Pressable>
              <Pressable
                onPress={handleReset}
                className="bg-secondary py-3.5 rounded-full items-center justify-center border border-black/5 active:opacity-70"
              >
                <Text className="text-foreground text-sm font-extrabold uppercase tracking-widest">
                  Discard
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
