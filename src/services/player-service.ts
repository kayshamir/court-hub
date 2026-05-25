import { DBPlayer } from "@/db/schema";
import { Player, SkillLevel } from "@/types/player";
import {
  addPlayer,
  deletePlayer,
  getPlayers,
  updatePlayerLevel,
} from "./database";

export async function initializePlayersDB() {
  // Migrations are now handled by useMigrations in _layout.tsx
}

export async function fetchRankedPlayersList(): Promise<Player[]> {
  const dbPlayers: DBPlayer[] = await getPlayers();

  const mappedPlayers: Player[] = dbPlayers.map((p) => {
    let parsedForm: ("W" | "L")[] = [];
    try {
      parsedForm = JSON.parse(p.form);
    } catch {
      parsedForm = [];
    }
    return {
      id: p.id,
      name: p.name,
      rank: p.rank,
      form: parsedForm,
      wins: p.wins ?? 0,
      losses: p.losses ?? 0,
      rate: p.rate ?? "0.0%",
      isTopPerformer: p.isTopPerformer === 1,
      level: (p.level as SkillLevel) || "Beginner",
    };
  });

  const getWinRateValue = (player: Player) => parseFloat(player.rate) || 0;

  mappedPlayers.sort((a, b) => {
    const rateA = getWinRateValue(a);
    const rateB = getWinRateValue(b);
    if (rateB !== rateA) return rateB - rateA;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.name.localeCompare(b.name);
  });

  return mappedPlayers.map((p, idx) => ({
    ...p,
    rank: idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`,
    isTopPerformer: idx === 0,
  }));
}

export async function registerPlayer(name: string, level: SkillLevel) {
  const winsNum = 0;
  const lossesNum = 0;
  const rateVal = "0.0%";
  const newForm: ("W" | "L")[] = [];

  await addPlayer(
    name,
    "00",
    newForm,
    winsNum,
    lossesNum,
    rateVal,
    false,
    level,
  );
}

export async function removePlayer(playerId: number) {
  await deletePlayer(playerId);
}

export async function changePlayerSkillLevel(
  playerId: number,
  level: SkillLevel,
) {
  await updatePlayerLevel(playerId, level);
}
