export type SportType = "tennis" | "pickleball" | "badminton";
export type MatchType = "singles" | "doubles";
export type CourtStatus = "available" | "playing" | "reserved";

export interface SportConfig {
  label: string;
  symbolName: string; // SF Symbol name for expo-symbols
  dimensions: string;
}

/** Mirrors the `courts` SQLite table row */
export interface DBCourt {
  id: number;
  name: string;
  sport: SportType;
  matchType: MatchType;
  status: CourtStatus;
  createdAt: string; // ISO date string
}

export const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  tennis: {
    label: "Tennis",
    symbolName: "tennisball.fill",
    dimensions: "78' x 36'",
  },
  pickleball: {
    label: "Pickleball",
    symbolName: "figure.racquetball",
    dimensions: "44' x 20'",
  },
  badminton: {
    label: "Badminton",
    symbolName: "figure.badminton",
    dimensions: "44' x 20'",
  },
};
