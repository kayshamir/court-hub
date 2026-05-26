import { Player, PairingMode } from "@/types/player";
import { Matchup } from "@/types/queue";

const SKILL_VALUE = { Beginner: 1, Intermediate: 2, Advanced: 3 };

const courtPools = new Map<number, Matchup[]>();
const poolListeners = new Set<() => void>();

let currentPairingMode: PairingMode = "balanced_mix";
const pairingModeListeners = new Set<(mode: PairingMode) => void>();

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

export function getPoolForCourt(courtId: number): Matchup[] {
  return courtPools.get(courtId) || [];
}

export function setPoolForCourt(courtId: number, pool: Matchup[]) {
  courtPools.set(courtId, pool);
  poolListeners.forEach((l) => l());
}

export function subscribeToPool(listener: () => void) {
  poolListeners.add(listener);
  return () => {
    poolListeners.delete(listener);
  };
}

export function clearAllPools() {
  courtPools.clear();
  poolListeners.forEach((l) => l());
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
    // Group by level, pair within groups
    for (let i = 0; i + playersPerTeam - 1 < sorted.length; i += playersPerTeam) {
      teams.push(sorted.slice(i, i + playersPerTeam));
    }
  } else if (pairingMode === "balanced_mix" && isDoubles) {
    // Pair from opposite ends: Beginner+Advanced, etc.
    const copy = [...sorted];
    while (copy.length >= 2) {
      const low = copy.shift()!;
      const high = copy.pop()!;
      teams.push([low, high]);
    }
  } else {
    // Random or balanced_mix singles
    for (let i = 0; i + playersPerTeam - 1 < sorted.length; i += playersPerTeam) {
      teams.push(sorted.slice(i, i + playersPerTeam));
    }
    if (pairingMode === "balanced_mix" && !isDoubles) {
      // For singles balanced: pair from opposite ends
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

export function swapPlayerInMatchup(
  matchup: Matchup,
  tappedPlayerId: number,
): Matchup {
  const idxA = matchup.teamA.findIndex(p => p.id === tappedPlayerId);
  const idxB = matchup.teamB.findIndex(p => p.id === tappedPlayerId);
  
  const newA = [...matchup.teamA];
  const newB = [...matchup.teamB];

  if (idxA !== -1 && newB[idxA]) {
    [newA[idxA], newB[idxA]] = [newB[idxA], newA[idxA]];
  } else if (idxB !== -1 && newA[idxB]) {
    [newA[idxB], newB[idxB]] = [newB[idxB], newA[idxB]];
  }

  return { ...matchup, teamA: newA, teamB: newB };
}

// Reorders a pool based on drag and drop
export function reorderWaitingPool(
  courtId: number,
  newOrder: string[], // array of matchup ids
): void {
  const current = getPoolForCourt(courtId);
  const reordered = newOrder
    .map(id => current.find(m => m.id === id)!)
    .filter(Boolean);
  
  setPoolForCourt(courtId, reordered);
}

// When a match finishes, we rotate
export function rotateCourt(courtId: number) {
  const pool = getPoolForCourt(courtId);
  if (pool.length === 0) return;

  const finishedMatchup = pool[0];
  const remaining = pool.slice(1);
  
  // Push the finished matchup to the bottom
  // In a real scenario, you might want to rebuild the pool from active players minus current court players
  // For now, simple rotation:
  setPoolForCourt(courtId, [...remaining, finishedMatchup]);
}
