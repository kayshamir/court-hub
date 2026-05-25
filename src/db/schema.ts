import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  rank: text('rank').notNull(),
  form: text('form').notNull().default('[]'), // JSON string of ('W' | 'L')[]
  wins: integer('wins').default(0).notNull(),
  losses: integer('losses').default(0).notNull(),
  rate: text('rate'),
  isTopPerformer: integer('isTopPerformer').default(0).notNull(), // 0 or 1
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  team_a: text('team_a').notNull(),  // JSON string of string[]
  team_b: text('team_b').notNull(),  // JSON string of string[]
  score_a: integer('score_a').notNull(),
  score_b: integer('score_b').notNull(),
  winner: text('winner').notNull(),
  played_at: text('played_at').notNull(),
});

// Inferred types — replaces the manual DBPlayer / DBMatch interfaces
export type DBPlayer = typeof players.$inferSelect;
export type DBMatch = typeof matches.$inferSelect;
