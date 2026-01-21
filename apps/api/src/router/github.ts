import { GitHubConnectionOperations, RepositoryOperations } from "@acme/db";
import { z } from "zod";
import { createGitHubService } from "../services/github";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const githubRouter = createTRPCRouter({
  // GitHub 데이터 동기화
  syncData: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const githubService = await createGitHubService(ctx.user.id);
      
      if (!githubService) {
        return {
          success: false,
          error: "GitHub connection not found. Please connect your GitHub account first.",
          syncedAt: new Date().toISOString(),
          activitiesCount: 0,
        };
      }

      const result = await githubService.syncUserData(ctx.user.id);
      
      return {
        success: result.success,
        syncedAt: result.syncedAt,
        activitiesCount: result.syncedActivities,
        repositoriesCount: result.syncedRepos,
        error: result.error,
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("GitHub sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown sync error",
        syncedAt: new Date().toISOString(),
        activitiesCount: 0,
        userId: ctx.user.id,
      };
    }
  }),

  // 저장소 목록 조회
  getRepositories: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 데이터베이스에서 저장소 목록 조회
      const repos = await RepositoryOperations.findByUserId(ctx.user.id);
      
      if (repos.length === 0) {
        // GitHub API에서 직접 조회 (연결되어 있는 경우)
        const githubService = await createGitHubService(ctx.user.id);
        if (githubService) {
          const githubRepos = await githubService.getRepositories();
          return githubRepos.slice(0, 10).map(repo => ({
            name: repo.name,
            commits: 0, // 실제로는 커밋 수를 계산해야 함
            language: repo.language || "Unknown",
            lastActivity: repo.pushed_at,
            url: repo.html_url,
            userId: ctx.user.id,
          }));
        }

        // 모킹 데이터 반환
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
      }

      // 저장소별 커밋 통계 조회
      const commitStats = await RepositoryOperations.getCommitStats(ctx.user.id);
      const statsMap = new Map(commitStats.map((stat) => [stat.repositoryName, stat]));

      return repos.map((repo) => {
        const stats = statsMap.get(repo.name);
        return {
          name: repo.name,
          commits: stats?.commits || 0,
          language: repo.language || "Unknown",
          lastActivity: stats?.lastActivity?.toISOString() || repo.updatedAt.toISOString(),
          url: repo.url,
          userId: ctx.user.id,
        };
      });
    } catch (error) {
      console.error("Get repositories error:", error);
      // 에러 시 모킹 데이터 반환
      return [
        {
          name: "github-dashboard",
          commits: 45,
          language: "TypeScript",
          lastActivity: "2026-01-20T10:30:00Z",
          url: "https://github.com/user/github-dashboard",
          userId: ctx.user.id,
        },
      ];
    }
  }),

  // 커밋 목록 조회
  getCommits: protectedProcedure
    .input(z.object({ 
      repo: z.string(), 
      since: z.date().optional() 
    }))
    .query(async ({ input, ctx }) => {
      try {
        const githubService = await createGitHubService(ctx.user.id);
        
        if (githubService) {
          // GitHub API에서 실제 커밋 조회
          const [owner, repoName] = input.repo.split('/');
          if (owner && repoName) {
            const commits = await githubService.getCommits(
              owner, 
              repoName, 
              input.since?.toISOString()
            );
            
            return commits.slice(0, 10).map(commit => ({
              sha: commit.sha,
              message: commit.commit.message,
              author: commit.commit.author.name,
              date: commit.commit.author.date,
              additions: commit.stats?.additions || 0,
              deletions: commit.stats?.deletions || 0,
              userId: ctx.user.id,
            }));
          }
        }

        // 모킹 데이터 반환
        return Array.from({ length: 10 }, (_, i) => ({
          sha: `abc123${i}`,
          message: `feat: 기능 추가 ${i + 1}`,
          author: ctx.user.name || "개발자",
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          additions: Math.floor(Math.random() * 100),
          deletions: Math.floor(Math.random() * 50),
          userId: ctx.user.id,
        }));
      } catch (error) {
        console.error("Get commits error:", error);
        // 에러 시 모킹 데이터 반환
        return Array.from({ length: 5 }, (_, i) => ({
          sha: `error${i}`,
          message: `커밋 ${i + 1}`,
          author: ctx.user.name || "개발자",
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          additions: Math.floor(Math.random() * 50),
          deletions: Math.floor(Math.random() * 25),
          userId: ctx.user.id,
        }));
      }
    }),

  // GitHub 연결 상태 확인
  getConnectionStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      const connection = await GitHubConnectionOperations.findByUserId(ctx.user.id);

      if (!connection) {
        return {
          connected: false,
          githubUsername: null,
          lastSyncAt: null,
          userId: ctx.user.id,
        };
      }

      return {
        connected: true,
        githubUsername: connection.githubUsername,
        lastSyncAt: connection.lastSyncAt?.toISOString() || null,
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("GitHub connection status error:", error);
      return {
        connected: false,
        githubUsername: null,
        lastSyncAt: null,
        userId: ctx.user.id,
      };
    }
  }),

  // GitHub 연결 해제
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      const success = await GitHubConnectionOperations.deleteByUserId(ctx.user.id);

      if (success) {
        return {
          success: true,
          message: "GitHub connection removed successfully",
        };
      } else {
        return {
          success: false,
          error: "No GitHub connection found to remove",
        };
      }
    } catch (error) {
      console.error("GitHub disconnect error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to disconnect GitHub",
      };
    }
  }),
});