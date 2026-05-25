import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const router = useRouter();
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();
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
                Court Hub
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Sports Queue & Scoring
              </Text>
            </View>
            <View className="flex-row gap-3">
              <Pressable className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:opacity-70">
                <SymbolView
                  name="bell.fill"
                  tintColor={theme.foreground}
                  size={18}
                />
              </Pressable>
              <Pressable className="w-10 h-10 rounded-full bg-primary items-center justify-center active:opacity-70">
                <Text className="text-white text-xs font-bold">JD</Text>
              </Pressable>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row gap-4">
            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-black/5">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <SymbolView
                  name="play.fill"
                  tintColor={theme.primary}
                  size={14}
                />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">8</Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Active Games
              </Text>
            </View>

            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-black/5">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <SymbolView
                  name="person.3.fill"
                  tintColor={theme.primary}
                  size={14}
                />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">
                32
              </Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Waiting Queue
              </Text>
            </View>

            <View className="flex-1 bg-secondary p-4 rounded-3xl border border-black/5">
              <View className="w-8 h-8 rounded-full bg-primary/10 items-center justify-center mb-3">
                <SymbolView
                  name="sportscourt.fill"
                  tintColor={theme.primary}
                  size={14}
                />
              </View>
              <Text className="text-2xl font-extrabold text-foreground">3</Text>
              <Text className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Courts
              </Text>
            </View>
          </View>

          {/* Featured Live Match Banner */}
          <View className="bg-primary p-5 rounded-3xl flex-row justify-between items-center relative overflow-hidden">
            <View className="z-10 flex-1">
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <Text className="text-white/80 text-[10px] font-bold tracking-widest uppercase">
                  Championship Court #1
                </Text>
              </View>
              <Text className="text-xl font-bold text-white mb-1">
                Lee vs. Garcia
              </Text>
              <Text className="text-white/70 text-xs font-semibold">
                Finals • Live Now
              </Text>
            </View>
            <View className="z-10 bg-white/20 px-4 py-2 rounded-full">
              <Text className="text-white text-lg font-black">21 - 19</Text>
            </View>
            <View className="absolute right-0 bottom-0 opacity-10 rotate-12">
              <SymbolView name="sportscourt" tintColor="#fff" size={150} />
            </View>
          </View>

          {/* Court Status Summary Header */}
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-extrabold text-foreground">
              Court Status
            </Text>
            <Pressable
              onPress={() => router.push("/create-court")}
              className="bg-primary flex-row items-center gap-1.5 px-3 py-2 rounded-full active:opacity-70"
            >
              <SymbolView name="plus" tintColor="#fff" size={12} />
              <Text className="text-[11px] font-extrabold text-white uppercase tracking-wider">
                New Court
              </Text>
            </Pressable>
          </View>

          {/* Court Grid List */}
          <View className="gap-4">
            {/* Court Alpha (Badminton) */}
            <View className="bg-secondary rounded-3xl overflow-hidden border border-black/5">
              <View className="p-4 border-b border-black/5 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <SymbolView
                    name="sparkles"
                    tintColor={theme.primary}
                    size={18}
                  />
                  <View>
                    <Text className="font-bold text-foreground">
                      Court Alpha
                    </Text>
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Badminton • Hard Court
                    </Text>
                  </View>
                </View>
                <View className="bg-primary/10 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <Text className="text-[10px] font-bold text-primary uppercase">
                    Playing
                  </Text>
                </View>
              </View>

              {/* Court Representation */}
              <View className="p-4 bg-black/5 dark:bg-white/5 m-3 rounded-2xl flex-row items-center justify-between">
                <View className="items-center flex-1">
                  <Text className="text-xs font-bold text-foreground">
                    Team Tigers
                  </Text>
                  <Text className="text-xl font-black text-primary mt-1">
                    15
                  </Text>
                </View>
                <View className="h-10 w-[1px] bg-black/10 dark:bg-white/10" />
                <View className="items-center flex-1">
                  <Text className="text-xs font-bold text-foreground">
                    Team Fox
                  </Text>
                  <Text className="text-xl font-black text-foreground mt-1">
                    12
                  </Text>
                </View>
              </View>

              <View className="px-4 pb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Next Matchup
                  </Text>
                  <Text className="text-[10px] font-bold text-primary uppercase">
                    Queue (3)
                  </Text>
                </View>
                <Text className="text-xs text-foreground font-medium">
                  S. Williams + 2 others
                </Text>
              </View>
            </View>

            {/* Court Beta (Pickleball Available) */}
            <View className="bg-secondary rounded-3xl overflow-hidden border border-black/5">
              <View className="p-4 border-b border-black/5 flex-row justify-between items-center">
                <View className="flex-row items-center gap-3">
                  <SymbolView
                    name="checkmark.circle.fill"
                    tintColor="#2D5A27"
                    size={18}
                  />
                  <View>
                    <Text className="font-bold text-foreground">
                      Court Beta
                    </Text>
                    <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Pickleball • Indoor
                    </Text>
                  </View>
                </View>
                <View className="bg-court-green/10 px-3 py-1 rounded-full flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-court-green" />
                  <Text className="text-[10px] font-bold text-court-green uppercase">
                    Available
                  </Text>
                </View>
              </View>

              <View className="p-5 items-center justify-center">
                <Pressable className="bg-primary px-6 py-4 rounded-full active:scale-95 transition-all">
                  <Text className="text-white text-xs font-extrabold uppercase tracking-wider">
                    Open Session
                  </Text>
                </Pressable>
                <Text className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wide">
                  Ready for players
                </Text>
              </View>
            </View>
          </View>

          {/* Interactive Court Map Card */}
          <View className="bg-secondary/40 rounded-3xl p-5 border border-dashed border-black/10 items-center justify-center py-8">
            <SymbolView
              name="map.fill"
              tintColor={theme.primary}
              size={36}
              className="opacity-70"
            />
            <Text className="text-base font-bold text-foreground mt-3">
              Interactive Court Map
            </Text>
            <Text className="text-xs text-muted-foreground text-center mt-1 mb-4 px-8">
              Visual representation of court status and live occupancy.
            </Text>
            <Pressable className="bg-secondary border border-black/10 px-5 py-3 rounded-full active:opacity-70">
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                Explore Layout
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
