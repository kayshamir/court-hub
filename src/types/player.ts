export type SkillLevel = "Beginner" | "Intermediate" | "Advanced";
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
