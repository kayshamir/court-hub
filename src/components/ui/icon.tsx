import {
  Bell,
  ChevronRight,
  CircleCheck,
  Crown,
  Feather,
  Map,
  Medal,
  Menu,
  Play,
  Plus,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Target,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import { SymbolView } from "expo-symbols";
import { Platform } from "react-native";

const ICON_MAP = {
  "bell.fill": Bell,
  "play.fill": Play,
  "person.3.fill": Users,
  "sportscourt.fill": Trophy,
  sportscourt: Trophy,
  plus: Plus,
  sparkles: Sparkles,
  "checkmark.circle.fill": CircleCheck,
  "map.fill": Map,
  shuffle: Shuffle,
  "line.3.horizontal": Menu,
  "person.badge.plus": UserPlus,
  magnifyingglass: Search,
  "star.fill": Star,
  "crown.fill": Crown,
  xmark: X,
  "chevron.right": ChevronRight,
  "tennisball.fill": Target,
  "figure.racquetball": Medal,
  "figure.badminton": Feather,
} as const;

type IconName = keyof typeof ICON_MAP;

interface AppIconProps {
  name: string;
  size?: number;
  tintColor?: string;
  style?: any;
  weight?: string;
}

export function AppIcon({ name, size = 24, tintColor, style, weight }: AppIconProps) {
  if (Platform.OS === "ios") {
    return (
      <SymbolView
        name={name as any}
        size={size}
        tintColor={tintColor}
        style={style}
        weight={weight as any}
      />
    );
  }

  const LucideIcon = ICON_MAP[name as IconName];
  if (!LucideIcon) return null;

  return <LucideIcon size={size} color={tintColor} style={style} />;
}
