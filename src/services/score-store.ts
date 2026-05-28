interface ScoreState {
  scoreA: number;
  scoreB: number;
  servingTeam: "A" | "B";
  teamAPlayers: string[];
  teamBPlayers: string[];
  initialTeamA: string[];
  initialTeamB: string[];
  winTarget: number;
  winBy2: boolean;
  isPaused: boolean;
  winner: "A" | "B" | null;
  history: Array<{
    scoreA: number;
    scoreB: number;
    teamAPlayers: string[];
    teamBPlayers: string[];
    servingTeam: "A" | "B";
  }>;
  recentPlays: Array<{ id: number; player: string; action: string; points: string }>;
}

const store = new Map<number, ScoreState>();

export const scoreStore = {
  get: (courtId: number): ScoreState | undefined => store.get(courtId),
  set: (courtId: number, state: ScoreState): void => { store.set(courtId, state); },
  delete: (courtId: number): void => { store.delete(courtId); },
};
