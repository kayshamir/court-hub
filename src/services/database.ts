import * as SQLite from "expo-sqlite";
import { DBPlayer } from "@/types/player";

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

export async function clearPlayers() {
  const db = await getDB();
  await db.execAsync("DELETE FROM players");
}
