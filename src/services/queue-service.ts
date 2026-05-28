import { Player, PairingMode } from "@/types/player";
import { Matchup } from "@/types/queue";
import { addMatchups, clearWaitingQueue, getGlobalQueue, getActiveMatchups, updateMatchupStatus, clearAllMatchups, deleteMatchupsByIds, finishMatchupsByIds } from "./database";
import { fetchActivePlayers } from "./player-service";

const SKILL_VALUE = { Beginner: 1, Intermediate: 2, Advanced: 3 };

let currentPairingMode: PairingMode = "balanced_mix";
const pairingModeListeners = new Set<(mode: PairingMode) => void>();
const queueListeners = new Set<() => void>();

export function getPairingMode(): PairingMode {
  return currentPairingMode;
}

export function setPairingMode(mode: PairingMode) {
  currentPairingMode = mode;
  pairingModeListeners.forEach((l) => l(mode));
}

export function subscribeToPairingMode(listener: (mode: PairingMode) => void) {
  pairingModeListeners.add(listener);
  return () => {
    pairingModeListeners.delete(listener);
  };
}

export function subscribeToQueue(listener: () => void) {
  queueListeners.add(listener);
  return () => {
    queueListeners.delete(listener);
  };
}

export function notifyQueueChanged() {
  queueListeners.forEach((l) => l());
}

export function buildBalancedPool(
  players: Player[],
  matchType: string,
  pairingMode: PairingMode,
): Matchup[] {
  const isDoubles = matchType.toLowerCase() === "doubles";
  const playersPerTeam = isDoubles ? 2 : 1;

  // Step 1: Sort based on pairing mode
  let sorted = [...players];
  if (pairingMode !== "random") {
    sorted.sort((a, b) => SKILL_VALUE[a.level] - SKILL_VALUE[b.level]);
  }

  // Step 2: Form teams
  let teams: Player[][] = [];

  if (pairingMode === "same_level") {
    // Group by level, pair only within each level group
    const levelGroups = new Map<string, Player[]>();
    for (const p of sorted) {
      const group = levelGroups.get(p.level) ?? [];
      group.push(p);
      levelGroups.set(p.level, group);
    }
    const matchups: Matchup[] = [];
    for (const group of levelGroups.values()) {
      const groupTeams: Player[][] = [];
      for (let i = 0; i + playersPerTeam - 1 < group.length; i += playersPerTeam) {
        groupTeams.push(group.slice(i, i + playersPerTeam));
      }
      for (let i = 0; i + 1 < groupTeams.length; i += 2) {
        matchups.push({
          id: Math.random().toString(36).substring(7),
          teamA: groupTeams[i],
          teamB: groupTeams[i + 1],
        });
      }
    }
    return matchups;
  } else if (pairingMode === "balanced_mix" && isDoubles) {
    const copy = [...sorted];
    while (copy.length >= 2) {
      const low = copy.shift()!;
      const high = copy.pop()!;
      teams.push([low, high]);
    }
  } else {
    for (let i = 0; i + playersPerTeam - 1 < sorted.length; i += playersPerTeam) {
      teams.push(sorted.slice(i, i + playersPerTeam));
    }
    if (pairingMode === "balanced_mix" && !isDoubles) {
      const half = Math.floor(teams.length / 2);
      const reordered: Matchup[] = [];
      for (let i = 0; i < half; i++) {
        reordered.push({ 
          id: Math.random().toString(36).substring(7),
          teamA: teams[i], 
          teamB: teams[teams.length - 1 - i] 
        });
      }
      return reordered;
    }
  }

  // Step 3: Pair teams into matchups
  const matchups: Matchup[] = [];
  for (let i = 0; i + 1 < teams.length; i += 2) {
    matchups.push({ 
      id: Math.random().toString(36).substring(7),
      teamA: teams[i], 
      teamB: teams[i + 1] 
    });
  }
  return matchups;
}

let isRebuildingQueue = false;

export async function rebuildGlobalQueue(courts: { id: number; matchType: string }[]) {
  if (isRebuildingQueue || courts.length === 0) return;
  isRebuildingQueue = true;
  try {
    await _rebuildGlobalQueue(courts);
  } finally {
    isRebuildingQueue = false;
  }
}

