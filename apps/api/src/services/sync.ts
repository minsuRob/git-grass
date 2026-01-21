import { cacheService } from "./cache";
import { createGitHubService } from "./github";

/**
 * 데이터 동기화 서비스
 */
export class SyncService {
  private static instance: SyncService;
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEFAULT_SYNC_INTERVAL = 15 * 60 * 1000; // 15분

  private constructor() {}

  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * 사용자의 주기적 동기화 시작
   */
  async startPeriodicSync(userId: string, intervalMs?: number): Promise<void> {
    // 기존 동기화가 있다면 중지
    this.stopPeriodicSync(userId);

    const interval = intervalMs || this.DEFAULT_SYNC_INTERVAL;
    
    console.log(`Starting periodic sync for user ${userId} every ${interval}ms`);

    // 즉시 한 번 동기화 실행
    await this.syncUserData(userId);

    // 주기적 동기화 설정
    const intervalId = setInterval(async () => {
      try {
        await this.syncUserData(userId);
      } catch (error) {
        console.error(`Periodic sync failed for user ${userId}:`, error);
      }
    }, interval);

    this.syncIntervals.set(userId, intervalId);
  }

  /**
   * 사용자의 주기적 동기화 중지
   */
  stopPeriodicSync(userId: string): void {
    const intervalId = this.syncIntervals.get(userId);
    if (intervalId) {
      clearInterval(intervalId);
      this.syncIntervals.delete(userId);
      console.log(`Stopped periodic sync for user ${userId}`);
    }
  }

