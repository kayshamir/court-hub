import React from "react";
import { Pressable, PressableProps, Text } from "react-native";

interface CustomButtonProps extends PressableProps {
  label?: string;
  className?: string;
  labelClassName?: string;
  children?: React.ReactNode;
  small?: boolean;
}

export function Button({
  label,
  className = "",
  labelClassName = "",
  children,
  small = false,
  ...props
}: CustomButtonProps) {
  return (
    <Pressable
      className={`bg-primary ${small ? "py-2.5" : "py-5"} rounded-full items-center justify-center active:scale-[0.98] transition-transform ${className}`}
      {...props}
    >
      {children ? (
        children
      ) : (
        <Text
          className={`text-white text-sm font-extrabold tracking-wider ${labelClassName}`}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}
