import { z } from "zod";
import { syncService } from "../services/sync";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const syncRouter = createTRPCRouter({
  // 수동 동기화 트리거
  triggerSync: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log(`Manual sync triggered for user ${ctx.user.id}`);
      
      const result = await syncService.syncUserData(ctx.user.id);
      
      return {
        success: result.success,
        message: result.success 
          ? `Synced ${result.syncedActivities} activities and ${result.syncedRepos} repositories`
          : result.error,
        syncedAt: result.syncedAt,
        syncedActivities: result.syncedActivities,
        syncedRepos: result.syncedRepos,
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("Manual sync error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
        syncedAt: new Date().toISOString(),
        syncedActivities: 0,
        syncedRepos: 0,
        userId: ctx.user.id,
      };
    }
  }),

  // 주기적 동기화 시작
  startPeriodicSync: protectedProcedure
    .input(z.object({ 
      intervalMinutes: z.number().min(5).max(1440).optional() // 5분 ~ 24시간
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const intervalMs = (input.intervalMinutes || 15) * 60 * 1000;
        
        console.log(`Starting periodic sync for user ${ctx.user.id} every ${input.intervalMinutes || 15} minutes`);
        
        await syncService.startPeriodicSync(ctx.user.id, intervalMs);
        
        return {
          success: true,
          message: `Periodic sync started (every ${input.intervalMinutes || 15} minutes)`,
          intervalMinutes: input.intervalMinutes || 15,
          userId: ctx.user.id,
        };
      } catch (error) {
        console.error("Start periodic sync error:", error);
        return {
          success: false,
          message: error instanceof Error ? error.message : "Failed to start periodic sync",
          userId: ctx.user.id,
        };
      }
    }),

  // 주기적 동기화 중지
  stopPeriodicSync: protectedProcedure.mutation(async ({ ctx }) => {
    try {
      console.log(`Stopping periodic sync for user ${ctx.user.id}`);
      
      syncService.stopPeriodicSync(ctx.user.id);
      
      return {
        success: true,
        message: "Periodic sync stopped",
        userId: ctx.user.id,
      };
    } catch (error) {
      console.error("Stop periodic sync error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to stop periodic sync",
        userId: ctx.user.id,
      };
    }
  }),

  // 동기화 상태 조회
  getSyncStatus: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 실제로는 데이터베이스에서 마지막 동기화 시간 등을 조회해야 함
      // 현재는 간단한 상태 반환
      
      return {
        userId: ctx.user.id,
        lastSyncAt: null, // TODO: 실제 마지막 동기화 시간
        isPeriodicSyncActive: false, // TODO: 실제 주기적 동기화 상태
        nextSyncAt: null, // TODO: 다음 동기화 예정 시간
        syncInterval: 15, // TODO: 실제 동기화 간격
        totalSyncs: 0, // TODO: 총 동기화 횟수
        lastSyncResult: null, // TODO: 마지막 동기화 결과
      };
    } catch (error) {
      console.error("Get sync status error:", error);
      throw new Error("Failed to get sync status");
    }
  }),

  // 관리자용: 모든 사용자 동기화 (개발/테스트용)
  syncAllUsers: publicProcedure.mutation(async () => {
    try {
      console.log("Admin triggered sync for all users");
      
      const summary = await syncService.syncAllUsers();
      
      return {
        success: true,
        message: `Synced ${summary.successfulSyncs}/${summary.totalUsers} users`,
        summary,
      };
    } catch (error) {
      console.error("Sync all users error:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to sync all users",
        summary: null,
      };
    }
  }),

  // 동기화 통계 조회
  getSyncStats: protectedProcedure.query(async ({ ctx }) => {
    try {
      // 실제로는 데이터베이스에서 동기화 통계를 조회해야 함
      // 현재는 모킹 데이터 반환
      
      return {
        userId: ctx.user.id,
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        lastWeekSyncs: 0,
        averageSyncDuration: 0,
        lastSyncDuration: 0,
        totalActivitiesSynced: 0,
        totalRepositoriesSynced: 0,
      };
    } catch (error) {
      console.error("Get sync stats error:", error);
      throw new Error("Failed to get sync statistics");
    }
  }),
});