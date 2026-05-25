import { Match } from '@/types/player';
import { DBMatch } from '@/db/schema';
import { addMatch, getRecentMatches, updatePlayerStats } from './database';

export async function saveMatchResult(
  teamA: string[],
  teamB: string[],
  scoreA: number,
  scoreB: number,
  winnerTeam: 'A' | 'B'
) {
  const winner = winnerTeam === 'A' ? teamA.join(' & ') : teamB.join(' & ');
  await addMatch(teamA, teamB, scoreA, scoreB, winner);

  const winners = winnerTeam === 'A' ? teamA : teamB;
  const losers = winnerTeam === 'A' ? teamB : teamA;

  await Promise.all([
    ...winners.map((name) => updatePlayerStats(name, true)),
    ...losers.map((name) => updatePlayerStats(name, false)),
  ]);
}

export async function fetchMatchHistory(): Promise<Match[]> {
  const rows: DBMatch[] = await getRecentMatches(20);
  return rows.map((r) => ({
    id: r.id,
    teamA: JSON.parse(r.team_a),
    teamB: JSON.parse(r.team_b),
    scoreA: r.score_a,
    scoreB: r.score_b,
    winner: r.winner,
    playedAt: r.played_at,
  }));
}
