import { Player } from "@/types/player";
import { addPlayer, getPlayers, initDatabase } from "./database";

export async function initializePlayersDB() {
  await initDatabase();
}

export async function fetchRankedPlayersList(): Promise<Player[]> {
  const dbPlayers = await getPlayers();

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
      wins: p.wins,
      losses: p.losses,
      rate: p.rate || "0.0%",
      isTopPerformer: p.isTopPerformer === 1,
    };
  });

  mappedPlayers.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return parseFloat(b.rate) - parseFloat(a.rate);
  });

  return mappedPlayers.map((p, idx) => ({
    ...p,
    rank: idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`,
    isTopPerformer: idx === 0,
  }));
}

export async function registerPlayer(
  name: string,
  initialWins: string,
  initialLosses: string,
) {
  const winsNum = parseInt(initialWins) || 0;
  const lossesNum = parseInt(initialLosses) || 0;
  const total = winsNum + lossesNum;
  const rateVal =
    total > 0 ? `${((winsNum / total) * 100).toFixed(1)}%` : "0.0%";

  const newForm: ("W" | "L")[] = [];
  for (let i = 0; i < 5; i++) {
    if (i < winsNum) {
      newForm.push("W");
    } else {
      newForm.push("L");
    }
  }
  newForm.sort(() => Math.random() - 0.5);

  await addPlayer(name, "00", newForm, winsNum, lossesNum, rateVal, false);
}
