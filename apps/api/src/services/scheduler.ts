import { syncService } from "./sync";

/**
 * 스케줄러 서비스 - 백그라운드 작업 관리
 */
export class SchedulerService {
  private static instance: SchedulerService;
  private jobs: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  private constructor() {}

  static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  /**
   * 스케줄러 시작
   */
  start(): void {
    if (this.isRunning) {
      console.log("Scheduler is already running");
      return;
    }

    console.log("Starting scheduler service");
    this.isRunning = true;

    // 주기적 작업들 설정
    this.schedulePeriodicJobs();
  }

  /**
   * 스케줄러 중지
   */
  stop(): void {
    if (!this.isRunning) {
      console.log("Scheduler is not running");
      return;
    }

    console.log("Stopping scheduler service");
    this.isRunning = false;

    // 모든 작업 중지
    for (const [jobName, jobId] of this.jobs) {
      clearInterval(jobId);
      console.log(`Stopped job: ${jobName}`);
    }
    this.jobs.clear();
  }

  /**
   * 주기적 작업들 설정
   */
  private schedulePeriodicJobs(): void {
    // 1시간마다 모든 사용자 동기화 상태 체크
    this.scheduleJob("sync-health-check", 60 * 60 * 1000, async () => {
      await this.performSyncHealthCheck();
    });

    // 6시간마다 전체 사용자 동기화 (선택적)
    this.scheduleJob("full-sync", 6 * 60 * 60 * 1000, async () => {
      await this.performFullSync();
    });

    // 매일 자정에 통계 정리 작업
    this.scheduleJob("daily-cleanup", 24 * 60 * 60 * 1000, async () => {
      await this.performDailyCleanup();
    });

    console.log("Scheduled periodic jobs");
  }

  /**
   * 작업 스케줄링
   */
  private scheduleJob(name: string, intervalMs: number, task: () => Promise<void>): void {
    const jobId = setInterval(async () => {
      try {
        console.log(`Running scheduled job: ${name}`);
        await task();
        console.log(`Completed scheduled job: ${name}`);
      } catch (error) {
        console.error(`Scheduled job failed: ${name}`, error);
      }
    }, intervalMs);

    this.jobs.set(name, jobId);
    console.log(`Scheduled job: ${name} (every ${intervalMs}ms)`);
  }

  /**
   * 동기화 상태 체크
   */
  private async performSyncHealthCheck(): Promise<void> {
    console.log("Performing sync health check");
    
    try {
      // 실제로는 데이터베이스에서 동기화 상태를 체크하고
      // 문제가 있는 사용자들을 찾아서 재동기화를 시도해야 함
      
      // 현재는 로그만 출력
      console.log("Sync health check completed");
    } catch (error) {
      console.error("Sync health check failed:", error);
    }
  }

  /**
   * 전체 사용자 동기화
   */
  private async performFullSync(): Promise<void> {
    console.log("Performing full sync for all users");
    
    try {
      const summary = await syncService.syncAllUsers();
      console.log("Full sync completed:", summary);
    } catch (error) {
      console.error("Full sync failed:", error);
    }
  }

  /**
   * 일일 정리 작업
   */
  private async performDailyCleanup(): Promise<void> {
    console.log("Performing daily cleanup");
    
    try {
      // 실제로는 다음과 같은 작업들을 수행:
      // - 오래된 로그 정리
      // - 임시 데이터 정리
      // - 통계 데이터 집계
      // - 데이터베이스 최적화
      
      console.log("Daily cleanup completed");
    } catch (error) {
      console.error("Daily cleanup failed:", error);
    }
  }

  /**
   * 특정 작업 추가
   */
  addJob(name: string, intervalMs: number, task: () => Promise<void>): void {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already exists, removing old job`);
      this.removeJob(name);
    }

    this.scheduleJob(name, intervalMs, task);
  }

  /**
   * 특정 작업 제거
   */
  removeJob(name: string): boolean {
    const jobId = this.jobs.get(name);
    if (jobId) {
      clearInterval(jobId);
      this.jobs.delete(name);
      console.log(`Removed job: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 실행 중인 작업 목록 조회
   */
  getRunningJobs(): string[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * 스케줄러 상태 조회
   */
  getStatus(): SchedulerStatus {
    return {
      isRunning: this.isRunning,
      jobCount: this.jobs.size,
      jobs: this.getRunningJobs(),
      startedAt: this.isRunning ? new Date().toISOString() : null,
    };
  }
}

// 타입 정의
export interface SchedulerStatus {
  isRunning: boolean;
  jobCount: number;
  jobs: string[];
  startedAt: string | null;
}

// 싱글톤 인스턴스 내보내기
export const schedulerService = SchedulerService.getInstance();