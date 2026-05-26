import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { getCourts } from "@/services/database";
import {
  getPool,
  subscribeToPool,
  MOCK_COURTS,
  shuffleWaitingPool,
} from "@/services/queue-service";
import { Team } from "@/types/queue";
import { SportType } from "@/types/court";
import { CourtCanvas } from "@/components/court-preview";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getCourtMatchups(pool: Team[], courtIndex: number, courtsCount: number) {
  const matchups: { teamA: string[]; teamB: string[]; label?: string }[] = [];

  // Current matchup
  const currentA = pool[courtIndex * 4]?.players ?? null;
  const currentB = pool[courtIndex * 4 + 1]?.players ?? null;

  // Next matchup (Matchup #1)
  const nextA = pool[courtIndex * 4 + 2]?.players ?? null;
  const nextB = pool[courtIndex * 4 + 3]?.players ?? null;

  if (currentA && currentB) {
    matchups.push({ teamA: currentA, teamB: currentB, label: "Live" });
  }
  if (nextA && nextB) {
    matchups.push({ teamA: nextA, teamB: nextB, label: "Next" });
  }

  // Subsequent matchups from the waiting pool (index courtsCount * 4)
  const waitingPool = pool.slice(courtsCount * 4);
  const waitingMatches: { teamA: string[]; teamB: string[] }[] = [];
  for (let i = 0; i < waitingPool.length; i += 2) {
    if (waitingPool[i] && waitingPool[i + 1]) {
      waitingMatches.push({
        teamA: waitingPool[i].players,
        teamB: waitingPool[i + 1].players,
      });
    }
  }

  // Distribute waiting matches among courts
  waitingMatches.forEach((match, idx) => {
    if (idx % courtsCount === courtIndex) {
      matchups.push({
        teamA: match.teamA,
        teamB: match.teamB,
      });
    }
  });

  return matchups;
}

