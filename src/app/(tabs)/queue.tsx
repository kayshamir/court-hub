import { AppIcon } from "@/components/ui/icon";
import { BottomTabInset, Spacing } from "@/constants/theme";
import { DBCourt } from "@/db/schema";
import { useTheme } from "@/hooks/use-theme";
import { getCourts } from "@/services/database";
import {
  getCourtMatch,
  INITIAL_POOL,
  MOCK_COURTS,
  reorderWaitingPool,
  shuffleWaitingPool,
} from "@/services/queue-service";
import { Team } from "@/types/queue";
import React from "react";
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface DraggableQueueItemProps {
  item: Team;
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
      const currentY = initialIndex * spacing + event.translationY;
      const hoverIndex = Math.max(
        0,
        Math.min(totalItems - 1, Math.round(currentY / spacing)),
      );
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
        },
      );
    });

  const targetY = useDerivedValue(() => {
    const targetIndex = order.value.indexOf(item.id);
    if (activeId.value === item.id)
      return initialIndex * spacing + translateY.value;
    return withSpring(targetIndex * spacing, {
      damping: 25,
      stiffness: 180,
      mass: 0.8,
    });
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: targetY.value }],
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: activeId.value === item.id ? 999 : 1,
    elevation: activeId.value === item.id ? 5 : 0,
    opacity: activeId.value === item.id ? 0.9 : 1,
  }));

  return (
    <GestureDetector gesture={dragGesture}>
      <Animated.View style={[animatedStyle, { height: 68 }]}>
        <View className="bg-secondary rounded-3xl p-4 border border-black/5 flex-row justify-between items-center flex-1">
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
              <Text className="text-sm font-semibold text-muted-foreground">
                Waiting
              </Text>
            </View>
          </View>
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

const SCREEN_W = Dimensions.get("window").width;
const CARD_W = SCREEN_W - 64;
const SNAP = CARD_W + 16;

function MatchRow({
  label,
  teamA,
  teamB,
  accent,
}: {
  label: string;
  teamA: string[] | null;
  teamB: string[] | null;
  accent?: boolean;
}) {
  if (!teamA || !teamB)
    return (
      <View className="bg-background/40 rounded-2xl px-3 py-2.5 items-center">
        <Text className="text-[10px] text-muted-foreground font-semibold">
          Waiting for teams…
        </Text>
      </View>
    );
  return (
    <View className="flex-row items-center bg-background/60 rounded-2xl px-3 py-2.5 gap-2">
      <View className="flex-1">
        <Text
          className={`text-sm font-semibold mb-0.5 ${accent ? "text-red-500" : "text-muted-foreground"}`}
        >
          Team A
        </Text>
        <Text
          className="text-xs font-extrabold text-foreground"
          numberOfLines={1}
        >
          {teamA.join(" & ")}
        </Text>
      </View>
      <Text className="text-[10px] font-black text-muted-foreground/30">
        VS
      </Text>
      <View className="flex-1 items-end">
        <Text
          className={`text-sm font-semibold mb-0.5 ${accent ? "text-blue-500" : "text-muted-foreground"}`}
        >
          Team B
        </Text>
        <Text
          className="text-xs font-extrabold text-foreground text-right"
          numberOfLines={1}
        >
          {teamB.join(" & ")}
        </Text>
      </View>
    </View>
  );
}

function CourtCard({
  court,
  currentA,
  currentB,
  nextA,
  nextB,
  isActive,
}: {
  court: DBCourt;
  currentA: string[] | null;
  currentB: string[] | null;
  nextA: string[] | null;
  nextB: string[] | null;
  isActive: boolean;
}) {
  return (
    <View
      style={{ width: isActive ? CARD_W + 16 : CARD_W - 16 }}
      className={`bg-secondary rounded-3xl p-4 gap-4 ${
        isActive ? "elevation-10" : ""
      }`}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-black text-foreground">{court.name}</Text>
        <View
          className={`px-2.5 py-1 rounded-full ${isActive ? "bg-primary" : "bg-primary/10"}`}
        >
          <Text
            className={`text-sm font-bold ${isActive ? "text-white" : "text-primary"}`}
          >
            {court.sport}
          </Text>
        </View>
      </View>

      {/* Current Match */}
      <View className="gap-2">
        <View className="flex-row items-center gap-2">
          <View className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <Text className="text-sm font-extrabold text-muted-foreground">
            Current Match
          </Text>
        </View>
        <View className="w-full aspect-[2.5/1] bg-[#2D5A27] rounded-2xl border border-white/20 relative overflow-hidden mb-1">
          <View className="absolute left-1/2 top-0 bottom-0 w-[1.5px] bg-white/60" />
          <View className="absolute top-2 bottom-2 left-2 right-2 border border-white/30 rounded" />
          {currentA && currentB ? (
            <>
              <View className="absolute left-3 top-0 bottom-0 justify-center gap-1.5">
                {currentA.map((p, i) => (
                  <View key={i} className="bg-red-500 px-2 py-0.5 rounded-full">
                    <Text className="text-[7px] font-bold text-white">
                      {p.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="absolute right-3 top-0 bottom-0 justify-center gap-1.5 items-end">
                {currentB.map((p, i) => (
                  <View
                    key={i}
                    className="bg-blue-500 px-2 py-0.5 rounded-full"
                  >
                    <Text className="text-[7px] font-bold text-white">
                      {p.split(" ")[0]}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View className="absolute inset-0 items-center justify-center">
              <Text className="text-sm font-bold text-white/50">
                Court Empty
              </Text>
            </View>
          )}
        </View>
        <MatchRow label="current" teamA={currentA} teamB={currentB} accent />
      </View>

      {/* Next Matchup */}
      <View className="gap-2">
        <Text className="text-sm font-semibold text-muted">Next Matchup</Text>
        <MatchRow label="next" teamA={nextA} teamB={nextB} />
      </View>
    </View>
  );
}

export default function QueueScreen() {
  const safeAreaInsets = useSafeAreaInsets();
  const theme = useTheme();

  const [courts, setCourts] = React.useState<DBCourt[]>([]);
  const [pool, setPool] = React.useState<Team[]>(INITIAL_POOL);
  const [scrollEnabled, setScrollEnabled] = React.useState(true);
  const [activeDragId, setActiveDragId] = React.useState<number | null>(null);
  const [activeCardIndex, setActiveCardIndex] = React.useState(0);

  const activeId = useSharedValue<number | null>(null);
  const order = useSharedValue<number[]>([]);

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

  const assignedCount = courts.length * 4;
  const waitingPool = pool.slice(assignedCount);

  React.useEffect(() => {
    order.value = waitingPool.map((t) => t.id);
  }, [waitingPool.length]);

  const handleDragEnd = React.useCallback(
    (newOrder: number[]) => {
      const updated = reorderWaitingPool(
        pool,
        newOrder,
        assignedCount,
        waitingPool,
      );
      setPool(updated);
      setActiveDragId(null);
      setScrollEnabled(true);
    },
    [pool, waitingPool, assignedCount],
  );

  const handleShuffle = () => {
    const updated = shuffleWaitingPool(pool, assignedCount);
    setPool(updated);
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
        scrollEnabled={scrollEnabled}
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
              className="bg-secondary px-4 py-2 rounded-full flex-row items-center gap-1.5 border border-black/5 active:opacity-70"
            >
              <AppIcon name="shuffle" tintColor={theme.foreground} size={12} />
              <Text className="text-sm font-bold text-foreground">Shuffle</Text>
            </Pressable>
          </View>
        </View>

        {/* Horizontal Court Cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + 12}
          decelerationRate="fast"
          snapToAlignment="center"
          onScroll={(event) => {
            const contentOffset = event.nativeEvent.contentOffset.x;
            const index = Math.round(contentOffset / (CARD_W + 12));
            if (
              index !== activeCardIndex &&
              index >= 0 &&
              index < courts.length
            ) {
              setActiveCardIndex(index);
            }
          }}
          scrollEventThrottle={16}
          contentContainerStyle={{
            paddingHorizontal: 20,
            gap: 12,
            paddingBottom: 4,
          }}
          className="mb-3"
        >
          {courts.map((court, idx) => {
            const { currentA, currentB, nextA, nextB } = getCourtMatch(
              pool,
              idx,
            );
            return (
              <CourtCard
                key={court.id}
                court={court}
                currentA={currentA}
                currentB={currentB}
                nextA={nextA}
                nextB={nextB}
                isActive={idx === activeCardIndex}
              />
            );
          })}
        </ScrollView>

        {/* Indicator Dots */}
        <View className="flex-row justify-center gap-1.5 mb-6">
          {courts.map((_, idx) => (
            <View
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeCardIndex
                  ? "w-4 bg-primary"
                  : "w-1.5 bg-muted-foreground/30"
              }`}
            />
          ))}
        </View>

        {/* Waiting Pool */}
        <View className="px-5 max-w-[800px] w-full self-center gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-extrabold text-foreground">
              Waiting Pool
            </Text>
            <Text className="text-xs font-bold text-primary">
              {waitingPool.length} Teams
            </Text>
          </View>

          {waitingPool.length === 0 ? (
            <View className="bg-secondary/40 rounded-3xl p-6 border border-dashed border-black/10 items-center py-10">
              <Text className="text-sm font-bold text-muted-foreground">
                No teams waiting
              </Text>
            </View>
          ) : (
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
          )}
        </View>
      </ScrollView>
    </View>
  );
}
