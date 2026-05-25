export interface Player {
  id: number;
  name: string;
  rank: string;
  form: ("W" | "L")[];
  wins: number;
  losses: number;
  rate: string;
  isTopPerformer: boolean;
}

export interface DBPlayer {
  id: number;
  name: string;
  rank: string;
  form: string; // JSON string of ('W' | 'L')[]
  wins: number;
  losses: number;
  rate: string;
  isTopPerformer: number; // 0 or 1
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

export interface DBMatch {
  id: number;
  team_a: string; // JSON string of string[]
  team_b: string; // JSON string of string[]
  score_a: number;
  score_b: number;
  winner: string;
  played_at: string;
}
