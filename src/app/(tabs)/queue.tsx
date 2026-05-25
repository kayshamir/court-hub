import { BottomTabInset, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { AppIcon } from "@/components/ui/icon";
import React from "react";
import { Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
  runOnJS,
  SharedValue,
} from "react-native-reanimated";

interface DraggableQueueItemProps {
  item: {
    id: number;
    players: string[];
    position: number;
    status: string;
  };
  initialIndex: number;
  totalItems: number;
  spacing: number;
  onDragStart: () => void;
  onDragEnd: (newOrder: number[]) => void;
  activeId: SharedValue<number | null>;
  setActiveId: (id: number | null) => void;
  order: SharedValue<number[]>;
}

function DraggableQueueItem({
  item,
  initialIndex,
  totalItems,
  spacing,
  onDragStart,
  onDragEnd,
  activeId,
  setActiveId,
  order,
}: DraggableQueueItemProps) {
  const theme = useTheme();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const dragGesture = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart(() => {
      isDragging.value = true;
      activeId.value = item.id;
      runOnJS(setActiveId)(item.id);
      runOnJS(onDragStart)();
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;

      // Calculate hover index
      const currentY = initialIndex * spacing + event.translationY;
      const hoverIndex = Math.max(
        0,
        Math.min(totalItems - 1, Math.round(currentY / spacing))
      );

      // Reorder on the fly
      const currentOrderIndex = order.value.indexOf(item.id);
      if (hoverIndex !== currentOrderIndex) {
        const newOrder = [...order.value];
        newOrder.splice(currentOrderIndex, 1);
        newOrder.splice(hoverIndex, 0, item.id);
        order.value = newOrder;
      }
    })
    .onEnd(() => {
      isDragging.value = false;
      const targetIndex = order.value.indexOf(item.id);
      const finalTranslateY = (targetIndex - initialIndex) * spacing;

      translateY.value = withSpring(
        finalTranslateY,
        { damping: 25, stiffness: 180, mass: 0.8 },
        (finished) => {
          if (finished) {
            activeId.value = null;
            runOnJS(onDragEnd)(order.value);
            translateY.value = 0;
          }
        }
      );
    });

  const targetY = useDerivedValue(() => {
    const targetIndex = order.value.indexOf(item.id);
    if (activeId.value === item.id) {
      return initialIndex * spacing + translateY.value;
    }
    return withSpring(targetIndex * spacing, { damping: 25, stiffness: 180, mass: 0.8 });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: targetY.value }],
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      zIndex: activeId.value === item.id ? 999 : 1,
      elevation: activeId.value === item.id ? 5 : 0,
      opacity: activeId.value === item.id ? 0.9 : 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: activeId.value === item.id ? 4 : 0 },
      shadowOpacity: activeId.value === item.id ? 0.15 : 0,
      shadowRadius: activeId.value === item.id ? 8 : 0,
    };
  });

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View
        style={[animatedStyle, { height: 68 }]}
        className={`bg-secondary rounded-3xl p-4 border border-black/5 flex-row justify-between items-center ${
          activeId.value === item.id ? "border-primary/20 bg-secondary/80" : ""
        }`}
      >
        <View className="flex-row items-center gap-4 flex-1">
          <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-xs font-black text-primary">
              #{item.position}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-bold text-foreground">
              {item.players.join(" & ")}
            </Text>
            <Text className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">
              {item.status}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable className="p-1 active:opacity-50">
            <AppIcon
              name="line.3.horizontal"
              tintColor={theme.foreground}
              size={16}
            />
          </Pressable>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function QueueScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [queueMode, setQueueMode] = React.useState<"singles" | "doubles">(
    "doubles",
  );

  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [activeDragId, setActiveDragId] = React.useState<number | null>(null);

  const activeId = useSharedValue<number | null>(null);
  const order = useSharedValue<number[]>([]);

  const [waitingPool, setWaitingPool] = React.useState([
    { id: 1, players: ["Elena Rodriguez", "David Kim"], position: 1, status: "Next Up" },
    { id: 2, players: ["Chris Evans", "Tom Holland"], position: 2, status: "Waiting" },
    { id: 3, players: ["Jessica Alba", "Scarlett J."], position: 3, status: "Waiting" },
    { id: 4, players: ["Taylor Swift", "Travis Kelce"], position: 4, status: "Waiting" },
  ]);

  React.useEffect(() => {
    setWaitingPool(
      queueMode === "singles"
        ? [
            { id: 1, players: ["Elena Rodriguez"], position: 1, status: "Next Up" },
            { id: 2, players: ["Chris Evans"], position: 2, status: "Waiting" },
            { id: 3, players: ["Jessica Alba"], position: 3, status: "Waiting" },
            { id: 4, players: ["Taylor Swift"], position: 4, status: "Waiting" },
          ]
        : [
            { id: 1, players: ["Elena Rodriguez", "David Kim"], position: 1, status: "Next Up" },
            { id: 2, players: ["Chris Evans", "Tom Holland"], position: 2, status: "Waiting" },
            { id: 3, players: ["Jessica Alba", "Scarlett J."], position: 3, status: "Waiting" },
            { id: 4, players: ["Taylor Swift", "Travis Kelce"], position: 4, status: "Waiting" },
          ]
    );
  }, [queueMode]);

  React.useEffect(() => {
    order.value = waitingPool.map((item) => item.id);
  }, [waitingPool]);

  const handleDragEnd = React.useCallback(
    (newOrder: number[]) => {
      const reordered = newOrder.map(
        (id) => waitingPool.find((p) => p.id === id)!
      );
      reordered.forEach((item, idx) => {
        item.position = idx + 1;
        item.status = idx === 0 ? "Next Up" : "Waiting";
      });
      setWaitingPool(reordered);
      setActiveDragId(null);
      setScrollEnabled(true);
    },
    [waitingPool]
  );

  const handleShuffle = () => {
    const shuffled = [...waitingPool].sort(() => Math.random() - 0.5);
    shuffled.forEach((item, idx) => {
      item.position = idx + 1;
      item.status = idx === 0 ? "Next Up" : "Waiting";
    });
    setWaitingPool(shuffled);
  };

  const nextMatch = {
    teamA:
      queueMode === "singles"
        ? ["Alex Rivera"]
        : ["Alex Rivera", "Jordan Chen"],
    teamB:
      queueMode === "singles"
        ? ["Sarah Thompson"]
        : ["Sarah Thompson", "Marcus Weber"],
    court: "Court 02",
  };

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
        scrollEnabled={scrollEnabled}
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
                Court Queue
              </Text>
              <Text className="text-sm font-medium text-muted-foreground">
                Queue Management
              </Text>
            </View>
            <Pressable
              onPress={handleShuffle}
              className="bg-secondary px-4 py-2 rounded-full flex-row items-center gap-1.5 border border-black/5 active:opacity-70"
            >
              <AppIcon
                name="shuffle"
                tintColor={theme.foreground}
                size={12}
              />
              <Text className="text-xs font-bold text-foreground uppercase tracking-wider">
                Shuffle
              </Text>
            </Pressable>
          </View>

          {/* Queue Mode Toggles */}
          <View className="flex-row bg-secondary p-1.5 rounded-full border border-black/5">
            <Pressable
              onPress={() => setQueueMode("singles")}
              className={`flex-1 py-2.5 rounded-full items-center ${
                queueMode === "singles" ? "bg-white" : ""
              }`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${
                  queueMode === "singles"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Singles
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setQueueMode("doubles")}
              className={`flex-1 py-2.5 rounded-full items-center ${
                queueMode === "doubles" ? "bg-white" : ""
              }`}
            >
              <Text
                className={`text-xs font-extrabold uppercase tracking-wider ${
                  queueMode === "doubles"
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Doubles
              </Text>
            </Pressable>
          </View>

          {/* Court Mini Graphic */}
          <View className="bg-secondary/40 rounded-3xl p-4 border border-black/5 items-center">
            <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider mb-3">
              Live Rotation Map
            </Text>
            <View className="w-full aspect-[2/1] max-w-[340px] bg-[#2D5A27] rounded-2xl border-2 border-white relative p-1 overflow-hidden">
              <View className="absolute left-1/2 top-0 bottom-0 w-[2px] bg-white/70 border-dashed border-r border-white/50" />
              <View className="absolute top-2 bottom-2 left-2 right-2 border border-white/40" />

              <View className="absolute left-4 top-0 bottom-0 justify-center gap-3">
                {nextMatch.teamA.map((player, idx) => (
                  <View
                    key={idx}
                    className="bg-primary px-2.5 py-1 rounded-full"
                  >
                    <Text className="text-[8px] font-bold text-white uppercase">
                      {player.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="absolute right-4 top-0 bottom-0 justify-center gap-3 items-end">
                {nextMatch.teamB.map((player, idx) => (
                  <View
                    key={idx}
                    className="bg-foreground px-2.5 py-1 rounded-full"
                  >
                    <Text className="text-[8px] font-bold text-background uppercase">
                      {player.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="absolute bottom-2 left-1/2 -ml-8 bg-black/40 px-2 py-0.5 rounded-full">
                <Text className="text-[7px] font-bold text-white/80 uppercase tracking-widest text-center">
                  {nextMatch.court}
                </Text>
              </View>
            </View>
          </View>

          {/* Next Match Section */}
          <View className="bg-secondary rounded-[32px] p-5 border border-black/5 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider">
                Next Matchup
              </Text>
              <View className="bg-primary px-3 py-1 rounded-full">
                <Text className="text-[9px] font-black text-white uppercase tracking-wider">
                  1st in Queue
                </Text>
              </View>
            </View>

            <View className="flex-row justify-between items-center bg-white dark:bg-black/20 p-4 rounded-2xl border border-black/5">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-primary uppercase">
                  Team A
                </Text>
                <Text className="text-sm font-extrabold text-foreground mt-0.5">
                  {nextMatch.teamA.join(" & ")}
                </Text>
              </View>
              <View className="px-3">
                <Text className="text-xs font-black text-muted-foreground/30">
                  VS
                </Text>
              </View>
              <View className="flex-1 items-end">
                <Text className="text-[10px] font-bold text-foreground uppercase">
                  Team B
                </Text>
                <Text className="text-sm font-extrabold text-foreground mt-0.5 text-right">
                  {nextMatch.teamB.join(" & ")}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/score",
                  params: {
                    teamA: JSON.stringify(nextMatch.teamA),
                    teamB: JSON.stringify(nextMatch.teamB),
                  },
                })
              }
              className="bg-primary py-4 rounded-full items-center justify-center active:scale-[0.98] transition-transform"
            >
              <Text className="text-white text-base font-bold">
                Start Match
              </Text>
            </Pressable>
          </View>

          {/* Waiting Pool Section */}
          <View className="gap-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-extrabold text-foreground">
                Waiting Pool
              </Text>
              <Text className="text-xs font-bold text-primary">
                {waitingPool.length} Teams
              </Text>
            </View>

            <View style={{ height: waitingPool.length * 80 - 12 }}>
              {waitingPool.map((item, idx) => (
                <DraggableQueueItem
                  key={item.id}
                  item={item}
                  initialIndex={idx}
                  totalItems={waitingPool.length}
                  spacing={80}
                  onDragStart={() => setScrollEnabled(false)}
                  onDragEnd={handleDragEnd}
                  activeId={activeId}
                  setActiveId={setActiveDragId}
                  order={order}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
