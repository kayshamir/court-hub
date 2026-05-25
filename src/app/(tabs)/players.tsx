import { Button } from "@/components/ui/button";
import { TextInput } from "@/components/ui/text-input";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
  changePlayerSkillLevel,
  fetchRankedPlayersList,
  initializePlayersDB,
  registerPlayer,
  removePlayer,
} from "@/services/player-service";
import { Player } from "@/types/player";
import { AppIcon } from "../../components/ui/icon";
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
  const [newPlayerLevel, setNewPlayerLevel] = React.useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Beginner");
  const [isLevelDropdownOpen, setIsLevelDropdownOpen] = React.useState(false);
  const [playerToEdit, setPlayerToEdit] = React.useState<Player | null>(null);
  const [editPlayerLevel, setEditPlayerLevel] = React.useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Beginner");
  const [isEditLevelDropdownOpen, setIsEditLevelDropdownOpen] =
    React.useState(false);
  const [openPlayerOptionsId, setOpenPlayerOptionsId] = React.useState<
    number | null
  >(null);
  const [players, setPlayers] = React.useState<Player[]>([]);
  const [playerToRemove, setPlayerToRemove] = React.useState<Player | null>(
    null,
  );

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
      await registerPlayer(newPlayerName, newPlayerLevel);
      setNewPlayerName("");
      setNewPlayerLevel("Beginner");
      setIsLevelDropdownOpen(false);
      setIsAddModalVisible(false);
      await loadPlayers();
    } catch (error) {
      console.error("Error adding player to SQLite:", error);
      setIsLoading(false);
    }
  };

  const openRemovePlayerModal = (player: Player) => {
    setPlayerToRemove(player);
  };

  const closeRemovePlayerModal = () => {
    setPlayerToRemove(null);
  };

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;

    try {
      setIsLoading(true);
      await removePlayer(playerToRemove.id);
      setPlayerToRemove(null);
      await loadPlayers();
    } catch (error) {
      console.error("Error removing player:", error);
      setIsLoading(false);
    }
  };

  const openEditPlayerModal = (player: Player) => {
    setPlayerToEdit(player);
    setEditPlayerLevel(player.level);
    setIsEditLevelDropdownOpen(false);
  };

  const closeEditPlayerModal = () => {
    setPlayerToEdit(null);
    setIsEditLevelDropdownOpen(false);
    setOpenPlayerOptionsId(null);
  };

  const togglePlayerOptions = (playerId: number) => {
    setOpenPlayerOptionsId((current) =>
      current === playerId ? null : playerId,
    );
  };

  const handleUpdatePlayerLevel = async () => {
    if (!playerToEdit) return;

    try {
      setIsLoading(true);
      await changePlayerSkillLevel(playerToEdit.id, editPlayerLevel);
      setPlayerToEdit(null);
      setIsEditLevelDropdownOpen(false);
      await loadPlayers();
    } catch (error) {
      console.error("Error updating player skill level:", error);
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
              <AppIcon name="person.badge.plus" tintColor="#fff" size={18} />
              <Text className="text-white text-xs font-extrabold tracking-wider">
                Add Player
              </Text>
            </Button>
          </View>

          {/* Search Input */}
          <View className="relative flex-row items-center bg-secondary rounded-2xl px-4 py-3">
            <AppIcon
              name="magnifyingglass"
              tintColor={theme.primary}
              size={16}
            />
            <RNTextInput
              className="flex-1 ml-3 text-sm text-foreground font-medium outline-none placeholder:text-muted-foreground py-0 h-6"
              style={{
                paddingBottom: 3,
              }}
              placeholder="Search player name..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          {isLoading ? (
            <View className="py-12 items-center justify-center">
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : players.length === 0 ? (
            <View className="bg-secondary/40 rounded-3xl p-6 border border-dashed border-black/10 items-center justify-center py-12">
              <AppIcon
                name="person.3.fill"
                tintColor={theme.textSecondary}
                size={36}
                style={{ opacity: 0.5 }}
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
                        <AppIcon
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
                    <AppIcon
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
                          <Text className="text-[11px] text-muted-foreground mt-1">
                            {player.level}
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center gap-2">
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

                        <View className="relative">
                          <Pressable
                            onPress={() => togglePlayerOptions(player.id)}
                            className="w-10 h-10 rounded-full bg-secondary items-center justify-center active:opacity-80"
                          >
                            <SymbolView
                              name="ellipsis"
                              tintColor={theme.foreground}
                              size={18}
                            />
                          </Pressable>

                          {openPlayerOptionsId === player.id && (
                            <View className="absolute right-0 top-12 z-20 w-40 rounded-3xl bg-background border border-black/10 shadow-lg overflow-hidden">
                              <Pressable
                                onPress={() => {
                                  togglePlayerOptions(player.id);
                                  openEditPlayerModal(player);
                                }}
                                className="px-4 py-4 border-b border-black/10"
                              >
                                <Text className="text-sm font-semibold text-foreground">
                                  Update
                                </Text>
                              </Pressable>
                              <Pressable
                                onPress={() => {
                                  togglePlayerOptions(player.id);
                                  openRemovePlayerModal(player);
                                }}
                                className="px-4 py-4"
                              >
                                <Text className="text-sm font-semibold text-red-500">
                                  Delete
                                </Text>
                              </Pressable>
                            </View>
                          )}
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
                  <AppIcon
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

                <View className="gap-2">
                  <Text className="text-sm font-semibold text-foreground">
                    Skill Level
                  </Text>
                  <View className="relative">
                    <Pressable
                      onPress={() => setIsLevelDropdownOpen((open) => !open)}
                      className="bg-secondary rounded-2xl border border-black/5 px-4 py-4 flex-row items-center justify-between"
                    >
                      <Text className="text-sm text-foreground font-medium">
                        {newPlayerLevel}
                      </Text>
                      <SymbolView
                        name={
                          isLevelDropdownOpen ? "chevron.up" : "chevron.down"
                        }
                        tintColor={theme.textSecondary}
                        size={16}
                      />
                    </Pressable>

                    {isLevelDropdownOpen && (
                      <View className="absolute z-50 mt-2 w-full rounded-2xl bg-background border border-black/10 shadow-lg overflow-hidden">
                        {["Beginner", "Intermediate", "Advanced"].map(
                          (level) => (
                            <Pressable
                              key={level}
                              onPress={() => {
                                setNewPlayerLevel(
                                  level as
                                    | "Beginner"
                                    | "Intermediate"
                                    | "Advanced",
                                );
                                setIsLevelDropdownOpen(false);
                              }}
                              className="px-4 py-4"
                            >
                              <Text
                                className={`text-sm font-medium ${
                                  newPlayerLevel === level
                                    ? "text-primary"
                                    : "text-foreground"
                                }`}
                              >
                                {level}
                              </Text>
                            </Pressable>
                          ),
                        )}
                      </View>
                    )}
                  </View>
                </View>

                <Text className="text-xs text-muted-foreground">
                  Player stats start empty and populate after their first match.
                </Text>
              </View>

              <Button onPress={handleAddPlayer} label="Create Profile" />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={Boolean(playerToEdit)}
        animationType="fade"
        transparent={true}
        onRequestClose={closeEditPlayerModal}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={closeEditPlayerModal}
        >
          <Pressable
            className="w-full max-w-md rounded-[28px] bg-background p-6 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-extrabold text-foreground mb-2">
              Update Skill Level
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              {playerToEdit?.name}
            </Text>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">
                Selected Level
              </Text>
              <View className="relative">
                <Pressable
                  onPress={() => setIsEditLevelDropdownOpen((open) => !open)}
                  className="bg-secondary rounded-2xl border border-black/5 px-4 py-4 flex-row items-center justify-between"
                >
                  <Text className="text-sm text-foreground font-medium">
                    {editPlayerLevel}
                  </Text>
                  <SymbolView
                    name={
                      isEditLevelDropdownOpen ? "chevron.up" : "chevron.down"
                    }
                    tintColor={theme.textSecondary}
                    size={16}
                  />
                </Pressable>

                {isEditLevelDropdownOpen && (
                  <View className="absolute z-50 mt-2 w-full rounded-2xl bg-background border border-black/10 shadow-lg overflow-hidden">
                    {["Beginner", "Intermediate", "Advanced"].map((level) => (
                      <Pressable
                        key={level}
                        onPress={() => {
                          setEditPlayerLevel(
                            level as "Beginner" | "Intermediate" | "Advanced",
                          );
                          setIsEditLevelDropdownOpen(false);
                        }}
                        className="px-4 py-4"
                      >
                        <Text
                          className={`text-sm font-medium ${
                            editPlayerLevel === level
                              ? "text-primary"
                              : "text-foreground"
                          }`}
                        >
                          {level}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            <View className="flex-row justify-end gap-3 mt-6">
              <Pressable
                onPress={closeEditPlayerModal}
                className="rounded-full border border-muted-foreground/30 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-muted-foreground">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleUpdatePlayerLevel}
                className="rounded-full bg-primary px-4 py-3 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-white">Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={Boolean(playerToRemove)}
        animationType="fade"
        transparent={true}
        onRequestClose={closeRemovePlayerModal}
      >
        <Pressable
          className="flex-1 bg-black/40 items-center justify-center px-6"
          onPress={closeRemovePlayerModal}
        >
          <Pressable
            className="w-full max-w-md rounded-[28px] bg-background p-6 shadow-lg"
            onPress={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-extrabold text-foreground mb-2">
              Remove player?
            </Text>
            <Text className="text-sm text-muted-foreground leading-6">
              This action will permanently remove the selected player and their
              associated data.{" "}
            </Text>

            <View className="flex-row justify-end gap-3 mt-6">
              <Pressable
                onPress={closeRemovePlayerModal}
                className="rounded-full border border-muted-foreground/30 px-4 py-3"
              >
                <Text className="text-sm font-semibold text-muted-foreground">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={handleRemovePlayer}
                className="rounded-full bg-red-500 px-4 py-3 items-center justify-center"
              >
                <Text className="text-sm font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
