import { CourtCanvas } from "@/components/court-preview";
import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { getCourts } from "@/services/database";
import { fetchActivePlayers, endSession } from "@/services/player-service";
import {
  buildBalancedPool,
  getPoolForCourt,
  setPoolForCourt,
  subscribeToPool,
  clearAllPools,
  getPairingMode,
  subscribeToPairingMode
} from "@/services/queue-service";
import { SportType } from "@/types/court";
import { Matchup } from "@/types/queue";
import { PairingMode, Player } from "@/types/player";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, Text, View, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function CourtCard({
  court,
  matchups,
  onPressScore,
}: {
  court: DBCourt;
  matchups: Matchup[];
  onPressScore: () => void;
}) {
  const currentMatch = matchups[0];
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
                {matchType.toLowerCase() === "doubles" && currentMatch.teamA.length > 1 ? (
                  <>
                    <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">{currentMatch.teamA[0].name}</Text>
                    </View>
                    <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">{currentMatch.teamA[1].name}</Text>
                    </View>
                  </>
                ) : currentMatch.teamA.length > 0 ? (
                  <View className="bg-red-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                    <Text className="text-[10px] font-black text-white">{currentMatch.teamA[0].name}</Text>
                  </View>
                ) : null}
              </View>

              {/* Right Half (Team B) */}
              <View
                style={{ width: "50%" }}
                className="absolute right-0 top-0 bottom-0 justify-center items-center gap-4 flex-row"
              >
                {matchType.toLowerCase() === "doubles" && currentMatch.teamB.length > 1 ? (
                  <>
                    <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">{currentMatch.teamB[0].name}</Text>
                    </View>
                    <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                      <Text className="text-[10px] font-black text-white">{currentMatch.teamB[1].name}</Text>
                    </View>
                  </>
                ) : currentMatch.teamB.length > 0 ? (
                  <View className="bg-blue-600 border border-white/20 px-2 py-1 rounded-full items-center justify-center">
                    <Text className="text-[10px] font-black text-white">{currentMatch.teamB[0].name}</Text>
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

      {/* Matchups list */}
      <View className="gap-3.5 pt-4 border-t border-border">
        <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
          Match Queue
        </Text>

        {matchups.length === 0 ? (
          <Text className="text-xs font-medium text-muted-foreground">
            No matchups scheduled. Activate players to populate.
          </Text>
        ) : (
          <View className="gap-2.5">
            {matchups.slice(0, 3).map((match, mIdx) => {
              const isLive = mIdx === 0;
              const isNext = mIdx === 1;
              return (
                <View
                  key={match.id}
                  className={`flex-row justify-between items-center p-3 rounded-2xl border ${
                    isLive
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background border-border"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isLive
                          ? "bg-primary bg-[#C1121F]"
                          : isNext
                            ? "bg-foreground/10"
                            : "bg-secondary"
                      }`}
                    >
                      <Text
                        className={`text-[10px] font-black ${
                          isLive ? "text-white" : "text-muted-foreground"
                        }`}
                      >
                        {isLive ? "▶" : `${mIdx}`}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs font-black text-foreground">
                        {match.teamA.map(p => p.name).join(" & ")} <Text className="text-muted-foreground font-medium text-[10px]">vs</Text> {match.teamB.map(p => p.name).join(" & ")}
                      </Text>
                      <Text className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                        {isLive
                          ? "Current Match"
                          : isNext
                            ? "Next Matchup"
                            : `Upcoming Matchup #${mIdx}`}
                      </Text>
                    </View>
                  </View>

                  {isLive && (
                    <View className="bg-primary/10 px-2 py-0.5 rounded-full bg-[#C1121F]/10">
                      <Text className="text-[8px] font-extrabold text-primary uppercase text-[#C1121F]">
                        Live
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
            {matchups.length > 3 && (
              <Text className="text-[10px] font-bold text-muted-foreground text-center mt-1">
                + {matchups.length - 3} more matchups
              </Text>
            )}
          </View>
        )}
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
  const [pairingMode, setPairingModeState] = React.useState<PairingMode>(getPairingMode());
  const [isEndSessionModalVisible, setIsEndSessionModalVisible] = React.useState(false);
  const [, setForceUpdate] = React.useState(0);

  const loadData = async () => {
    try {
      const dbCourts = await getCourts();
      setCourts(dbCourts);
      const players = await fetchActivePlayers();
      setActivePlayers(players);

      // Initialize pools for courts if they don't have one
      dbCourts.forEach(court => {
        if (getPoolForCourt(court.id).length === 0 && players.length > 0) {
          const newPool = buildBalancedPool(players, court.matchType, pairingMode);
          setPoolForCourt(court.id, newPool);
        }
      });
    } catch (error) {
      console.error("Error loading queue data:", error);
    }
  };

  React.useEffect(() => {
    loadData();
  }, [pairingMode]);

  // Subscribe to pool changes to trigger re-renders
  React.useEffect(() => {
    const unsubPool = subscribeToPool(() => {
      setForceUpdate(prev => prev + 1);
    });
    
    const unsubPairing = subscribeToPairingMode((newMode) => {
      setPairingModeState(newMode);
    });

    return () => {
      unsubPool();
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
          <View className="flex-row justify-between items-center py-2 mb-6">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                Court Queue
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Live Rotation
              </Text>
            </View>
            <Pressable
              onPress={() => setIsEndSessionModalVisible(true)}
              className="bg-secondary px-4 py-2 rounded-full flex-row items-center gap-1.5 border border-red-500/20 active:opacity-70"
            >
              <AppIcon name="stop.circle.fill" tintColor="#ef4444" size={14} />
              <Text className="text-sm font-bold text-red-500">End Session</Text>
            </Pressable>
          </View>

        </View>

        {/* Vertical Court Cards list */}
        <View className="px-5">
          {courts.length === 0 ? (
            <View className="py-12 items-center justify-center border border-dashed border-border rounded-3xl bg-secondary/50">
              <Text className="text-muted-foreground font-medium">No courts available.</Text>
            </View>
          ) : (
            courts.map((court) => {
              const matchups = getPoolForCourt(court.id);
              return (
                <CourtCard
                  key={court.id}
                  court={court}
                  matchups={matchups}
                  onPressScore={() => {
                    router.push({
                      pathname: "/score",
                      params: {
                        courtId: court.id.toString(),
                        courtName: court.name,
                        sport: court.sport,
                        matchType: court.matchType,
                        pairingMode,
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
              This will reset all active players to inactive and clear all waiting pools. This action cannot be undone.
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
                <Text className="text-sm font-semibold text-white">End Session</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
