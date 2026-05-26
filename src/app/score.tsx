import { CourtCanvas } from "@/components/court-preview";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { saveMatchResult } from "@/services/match-service";
import { getActiveMatchupForCourt } from "@/services/database";
import { rotateCourt } from "@/services/queue-service";
import { SportType } from "@/types/court";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Activity,
  ChevronLeft,
  Info,
  Minus,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Undo2,
} from "lucide-react-native";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
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

interface MatchState {
  scoreA: number;
  scoreB: number;
  teamAPlayers: string[];
  teamBPlayers: string[];
  servingTeam: "A" | "B";
}

const getPlayerNumber = (
  player: string,
  initialTeam: string[],
  prefix: string,
) => {
  if (initialTeam.length <= 1) return prefix;
  const idx = initialTeam.indexOf(player);
  return idx === -1 ? prefix : `${prefix}${idx + 1}`;
};

export default function ScoreScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
  const params = useLocalSearchParams<{
    courtId?: string;
    courtName?: string;
    sport?: string;
    matchType?: string;
  }>();

  const sportType = (params.sport?.toLowerCase() || "badminton") as SportType;

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
  const [initialTeamA, setInitialTeamA] = React.useState<string[]>([]);
  const [initialTeamB, setInitialTeamB] = React.useState<string[]>([]);
  const [teamAPlayers, setTeamAPlayers] = React.useState<string[]>([]);
  const [teamBPlayers, setTeamBPlayers] = React.useState<string[]>([]);
  const [matchMode, setMatchMode] = React.useState<"singles" | "doubles">("doubles");

  // Loading state — prevents false "empty court" opacity flash on initial render
  const [isMatchLoading, setIsMatchLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const courtId = params.courtId ? parseInt(params.courtId as string, 10) : 1;

  const loadMatchup = React.useCallback(async () => {
    try {
      const matchup = await getActiveMatchupForCourt(courtId);
      if (matchup) {
        const tA = JSON.parse(matchup.team_a).map((p: any) => p.name);
        const tB = JSON.parse(matchup.team_b).map((p: any) => p.name);
        setInitialTeamA(tA);
        setInitialTeamB(tB);
        setTeamAPlayers(tA);
        setTeamBPlayers(tB);
        setMatchMode(tA.length > 1 ? "doubles" : "singles");
      }
    } catch (e) {
      console.error("Failed to load matchup", e);
    } finally {
      setIsMatchLoading(false);
    }
  }, [courtId]);

  React.useEffect(() => {
    loadMatchup();
  }, [loadMatchup]);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    setIsMatchLoading(true);
    await loadMatchup();
    setIsRefreshing(false);
  }, [loadMatchup]);

  const [servingTeam, setServingTeam] = React.useState<"A" | "B">("A");
  const [history, setHistory] = React.useState<MatchState[]>([]);

  const hasPlayers = teamAPlayers.length > 0;
  // Only show disabled state after we've confirmed the court is empty (not during load)
  const isCourtEmpty = !isMatchLoading && teamAPlayers.length === 0;
  const matchStarted = scoreA > 0 || scoreB > 0;

  const currentServerName = React.useMemo(() => {
    if (matchMode === "singles") {
      return servingTeam === "A" ? teamAPlayers[0] : teamBPlayers[0];
    }
    const score = servingTeam === "A" ? scoreA : scoreB;
    const players = servingTeam === "A" ? teamAPlayers : teamBPlayers;
    if (players.length < 2) return players[0] ?? "";
    return players[score % 2 === 0 ? 0 : 1];
  }, [servingTeam, scoreA, scoreB, teamAPlayers, teamBPlayers, matchMode]);

  const currentReceiverName = React.useMemo(() => {
    if (servingTeam === "A") {
      if (matchMode === "singles") return teamBPlayers[0];
      return teamBPlayers[scoreA % 2 === 0 ? 0 : 1];
    } else {
      if (matchMode === "singles") return teamAPlayers[0];
      return teamAPlayers[scoreB % 2 === 0 ? 0 : 1];
    }
  }, [servingTeam, scoreA, scoreB, teamAPlayers, teamBPlayers, matchMode]);

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
    if (isPaused || winner || !hasPlayers) return;

    setHistory((prev) => [
      ...prev,
      { scoreA, scoreB, teamAPlayers: [...teamAPlayers], teamBPlayers: [...teamBPlayers], servingTeam },
    ]);

    const newA = team === "A" ? scoreA + 1 : scoreA;
    const newB = team === "B" ? scoreB + 1 : scoreB;
    if (team === "A") setScoreA(newA);
    else setScoreB(newB);

    let scoringPlayer = "";
    if (team === "A") {
      scoringPlayer =
        matchMode === "doubles" && teamAPlayers.length > 1
          ? teamAPlayers[newA % 2 === 0 ? 1 : 0]
          : teamAPlayers[0];
    } else {
      scoringPlayer =
        matchMode === "doubles" && teamBPlayers.length > 1
          ? teamBPlayers[newB % 2 === 0 ? 1 : 0]
          : teamBPlayers[0];
    }

    setRecentPlays((prev) => [
      {
        id: Date.now(),
        player: scoringPlayer || (team === "A" ? "Team A" : "Team B"),
        action: "Point Won",
        points: "+1 PT",
      },
      ...prev.slice(0, 4),
    ]);

    if (matchMode === "doubles" && teamAPlayers.length > 1 && teamBPlayers.length > 1) {
      if (servingTeam === team) {
        if (team === "A") setTeamAPlayers((prev) => [prev[1], prev[0]]);
        else setTeamBPlayers((prev) => [prev[1], prev[0]]);
      } else {
        setServingTeam(team);
      }
    } else {
      setServingTeam(team);
    }

    const result = checkWinner(newA, newB, winTarget, winBy2);
    if (result) setWinner(result);
  };

  const removePoint = (team: "A" | "B") => {
    if (isPaused || winner || !hasPlayers) return;

    if (team === "A" && scoreA > 0) {
      setHistory((prev) => [
        ...prev,
        { scoreA, scoreB, teamAPlayers: [...teamAPlayers], teamBPlayers: [...teamBPlayers], servingTeam },
      ]);
      const newA = scoreA - 1;
      setScoreA(newA);
      if (matchMode === "doubles" && servingTeam === "A") {
        setTeamAPlayers((prev) => [prev[1], prev[0]]);
      }
    }
    if (team === "B" && scoreB > 0) {
      setHistory((prev) => [
        ...prev,
        { scoreA, scoreB, teamAPlayers: [...teamAPlayers], teamBPlayers: [...teamBPlayers], servingTeam },
      ]);
      const newB = scoreB - 1;
      setScoreB(newB);
      if (matchMode === "doubles" && servingTeam === "B") {
        setTeamBPlayers((prev) => [prev[1], prev[0]]);
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const nextHistory = [...history];
    const prevState = nextHistory.pop();
    if (prevState) {
      setScoreA(prevState.scoreA);
      setScoreB(prevState.scoreB);
      setTeamAPlayers(prevState.teamAPlayers);
      setTeamBPlayers(prevState.teamBPlayers);
      setServingTeam(prevState.servingTeam);
      setWinner(null);
      setHistory(nextHistory);
      setRecentPlays((prev) => prev.slice(1));
    }
  };

  const handleReset = () => {
    setScoreA(0);
    setScoreB(0);
    setTeamAPlayers(initialTeamA);
    setTeamBPlayers(initialTeamB);
    setServingTeam("A");
    setWinner(null);
    setIsPaused(false);
    setRecentPlays([]);
    setHistory([]);
  };

  const handleSaveMatch = async () => {
    if (!winner) return;
    setIsSaving(true);
    try {
      await saveMatchResult(teamAPlayers, teamBPlayers, scoreA, scoreB, winner);
      if (params.courtId !== undefined) {
        await rotateCourt(
          parseInt(params.courtId as string, 10),
          params.matchType ?? "doubles",
        );
      }
      setWinner(null);
      router.back();
    } catch (e) {
      console.error("Failed to save match:", e);
    } finally {
      setIsSaving(false);
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
    winner === "A" ? teamAPlayers.join(" & ") : teamBPlayers.join(" & ");
  const isCustomSelected = !WIN_OPTIONS.includes(winTarget);
  const swapThreshold = Math.ceil(winTarget / 2);
  const isSwapped = scoreA >= swapThreshold || scoreB >= swapThreshold;

  const leftHalfPlayers = isSwapped ? teamBPlayers : teamAPlayers;
  const rightHalfPlayers = isSwapped ? teamAPlayers : teamBPlayers;
  const leftInitialTeam = isSwapped ? initialTeamB : initialTeamA;
  const rightInitialTeam = isSwapped ? initialTeamA : initialTeamB;
  const leftPrefix = isSwapped ? "B" : "A";
  const rightPrefix = isSwapped ? "A" : "B";
  const leftColor = isSwapped ? "bg-[#1E3A8A]" : "bg-[#C1121F]";
  const rightColor = isSwapped ? "bg-[#C1121F]" : "bg-[#1E3A8A]";

  return (
    <View className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={[
          { paddingTop: safeAreaInsets.top + Spacing.two, paddingHorizontal: 20 },
          contentPlatformStyle,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View className="max-w-[800px] w-full self-center gap-6 pb-6">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2">
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => router.back()}
                className="w-10 h-10 rounded-full bg-secondary border border-border items-center justify-center active:scale-95"
              >
                <ChevronLeft size={20} color={theme.foreground} />
              </Pressable>
              <View>
                <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                  {params.courtName}
                </Text>
                {params.courtName ? (
                  <Text className="text-sm font-medium text-muted-foreground">
                    Live Scoring ({params.sport})
                  </Text>
                ) : (
                  <Text className="text-sm font-medium text-muted-foreground">
                    Scoring Dashboard
                  </Text>
                )}
              </View>
            </View>
            <View className="bg-[#C1121F]/10 px-3.5 py-1 rounded-full flex-row items-center gap-1.5">
              <View
                className={`w-2 h-2 rounded-full ${isCourtEmpty || isPaused ? "bg-muted-foreground" : "bg-[#C1121F] animate-pulse"}`}
              />
              <Text className="text-xs font-bold text-[#C1121F] uppercase">
                {isCourtEmpty ? "Empty" : isPaused ? "Paused" : "Live"}
              </Text>
            </View>
          </View>

          {/* Empty court banner — only shown after loading confirms no active matchup */}
          {isCourtEmpty && (
            <View className="bg-muted-foreground/10 border border-border rounded-3xl p-5 items-center gap-2">
              <Text className="text-sm font-extrabold text-muted-foreground uppercase tracking-wide">
                No Match Assigned
              </Text>
              <Text className="text-xs text-muted-foreground text-center">
                Go back to the Queue tab — a match will be auto-assigned to this
                court when available.
              </Text>
            </View>
          )}

          {/* Court Visualizer */}
          <View className="bg-secondary rounded-[32px] p-4 border border-border gap-3.5">
            <View className="flex-row justify-between items-center px-1">
              <Text className="text-xs font-extrabold text-muted-foreground uppercase tracking-widest">
                Court Visualizer
              </Text>
              <View className="flex-row gap-4 items-center">
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2.5 h-2.5 rounded-full bg-[#C1121F]" />
                  <Text className="text-[10px] font-bold text-muted-foreground">TEAM A (RED)</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <View className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                  <Text className="text-[10px] font-bold text-muted-foreground">TEAM B (BLUE)</Text>
                </View>
              </View>
            </View>

            <CourtCanvas sportType={sportType} aspectRatio={2.2 / 1}>
              {/* Left Half */}
              <View
                style={{ width: "50%" }}
                className="absolute left-0 top-0 bottom-0 justify-around py-4 items-center"
              >
                {matchMode === "doubles" && leftHalfPlayers.length > 1 ? (
                  <View className="items-center justify-center relative w-12 h-12">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${leftColor}`}
                      style={leftHalfPlayers[1] === currentServerName ? { transform: [{ scale: 1.1 }], borderColor: "#facc15" } : undefined}
                    >
                      <Text className="text-white text-xs font-black leading-none">
                        {getPlayerNumber(leftHalfPlayers[1], leftInitialTeam, leftPrefix)}
                      </Text>
                      {leftHalfPlayers[1] === currentServerName && (
                        <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">SVC</Text>
                      )}
                      {leftHalfPlayers[1] === currentReceiverName && (
                        <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">RCV</Text>
                      )}
                    </View>
                    {leftHalfPlayers[1] === currentServerName && (
                      <View className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 border border-white items-center justify-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-black/60" />
                      </View>
                    )}
                  </View>
                ) : null}

                <View className="items-center justify-center relative w-12 h-12">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${leftColor}`}
                    style={leftHalfPlayers[0] === currentServerName ? { transform: [{ scale: 1.1 }], borderColor: "#facc15" } : undefined}
                  >
                    <Text className="text-white text-xs font-black leading-none">
                      {getPlayerNumber(leftHalfPlayers[0], leftInitialTeam, leftPrefix)}
                    </Text>
                    {leftHalfPlayers[0] === currentServerName && (
                      <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">SVC</Text>
                    )}
                    {leftHalfPlayers[0] === currentReceiverName && (
                      <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">RCV</Text>
                    )}
                  </View>
                  {leftHalfPlayers[0] === currentServerName && (
                    <View className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 border border-white items-center justify-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-black/60" />
                    </View>
                  )}
                </View>
              </View>

              {/* Right Half */}
              <View
                style={{ width: "50%" }}
                className="absolute right-0 top-0 bottom-0 justify-around py-4 items-center"
              >
                <View className="items-center justify-center relative w-12 h-12">
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${rightColor}`}
                    style={rightHalfPlayers[0] === currentServerName ? { transform: [{ scale: 1.1 }], borderColor: "#facc15" } : undefined}
                  >
                    <Text className="text-white text-xs font-black leading-none">
                      {getPlayerNumber(rightHalfPlayers[0], rightInitialTeam, rightPrefix)}
                    </Text>
                    {rightHalfPlayers[0] === currentServerName && (
                      <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">SVC</Text>
                    )}
                    {rightHalfPlayers[0] === currentReceiverName && (
                      <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">RCV</Text>
                    )}
                  </View>
                  {rightHalfPlayers[0] === currentServerName && (
                    <View className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 border border-white items-center justify-center">
                      <View className="w-1.5 h-1.5 rounded-full bg-black/60" />
                    </View>
                  )}
                </View>

                {matchMode === "doubles" && rightHalfPlayers.length > 1 ? (
                  <View className="items-center justify-center relative w-12 h-12">
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center border-2 border-white ${rightColor}`}
                      style={rightHalfPlayers[1] === currentServerName ? { transform: [{ scale: 1.1 }], borderColor: "#facc15" } : undefined}
                    >
                      <Text className="text-white text-xs font-black leading-none">
                        {getPlayerNumber(rightHalfPlayers[1], rightInitialTeam, rightPrefix)}
                      </Text>
                      {rightHalfPlayers[1] === currentServerName && (
                        <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">SVC</Text>
                      )}
                      {rightHalfPlayers[1] === currentReceiverName && (
                        <Text className="text-white text-[7px] font-black leading-none mt-0.5 uppercase">RCV</Text>
                      )}
                    </View>
                    {rightHalfPlayers[1] === currentServerName && (
                      <View className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 border border-white items-center justify-center">
                        <View className="w-1.5 h-1.5 rounded-full bg-black/60" />
                      </View>
                    )}
                  </View>
                ) : null}
              </View>
            </CourtCanvas>

            <View className="flex-row justify-between pt-1 px-1">
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Team A: {teamAPlayers.join(" & ") || "—"}
              </Text>
              <Text className="text-[10px] font-semibold text-muted-foreground">
                Team B: {teamBPlayers.join(" & ") || "—"}
              </Text>
            </View>

            {isSwapped && (
              <View className="bg-[#C1121F]/10 px-4 py-1.5 rounded-full items-center self-center my-1.5 border border-[#C1121F]/20">
                <Text className="text-[10px] font-black text-[#C1121F] uppercase tracking-widest">
                  Court Swapped (Teams changed ends)
                </Text>
              </View>
            )}
          </View>

          {/* Scoreboard */}
          <View className="bg-secondary rounded-3xl p-5 border border-border mb-2 gap-6">
            <View className="flex-row gap-4 items-center justify-between">
              {/* Team A */}
              <View className="flex-1 items-center">
                <View className="bg-[#C1121F]/10 px-3.5 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-[#C1121F] uppercase tracking-wide">
                    {matchMode === "doubles" ? "Team A" : teamAPlayers[0] || "Team A"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => addPoint("A")}
                  disabled={isCourtEmpty}
                  className={`bg-[#C1121F] border border-[#C1121F] rounded-[32px] w-full aspect-[1/1] items-center justify-center active:scale-95 transition-transform ${isCourtEmpty ? "opacity-40" : ""}`}
                >
                  <Text className="text-7xl font-black text-white">{scoreA}</Text>
                  <Text className="text-[9px] font-extrabold text-white/70 uppercase tracking-widest mt-2">
                    {isCourtEmpty ? "No players" : "Tap to score"}
                  </Text>
                </Pressable>
                <View className="flex-row justify-center mt-3">
                  <Pressable
                    onPress={() => removePoint("A")}
                    disabled={scoreA === 0 || isCourtEmpty}
                    className={`w-12 h-12 bg-background border border-border rounded-full items-center justify-center active:scale-90 ${scoreA === 0 || isCourtEmpty ? "opacity-30" : ""}`}
                  >
                    <Minus size={16} color={theme.foreground} />
                  </Pressable>
                </View>
              </View>

              <View className="px-1 items-center justify-center">
                <Text className="text-xl font-black text-muted-foreground opacity-30">VS</Text>
              </View>

              {/* Team B */}
              <View className="flex-1 items-center">
                <View className="bg-[#1E3A8A]/10 px-3.5 py-1 rounded-full mb-3">
                  <Text className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-wide">
                    {matchMode === "doubles" ? "Team B" : teamBPlayers[0] || "Team B"}
                  </Text>
                </View>
                <Pressable
                  onPress={() => addPoint("B")}
                  disabled={isCourtEmpty}
                  className={`bg-[#1E3A8A] border border-[#1E3A8A] rounded-[32px] w-full aspect-[1/1] items-center justify-center active:scale-95 transition-transform ${isCourtEmpty ? "opacity-40" : ""}`}
                >
                  <Text className="text-7xl font-black text-white">{scoreB}</Text>
                  <Text className="text-[9px] font-extrabold text-white/70 uppercase tracking-widest mt-2">
                    {isCourtEmpty ? "No players" : "Tap to score"}
                  </Text>
                </Pressable>
                <View className="flex-row justify-center mt-3">
                  <Pressable
                    onPress={() => removePoint("B")}
                    disabled={scoreB === 0 || isCourtEmpty}
                    className={`w-12 h-12 bg-background border border-border rounded-full items-center justify-center active:scale-90 ${scoreB === 0 || isCourtEmpty ? "opacity-30" : ""}`}
                  >
                    <Minus size={16} color={theme.foreground} />
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="flex-row gap-3 pt-4 border-t border-border justify-center">
              <Pressable
                onPress={() => setIsPaused((p) => !p)}
                disabled={isCourtEmpty}
                className={`flex-row items-center bg-background px-5 py-2.5 rounded-full border border-border gap-2 ${isCourtEmpty ? "opacity-40" : "active:opacity-70"}`}
              >
                {isPaused ? <Play size={12} color={theme.foreground} /> : <Pause size={12} color={theme.foreground} />}
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {isPaused ? "Resume" : "Pause"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleUndo}
                disabled={history.length === 0}
                className={`flex-row items-center bg-background px-5 py-2.5 rounded-full border border-border gap-2 ${history.length === 0 ? "opacity-40" : "active:opacity-70"}`}
              >
                <Undo2 size={12} color={theme.foreground} />
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Undo</Text>
              </Pressable>

              <Pressable
                onPress={handleReset}
                disabled={isCourtEmpty}
                className={`flex-row items-center bg-background px-5 py-2.5 rounded-full border border-border gap-2 ${isCourtEmpty ? "opacity-40" : "active:opacity-70"}`}
              >
                <RotateCcw size={12} color={theme.foreground} />
                <Text className="text-xs font-bold text-foreground uppercase tracking-wider">Reset</Text>
              </Pressable>
            </View>
          </View>

          {/* Match Settings */}
          <View className="bg-secondary rounded-3xl p-4 border border-border gap-4">
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
                        ? "bg-[#C1121F] border-[#C1121F]"
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
                  onPress={() => { if (matchStarted) return; setShowCustomInput((v) => !v); }}
                  className={`px-4 py-2 rounded-full border ${isCustomSelected ? "bg-[#C1121F] border-[#C1121F]" : "bg-background border-black/10"} ${matchStarted ? "opacity-50" : "active:opacity-70"}`}
                >
                  <Text className={`text-xs font-extrabold ${isCustomSelected ? "text-white" : "text-foreground"}`}>
                    {isCustomSelected ? winTarget : "Custom"}
                  </Text>
                </Pressable>
              </View>

              {showCustomInput && (
                <View className="flex-row gap-2 items-center">
                  <TextInput
                    className="flex-1 bg-background border border-border rounded-2xl px-4 py-2.5 text-sm text-foreground font-medium outline-none"
                    placeholder="Enter target score"
                    placeholderTextColor={theme.textSecondary}
                    value={customTarget}
                    onChangeText={setCustomTarget}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={handleCustomConfirm}
                  />
                  <Pressable onPress={handleCustomConfirm} className="bg-primary px-4 py-2.5 rounded-2xl active:opacity-70">
                    <Text className="text-white text-xs font-extrabold">Set</Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View className="flex-row justify-between items-center pt-3 border-t border-border">
              <View className="flex-1 pr-4">
                <Text className="text-xs font-extrabold text-foreground">Win by 2</Text>
                <Text className="text-[10px] text-muted-foreground font-medium mt-0.5">
                  Must lead by 2 points at target score
                </Text>
              </View>
              <Switch
                value={winBy2}
                onValueChange={(v) => { if (!matchStarted) setWinBy2(v); }}
                disabled={matchStarted}
                trackColor={{ false: theme.grey5, true: theme.primary }}
                thumbColor="#fff"
              />
            </View>

            <View className="flex-row items-center gap-1.5 -mt-1">
              <Info size={11} color={theme.textSecondary} />
              <Text className="text-[10px] text-muted-foreground font-semibold">
                {winBy2 ? `First to ${winTarget}, win by 2 (cap ${winTarget + 9})` : `First to ${winTarget} wins`}
              </Text>
            </View>
          </View>

          {/* Recent Plays */}
          <View className="gap-3">
            <Text className="text-lg font-extrabold text-foreground">Recent Plays</Text>
            {recentPlays.length === 0 ? (
              <View className="bg-secondary/40 p-6 rounded-3xl border border-dashed border-border items-center justify-center">
                <Text className="text-xs text-muted-foreground">
                  {isCourtEmpty
                    ? "Assign a match to this court to start scoring."
                    : "No plays recorded yet. Start updating the score!"}
                </Text>
              </View>
            ) : (
              <View className="bg-secondary rounded-3xl p-4 border border-border gap-3.5">
                {recentPlays.map((play) => (
                  <View
                    key={play.id}
                    className="flex-row justify-between items-center pb-3 border-b border-black/5 last:border-b-0"
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="w-8 h-8 rounded-full bg-[#C1121F]/10 items-center justify-center">
                        <Activity size={14} color="#C1121F" />
                      </View>
                      <View>
                        <Text className="text-xs font-bold text-foreground">{play.player}</Text>
                        <Text className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                          {play.action}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-xs font-black text-[#C1121F]">{play.points}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Winner Modal */}
      <Modal visible={!!winner} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 items-center justify-center px-6">
          <View className="bg-background rounded-[32px] p-8 w-full max-w-sm gap-5 items-center">
            <View className="w-16 h-16 rounded-full bg-[#C1121F]/10 items-center justify-center">
              <Trophy size={32} color="#C1121F" />
            </View>
            <View className="items-center gap-1">
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest">
                Match Over
              </Text>
              <Text className="text-2xl font-black text-foreground text-center">{winningTeamName}</Text>
              <Text className="text-xs font-semibold text-muted-foreground">Wins!</Text>
            </View>
            <View className="bg-secondary rounded-2xl px-8 py-3 flex-row gap-4 items-center">
              <Text className="text-3xl font-black text-[#C1121F]">{scoreA}</Text>
              <Text className="text-lg font-black text-muted-foreground opacity-40">–</Text>
              <Text className="text-3xl font-black text-foreground">{scoreB}</Text>
            </View>
            <View className="w-full gap-3">
              <Pressable
                onPress={handleSaveMatch}
                disabled={isSaving}
                className="bg-[#C1121F] py-3.5 rounded-full items-center justify-center active:scale-[0.98] transition-transform"
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
                className="bg-secondary py-3.5 rounded-full items-center justify-center border border-border active:opacity-70"
              >
                <Text className="text-foreground text-sm font-extrabold uppercase tracking-widest">Discard</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
