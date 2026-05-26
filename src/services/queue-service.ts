import { Player, PairingMode } from "@/types/player";
import { Matchup } from "@/types/queue";
import { addMatchups, clearWaitingQueue, getGlobalQueue, getActiveMatchups, updateMatchupStatus, clearAllMatchups } from "./database";
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
    for (let i = 0; i + playersPerTeam - 1 < sorted.length; i += playersPerTeam) {
      teams.push(sorted.slice(i, i + playersPerTeam));
    }
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

export async function rebuildGlobalQueue(matchType: string = "doubles") {
  const activePlayers = await fetchActivePlayers();
  
  const playingMatchupsDB = await getActiveMatchups();
  const playingPlayerIds = new Set<number>();
  
  for (const m of playingMatchupsDB) {
    try {
      const teamA = JSON.parse(m.team_a) as Player[];
      const teamB = JSON.parse(m.team_b) as Player[];
      teamA.forEach(p => playingPlayerIds.add(p.id));
      teamB.forEach(p => playingPlayerIds.add(p.id));
    } catch {}
  }
  
  const waitingPlayers = activePlayers.filter(p => !playingPlayerIds.has(p.id));
  const newMatchups = buildBalancedPool(waitingPlayers, matchType, currentPairingMode);
  
  await clearWaitingQueue();
  
  await addMatchups(newMatchups.map((m, index) => ({
    teamA: JSON.stringify(m.teamA),
    teamB: JSON.stringify(m.teamB),
    orderIndex: index,
    status: "waiting",
    courtId: null
  })));

  notifyQueueChanged();
}

export async function rotateCourt(courtId: number) {
  const playingMatchups = await getActiveMatchups();
  const currentMatch = playingMatchups.find(m => m.courtId === courtId);
  
  if (currentMatch) {
    await updateMatchupStatus(currentMatch.id, "finished", null);
  }
  
  const queue = await getGlobalQueue();
  if (queue.length > 0) {
    const nextMatch = queue[0];
    await updateMatchupStatus(nextMatch.id, "playing", courtId);
  }
  
  notifyQueueChanged();
}

export async function autoAssignMatchupsToEmptyCourts(courtIds: number[]) {
  const playingMatchups = await getActiveMatchups();
  const occupiedCourtIds = new Set(playingMatchups.map(m => m.courtId));
  const emptyCourts = courtIds.filter(id => !occupiedCourtIds.has(id));
  
  if (emptyCourts.length === 0) return;

  const queue = await getGlobalQueue();
  let assignedCount = 0;

  for (const emptyCourtId of emptyCourts) {
    if (assignedCount < queue.length) {
      const nextMatch = queue[assignedCount];
      await updateMatchupStatus(nextMatch.id, "playing", emptyCourtId);
      assignedCount++;
    }
  }

  if (assignedCount > 0) {
    notifyQueueChanged();
  }
}

export async function clearAllPools() {
  await clearAllMatchups();
  notifyQueueChanged();
}

