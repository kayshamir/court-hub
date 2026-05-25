import React from "react";
import { Pressable, Text, View } from "react-native";
import { SymbolView } from "expo-symbols";
import { SportType, SPORT_CONFIGS } from "@/types/court";
import { useTheme } from "@/hooks/use-theme";

interface SportTypeSelectorProps {
  selected: SportType;
  onSelect: (sport: SportType) => void;
}

const SPORTS: SportType[] = ["tennis", "pickleball", "badminton"];

export function SportTypeSelector({ selected, onSelect }: SportTypeSelectorProps) {
  const theme = useTheme();

  return (
    <View className="flex-col gap-3">
      <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
        Sport Type
      </Text>
      <View className="flex-row gap-3">
        {SPORTS.map((sport) => {
          const config = SPORT_CONFIGS[sport];
          const isActive = selected === sport;
          return (
            <Pressable
              key={sport}
              onPress={() => onSelect(sport)}
              className={`flex-1 items-center justify-center gap-2 py-4 rounded-3xl border transition-all active:scale-95 ${
                isActive
                  ? "bg-primary/10 border-primary"
                  : "bg-secondary border-black/5"
              }`}
            >
              <SymbolView
                name={config.symbolName as any}
                tintColor={isActive ? theme.primary : theme.textSecondary}
                size={26}
              />
              <Text
                className={`text-[10px] font-extrabold uppercase tracking-wider ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