function CourtCard({
  court,
  matchups,
  onPressScore,
}: {
  court: DBCourt;
  matchups: { teamA: string[]; teamB: string[]; label?: string }[];
  onPressScore: () => void;
}) {
  const currentMatch = matchups[0];
  const hasMatch = !!currentMatch;
  const matchType = court.matchType;

  return (
    <View className="bg-secondary rounded-[32px] p-5 border border-border gap-5 mb-5 w-full max-w-[800px] self-center">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
            <AppIcon name="sportscourt.fill" tintColor="#C1121F" size={18} />
          </View>
          <View>
            <Text className="text-lg font-black text-foreground">{court.name}</Text>
            <Text className="text-xs font-semibold text-muted-foreground">
              {court.sport} • {court.matchType}
            </Text>
          </View>
        </View>
        
        {hasMatch ? (
          <Pressable
            onPress={onPressScore}
            className="bg-primary px-4 py-2 rounded-full active:scale-95 flex-row items-center gap-1 bg-[#C1121F]"
          >
            <Text className="text-white text-xs font-extrabold uppercase tracking-wide">
              Score Match
            </Text>
          </Pressable>
        ) : (
          <View className="bg-muted-foreground/10 px-4 py-2 rounded-full">
            <Text className="text-muted-foreground text-xs font-extrabold uppercase tracking-wide">
              Empty
            </Text>
          </View>
        )}
      </View>

      {/* Court board visualizer - occupies the prominent space */}
      <Pressable onPress={() => hasMatch && onPressScore()} className="active:opacity-95">
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
                {matchType === "doubles" && currentMatch.teamA.length > 1 ? (
                  <>
                    <View className="bg-red-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-xs font-black text-white">A1</Text>
                    </View>
                    <View className="bg-red-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-xs font-black text-white">A2</Text>
                    </View>
                  </>
                ) : (
                  <View className="bg-red-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                    <Text className="text-xs font-black text-white">A</Text>
                  </View>
                )}
              </View>

              {/* Right Half (Team B) */}
              <View
                style={{ width: "50%" }}
                className="absolute right-0 top-0 bottom-0 justify-center items-center gap-4 flex-row"
              >
                {matchType === "doubles" && currentMatch.teamB.length > 1 ? (
                  <>
                    <View className="bg-blue-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-xs font-black text-white">B1</Text>
                    </View>
                    <View className="bg-blue-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                      <Text className="text-xs font-black text-white">B2</Text>
                    </View>
                  </>
                ) : (
                  <View className="bg-blue-600 border border-white/20 w-8 h-8 rounded-full items-center justify-center shadow-lg">
                    <Text className="text-xs font-black text-white">B</Text>
                  </View>
                )}
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
      </Pressable>

      {/* Matchups list listed vertically */}
      <View className="gap-3.5 pt-4 border-t border-border">
        <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
          Match Queue
        </Text>
        
        {matchups.length === 0 ? (
          <Text className="text-xs font-medium text-muted-foreground">
            No matchups scheduled.
          </Text>
        ) : (
          <View className="gap-2.5">
            {matchups.map((match, mIdx) => {
              const isLive = mIdx === 0;
              const isNext = mIdx === 1;
              return (
                <View
                  key={mIdx}
                  className={`flex-row justify-between items-center p-3 rounded-2xl border ${
                    isLive
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background border-border"
                  }`}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      className={`w-6 h-6 rounded-full items-center justify-center ${
                        isLive ? "bg-primary bg-[#C1121F]" : isNext ? "bg-foreground/10" : "bg-secondary"
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
                        {match.teamA.join(" & ")} vs {match.teamB.join(" & ")}
                      </Text>
                      <Text className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                        {isLive ? "Current Match" : isNext ? "Next Matchup" : `Upcoming Matchup #${mIdx}`}
                      </Text>
                    </View>
                  </View>
                  
                  {isLive && (
                    <View className="bg-primary/10 px-2 py-0.5 rounded-full bg-[#C1121F]/10">
                      <Text className="text-[8px] font-extrabold text-primary uppercase text-[#C1121F]">Live</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
}

export default function QueueScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [courts, setCourts] = React.useState<DBCourt[]>([]);
  const [pool, setPoolState] = React.useState<Team[]>(getPool());

  React.useEffect(() => {
    (async () => {
      try {
        const dbCourts = await getCourts();
        setCourts(dbCourts.length > 0 ? dbCourts : MOCK_COURTS);
      } catch {
        setCourts(MOCK_COURTS);
      }
    })();
  }, []);

  React.useEffect(() => {
    return subscribeToPool(() => {
      setPoolState(getPool());
    });
  }, []);

  const assignedCount = courts.length * 4;

  const handleShuffle = () => {
    const updated = shuffleWaitingPool(pool, assignedCount);
    setPoolState(updated);
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
        {/* Header */}
        <View className="px-5 max-w-[800px] w-full self-center">
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
              onPress={handleShuffle}
              className="bg-secondary px-4 py-2 rounded-full flex-row items-center gap-1.5 border border-border active:opacity-70"
            >
              <AppIcon name="shuffle" tintColor={theme.foreground} size={12} />
              <Text className="text-sm font-bold text-foreground">Shuffle</Text>
            </Pressable>
          </View>
        </View>

        {/* Vertical Court Cards list */}
        <View className="px-5">
          {courts.map((court, idx) => {
            const matchups = getCourtMatchups(pool, idx, courts.length);
            return (
              <CourtCard
                key={court.id}
                court={court}
                matchups={matchups}
                onPressScore={() => {
                  const currentMatch = matchups[0];
                  if (currentMatch) {
                    router.push({
                      pathname: "/score",
                      params: {
                        courtIndex: idx.toString(),
                        assignedCount: assignedCount.toString(),
                        courtName: court.name,
                        sport: court.sport,
                        matchType: court.matchType,
                        teamA: JSON.stringify(currentMatch.teamA),
                        teamB: JSON.stringify(currentMatch.teamB),
                      },
                    });
                  }
                }}
              />
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
