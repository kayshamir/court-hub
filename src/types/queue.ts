import { Player } from "./player";

export type Matchup = {
  id: string;
  teamA: Player[];
  teamB: Player[];
};
