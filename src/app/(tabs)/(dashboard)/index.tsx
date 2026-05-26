import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt, DBMatchup } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import {
  getActiveMatchups,
  getCourts,
  getGlobalQueue,
} from "@/services/database";
import { fetchMatchHistory } from "@/services/match-service";
import { subscribeToQueue } from "@/services/queue-service";
import { Match, Player } from "@/types/player";
import { useFocusEffect, useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function parsePlayers(json: string): Player[] {
  try {
    return JSON.parse(json) as Player[];
  } catch {
    return [];
  }
}

function teamLabel(players: Player[]): string {
  return players.map((p) => p.name).join(" & ");
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [courts, setCourts] = React.useState<DBCourt[]>([]);
  const [activeMatchups, setActiveMatchups] = React.useState<DBMatchup[]>([]);
  const [globalQueue, setGlobalQueue] = React.useState<DBMatchup[]>([]);
  const [recentMatches, setRecentMatches] = React.useState<Match[]>([]);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const [dbCourts, dbActive, dbQueue, dbMatches] = await Promise.all([
        getCourts(),
        getActiveMatchups(),
        getGlobalQueue(),
        fetchMatchHistory(),
      ]);
      setCourts(dbCourts);
      setActiveMatchups(dbActive);
      setGlobalQueue(dbQueue);
      setRecentMatches(dbMatches.slice(0, 5));
    } catch (e) {
      console.error("Dashboard load error:", e);
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
    return subscribeToQueue(loadData);
  }, [loadData]);

  // Derived stats
  const activeGamesCount = activeMatchups.length;
  const totalCourts = courts.length;
  const waitingPlayersCount = globalQueue.reduce((acc, m) => {
    return acc + parsePlayers(m.team_a).length + parsePlayers(m.team_b).length;
  }, 0);

  const courtById = React.useMemo(() => {
    const map = new Map<number, DBCourt>();
    courts.forEach((c) => map.set(c.id, c));
    return map;
  }, [courts]);

  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - 40;

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
        <View className="px-5 max-w-[800px] w-full self-center gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                Court Hub
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Sports Queue & Scoring
              </Text>
            </View>
            <Image
              source={require("@/assets/images/icon.png")}
              style={{ width: 50, height: 50 }}
            />
          </View>

          {/* Quick Stats */}
          <View className="flex-row gap-4">
            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-border">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <AppIcon name="play.fill" tintColor={theme.primary} size={14} />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">
                {activeGamesCount}
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Games
              </Text>
            </View>

            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-border">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <AppIcon
                  name="person.3.fill"
                  tintColor={theme.primary}
                  size={14}
                />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">
                {waitingPlayersCount}
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                In Queue
              </Text>
            </View>

            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-border">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <AppIcon
                  name="sportscourt.fill"
                  tintColor={theme.primary}
                  size={14}
                />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">
                {totalCourts}
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Courts
              </Text>
            </View>
          </View>

          {/* Live Now — horizontal carousel */}
          <View className="gap-3">
            <View className="flex-row items-center gap-2">
              <View className="w-2 h-2 rounded-full bg-[#C1121F]" />
              <Text className="text-lg font-extrabold text-foreground">
                Live Now
              </Text>
              {activeGamesCount > 0 && (
                <View className="ml-auto bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                  <Text className="text-[10px] font-bold text-primary">
                    {activeGamesCount}{" "}
                    {activeGamesCount === 1 ? "match" : "matches"}
                  </Text>
                </View>
              )}
            </View>

            {activeMatchups.length === 0 ? (
              <View className="bg-secondary/40 p-6 rounded-3xl border border-dashed border-border items-center justify-center">
                <AppIcon
                  name="sportscourt"
                  tintColor={theme.textSecondary}
                  size={28}
                  style={{ opacity: 0.4 }}
                />
                <Text className="text-xs text-muted-foreground mt-2 font-medium">
                  No live matches right now
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-5"
                contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
              >
                {activeMatchups.map((m) => {
                  const court =
                    m.courtId != null ? courtById.get(m.courtId) : undefined;
                  const tA = parsePlayers(m.team_a);
                  const tB = parsePlayers(m.team_b);
                  const teamsLabel = `${teamLabel(tA)} vs. ${teamLabel(tB)}`;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() =>
                        router.push({
                          pathname: "/score",
                          params: {
                            courtId: m.courtId?.toString(),
                            courtName: court?.name,
                            sport: court?.sport,
                            matchType: court?.matchType,
                          },
                        })
                      }
                      className="bg-primary rounded-3xl px-4 py-4 relative overflow-hidden active:scale-[0.98] transition-transform justify-between"
                      style={{ width: cardWidth }}
                    >
                      {/* Row 1: dot + court name */}
                      <View className="flex-row items-center gap-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        <Text className="text-white/70 text-[10px] font-extrabold uppercase tracking-widest">
                          Court {court?.name ?? "Court"}
                        </Text>
                      </View>

                      {/* Row 2: team names + live indicator */}
                      <View className="flex-row items-center justify-between gap-3 mt-1.5">
                        <Text
                          className="text-white text-[15px] font-extrabold flex-1 leading-snug"
                          numberOfLines={1}
                        >
                          {teamsLabel}
                        </Text>
                        <View className="bg-white/20 rounded-lg px-2.5 py-1 items-center justify-center shrink-0">
                          <Text className="text-white text-xs font-black tracking-wider">
                            ● Live
                          </Text>
                        </View>
                      </View>

                      {/* Row 3: sport + match type */}
                      <Text className="text-white/50 text-[10px] font-semibold mt-1.5 uppercase tracking-wider">
                        {court?.matchType} · Live Now
                      </Text>

                      {/* Background watermark */}
                      <View className="absolute right-2 top-0 bottom-0 justify-center opacity-10">
                        <AppIcon
                          name="sportscourt"
                          tintColor="#fff"
                          size={80}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Recent Match Results */}
          <View className="gap-3">
            <Text className="text-lg font-extrabold text-foreground">
              Recent Matches
            </Text>

            {recentMatches.length === 0 ? (
              <View className="bg-secondary/40 p-6 rounded-3xl border border-dashed border-border items-center justify-center">
                <AppIcon
                  name="trophy"
                  tintColor={theme.textSecondary}
                  size={28}
                  style={{ opacity: 0.4 }}
                />
                <Text className="text-xs text-muted-foreground mt-2 font-medium">
                  No matches recorded yet
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {recentMatches.map((match) => {
                  const aWon = match.winner === match.teamA.join(" & ");
                  return (
                    <View
                      key={match.id}
                      className="bg-secondary rounded-3xl p-4 border border-border gap-2"
                    >
                      {/* Winner row */}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <AppIcon
                            name="trophy.fill"
                            tintColor="#C1121F"
                            size={10}
                          />
                          <Text className="text-[10px] font-extrabold text-[#C1121F] uppercase tracking-wider">
                            {match.winner} wins
                          </Text>
                        </View>
                        <Text className="text-[10px] font-semibold text-muted-foreground">
                          {timeAgo(match.playedAt)}
                        </Text>
                      </View>

                      {/* Score row */}
                      <View className="flex-row items-center gap-3">
                        <Text
                          className={`flex-1 text-sm font-extrabold ${aWon ? "text-foreground" : "text-muted-foreground"}`}
                          numberOfLines={1}
                        >
                          {match.teamA.join(" & ")}
                        </Text>
                        <View className="bg-background border border-border rounded-2xl px-3 py-1">
                          <Text className="text-sm font-black text-foreground">
                            {match.scoreA} – {match.scoreB}
                          </Text>
                        </View>
                        <Text
                          className={`flex-1 text-sm font-extrabold text-right ${!aWon ? "text-foreground" : "text-muted-foreground"}`}
                          numberOfLines={1}
                        >
                          {match.teamB.join(" & ")}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
