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
