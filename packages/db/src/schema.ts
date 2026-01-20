import { createId } from "@paralleldrive/cuid2";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Users 테이블
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  githubId: text("github_id"),
  githubAccessToken: text("github_access_token"), // 암호화된 토큰
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// GitHub Activities 테이블
export const githubActivities = pgTable("github_activities", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type", { enum: ["commit", "pull_request", "issue", "release"] }).notNull(),
  repositoryName: text("repository_name").notNull(),
  repositoryUrl: text("repository_url").notNull(),
  commitSha: text("commit_sha"),
  message: text("message"),
  additions: integer("additions"),
  deletions: integer("deletions"),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Repositories 테이블
export const repositories = pgTable("repositories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  githubId: integer("github_id").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  language: text("language"),
  isPrivate: boolean("is_private").notNull().default(false),
  url: text("url").notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Daily Statistics 테이블
export const dailyStats = pgTable("daily_stats", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: timestamp("date").notNull(),
  commits: integer("commits").notNull().default(0),
  additions: integer("additions").notNull().default(0),
  deletions: integer("deletions").notNull().default(0),
  repositories: integer("repositories").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type GitHubActivity = typeof githubActivities.$inferSelect;
export type NewGitHubActivity = typeof githubActivities.$inferInsert;
export type Repository = typeof repositories.$inferSelect;
export type NewRepository = typeof repositories.$inferInsert;
export type DailyStats = typeof dailyStats.$inferSelect;
export type NewDailyStats = typeof dailyStats.$inferInsert;