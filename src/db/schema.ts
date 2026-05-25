import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const players = sqliteTable("players", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  rank: text("rank").notNull(),
  form: text("form").notNull().default("[]"), 
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  rate: text("rate"),
  isTopPerformer: integer("isTopPerformer").default(0).notNull(),
  level: text("level").default("Beginner").notNull(),
});

export const matches = sqliteTable("matches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  team_a: text("team_a").notNull(), 
  team_b: text("team_b").notNull(),
  score_a: integer("score_a").notNull(),
  score_b: integer("score_b").notNull(),
  winner: text("winner").notNull(),
  played_at: text("played_at").notNull(),
});

export const courts = sqliteTable("courts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sport: text("sport").notNull(),
  matchType: text("matchType").notNull(),
  status: text("status").notNull().default("available"),
  createdAt: text("createdAt").notNull(),
});

export type DBPlayer = typeof players.$inferSelect;
export type DBMatch = typeof matches.$inferSelect;
export type DBCourt = typeof courts.$inferSelect;
