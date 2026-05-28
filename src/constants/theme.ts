import "@/global.css";

import { Platform } from "react-native";

const IOS_SYSTEM_COLORS = {
  white: "rgb(255, 255, 255)",
  black: "rgb(0, 0, 0)",
  light: {
    grey6: "rgb(248, 247, 247)",
    grey5: "rgb(238, 236, 237)",
    grey4: "rgb(228, 226, 226)",
    grey3: "rgb(214, 210, 210)",
    grey2: "rgb(184, 178, 179)",
    grey: "rgb(165, 157, 157)",
    background: "rgb(247, 244, 245)",
    foreground: "rgb(6, 4, 5)",
    root: "rgb(247, 244, 245)",
    card: "rgb(247, 244, 245)",
    destructive: "rgb(255, 56, 43)",
    primary: "rgb(193, 18, 31)",
    text: "rgb(6, 4, 5)",
    backgroundElement: "rgb(248, 247, 247)",
    backgroundSelected: "rgb(238, 236, 237)",
    textSecondary: "rgb(165, 157, 157)",
  },
  dark: {
    grey6: "rgb(28, 26, 26)",
    grey5: "rgb(47, 43, 44)",
    grey4: "rgb(60, 56, 56)",
    grey3: "rgb(82, 75, 76)",
    grey2: "rgb(127, 117, 117)",
    grey: "rgb(164, 156, 157)",
    background: "rgb(5, 0, 1)",
    foreground: "rgb(254, 245, 246)",
    root: "rgb(5, 0, 1)",
    card: "rgb(5, 0, 1)",
    destructive: "rgb(254, 67, 54)",
    primary: "rgb(238, 68, 81)",
    text: "rgb(254, 245, 246)",
    backgroundElement: "rgb(28, 26, 26)",
    backgroundSelected: "rgb(47, 43, 44)",
    textSecondary: "rgb(164, 156, 157)",
  },
} as const;

const ANDROID_COLORS = {
  white: "rgb(255, 255, 255)",
  black: "rgb(0, 0, 0)",
  light: {
    grey6: "rgb(248, 247, 247)",
    grey5: "rgb(238, 236, 237)",
    grey4: "rgb(228, 226, 226)",
    grey3: "rgb(214, 210, 210)",
    grey2: "rgb(184, 178, 179)",
    grey: "rgb(165, 157, 157)",
    background: "rgb(247, 244, 245)",
    foreground: "rgb(6, 4, 5)",
    root: "rgb(247, 244, 245)",
    card: "rgb(247, 244, 245)",
    destructive: "rgb(255, 56, 43)",
    primary: "rgb(193, 18, 31)",
    text: "rgb(6, 4, 5)",
    backgroundElement: "rgb(248, 247, 247)",
    backgroundSelected: "rgb(238, 236, 237)",
    textSecondary: "rgb(165, 157, 157)",
  },
  dark: {
    grey6: "rgb(28, 26, 26)",
    grey5: "rgb(47, 43, 44)",
    grey4: "rgb(60, 56, 56)",
    grey3: "rgb(82, 75, 76)",
    grey2: "rgb(127, 117, 117)",
    grey: "rgb(164, 156, 157)",
    background: "rgb(5, 0, 1)",
    foreground: "rgb(254, 245, 246)",
    root: "rgb(5, 0, 1)",
    card: "rgb(5, 0, 1)",
    destructive: "rgb(254, 67, 54)",
    primary: "rgb(238, 68, 81)",
    text: "rgb(254, 245, 246)",
    backgroundElement: "rgb(28, 26, 26)",
    backgroundSelected: "rgb(47, 43, 44)",
    textSecondary: "rgb(164, 156, 157)",
  },
} as const;

const WEB_COLORS = {
  white: "rgb(255, 255, 255)",
  black: "rgb(0, 0, 0)",
  light: {
    grey6: "rgb(250, 252, 255)",
    grey5: "rgb(243, 247, 251)",
    grey4: "rgb(236, 242, 248)",
    grey3: "rgb(233, 239, 247)",
    grey2: "rgb(229, 237, 245)",
    grey: "rgb(226, 234, 243)",
    background: "rgb(250, 252, 255)",
    foreground: "rgb(27, 28, 29)",
    root: "rgb(250, 252, 255)",
    card: "rgb(250, 252, 255)",
    destructive: "rgb(186, 26, 26)",
    primary: "rgb(0, 112, 233)",
    text: "rgb(27, 28, 29)",
    backgroundElement: "rgb(250, 252, 255)",
    backgroundSelected: "rgb(243, 247, 251)",
    textSecondary: "rgb(226, 234, 243)",
  },
  dark: {
    grey6: "rgb(25, 30, 36)",
    grey5: "rgb(31, 38, 45)",
    grey4: "rgb(35, 43, 52)",
    grey3: "rgb(38, 48, 59)",
    grey2: "rgb(40, 51, 62)",
    grey: "rgb(44, 56, 68)",
    background: "rgb(24, 28, 32)",
    foreground: "rgb(221, 227, 233)",
    root: "rgb(24, 28, 32)",
    card: "rgb(24, 28, 32)",
    destructive: "rgb(147, 0, 10)",
    primary: "rgb(0, 69, 148)",
    text: "rgb(221, 227, 233)",
    backgroundElement: "rgb(25, 30, 36)",
    backgroundSelected: "rgb(31, 38, 45)",
    textSecondary: "rgb(44, 56, 68)",
  },
} as const;

export const Colors =
  Platform.OS === "ios"
    ? IOS_SYSTEM_COLORS
    : Platform.OS === "android"
      ? ANDROID_COLORS
      : WEB_COLORS;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "var(--font-display)",
    serif: "var(--font-serif)",
    rounded: "var(--font-rounded)",
    mono: "var(--font-mono)",
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 70 }) ?? 0;
export const MaxContentWidth = 800;
