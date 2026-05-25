import { useTheme } from "@/hooks/use-theme";
import React from "react";
import {
  TextInput as RNTextInput,
  Text,
  TextInputProps,
  View,
} from "react-native";

interface CustomTextInputProps extends TextInputProps {
  label?: string;
  containerClassName?: string;
}

export function TextInput({
  label,
  containerClassName = "",
  className = "",
  placeholderTextColor,
  ...props
}: CustomTextInputProps) {
  const theme = useTheme();

  return (
    <View className={`gap-2 ${containerClassName}`}>
      {label && (
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
      )}
      <RNTextInput
        style={{
          height: 50,
          paddingTop: 8,
        }}
        className={`bg-secondary rounded-2xl border border-black/5 px-4 py-4 text-sm text-foreground font-medium outline-none ${className}`}
        placeholderTextColor={placeholderTextColor || theme.textSecondary}
        {...props}
      />
    </View>
  );
}
