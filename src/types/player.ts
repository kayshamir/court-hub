// DBPlayer and DBMatch have been replaced by Drizzle inferred types in src/db/schema.ts
// Use: import { DBPlayer, DBMatch } from '@/db/schema';

export interface Player {
  id: number;
  name: string;
  rank: string;
  form: ('W' | 'L')[];
  wins: number;
  losses: number;
  rate: string;
  isTopPerformer: boolean;
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
