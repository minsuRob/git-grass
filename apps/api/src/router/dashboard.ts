import { DashboardMetrics } from "@acme/db";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  // 활동 메트릭 조회
  getMetrics: protectedProcedure
    .input(z.object({ timeRange: z.enum(["week", "month", "year"]) }))
    .query(async ({ input, ctx }) => {
      try {
        console.log(`Getting metrics for user ${ctx.user.id}, timeRange: ${input.timeRange}`);
        
        const metrics = await DashboardMetrics.getActivityMetrics(ctx.user.id, input.timeRange);
        
        return {
          ...metrics,
          userId: ctx.user.id,
        };
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
        
        const trendData = await DashboardMetrics.getTrendData(ctx.user.id, input.timeRange);
        
        // 데이터가 없는 경우 빈 배열 대신 0으로 채운 데이터 반환
        if (trendData.length === 0) {
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
        
        return trendData;
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
        
        const calendarData = await DashboardMetrics.getCalendarData(ctx.user.id, input.year);
        
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
});