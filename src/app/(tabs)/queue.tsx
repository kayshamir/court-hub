import { CourtCanvas } from "@/components/court-preview";
import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { getCourts, clearAllMatchups } from "@/services/database";
import { endSession, fetchActivePlayers } from "@/services/player-service";
import {
  getPairingMode,
  setPairingMode,
  subscribeToPairingMode,
  subscribeToQueue,
  autoAssignMatchupsToEmptyCourts,
  clearAllPools,
  rebuildGlobalQueue,
  manualAssignCourt,
} from "@/services/queue-service";
import { getGlobalQueue, getActiveMatchups } from "@/services/database";
import { SportType } from "@/types/court";
import { PairingMode, Player } from "@/types/player";
import { Matchup } from "@/types/queue";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CourtCard({
  court,
  currentMatch,
  onPressScore,
  onAssign,
  isManualMode,
}: {
  court: DBCourt;
  currentMatch: Matchup | undefined;
  onPressScore: () => void;
  onAssign?: () => void;
  isManualMode?: boolean;
}) {
  const hasMatch = !!currentMatch;
  const matchType = court.matchType;
  const theme = useTheme();

  return (
    <Pressable
      className="bg-secondary rounded-[32px] p-5 border border-border gap-5 mb-5 w-full max-w-[800px] self-center active:scale-[0.98] transition-transform"
      onPress={onPressScore}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <AppIcon name="sportscourt.fill" tintColor="#C1121F" size={18} />
          </View>
          <View>
            <Text className="text-lg font-black text-foreground">
              {court.name}
            </Text>
            <Text className="text-xs font-semibold text-muted-foreground">
              {court.sport} • {court.matchType}
            </Text>
          </View>
        </View>

        {!hasMatch && (
          <View className="bg-muted-foreground/10 px-4 py-2 rounded-full">
            <Text className="text-muted-foreground text-xs font-extrabold uppercase tracking-wide">
              Empty
            </Text>
          </View>
        )}
      </View>

      {/* Court board visualizer */}
      <View className="overflow-hidden rounded-2xl">
        <CourtCanvas
          sportType={court.sport.toLowerCase() as SportType}
          aspectRatio={2.2 / 1}
        >
          {hasMatch ? (
            <>
              {/* Left Half (Team A) */}
              <View
                style={{ width: "50%" }}
                className="absolute left-0 top-0 bottom-0 justify-center items-center gap-4 flex-row"
              >
                {matchType.toLowerCase() === "doubles" &&
                currentMatch.teamA.length > 1 ? (
                  <>
                    <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">
                        {currentMatch.teamA[0].name}
                      </Text>
                    </View>
                    <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">
                        {currentMatch.teamA[1].name}
                      </Text>
                    </View>
                  </>
                ) : currentMatch.teamA.length > 0 ? (
                  <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                    <Text className="text-[10px] font-black text-white">
                      {currentMatch.teamA[0].name}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Right Half (Team B) */}
              <View
                style={{ width: "50%" }}
                className="absolute right-0 top-0 bottom-0 justify-center items-center gap-4 flex-row"
              >
                {matchType.toLowerCase() === "doubles" &&
                currentMatch.teamB.length > 1 ? (
                  <>
                    <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">
                        {currentMatch.teamB[0].name}
                      </Text>
                    </View>
                    <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">
                        {currentMatch.teamB[1].name}
                      </Text>
                    </View>
                  </>
                ) : currentMatch.teamB.length > 0 ? (
                  <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                    <Text className="text-[10px] font-black text-white">
                      {currentMatch.teamB[0].name}
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          ) : (
            <View className="absolute inset-0 items-center justify-center bg-black/10">
              <Text className="text-sm font-bold text-white/50">
                Court Available
              </Text>
            </View>
          )}
        </CourtCanvas>
      </View>

      {isManualMode && (
        <Pressable
          onPress={onAssign}
          className="bg-primary/10 border border-primary/30 rounded-2xl p-3 flex-row items-center justify-center gap-2 active:opacity-70"
        >
          <AppIcon name="person.badge.plus" tintColor={theme.primary} size={14} />
          <Text className="text-xs font-extrabold text-primary">
            {hasMatch ? "Reassign Players" : "Assign Players"}
          </Text>
        </Pressable>
      )}
    </Pressable>
  );
}

export default function QueueScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [courts, setCourts] = React.useState<DBCourt[]>([]);
  const [pairingModeState, setPairingModeState] =
    React.useState<PairingMode>(getPairingMode());
  const [globalQueue, setGlobalQueue] = React.useState<Matchup[]>([]);
  const [activeMatchups, setActiveMatchups] = React.useState<Map<number, Matchup>>(new Map());
  const [isEndSessionModalVisible, setIsEndSessionModalVisible] =
    React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Manual assignment mode
  const [assignMode, setAssignMode] = React.useState<"auto" | "manual">("auto");
  const assignModeRef = React.useRef<"auto" | "manual">("auto");
  const [assignModalCourt, setAssignModalCourt] = React.useState<DBCourt | null>(null);
  const [activePlayers, setActivePlayers] = React.useState<Player[]>([]);
  const [playerAssignments, setPlayerAssignments] = React.useState<Map<number, "A" | "B">>(new Map());

  const loadData = React.useCallback(async () => {
    try {
      const [dbCourts, dbGlobalQueue, dbActiveMatchups, dbActivePlayers] = await Promise.all([
        getCourts(),
        getGlobalQueue(),
        getActiveMatchups(),
        fetchActivePlayers(),
      ]);

      setCourts(dbCourts);
      setActivePlayers(dbActivePlayers);

      const parsedQueue = dbGlobalQueue.map(m => ({
        id: m.id.toString(),
        teamA: JSON.parse(m.team_a),
        teamB: JSON.parse(m.team_b),
      }));
      setGlobalQueue(parsedQueue);

      const parsedActive = new Map<number, Matchup>();
      dbActiveMatchups.forEach(m => {
        if (m.courtId) {
          parsedActive.set(m.courtId, {
            id: m.id.toString(),
            teamA: JSON.parse(m.team_a),
            teamB: JSON.parse(m.team_b),
          });
        }
      });
      setActiveMatchups(parsedActive);

      // Auto-rebuild queue when it's empty and no games are in progress
      if (parsedQueue.length === 0 && dbActiveMatchups.length === 0) {
        if (dbActivePlayers.length >= 2) {
          await rebuildGlobalQueue(dbCourts);
          return;
        }
      }

      if (assignModeRef.current === "auto") {
        await autoAssignMatchupsToEmptyCourts(dbCourts);
      }
    } catch (error) {
      console.error("Error loading queue data:", error);
    }
  }, []);

  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  }, [loadData]);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [loadData]),
  );

  React.useEffect(() => {
    loadData();
  }, [pairingModeState]);

  React.useEffect(() => {
    const unsubQueue = subscribeToQueue(() => {
      loadData();
    });

    const unsubPairing = subscribeToPairingMode((newMode) => {
      setPairingModeState(newMode);
    });

    return () => {
      unsubQueue();
      unsubPairing();
    };
  }, []);

  const handleSetAssignMode = (mode: "auto" | "manual") => {
    assignModeRef.current = mode;
    setAssignMode(mode);
    loadData();
  };

  const handleOpenAssignModal = (court: DBCourt) => {
    setAssignModalCourt(court);
    const current = activeMatchups.get(court.id);
    const pre = new Map<number, "A" | "B">();
    if (current) {
      current.teamA.forEach((p: Player) => pre.set(p.id, "A"));
      current.teamB.forEach((p: Player) => pre.set(p.id, "B"));
    }
    setPlayerAssignments(pre);
  };

  const togglePlayerAssignment = (player: Player) => {
    if (!assignModalCourt) return;
    const maxPerTeam = assignModalCourt.matchType.toLowerCase() === "doubles" ? 2 : 1;
    const current = playerAssignments.get(player.id);
    const aCount = [...playerAssignments.values()].filter(v => v === "A").length;
    const bCount = [...playerAssignments.values()].filter(v => v === "B").length;
    const next = new Map(playerAssignments);
    if (current === undefined) {
      if (aCount < maxPerTeam) next.set(player.id, "A");
      else if (bCount < maxPerTeam) next.set(player.id, "B");
    } else if (current === "A") {
      if (bCount < maxPerTeam) next.set(player.id, "B");
      else next.delete(player.id);
    } else {
      next.delete(player.id);
    }
    setPlayerAssignments(next);
  };

  const handleConfirmAssignment = async () => {
    if (!assignModalCourt) return;
    const teamA = activePlayers.filter(p => playerAssignments.get(p.id) === "A");
    const teamB = activePlayers.filter(p => playerAssignments.get(p.id) === "B");
    await manualAssignCourt(assignModalCourt.id, teamA, teamB);
    setAssignModalCourt(null);
    setPlayerAssignments(new Map());
  };

  const handleEndSession = async () => {
    try {
      await endSession();
      clearAllPools();
      setIsEndSessionModalVisible(false);
      await loadData();
    } catch (error) {
      console.error("Error ending session:", error);
    }
  };

  const maxPerTeam = assignModalCourt?.matchType.toLowerCase() === "doubles" ? 2 : 1;
  const teamACount = [...playerAssignments.values()].filter(v => v === "A").length;
  const teamBCount = [...playerAssignments.values()].filter(v => v === "B").length;
  const isAssignReady = teamACount === maxPerTeam && teamBCount === maxPerTeam;
  const remainingToSelect = maxPerTeam * 2 - teamACount - teamBCount;

  const insets = {
    ...safeAreaInsets,
    bottom: safeAreaInsets.bottom + BottomTabInset + Spacing.four,
  };

  const contentPlatformStyle = Platform.select({
    android: { paddingBottom: insets.bottom },
    ios: { paddingBottom: insets.bottom },
    default: { paddingBottom: Spacing.four },
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
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        <View className="px-5 max-w-[800px] w-full self-center">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2 mb-4">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                Court Queue
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Live Rotation
              </Text>
            </View>
            <View className="flex-row items-center gap-3">
              <Pressable
                onPress={() => setIsEndSessionModalVisible(true)}
                className="bg-red-500/10 w-10 h-10 rounded-full items-center justify-center border border-red-500/20 active:opacity-70"
              >
                <AppIcon
                  name="stop.circle.fill"
                  tintColor="#ef4444"
                  size={16}
                />
              </Pressable>
              <Pressable
                onPress={() => router.push("/create-court")}
                className="bg-primary w-10 h-10 rounded-full items-center justify-center active:opacity-80"
              >
                <AppIcon name="plus" tintColor="#fff" size={16} />
              </Pressable>
            </View>
          </View>

          {/* Assignment Mode Toggle */}
          <View className="flex-row gap-2 mb-4">
            {([
              { id: "auto", label: "Auto Queue", icon: "arrow.triangle.2.circlepath", desc: "Queue assigns players" },
              { id: "manual", label: "Manual Select", icon: "hand.tap.fill", desc: "Pick players per court" },
            ] as const).map((mode) => {
              const isActive = assignMode === mode.id;
              return (
                <Pressable
                  key={mode.id}
                  onPress={() => handleSetAssignMode(mode.id)}
                  className={`flex-1 py-3.5 px-3 rounded-3xl border items-center gap-1 active:opacity-80 ${
                    isActive ? "bg-primary/10 border-primary/50" : "bg-secondary border-border"
                  }`}
                >
                  <AppIcon
                    name={mode.icon}
                    tintColor={isActive ? theme.primary : theme.textSecondary}
                    size={16}
                  />
                  <Text className={`text-xs font-extrabold ${isActive ? "text-primary" : "text-foreground"}`}>
                    {mode.label}
                  </Text>
                  <Text className={`text-[9px] font-medium text-center ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>
                    {mode.desc}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Pairing Mode Selector — only in auto mode */}
          {assignMode === "auto" && (
            <View className="bg-secondary rounded-[32px] p-5 border border-border gap-4 mb-6">
              <View>
                <Text className="text-lg font-black text-foreground tracking-tight">
                  Pairing Mode
                </Text>
                <Text className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Select how players are grouped
                </Text>
              </View>
              <View className="flex-row gap-2">
                {([
                  { id: "same_level", label: "Same Level", icon: "person.3.fill", desc: "Similar skills" },
                  { id: "balanced_mix", label: "Balanced Mix", icon: "equal", desc: "Even teams" },
                  { id: "random", label: "Random", icon: "dice.fill", desc: "Any combination" },
                ] as const).map((mode) => {
                  const isActive = pairingModeState === mode.id;
                  return (
                    <Pressable
                      key={mode.id}
                      onPress={async () => {
                        setPairingMode(mode.id as PairingMode);
                        await clearAllMatchups();
                        await rebuildGlobalQueue(courts);
                      }}
                      className={`flex-1 py-4 px-2 rounded-3xl border items-center justify-center transition-all ${
                        isActive ? "bg-primary/10 border-primary/50" : "bg-background border-border/50"
                      }`}
                    >
                      <View className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${isActive ? "bg-primary/20" : "bg-secondary border border-border/50"}`}>
                        <AppIcon name={mode.icon as any} tintColor={isActive ? theme.primary : theme.textSecondary} size={16} />
                      </View>
                      <Text className={`text-[11px] font-bold text-center ${isActive ? "text-primary" : "text-foreground"}`}>
                        {mode.label}
                      </Text>
                      <Text className={`text-[9px] font-medium text-center mt-0.5 px-1 ${isActive ? "text-primary/70" : "text-muted-foreground"}`}>
                        {mode.desc}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Vertical Court Cards list */}
        <View className="px-5">
          {courts.length === 0 ? (
            <View className="py-12 items-center justify-center border border-dashed border-border rounded-3xl bg-secondary/50">
              <Text className="text-muted-foreground font-medium">
                No courts available.
              </Text>
            </View>
          ) : (
            courts.map((court) => {
              const currentMatch = activeMatchups.get(court.id);
              return (
                <CourtCard
                  key={court.id}
                  court={court}
                  currentMatch={currentMatch}
                  isManualMode={assignMode === "manual"}
                  onAssign={() => handleOpenAssignModal(court)}
                  onPressScore={() => {
                    router.push({
                      pathname: "/score",
                      params: {
                        courtId: court.id.toString(),
                        courtName: court.name,
                        sport: court.sport,
                        matchType: court.matchType,
                        pairingMode: pairingModeState,
                      },
                    });
                  }}
                />
              );
            })
          )}

          {/* Global Queue — shown below all courts */}
          <View className="mt-2 mb-6 bg-secondary rounded-[32px] p-5 border border-border">
            <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-4">
              Match Queue
            </Text>
            {globalQueue.length === 0 ? (
              <Text className="text-xs font-medium text-muted-foreground">
                No matchups scheduled.
              </Text>
            ) : (
              <View className="gap-2.5">
                {globalQueue.map((match, mIdx) => {
                  const isNext = mIdx === 0;
                  return (
                    <View
                      key={match.id}
                      className={`flex-row justify-between items-center p-3 rounded-2xl border ${
                        isNext
                          ? "bg-primary/5 border-primary/20"
                          : "bg-background border-border"
                      }`}
                    >
                      <View className="flex-row items-center gap-3">
                        <View
                          className={`w-6 h-6 rounded-full items-center justify-center ${
                            isNext ? "bg-foreground/10" : "bg-secondary"
                          }`}
                        >
                          <Text className="text-[10px] font-black text-muted-foreground">
                            {mIdx + 1}
                          </Text>
                        </View>
                        <View>
                          <Text className="text-xs font-black text-foreground">
                            {match.teamA.map((p) => p.name).join(" & ")}{" "}
                            <Text className="text-muted-foreground font-medium text-[10px]">
                              vs
                            </Text>{" "}
                            {match.teamB.map((p) => p.name).join(" & ")}
                          </Text>
                          <Text className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                            {isNext ? "Next Matchup" : `Upcoming #${mIdx + 1}`}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Manual Player Assignment Modal */}
      <Modal
        visible={!!assignModalCourt}
        animationType="slide"
        transparent
        onRequestClose={() => { setAssignModalCourt(null); setPlayerAssignments(new Map()); }}
      >
        <Pressable
          className="flex-1 justify-end bg-black/50"
          onPress={() => { setAssignModalCourt(null); setPlayerAssignments(new Map()); }}
        >
          <Pressable className="bg-background rounded-t-[32px] p-6 gap-5" onPress={e => e.stopPropagation()}>
            {/* Modal header */}
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xl font-extrabold text-foreground">Assign Players</Text>
                <Text className="text-xs font-semibold text-muted-foreground">
                  {assignModalCourt?.name} · {assignModalCourt?.matchType} ({maxPerTeam}v{maxPerTeam})
                </Text>
              </View>
              <Pressable
                onPress={() => { setAssignModalCourt(null); setPlayerAssignments(new Map()); }}
                className="w-8 h-8 rounded-full bg-secondary items-center justify-center active:opacity-70"
              >
                <AppIcon name="xmark" tintColor={theme.foreground} size={14} />
              </Pressable>
            </View>

            {/* Team counters */}
            <View className="flex-row gap-3">
              <View className={`flex-1 rounded-2xl p-3 items-center border ${teamACount === maxPerTeam ? "bg-[#C1121F]/10 border-[#C1121F]/40" : "bg-secondary border-border"}`}>
                <Text className="text-[10px] font-extrabold text-[#C1121F] uppercase tracking-wider">Team A</Text>
                <Text className="text-2xl font-black text-foreground">{teamACount}/{maxPerTeam}</Text>
              </View>
              <View className={`flex-1 rounded-2xl p-3 items-center border ${teamBCount === maxPerTeam ? "bg-[#1E3A8A]/10 border-[#1E3A8A]/40" : "bg-secondary border-border"}`}>
                <Text className="text-[10px] font-extrabold text-[#1E3A8A] uppercase tracking-wider">Team B</Text>
                <Text className="text-2xl font-black text-foreground">{teamBCount}/{maxPerTeam}</Text>
              </View>
            </View>

            <Text className="text-[10px] font-medium text-muted-foreground -mt-2">
              Tap a player to assign → Team A → Team B → remove
            </Text>

            {/* Player list */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 280 }}>
              <View className="gap-2">
                {activePlayers.length === 0 ? (
                  <Text className="text-xs text-muted-foreground text-center py-6">
                    No active players. Activate players in the Players tab first.
                  </Text>
                ) : (
                  activePlayers.map(player => {
                    const assignment = playerAssignments.get(player.id);
                    return (
                      <Pressable
                        key={player.id}
                        onPress={() => togglePlayerAssignment(player)}
                        className={`flex-row items-center justify-between p-3.5 rounded-2xl border active:opacity-70 ${
                          assignment === "A"
                            ? "bg-[#C1121F]/10 border-[#C1121F]/30"
                            : assignment === "B"
                            ? "bg-[#1E3A8A]/10 border-[#1E3A8A]/30"
                            : "bg-secondary border-border"
                        }`}
                      >
                        <View>
                          <Text className="text-sm font-extrabold text-foreground">{player.name}</Text>
                          <Text className="text-[10px] font-medium text-muted-foreground">{player.level}</Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${
                          assignment === "A" ? "bg-[#C1121F]" :
                          assignment === "B" ? "bg-[#1E3A8A]" :
                          "bg-muted-foreground/20"
                        }`}>
                          <Text className="text-[10px] font-black text-white">
                            {assignment === "A" ? "Team A" : assignment === "B" ? "Team B" : "Tap"}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })
                )}
              </View>
            </ScrollView>

            {/* Confirm button */}
            <Pressable
              onPress={handleConfirmAssignment}
              disabled={!isAssignReady}
              className={`py-4 rounded-full items-center justify-center ${isAssignReady ? "bg-primary active:opacity-80" : "bg-muted-foreground/20"}`}
            >
              <Text className={`text-sm font-extrabold uppercase tracking-wider ${isAssignReady ? "text-white" : "text-muted-foreground"}`}>
                {isAssignReady
                  ? "Assign to Court"
                  : `Select ${remainingToSelect} more player${remainingToSelect !== 1 ? "s" : ""}`}
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* End Session Modal */}
      <Modal
        visible={isEndSessionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsEndSessionModalVisible(false)}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={() => setIsEndSessionModalVisible(false)}
        >
          <Pressable
            className="w-full max-w-md rounded-[28px] bg-background p-6"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-extrabold text-foreground mb-2">
              End Session?
            </Text>
            <Text className="text-sm text-muted-foreground leading-6">
              This will reset all active players to inactive and clear all
              waiting pools. This action cannot be undone.
            </Text>

            <View className="flex-row justify-end gap-3 mt-6">
              <Pressable
                onPress={() => setIsEndSessionModalVisible(false)}
                className="rounded-full border border-muted-foreground/30 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-muted-foreground">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleEndSession}
                className="rounded-full bg-red-500 px-4 py-3 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-white">
                  End Session
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
