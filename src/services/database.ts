import * as schema from "@/db/schema";
import { courts, matches, players, DBPlayer, matchups, DBMatchup } from "@/db/schema";
import { and, desc, eq, inArray } from "drizzle-orm";
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

export async function updatePlayerStatus(id: number, status: "active" | "inactive") {
  await db
    .update(players)
    .set({ status })
    .where(eq(players.id, id));
}

export async function resetAllPlayersToInactive() {
  await db
    .update(players)
    .set({ status: "inactive" });
}

export async function getActivePlayers(): Promise<DBPlayer[]> {
  return db
    .select()
    .from(players)
    .where(eq(players.status, "active"))
    .orderBy(desc(players.isTopPerformer), players.rank);
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

const courtListeners = new Set<() => void>();
export function subscribeToCourtChanged(listener: () => void) {
  courtListeners.add(listener);
  return () => courtListeners.delete(listener);
}
function notifyCourtChanged() {
  courtListeners.forEach((l) => l());
}

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
  notifyCourtChanged();
}

export async function deleteCourt(id: number) {
  await db.delete(courts).where(eq(courts.id, id));
  notifyCourtChanged();
}

// Matchups / Queue
export async function addMatchups(
  matchupsData: {
    teamA: string;
    teamB: string;
    orderIndex: number;
    status?: "waiting" | "playing" | "finished";
    courtId?: number | null;
  }[]
) {
  if (matchupsData.length === 0) return;
  await db.insert(matchups).values(
    matchupsData.map((m) => ({
      team_a: m.teamA,
      team_b: m.teamB,
      order_index: m.orderIndex,
      status: m.status || "waiting",
      courtId: m.courtId || null,
    }))
  );
}

export async function clearWaitingQueue() {
  await db.delete(matchups).where(eq(matchups.status, "waiting"));
}

export async function clearAllMatchups() {
  await db.delete(matchups);
}

export async function getGlobalQueue(): Promise<DBMatchup[]> {
  return db
    .select()
    .from(matchups)
    .where(eq(matchups.status, "waiting"))
    .orderBy(matchups.order_index);
}

export async function getActiveMatchups(): Promise<DBMatchup[]> {
  return db
    .select()
    .from(matchups)
    .where(eq(matchups.status, "playing"));
}

export async function updateMatchupStatus(
  id: number,
  status: "waiting" | "playing" | "finished",
  courtId: number | null = null
) {
  await db
    .update(matchups)
    .set({ status, courtId })
    .where(eq(matchups.id, id));
}

export async function deleteMatchupById(id: number) {
  await db.delete(matchups).where(eq(matchups.id, id));
}

export async function finishMatchupsByIds(ids: number[]) {
  if (ids.length === 0) return;
  await db.update(matchups).set({ status: "finished", courtId: null }).where(inArray(matchups.id, ids));
}

export async function deleteMatchupsByIds(ids: number[]) {
  if (ids.length === 0) return;
  await db.delete(matchups).where(inArray(matchups.id, ids));
}

export async function getActiveMatchupForCourt(courtId: number) {
  const [result] = await db
    .select()
    .from(matchups)
    .where(and(eq(matchups.status, "playing"), eq(matchups.courtId, courtId)))
    .limit(1);
  return result ?? null;
}