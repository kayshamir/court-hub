import { DBCourt } from "@/db/schema";
import { Team } from "@/types/queue";

export const MOCK_COURTS: DBCourt[] = [
  {
    id: 1,
    name: "Court 01",
    sport: "Badminton",
    matchType: "Doubles",
    status: "available",
    createdAt: "",
  },
  {
    id: 2,
    name: "Court 02",
    sport: "Badminton",
    matchType: "Doubles",
    status: "available",
    createdAt: "",
  },
];

export const INITIAL_POOL: Team[] = [
  { id: 1, players: ["Elena R.", "David K."], position: 1 },
  { id: 2, players: ["Chris E.", "Tom H."], position: 2 },
  { id: 3, players: ["Jessica A.", "Scarlett J."], position: 3 },
  { id: 4, players: ["Taylor S.", "Travis K."], position: 4 },
  { id: 5, players: ["Alex R.", "Jordan C."], position: 5 },
  { id: 6, players: ["Sarah T.", "Marcus W."], position: 6 },
  { id: 7, players: ["Mike J.", "LeBron J."], position: 7 },
  { id: 8, players: ["Kobe B.", "Steph C."], position: 8 },
  { id: 9, players: ["Giannis A.", "Luka D."], position: 9 },
];

export function getCourtMatch(pool: Team[], courtIndex: number) {
  return {
    currentA: pool[courtIndex * 4]?.players ?? null,
    currentB: pool[courtIndex * 4 + 1]?.players ?? null,
    nextA: pool[courtIndex * 4 + 2]?.players ?? null,
    nextB: pool[courtIndex * 4 + 3]?.players ?? null,
  };
}

let currentPool: Team[] = [...INITIAL_POOL];
const poolListeners = new Set<() => void>();

export function getPool(): Team[] {
  return currentPool;
}

export function setPool(newPool: Team[]) {
  currentPool = newPool;
  poolListeners.forEach((l) => l());
}

export function subscribeToPool(listener: () => void) {
  poolListeners.add(listener);
  return () => {
    poolListeners.delete(listener);
  };
}

export function rotateCourt(
  courtIndex: number,
  assignedCount: number,
  updatedTeamA?: string[],
  updatedTeamB?: string[],
) {
  const tempPool: (Team | undefined)[] = [...currentPool];

  const idxA = courtIndex * 4;
  const idxB = courtIndex * 4 + 1;
  const idxNextA = courtIndex * 4 + 2;
  const idxNextB = courtIndex * 4 + 3;

  const oldA = tempPool[idxA];
  const oldB = tempPool[idxB];
  const nextA = tempPool[idxNextA];
  const nextB = tempPool[idxNextB];

  if (oldA && updatedTeamA) {
    oldA.players = updatedTeamA;
  }
  if (oldB && updatedTeamB) {
    oldB.players = updatedTeamB;
  }

  const waitingPool = currentPool.slice(assignedCount);

  // The new current teams for this court are the old next teams
  tempPool[idxA] = nextA;
  tempPool[idxB] = nextB;

  // The new next teams for this court come from the head of the waiting pool
  const newNextA = waitingPool.shift();
  const newNextB = waitingPool.shift();

  tempPool[idxNextA] = newNextA;
  tempPool[idxNextB] = newNextB;

  // The finished teams go to the back of the waiting pool
  if (oldA) waitingPool.push(oldA);
  if (oldB) waitingPool.push(oldB);

  // Now, we need to reconstruct the pool
  const assignedTeams: Team[] = [];
  for (let i = 0; i < assignedCount; i++) {
    const t = tempPool[i];
    if (t) {
      assignedTeams.push(t);
    }
  }

  const newPool = [...assignedTeams, ...waitingPool];

  // Re-index all positions
  const reIndexedPool = newPool.map((team, idx) => ({
    ...team,
    position: idx + 1,
  }));

  setPool(reIndexedPool);
}

export function reorderWaitingPool(
  pool: Team[],
  newOrder: number[],
  assignedCount: number,
  waitingPool: Team[],
): Team[] {
  const assigned = pool.slice(0, assignedCount);
  const reordered = newOrder
    .map((id) => waitingPool.find((t) => t.id === id)!)
    .filter(Boolean)
    .map((t, idx) => ({ ...t, position: assignedCount + idx + 1 }));
  return [...assigned, ...reordered];
}

export function shuffleWaitingPool(pool: Team[], assignedCount: number): Team[] {
  const assigned = pool.slice(0, assignedCount);
  const shuffled = [...pool.slice(assignedCount)]
    .sort(() => Math.random() - 0.5)
    .map((t, idx) => ({ ...t, position: assignedCount + idx + 1 }));
  return [...assigned, ...shuffled];
}
