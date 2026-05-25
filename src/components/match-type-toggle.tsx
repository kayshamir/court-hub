import React from "react";
import { Pressable, Text, View } from "react-native";
import { MatchType } from "@/types/court";

interface MatchTypeToggleProps {
  value: MatchType;
  onChange: (type: MatchType) => void;
}

export function MatchTypeToggle({ value, onChange }: MatchTypeToggleProps) {
  return (
    <View className="flex-col gap-2">
      <Text className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest">
        Match Type
      </Text>
      <View className="flex-row bg-secondary p-1.5 rounded-full border border-black/5">
        <Pressable
          onPress={() => onChange("singles")}
          className={`flex-1 py-2.5 rounded-full items-center active:opacity-70 ${
            value === "singles" ? "bg-primary" : ""
          }`}
        >
          <Text
            className={`text-xs font-extrabold uppercase tracking-wider ${
              value === "singles" ? "text-white" : "text-muted-foreground"
            }`}
          >
            Singles
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("doubles")}
          className={`flex-1 py-2.5 rounded-full items-center active:opacity-70 ${
            value === "doubles" ? "bg-primary" : ""
          }`}
        >
          <Text
            className={`text-xs font-extrabold uppercase tracking-wider ${
              value === "doubles" ? "text-white" : "text-muted-foreground"
            }`}
          >
            Doubles
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
