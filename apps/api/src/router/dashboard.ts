import { DashboardMetrics, RepositoryOperations } from "@acme/db";
import { z } from "zod";
import { CACHE_KEYS, CACHE_TTL, CacheService, cacheService } from "../services/cache";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  // 활동 메트릭 조회
  getMetrics: protectedProcedure
    .input(z.object({ timeRange: z.enum(["week", "month", "year"]) }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting metrics for user ${ctx.user.id}, timeRange: ${input.timeRange}`);
        
        // 캐시 키 생성
        const cacheKey = CacheService.createDashboardKey(
          ctx.user.id, 
          CACHE_KEYS.DASHBOARD_METRICS, 
          input.timeRange
        );
        
        // 캐시에서 조회
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for metrics: ${cacheKey}`);
          return cached;
        }
        
        const metrics = await DashboardMetrics.getActivityMetrics(ctx.user.id, input.timeRange);
        
        const result = {
          ...metrics,
          userId: ctx.user.id,
        };
        
        // 캐시에 저장 (5분)
        cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error("Dashboard metrics error:", error);
        
        // 에러 시 기본값 반환
        return {
          todayCommits: 0,
          weeklyCommits: 0,
          monthlyCommits: 0,
          percentageChange: 0,
          trend: "stable" as const,
          userId: ctx.user.id,
        };
      }
    }),

  // 트렌드 데이터 조회
  getTrendData: protectedProcedure
    .input(z.object({ timeRange: z.enum(["week", "month", "year"]) }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting trend data for user ${ctx.user.id}, timeRange: ${input.timeRange}`);
        
        // 캐시 키 생성
        const cacheKey = CacheService.createDashboardKey(
          ctx.user.id, 
          CACHE_KEYS.DASHBOARD_TREND, 
          input.timeRange
        );
        
        // 캐시에서 조회
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for trend data: ${cacheKey}`);
          return cached;
        }
        
        const trendData = await DashboardMetrics.getTrendData(ctx.user.id, input.timeRange);
        
        let result;
        
        // 데이터가 없는 경우 빈 배열 대신 0으로 채운 데이터 반환
        if (trendData.length === 0) {
          const days = input.timeRange === "week" ? 7 : input.timeRange === "month" ? 30 : 365;
          const now = new Date();
          
          result = Array.from({ length: days }, (_, i) => {
            const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
            return {
              date: date.toISOString().split('T')[0]!,
              commits: 0,
              additions: 0,
              deletions: 0,
            };
          });
        } else {
          result = trendData;
        }
        
        // 캐시에 저장 (15분)
        cacheService.set(cacheKey, result, CACHE_TTL.LONG);
        
        return result;
      } catch (error) {
        console.error("Dashboard trend data error:", error);
        
        // 에러 시 빈 데이터 반환
        const days = input.timeRange === "week" ? 7 : input.timeRange === "month" ? 30 : 365;
        const now = new Date();
        
        return Array.from({ length: days }, (_, i) => {
          const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
          return {
            date: date.toISOString().split('T')[0]!,
            commits: 0,
            additions: 0,
            deletions: 0,
          };
        });
      }
    }),

  // 캘린더 데이터 조회
  getCalendarData: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting calendar data for user ${ctx.user.id}, year: ${input.year}`);
        
        // 캐시 키 생성
        const cacheKey = CacheService.createDashboardKey(
          ctx.user.id, 
          CACHE_KEYS.DASHBOARD_CALENDAR, 
          input.year
        );
        
        // 캐시에서 조회
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for calendar data: ${cacheKey}`);
          return cached;
        }
        
        const calendarData = await DashboardMetrics.getCalendarData(ctx.user.id, input.year);
        
        // 캐시에 저장 (1시간)
        cacheService.set(cacheKey, calendarData, CACHE_TTL.VERY_LONG);
        
        return calendarData;
      } catch (error) {
        console.error("Dashboard calendar data error:", error);
        
        // 에러 시 빈 캘린더 데이터 반환
        const startDate = new Date(input.year, 0, 1);
        const endDate = new Date(input.year, 11, 31);
        const data = [];
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          data.push({
            date: d.toISOString().split('T')[0]!,
            count: 0,
            level: 0 as const,
          });
        }
        
        return data;
      }
    }),

  // 프로젝트 통계 조회
  getProjectStats: protectedProcedure
    .input(z.object({ 
      limit: z.number().min(1).max(50).optional(),
      sortBy: z.enum(["commits", "lastActivity", "name"]).optional(),
      sortOrder: z.enum(["asc", "desc"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting project stats for user ${ctx.user.id}`);
        
        // 캐시 키 생성
        const cacheKey = CacheService.createDashboardKey(
          ctx.user.id, 
          CACHE_KEYS.DASHBOARD_PROJECTS,
          input.limit || 10,
          input.sortBy || "commits",
          input.sortOrder || "desc"
        );
        
        // 캐시에서 조회
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for project stats: ${cacheKey}`);
          return cached;
        }
        
        // 저장소별 커밋 통계 조회
        const commitStats = await RepositoryOperations.getCommitStats(ctx.user.id);
        
        // 정렬 적용
        const sortBy = input.sortBy || "commits";
        const sortOrder = input.sortOrder || "desc";
        
        const sortedStats = commitStats.sort((a, b) => {
          let comparison = 0;
          
          switch (sortBy) {
            case "commits":
              comparison = a.commits - b.commits;
              break;
            case "lastActivity":
              const aTime = a.lastActivity?.getTime() || 0;
              const bTime = b.lastActivity?.getTime() || 0;
              comparison = aTime - bTime;
              break;
            case "name":
              comparison = a.repositoryName.localeCompare(b.repositoryName);
              break;
          }
          
          return sortOrder === "desc" ? -comparison : comparison;
        });
        
        // 제한 적용
        const limit = input.limit || 10;
        const limitedStats = sortedStats.slice(0, limit);
        
        const result = limitedStats.map(stat => ({
          name: stat.repositoryName,
          commits: stat.commits,
          additions: stat.additions,
          deletions: stat.deletions,
          lastActivity: stat.lastActivity?.toISOString() || null,
          language: "Unknown", // TODO: 저장소 정보에서 언어 정보 가져오기
          url: `https://github.com/${stat.repositoryName}`, // TODO: 실제 URL 사용
          userId: ctx.user.id,
        }));
        
        // 캐시에 저장 (5분)
        cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error("Dashboard project stats error:", error);
        
        // 에러 시 빈 배열 반환
        return [];
      }
    }),

  // 실시간 활동 요약 조회
  getActivitySummary: protectedProcedure.query(async ({ ctx }) => {
    try {
      console.log(`Getting activity summary for user ${ctx.user.id}`);
      
      // 캐시 키 생성
      const cacheKey = CacheService.createDashboardKey(
        ctx.user.id, 
        CACHE_KEYS.DASHBOARD_SUMMARY
      );
      
      // 캐시에서 조회
      const cached = cacheService.get(cacheKey);
      if (cached) {
        console.log(`Cache hit for activity summary: ${cacheKey}`);
        return cached;
      }
      
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      
      const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // 각 기간별 메트릭 조회
      const [weekMetrics, monthMetrics] = await Promise.all([
        DashboardMetrics.getActivityMetrics(ctx.user.id, "week"),
        DashboardMetrics.getActivityMetrics(ctx.user.id, "month"),
      ]);
      
      // 저장소 통계
      const projectStats = await RepositoryOperations.getCommitStats(ctx.user.id);
      const totalRepositories = projectStats.length;
      const activeRepositories = projectStats.filter(stat => {
        const lastActivity = stat.lastActivity;
        return lastActivity && lastActivity.getTime() > thisWeek.getTime();
      }).length;
      
      const result = {
        today: {
          commits: weekMetrics.todayCommits,
          date: today.toISOString().split('T')[0],
        },
        week: {
          commits: weekMetrics.weeklyCommits,
          trend: weekMetrics.trend,
          percentageChange: weekMetrics.percentageChange,
        },
        month: {
          commits: monthMetrics.monthlyCommits,
          trend: monthMetrics.trend,
          percentageChange: monthMetrics.percentageChange,
        },
        repositories: {
          total: totalRepositories,
          active: activeRepositories,
          inactiveCount: totalRepositories - activeRepositories,
        },
        lastUpdated: now.toISOString(),
        userId: ctx.user.id,
      };
      
      // 캐시에 저장 (2분)
      cacheService.set(cacheKey, result, CACHE_TTL.SHORT);
      
      return result;
    } catch (error) {
      console.error("Dashboard activity summary error:", error);
      
      // 에러 시 기본값 반환
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      return {
        today: {
          commits: 0,
          date: today.toISOString().split('T')[0]!,
        },
        week: {
          commits: 0,
          trend: "stable" as const,
          percentageChange: 0,
        },
        month: {
          commits: 0,
          trend: "stable" as const,
          percentageChange: 0,
        },
        repositories: {
          total: 0,
          active: 0,
          inactiveCount: 0,
        },
        lastUpdated: new Date().toISOString(),
        userId: ctx.user.id,
      };
    }
  }),

  // 성과 지표 조회 (주간/월간 목표 대비)
  getPerformanceMetrics: protectedProcedure
    .input(z.object({
      weeklyGoal: z.number().min(0).optional(),
      monthlyGoal: z.number().min(0).optional(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting performance metrics for user ${ctx.user.id}`);
        
        // 캐시 키 생성
        const cacheKey = CacheService.createDashboardKey(
          ctx.user.id, 
          CACHE_KEYS.DASHBOARD_PERFORMANCE,
          input.weeklyGoal || 20,
          input.monthlyGoal || 100
        );
        
        // 캐시에서 조회
        const cached = cacheService.get(cacheKey);
        if (cached) {
          console.log(`Cache hit for performance metrics: ${cacheKey}`);
          return cached;
        }
        
        const weeklyGoal = input.weeklyGoal || 20; // 기본 주간 목표: 20 커밋
        const monthlyGoal = input.monthlyGoal || 100; // 기본 월간 목표: 100 커밋
        
        const [weekMetrics, monthMetrics] = await Promise.all([
          DashboardMetrics.getActivityMetrics(ctx.user.id, "week"),
          DashboardMetrics.getActivityMetrics(ctx.user.id, "month"),
        ]);
        
        const weeklyProgress = Math.min((weekMetrics.weeklyCommits / weeklyGoal) * 100, 100);
        const monthlyProgress = Math.min((monthMetrics.monthlyCommits / monthlyGoal) * 100, 100);
        
        const result = {
          weekly: {
            current: weekMetrics.weeklyCommits,
            goal: weeklyGoal,
            progress: Math.round(weeklyProgress),
            remaining: Math.max(weeklyGoal - weekMetrics.weeklyCommits, 0),
            trend: weekMetrics.trend,
          },
          monthly: {
            current: monthMetrics.monthlyCommits,
            goal: monthlyGoal,
            progress: Math.round(monthlyProgress),
            remaining: Math.max(monthlyGoal - monthMetrics.monthlyCommits, 0),
            trend: monthMetrics.trend,
          },
          streaks: {
            current: 0, // TODO: 연속 활동 일수 계산
            longest: 0, // TODO: 최장 연속 활동 일수 계산
          },
          userId: ctx.user.id,
        };
        
        // 캐시에 저장 (5분)
        cacheService.set(cacheKey, result, CACHE_TTL.MEDIUM);
        
        return result;
      } catch (error) {
        console.error("Dashboard performance metrics error:", error);
        
        // 에러 시 기본값 반환
        return {
          weekly: {
            current: 0,
            goal: input.weeklyGoal || 20,
            progress: 0,
            remaining: input.weeklyGoal || 20,
            trend: "stable" as const,
          },
          monthly: {
            current: 0,
            goal: input.monthlyGoal || 100,
            progress: 0,
            remaining: input.monthlyGoal || 100,
            trend: "stable" as const,
          },
          streaks: {
            current: 0,
            longest: 0,
          },
          userId: ctx.user.id,
        };
      }
    }),

  // 캐시 무효화 (데이터 업데이트 후 호출)
  invalidateCache: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log(`Invalidating cache for user ${ctx.user.id}`);
      
      const deletedCount = cacheService.deleteUserCache(ctx.user.id);
      
      return {
        success: true,
        message: `Invalidated ${deletedCount} cache entries`,
        deletedCount,
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("Cache invalidation error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to invalidate cache",
        deletedCount: 0,
        userId: ctx.user.id,
      };
    }
  }),

  // 캐시 통계 조회 (개발/디버깅용)
  getCacheStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      const stats = cacheService.getStats();
      
      return {
        ...stats,
        userId: ctx.user.id,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Cache stats error:", error);
      throw new Error("Failed to get cache statistics");
    }
  }),
});