async function _rebuildGlobalQueue(courts: { id: number; matchType: string }[]) {

  const activePlayers = await fetchActivePlayers();

  const playingMatchupsDB = await getActiveMatchups();
  const playingPlayerIds = new Set<number>();
  for (const m of playingMatchupsDB) {
    try {
      const teamA = JSON.parse(m.team_a) as Player[];
      const teamB = JSON.parse(m.team_b) as Player[];
      teamA.forEach((p) => playingPlayerIds.add(p.id));
      teamB.forEach((p) => playingPlayerIds.add(p.id));
    } catch {}
  }

  let waitingPlayers = activePlayers.filter((p) => !playingPlayerIds.has(p.id));

  // Sort match types by court count descending so more courts get proportionally more queue slots
  const courtCounts = new Map<string, number>();
  for (const c of courts) {
    courtCounts.set(c.matchType, (courtCounts.get(c.matchType) ?? 0) + 1);
  }
  const matchTypes = [...courtCounts.keys()].sort(
    (a, b) => (courtCounts.get(b) ?? 0) - (courtCounts.get(a) ?? 0)
  );

  const allMatchupData: {
    teamA: string;
    teamB: string;
    orderIndex: number;
    status: "waiting";
    courtId: null;
  }[] = [];
  let orderIndex = 0;

  // Interleave one matchup at a time per court type so all types get players from the same pool
  let madeProgress = true;
  while (madeProgress) {
    madeProgress = false;
    for (const matchType of matchTypes) {
      const playersPerMatch = matchType.toLowerCase() === "doubles" ? 4 : 2;
      if (waitingPlayers.length < playersPerMatch) continue;

      const newMatchups = buildBalancedPool(waitingPlayers, matchType, currentPairingMode);
      if (newMatchups.length === 0) continue;

      const m = newMatchups[0];
      allMatchupData.push({
        teamA: JSON.stringify(m.teamA),
        teamB: JSON.stringify(m.teamB),
        orderIndex: orderIndex++,
        status: "waiting",
        courtId: null,
      });

      const usedIds = new Set<number>();
      m.teamA.forEach((p) => usedIds.add(p.id));
      m.teamB.forEach((p) => usedIds.add(p.id));
      waitingPlayers = waitingPlayers.filter((p) => !usedIds.has(p.id));
      madeProgress = true;
    }
  }

  await clearWaitingQueue();
  if (allMatchupData.length > 0) {
    await addMatchups(allMatchupData);
  }

  notifyQueueChanged();
}

export async function rotateCourt(courtId: number, matchType: string) {
  const playingMatchups = await getActiveMatchups();
  const currentMatch = playingMatchups.find((m) => m.courtId === courtId);

  if (currentMatch) {
    await updateMatchupStatus(currentMatch.id, "finished", null);
  }

  const expectedTeamSize = matchType.toLowerCase() === "doubles" ? 2 : 1;
  const queue = await getGlobalQueue();
  const nextMatch = queue.find((m) => {
    try {
      return (JSON.parse(m.team_a) as Player[]).length === expectedTeamSize;
    } catch {
      return false;
    }
  });

  if (nextMatch) {
    await updateMatchupStatus(nextMatch.id, "playing", courtId);
  }

  notifyQueueChanged();
}

export async function autoAssignMatchupsToEmptyCourts(
  courts: { id: number; matchType: string }[]
) {
  const playingMatchups = await getActiveMatchups();
  const occupiedCourtIds = new Set(playingMatchups.map((m) => m.courtId));
  const emptyCourts = courts.filter((c) => !occupiedCourtIds.has(c.id));

  if (emptyCourts.length === 0) return;

  const queue = await getGlobalQueue();
  const assignedMatchupIds = new Set<number>();
  let assignedCount = 0;

  for (const court of emptyCourts) {
    const expectedTeamSize = court.matchType.toLowerCase() === "doubles" ? 2 : 1;
    const matchup = queue.find((m) => {
      if (assignedMatchupIds.has(m.id)) return false;
      try {
        return (JSON.parse(m.team_a) as Player[]).length === expectedTeamSize;
      } catch {
        return false;
      }
    });

    if (matchup) {
      await updateMatchupStatus(matchup.id, "playing", court.id);
      assignedMatchupIds.add(matchup.id);
      assignedCount++;
    }
  }

  if (assignedCount > 0) {
    notifyQueueChanged();
  }
}

export async function manualAssignCourt(
  courtId: number,
  teamA: Player[],
  teamB: Player[],
) {
  const playing = await getActiveMatchups();
  const selectedIds = new Set([...teamA, ...teamB].map((p) => p.id));

  const toFinish = playing
    .filter((m) => {
      if (m.courtId === courtId) return true;
      try {
        const mA = JSON.parse(m.team_a) as Player[];
        const mB = JSON.parse(m.team_b) as Player[];
        return [...mA, ...mB].some((p) => selectedIds.has(p.id));
      } catch {
        return false;
      }
    })
    .map((m) => m.id);

  await finishMatchupsByIds(toFinish);
  await addMatchups([{
    teamA: JSON.stringify(teamA),
    teamB: JSON.stringify(teamB),
    orderIndex: 0,
    status: "playing",
    courtId,
  }]);
  notifyQueueChanged();
}

export async function removePlayerFromQueue(playerId: number) {
  const waiting = await getGlobalQueue();
  const playing = await getActiveMatchups();

  const idsToDelete: number[] = [];
  for (const m of [...waiting, ...playing]) {
    try {
      const teamA = JSON.parse(m.team_a) as Player[];
      const teamB = JSON.parse(m.team_b) as Player[];
      if ([...teamA, ...teamB].some((p) => p.id === playerId)) {
        idsToDelete.push(m.id);
      }
    } catch {}
  }

  await deleteMatchupsByIds(idsToDelete);
  notifyQueueChanged();
}

export async function clearAllPools() {
  await clearAllMatchups();
  notifyQueueChanged();
}

