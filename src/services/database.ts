import * as SQLite from "expo-sqlite";
import { DBMatch, DBPlayer } from "@/types/player";

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB() {
  if (!dbInstance) {
    dbInstance = await SQLite.openDatabaseAsync("courthub.db");
  }
  return dbInstance;
}

export async function initDatabase() {
  const db = await getDB();
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      rank TEXT NOT NULL,
      form TEXT NOT NULL,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
      rate TEXT,
      isTopPerformer INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_a TEXT NOT NULL,
      team_b TEXT NOT NULL,
      score_a INTEGER NOT NULL,
      score_b INTEGER NOT NULL,
      winner TEXT NOT NULL,
      played_at TEXT NOT NULL
    );
  `);
}

export async function getPlayers(): Promise<DBPlayer[]> {
  const db = await getDB();
  return await db.getAllAsync<DBPlayer>("SELECT * FROM players ORDER BY isTopPerformer DESC, rank ASC");
}

export async function addPlayer(
  name: string,
  rank: string,
  form: ("W" | "L")[],
  wins: number,
  losses: number,
  rate: string,
  isTopPerformer: boolean
) {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO players (name, rank, form, wins, losses, rate, isTopPerformer) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [name, rank, JSON.stringify(form), wins, losses, rate, isTopPerformer ? 1 : 0]
  );
}

export async function updatePlayerStats(name: string, won: boolean) {
  const db = await getDB();
  const player = await db.getFirstAsync<DBPlayer>(
    "SELECT * FROM players WHERE name = ?",
    [name]
  );
  if (!player) return;

  const wins = won ? player.wins + 1 : player.wins;
  const losses = won ? player.losses : player.losses + 1;
  const total = wins + losses;
  const rate = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : "0.0%";

  let form: ("W" | "L")[] = [];
  try {
    form = JSON.parse(player.form);
  } catch {
    form = [];
  }
  form.unshift(won ? "W" : "L");
  form = form.slice(0, 5);

  await db.runAsync(
    "UPDATE players SET wins = ?, losses = ?, rate = ?, form = ? WHERE name = ?",
    [wins, losses, rate, JSON.stringify(form), name]
  );
}

export async function clearPlayers() {
  const db = await getDB();
  await db.execAsync("DELETE FROM players");
}

export async function addMatch(
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
  winner: string
) {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO matches (team_a, team_b, score_a, score_b, winner, played_at) VALUES (?, ?, ?, ?, ?, ?)",
    [JSON.stringify(teamA), JSON.stringify(teamB), scoreA, scoreB, winner, new Date().toISOString()]
  );
}

export async function getRecentMatches(limit = 20): Promise<DBMatch[]> {
  const db = await getDB();
  return await db.getAllAsync<DBMatch>(
    "SELECT * FROM matches ORDER BY played_at DESC LIMIT ?",
    [limit]
  );
}
