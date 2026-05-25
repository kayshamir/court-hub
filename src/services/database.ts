import { DBPlayer, SkillLevel } from "@/types/player";
import * as SQLite from "expo-sqlite";

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
      isTopPerformer INTEGER DEFAULT 0,
      level TEXT DEFAULT 'Beginner'
    );
  `);

  const existingColumns = await db.getAllAsync<{ name: string }>(
    "PRAGMA table_info(players);",
  );

  if (!existingColumns.some((column) => column.name === "level")) {
    await db.execAsync(
      "ALTER TABLE players ADD COLUMN level TEXT DEFAULT 'Beginner'",
    );
  }
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
  isTopPerformer: boolean,
  level: SkillLevel
) {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO players (name, rank, form, wins, losses, rate, isTopPerformer, level) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      rank,
      JSON.stringify(form),
      wins,
      losses,
      rate,
      isTopPerformer ? 1 : 0,
      level,
    ],
  );
}

export async function updatePlayerLevel(id: number, level: SkillLevel) {
  const db = await getDB();
  await db.runAsync("UPDATE players SET level = ? WHERE id = ?", [level, id]);
}

export async function deletePlayer(id: number) {
  const db = await getDB();
  await db.execAsync(`DELETE FROM players WHERE id = ${Number(id)}`);
}

export async function clearPlayers() {
  const db = await getDB();
  await db.execAsync("DELETE FROM players");
}
