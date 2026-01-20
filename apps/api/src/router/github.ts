import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const githubRouter = createTRPCRouter({
  // GitHub 데이터 동기화
  syncData: protectedProcedure.mutation(async ({ ctx }) => {
    // 사용자별 GitHub 데이터 동기화 (현재는 모킹)
    console.log(`Syncing GitHub data for user ${ctx.user.id}`);
    
    return {
      success: true,
      syncedAt: new Date().toISOString(),
      activitiesCount: 25,
      userId: ctx.user.id,
    };
  }),

  // 저장소 목록 조회
  getRepositories: protectedProcedure.query(async ({ ctx }) => {
    // 사용자별 저장소 목록 조회 (현재는 모킹 데이터)
    console.log(`Getting repositories for user ${ctx.user.id}`);
    
    return [
      {
        name: "github-dashboard",
        commits: 45,
        language: "TypeScript",
        lastActivity: "2026-01-20T10:30:00Z",
        url: "https://github.com/user/github-dashboard",
        userId: ctx.user.id,
      },
      {
        name: "react-native-app",
        commits: 23,
        language: "JavaScript",
        lastActivity: "2026-01-19T15:45:00Z",
        url: "https://github.com/user/react-native-app",
        userId: ctx.user.id,
      },
    ];
  }),

  // 커밋 목록 조회
  getCommits: protectedProcedure
    .input(z.object({ 
      repo: z.string(), 
      since: z.date().optional() 
    }))
    .query(async ({ input, ctx }) => {
      // 사용자별 커밋 목록 조회 (현재는 모킹 데이터)
      console.log(`Getting commits for user ${ctx.user.id}, repo: ${input.repo}`);
      
      return Array.from({ length: 10 }, (_, i) => ({
        sha: `abc123${i}`,
        message: `feat: 기능 추가 ${i + 1}`,
        author: ctx.user.name || "개발자",
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
        additions: Math.floor(Math.random() * 100),
        deletions: Math.floor(Math.random() * 50),
        userId: ctx.user.id,
      }));
    }),

  // GitHub 연결 상태 확인
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    // 사용자의 GitHub 연결 상태 확인 (현재는 모킹)
    console.log(`Checking GitHub connection for user ${ctx.user.id}`);
    
    return {
      connected: false, // 실제로는 데이터베이스에서 확인
      githubUsername: null,
      lastSyncAt: null,
      userId: ctx.user.id,
    };
  }),
});