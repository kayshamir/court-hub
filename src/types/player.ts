export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
export type PlayerStatus = "active" | "inactive";
export type PairingMode = "same_level" | "balanced_mix" | "random";

export interface Player {
  id: number;
  name: string;
  rank: string;
  form: ("W" | "L")[];
  wins: number;
  losses: number;
  rate: string;
  isTopPerformer: boolean;
  level: SkillLevel;
  status: PlayerStatus;
}
export interface Match {
  id: number;
  teamA: string[];
  teamB: string[];
  scoreA: number;
  scoreB: number;
  winner: string;
  playedAt: string;
}
