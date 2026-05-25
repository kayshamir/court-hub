import * as schema from "@/db/schema";
import { courts, matches, players, DBPlayer } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { SkillLevel } from "@/types/player";
import * as SQLite from "expo-sqlite";

export const expoDb = SQLite.openDatabaseSync("courthub.db");
export const db = drizzle(expoDb, { schema });

export async function getPlayers(): Promise<DBPlayer[]> {
  return db
    .select()
    .from(players)
    .orderBy(desc(players.isTopPerformer), players.rank);
}

export async function addPlayer(
  name: string,
  rank: string,
  form: ("W" | "L")[],
  wins: number,
  losses: number,
  rate: string,
  isTopPerformer: boolean,
  level: SkillLevel,
) {
  await db.insert(players).values({
    name,
    rank,
    form: JSON.stringify(form),
    wins,
    losses,
    rate,
    isTopPerformer: isTopPerformer ? 1 : 0,
    level,
  });
}

export async function updatePlayerLevel(id: number, level: SkillLevel) {
  await db
    .update(players)
    .set({ level })
    .where(eq(players.id, id));
}

export async function deletePlayer(id: number) {
  await db
    .delete(players)
    .where(eq(players.id, id));
}

export async function updatePlayerStats(name: string, won: boolean) {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.name, name))
    .limit(1);

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

  await db
    .update(players)
    .set({ wins, losses, rate, form: JSON.stringify(form) })
    .where(eq(players.name, name));
}

export async function clearPlayers() {
  await db.delete(players);
}

// Matches
export async function addMatch(
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
  winner: string,
) {
  await db.insert(matches).values({
    team_a: JSON.stringify(teamA),
    team_b: JSON.stringify(teamB),
    score_a: scoreA,
    score_b: scoreB,
    winner,
    played_at: new Date().toISOString(),
  });
}

export async function getRecentMatches(limit = 20) {
  return db
    .select()
    .from(matches)
    .orderBy(desc(matches.played_at))
    .limit(limit);
}

// Courts

export async function getCourts() {
  return db
    .select()
    .from(courts)
    .orderBy(desc(courts.createdAt));
}

export async function addCourt(
  name: string,
  sport: string,
  matchType: string,
) {
  await db.insert(courts).values({
    name,
    sport,
    matchType,
    status: "available",
    createdAt: new Date().toISOString(),
  });
}

export async function deleteCourt(id: number) {
  await db.delete(courts).where(eq(courts.id, id));
}