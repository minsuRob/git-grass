import { z } from "zod";

// 사용자 관련 스키마
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  githubConnected: z.boolean(),
});

// 활동 메트릭 스키마
export const activityMetricsSchema = z.object({
  todayCommits: z.number().int().min(0),
  weeklyCommits: z.number().int().min(0),
  monthlyCommits: z.number().int().min(0),
  percentageChange: z.number(),
  trend: z.enum(["up", "down", "stable"]),
});

// 트렌드 데이터 스키마
export const trendDataSchema = z.object({
  date: z.string(),
  commits: z.number().int().min(0),
  additions: z.number().int().min(0),
  deletions: z.number().int().min(0),
});

// 캘린더 데이터 스키마
export const calendarDataSchema = z.object({
  date: z.string(),
  count: z.number().int().min(0),
  level: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});

// 프로젝트 통계 스키마
export const projectStatsSchema = z.object({
  name: z.string(),
  commits: z.number().int().min(0),
  language: z.string(),
  lastActivity: z.string(),
  url: z.string().url(),
});

// GitHub 사용자 스키마
export const githubUserSchema = z.object({
  id: z.number(),
  login: z.string(),
  avatar_url: z.string().url(),
  name: z.string(),
  email: z.string().email(),
  public_repos: z.number().int().min(0),
  followers: z.number().int().min(0),
  following: z.number().int().min(0),
});

// GitHub 저장소 스키마
export const githubRepositorySchema = z.object({
  id: z.number(),
  name: z.string(),
  full_name: z.string(),
  description: z.string().nullable(),
  private: z.boolean(),
  html_url: z.string().url(),
  language: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  pushed_at: z.string(),
});

// GitHub 커밋 스키마
export const githubCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    message: z.string(),
    author: z.object({
      name: z.string(),
      email: z.string().email(),
      date: z.string(),
    }),
  }),
  stats: z.object({
    additions: z.number().int().min(0),
    deletions: z.number().int().min(0),
    total: z.number().int().min(0),
  }),
});

// 타입 내보내기
export type User = z.infer<typeof userSchema>;
export type ActivityMetrics = z.infer<typeof activityMetricsSchema>;
export type TrendData = z.infer<typeof trendDataSchema>;
export type CalendarData = z.infer<typeof calendarDataSchema>;
export type ProjectStats = z.infer<typeof projectStatsSchema>;
export type GitHubUser = z.infer<typeof githubUserSchema>;
export type GitHubRepository = z.infer<typeof githubRepositorySchema>;
export type GitHubCommit = z.infer<typeof githubCommitSchema>;