  /**
   * 사용자 데이터 동기화 (재시도 로직 포함)
   */
  async syncUserData(userId: string, maxRetries = 3): Promise<SyncResult> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Sync attempt ${attempt}/${maxRetries} for user ${userId}`);
        
        const githubService = await createGitHubService(userId);
        
        if (!githubService) {
          return {
            success: false,
            error: "GitHub connection not found",
            syncedRepos: 0,
            syncedActivities: 0,
            syncedAt: new Date().toISOString(),
            attempt,
          };
        }

        const result = await githubService.syncUserData(userId);
        
        if (result.success) {
          console.log(`Sync successful for user ${userId} on attempt ${attempt}`);
          
          // 동기화 성공 시 사용자 캐시 무효화
          const deletedCacheCount = cacheService.deleteUserCache(userId);
          console.log(`Invalidated ${deletedCacheCount} cache entries for user ${userId}`);
          
          return {
            ...result,
            attempt,
          };
        } else {
          lastError = new Error(result.error || "Unknown sync error");
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(`Sync attempt ${attempt} failed for user ${userId}:`, lastError.message);
        
        // GitHub API rate limit 에러인 경우 더 오래 기다림
        if (lastError.message.includes("rate limit")) {
          const waitTime = this.calculateBackoffDelay(attempt, true);
          console.log(`Rate limit hit, waiting ${waitTime}ms before retry`);
          await this.sleep(waitTime);
        } else {
          // 일반적인 지수 백오프
          const waitTime = this.calculateBackoffDelay(attempt);
          if (attempt < maxRetries) {
            console.log(`Waiting ${waitTime}ms before retry`);
            await this.sleep(waitTime);
          }
        }
      }
    }

    return {
      success: false,
      error: lastError?.message || "Max retries exceeded",
      syncedRepos: 0,
      syncedActivities: 0,
      syncedAt: new Date().toISOString(),
      attempt: maxRetries,
    };
  }

  /**
   * 모든 연결된 사용자의 데이터 동기화
   */
  async syncAllUsers(): Promise<SyncSummary> {
    console.log("Starting sync for all connected users");
    
    try {
      // 모든 GitHub 연결된 사용자 조회
      // 실제로는 GitHubConnectionOperations에서 모든 연결을 가져와야 함
      // 현재는 간단한 구현으로 대체
      
      const summary: SyncSummary = {
        totalUsers: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalActivities: 0,
        totalRepositories: 0,
        startedAt: new Date().toISOString(),
        completedAt: "",
        errors: [],
      };

      // TODO: 실제 구현에서는 모든 사용자를 가져와서 동기화
      // const connections = await GitHubConnectionOperations.findAll();
      // for (const connection of connections) {
      //   const result = await this.syncUserData(connection.userId);
      //   // 결과 처리
      // }

      summary.completedAt = new Date().toISOString();
      console.log("Completed sync for all users", summary);
      
      return summary;
    } catch (error) {
      console.error("Failed to sync all users:", error);
      throw error;
    }
  }

  /**
   * GitHub 웹훅 이벤트 처리
   */
  async processWebhookEvent(event: GitHubWebhookEvent): Promise<WebhookProcessResult> {
    try {
      console.log(`Processing webhook event: ${event.type} for ${event.repository?.full_name}`);

      // 이벤트 타입에 따른 처리
      switch (event.type) {
        case "push":
          return await this.processPushEvent(event);
        case "pull_request":
          return await this.processPullRequestEvent(event);
        case "issues":
          return await this.processIssueEvent(event);
        default:
          console.log(`Unsupported webhook event type: ${event.type}`);
          return {
            success: true,
            message: `Event type ${event.type} ignored`,
            processedAt: new Date().toISOString(),
          };
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown webhook error",
        processedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * Push 이벤트 처리
   */
  private async processPushEvent(event: GitHubWebhookEvent): Promise<WebhookProcessResult> {
    if (!event.repository || !event.pusher) {
      return {
        success: false,
        error: "Invalid push event data",
        processedAt: new Date().toISOString(),
      };
    }

    // 푸시한 사용자의 GitHub 연결 찾기
    // 실제로는 GitHub username으로 사용자를 찾아야 함
    // const connection = await GitHubConnectionOperations.findByGitHubUsername(event.pusher.name);
    
    // 현재는 간단한 응답 반환
    return {
      success: true,
      message: `Processed push event for ${event.repository.full_name}`,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Pull Request 이벤트 처리
   */
  private async processPullRequestEvent(event: GitHubWebhookEvent): Promise<WebhookProcessResult> {
    return {
      success: true,
      message: `Processed pull request event for ${event.repository?.full_name}`,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * Issue 이벤트 처리
   */
  private async processIssueEvent(event: GitHubWebhookEvent): Promise<WebhookProcessResult> {
    return {
      success: true,
      message: `Processed issue event for ${event.repository?.full_name}`,
      processedAt: new Date().toISOString(),
    };
  }

  /**
   * 지수 백오프 지연 시간 계산
   */
  private calculateBackoffDelay(attempt: number, isRateLimit = false): number {
    if (isRateLimit) {
      // Rate limit의 경우 더 긴 대기 시간
      return Math.min(1000 * Math.pow(2, attempt) * 10, 300000); // 최대 5분
    }
    
    // 일반적인 지수 백오프: 1초, 2초, 4초, 8초...
    return Math.min(1000 * Math.pow(2, attempt - 1), 30000); // 최대 30초
  }

  /**
   * 비동기 대기
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 서비스 종료 시 모든 동기화 중지
   */
  shutdown(): void {
    console.log("Shutting down sync service");
    for (const [userId, intervalId] of this.syncIntervals) {
      clearInterval(intervalId);
      console.log(`Stopped sync for user ${userId}`);
    }
    this.syncIntervals.clear();
  }
}

// 타입 정의
export interface SyncResult {
  success: boolean;
  syncedRepos: number;
  syncedActivities: number;
  syncedAt: string;
  error?: string;
  attempt?: number;
}

export interface SyncSummary {
  totalUsers: number;
  successfulSyncs: number;
  failedSyncs: number;
  totalActivities: number;
  totalRepositories: number;
  startedAt: string;
  completedAt: string;
  errors: string[];
}

export interface GitHubWebhookEvent {
  type: string;
  action?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: {
      login: string;
      id: number;
    };
  };
  pusher?: {
    name: string;
    email: string;
  };
  sender?: {
    login: string;
    id: number;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: {
      name: string;
      email: string;
    };
    added: string[];
    removed: string[];
    modified: string[];
  }>;
}

export interface WebhookProcessResult {
  success: boolean;
  message?: string;
  error?: string;
  processedAt: string;
}

// 싱글톤 인스턴스 내보내기
export const syncService = SyncService.getInstance();