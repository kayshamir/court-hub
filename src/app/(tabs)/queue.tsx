import { CourtCanvas } from "@/components/court-preview";
import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { getCourts } from "@/services/database";
import { endSession, fetchActivePlayers } from "@/services/player-service";
import {
  getPairingMode,
  setPairingMode,
  subscribeToPairingMode,
  subscribeToQueue,
  autoAssignMatchupsToEmptyCourts,
  clearAllPools,
} from "@/services/queue-service";
import { getGlobalQueue, getActiveMatchups } from "@/services/database";
import { SportType } from "@/types/court";
import { PairingMode, Player } from "@/types/player";
import { Matchup } from "@/types/queue";
import { useRouter } from "expo-router";
import React from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CourtCard({
  court,
  currentMatch,
  onPressScore,
}: {
  court: DBCourt;
  currentMatch: Matchup | undefined;
  onPressScore: () => void;
}) {
  const hasMatch = !!currentMatch;
  const matchType = court.matchType;

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

    </Pressable>
  );
}

export default function QueueScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [courts, setCourts] = React.useState<DBCourt[]>([]);
  const [activePlayers, setActivePlayers] = React.useState<Player[]>([]);
  const [pairingModeState, setPairingModeState] =
    React.useState<PairingMode>(getPairingMode());
  const [globalQueue, setGlobalQueue] = React.useState<Matchup[]>([]);
  const [activeMatchups, setActiveMatchups] = React.useState<Map<number, Matchup>>(new Map());
  const [isEndSessionModalVisible, setIsEndSessionModalVisible] =
    React.useState(false);
  const [, setForceUpdate] = React.useState(0);

  const loadData = async () => {
    try {
      const dbCourts = await getCourts();
      setCourts(dbCourts);
      const players = await fetchActivePlayers();
      setActivePlayers(players);

      const dbGlobalQueue = await getGlobalQueue();
      const dbActiveMatchups = await getActiveMatchups();
      
      const parsedQueue = dbGlobalQueue.map(m => ({
        id: m.id.toString(),
        teamA: JSON.parse(m.team_a),
        teamB: JSON.parse(m.team_b)
      }));
      setGlobalQueue(parsedQueue);
      
      const parsedActive = new Map<number, Matchup>();
      dbActiveMatchups.forEach(m => {
        if (m.courtId) {
          parsedActive.set(m.courtId, {
            id: m.id.toString(),
            teamA: JSON.parse(m.team_a),
            teamB: JSON.parse(m.team_b)
          });
        }
      });
      setActiveMatchups(parsedActive);

      await autoAssignMatchupsToEmptyCourts(dbCourts.map(c => c.id));
    } catch (error) {
      console.error("Error loading queue data:", error);
    }
  };

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

          {/* Pairing Mode Selector */}
          <View className="bg-secondary rounded-[32px] p-5 border border-border gap-4 mb-6">
            <View className="flex-row items-center justify-between gap-x-3 gap-y-1.5">
              <View>
                <Text className="text-lg font-black text-foreground tracking-tight">
                  Pairing Mode
                </Text>
                <Text className="text-xs font-semibold text-muted-foreground mt-0.5">
                  Select how players are grouped
                </Text>
              </View>
            </View>
            <View className="flex-row gap-2 mt-2">
              {[
                {
                  id: "same_level",
                  label: "Same Level",
                  icon: "person.3.fill",
                  desc: "Similar skills",
                },
                {
                  id: "balanced_mix",
                  label: "Balanced Mix",
                  icon: "equal",
                  desc: "Even teams",
                },
                {
                  id: "random",
                  label: "Random",
                  icon: "dice.fill",
                  desc: "Any combination",
                },
              ].map((mode) => {
                const isActive = pairingModeState === mode.id;
                return (
                  <Pressable
                    key={mode.id}
                    onPress={() => setPairingMode(mode.id as PairingMode)}
                    className={`flex-1 py-4 px-2 rounded-3xl border items-center justify-center transition-all ${
                      isActive
                        ? "bg-primary/10 border-primary/50"
                        : "bg-background border-border/50"
                    }`}
                  >
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${isActive ? "bg-primary/20" : "bg-secondary border border-border/50"}`}
                    >
                      <AppIcon
                        name={mode.icon as any}
                        tintColor={
                          isActive ? theme.primary : theme.textSecondary
                        }
                        size={16}
                      />
                    </View>
                    <Text
                      className={`text-[11px] font-bold text-center ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {mode.label}
                    </Text>
                    <Text
                      className={`text-[9px] font-medium text-center mt-0.5 px-1 ${
                        isActive ? "text-primary/70" : "text-muted-foreground"
                      }`}
                    >
                      {mode.desc}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Vertical Court Cards list */}
        <View className="px-5">
          {/* Global Queue UI */}
          <View className="mb-6 bg-secondary rounded-[32px] p-5 border border-border">
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
        </View>
      </ScrollView>

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
