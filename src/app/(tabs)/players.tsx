import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  fetchRankedPlayersList,
  initializePlayersDB,
  registerPlayer,
} from "@/services/player-service";
import { Player } from "@/types/player";
import { SymbolView } from "expo-symbols";
import React from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  TextInput as RNTextInput,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PlayersScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isAddModalVisible, setIsAddModalVisible] = React.useState(false);
  const [newPlayerName, setNewPlayerName] = React.useState("");
  const [initialWins, setInitialWins] = React.useState("0");
  const [initialLosses, setInitialLosses] = React.useState("0");
  const [players, setPlayers] = React.useState<Player[]>([]);

  const loadPlayers = async () => {
    try {
      await initializePlayersDB();
      const rankedPlayers = await fetchRankedPlayersList();
      setPlayers(rankedPlayers);
    } catch (error) {
      console.error("Error loading players from SQLite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    loadPlayers();
  }, []);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;

    try {
      setIsLoading(true);
      await registerPlayer(newPlayerName, initialWins, initialLosses);
      setNewPlayerName("");
      setInitialWins("0");
      setInitialLosses("0");
      setIsAddModalVisible(false);
      await loadPlayers();
    } catch (error) {
      console.error("Error adding player to SQLite:", error);
      setIsLoading(false);
    }
  };

  const topPerformer = players.length > 0 ? players[0] : null;
  const regularPlayers = players.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
        <View className="px-5 max-w-[800px] w-full self-center gap-6">
          {/* Header */}
          <View className="flex-row justify-between items-center py-2">
            <View>
              <Text className="text-3xl font-extrabold tracking-tight text-foreground">
                Players
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Rankings & Statistics
              </Text>
            </View>
            <Button
              onPress={() => setIsAddModalVisible(true)}
              className="px-4 py-3 flex-row items-center gap-1.5 active:scale-95"
              small
            >
              <SymbolView name="person.badge.plus" tintColor="#fff" size={18} />
              <Text className="text-white text-xs font-extrabold tracking-wider">
                Add Player
              </Text>
            </Button>
          </View>

          {/* Search Input */}
          <View className="relative flex-row items-center bg-secondary rounded-2xl px-4 py-3">
            <SymbolView
              name="magnifyingglass"
              tintColor={theme.primary}
              size={16}
            />
            <RNTextInput
              className="flex-1 ml-3 text-sm text-foreground font-medium outline-none placeholder:text-muted-foreground py-0 h-6"
              style={{
                paddingBottom: 3,
              }}
              placeholder="Search player stats..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.mutedForeground}
            />
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : players.length === 0 ? (
            <View className="bg-secondary/40 rounded-3xl p-6 border border-dashed border-black/10 items-center justify-center py-12">
              <SymbolView
                name="person.3.fill"
                tintColor={theme.mutedForeground}
                size={36}
                className="opacity-50"
              />
              <Text className="text-base font-bold text-foreground mt-4">
                No Players Yet
              </Text>
              <Text className="text-xs text-muted-foreground text-center mt-1 px-8">
                Tap "Add Player" at the top to register players and track their
                standings.
              </Text>
            </View>
          ) : (
            <>
              {topPerformer && (
                <View className="bg-secondary rounded-3xl p-5 border border-black/5 flex-row justify-between items-center relative overflow-hidden">
                  <View className="z-10 flex-1">
                    <View className="flex-row items-center gap-2 mb-2">
                      <View className="bg-primary px-2.5 py-2 rounded-full flex-row items-center gap-1">
                        <SymbolView
                          name="star.fill"
                          tintColor="#fff"
                          size={10}
                        />
                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                          Top Performer
                        </Text>
                      </View>
                    </View>
                    <Text className="text-2xl font-black text-foreground uppercase tracking-tight">
                      {topPerformer.name}
                    </Text>

                    <View className="mt-3">
                      <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Recent Form Streak
                      </Text>
                      <View className="flex-row gap-1.5">
                        {topPerformer.form.map((res, index) => (
                          <View
                            key={index}
                            className={`w-6 h-6 items-center justify-center rounded-full ${
                              res === "W"
                                ? "bg-primary"
                                : "bg-black/10 dark:bg-white/10"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-black ${
                                res === "W"
                                  ? "text-white"
                                  : "text-muted-foreground"
                              }`}
                            >
                              {res}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View className="absolute right-0 bottom-0 opacity-5 rotate-12 z-0">
                    <SymbolView
                      name="crown.fill"
                      tintColor={theme.foreground}
                      size={160}
                    />
                  </View>
                </View>
              )}

              {/* Player Statistics Board */}
              <View className="gap-3">
                <View className="flex-row justify-between items-center px-1">
                  <Text className="text-lg font-extrabold text-foreground">
                    Leaderboard
                  </Text>
                  <Text className="text-xs font-semibold text-muted-foreground">
                    Active Season
                  </Text>
                </View>

                {/* List Header */}
                <View className="flex-row items-center px-4 py-2 border-b border-black/5">
                  <Text className="w-12 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Rank
                  </Text>
                  <Text className="flex-1 text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Player
                  </Text>
                  <Text className="w-32 text-right text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">
                    Form / Stats
                  </Text>
                </View>

                {/* List of Players */}
                <View className="gap-2.5">
                  {regularPlayers.map((player) => (
                    <View
                      key={player.id}
                      className="bg-secondary rounded-3xl p-4 border border-black/5 flex-row justify-between items-center"
                    >
                      <View className="flex-row items-center gap-4 flex-1">
                        <Text className="w-8 text-sm font-black text-muted-foreground">
                          #{player.rank}
                        </Text>
                        <View className="flex-1">
                          <Text className="text-base font-extrabold text-foreground">
                            {player.name}
                          </Text>
                        </View>
                      </View>

                      <View className="w-36 flex-row justify-end gap-1 items-center">
                        <View className="items-end gap-1">
                          <View className="flex-row gap-0.5">
                            {player.form.map((res, index) => (
                              <View
                                key={index}
                                className={`w-5 h-5 items-center justify-center rounded-full ${
                                  res === "W"
                                    ? "bg-primary"
                                    : "bg-black/10 dark:bg-white/10"
                                }`}
                              >
                                <Text
                                  className={`text-[9px] font-black ${
                                    res === "W"
                                      ? "text-white"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {res}
                                </Text>
                              </View>
                            ))}
                          </View>
                          <Text className="text-[9px] font-bold text-muted-foreground uppercase">
                            {player.rate} Win rate
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Player Modal */}
      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Pressable
            className="flex-1 justify-end bg-black/40"
            onPress={() => Keyboard.dismiss()}
          >
            <Pressable
              className="bg-background rounded-t-[32px] p-6 gap-6"
              onPress={(e) => e.stopPropagation()}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-extrabold text-foreground">
                  Add New Player
                </Text>
                <Pressable
                  onPress={() => setIsAddModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-secondary items-center justify-center active:opacity-70"
                >
                  <SymbolView
                    name="xmark"
                    tintColor={theme.foreground}
                    size={14}
                  />
                </Pressable>
              </View>

              <View className="gap-4">
                <TextInput
                  label="Player Name"
                  placeholder="Enter full name"
                  value={newPlayerName}
                  onChangeText={setNewPlayerName}
                />

                <View className="flex-row gap-4">
                  <TextInput
                    label="Initial Wins"
                    placeholder="0"
                    value={initialWins}
                    onChangeText={setInitialWins}
                    keyboardType="numeric"
                    containerClassName="flex-1"
                  />
                  <TextInput
                    label="Initial Losses"
                    placeholder="0"
                    value={initialLosses}
                    onChangeText={setInitialLosses}
                    keyboardType="numeric"
                    containerClassName="flex-1"
                  />
                </View>
              </View>

              <Button onPress={handleAddPlayer} label="Create Profile" />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
