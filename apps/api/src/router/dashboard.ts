import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";

export const dashboardRouter = createTRPCRouter({
  // 활동 메트릭 조회
  getMetrics: protectedProcedure
    .input(z.object({ timeRange: z.enum(["week", "month", "year"]) }))
    .query(async ({ input, ctx }) => {
      // 사용자별 활동 메트릭 조회 (현재는 모킹 데이터)
      console.log(`Getting metrics for user ${ctx.user.id}, timeRange: ${input.timeRange}`);
      
      return {
        todayCommits: 3,
        weeklyCommits: 15,
        monthlyCommits: 67,
        percentageChange: 12.5,
        trend: "up" as const,
        userId: ctx.user.id,
      };
    }),

  // 트렌드 데이터 조회
  getTrendData: protectedProcedure
    .input(z.object({ timeRange: z.enum(["week", "month", "year"]) }))
    .query(async ({ input, ctx }) => {
      // 사용자별 트렌드 데이터 조회 (현재는 모킹 데이터)
      console.log(`Getting trend data for user ${ctx.user.id}, timeRange: ${input.timeRange}`);
      
      const days = input.timeRange === "week" ? 7 : input.timeRange === "month" ? 30 : 365;
      const data = Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        commits: Math.floor(Math.random() * 10),
        additions: Math.floor(Math.random() * 100),
        deletions: Math.floor(Math.random() * 50),
      }));
      
      return data;
    }),

  // 캘린더 데이터 조회
  getCalendarData: protectedProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      // 사용자별 캘린더 데이터 조회 (현재는 모킹 데이터)
      console.log(`Getting calendar data for user ${ctx.user.id}, year: ${input.year}`);
      
      const startDate = new Date(input.year, 0, 1);
      const endDate = new Date(input.year, 11, 31);
      const data = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        data.push({
          date: d.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 15),
          level: Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4,
        });
      }
      
      return data;
    }),
});