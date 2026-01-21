import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "./client";
import {
    dailyStats,
    githubActivities,
    githubConnections,
    repositories,
    user,
    type DailyStats,
    type GitHubActivity,
    type GitHubConnection,
    type NewDailyStats,
    type NewGitHubActivity,
    type NewGitHubConnection,
    type NewRepository,
    type Repository,
    type User,
} from "./schema";

/**
 * 사용자 관련 데이터베이스 작업
 */
export class UserOperations {
  /**
   * 사용자 조회
   */
  static async findById(id: string): Promise<User | null> {
    const users = await db.select().from(user).where(eq(user.id, id)).limit(1);
    return users[0] || null;
  }

  /**
   * 이메일로 사용자 조회
   */
  static async findByEmail(email: string): Promise<User | null> {
    const users = await db.select().from(user).where(eq(user.email, email)).limit(1);
    return users[0] || null;
  }

  /**
   * 사용자 생성
   */
  static async create(userData: {
    name: string;
    email: string;
    image?: string;
  }): Promise<User> {
    const [newUser] = await db
      .insert(user)
      .values({
        name: userData.name,
        email: userData.email,
        image: userData.image,
      })
      .returning();
    
    if (!newUser) {
      throw new Error("Failed to create user");
    }
    
    return newUser;
  }

  /**
   * 사용자 정보 업데이트
   */
  static async update(id: string, updates: Partial<Pick<User, 'name' | 'email' | 'image'>>): Promise<User | null> {
    const [updatedUser] = await db
      .update(user)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    
    return updatedUser || null;
  }
}

/**
 * GitHub 활동 관련 데이터베이스 작업
 */
export class GitHubActivityOperations {
  /**
   * 활동 생성
   */
  static async create(activityData: NewGitHubActivity): Promise<GitHubActivity> {
    const [activity] = await db
      .insert(githubActivities)
      .values(activityData)
      .returning();
    
    if (!activity) {
      throw new Error("Failed to create GitHub activity");
    }
    
    return activity;
  }

  /**
   * 사용자의 활동 목록 조회
   */
  static async findByUserId(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      startDate?: Date;
      endDate?: Date;
      type?: GitHubActivity['type'];
    } = {}
  ): Promise<GitHubActivity[]> {
    const { limit = 50, offset = 0, startDate, endDate, type } = options;
    
    let query = db.select().from(githubActivities).where(eq(githubActivities.userId, userId));
    
    const conditions = [eq(githubActivities.userId, userId)];
    
    if (startDate) {
      conditions.push(gte(githubActivities.timestamp, startDate));
    }
    
    if (endDate) {
      conditions.push(lte(githubActivities.timestamp, endDate));
    }
    
    if (type) {
      conditions.push(eq(githubActivities.type, type));
    }
    
    return db
      .select()
      .from(githubActivities)
      .where(and(...conditions))
      .orderBy(desc(githubActivities.timestamp))
      .limit(limit)
      .offset(offset);
  }

  /**
   * 특정 기간의 커밋 수 조회
   */
  static async getCommitCount(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(githubActivities)
      .where(
        and(
          eq(githubActivities.userId, userId),
          eq(githubActivities.type, "commit"),
          gte(githubActivities.timestamp, startDate),
          lte(githubActivities.timestamp, endDate)
        )
      );
    
    return result[0]?.count || 0;
  }

  /**
   * 일별 활동 통계 조회
   */
  static async getDailyStats(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Array<{ date: string; commits: number; additions: number; deletions: number }>> {
    const result = await db
      .select({
        date: sql<string>`DATE(${githubActivities.timestamp})`,
        commits: sql<number>`count(*)`,
        additions: sql<number>`sum(${githubActivities.additions})`,
        deletions: sql<number>`sum(${githubActivities.deletions})`,
      })
      .from(githubActivities)
      .where(
        and(
          eq(githubActivities.userId, userId),
          eq(githubActivities.type, "commit"),
          gte(githubActivities.timestamp, startDate),
          lte(githubActivities.timestamp, endDate)
        )
      )
      .groupBy(sql`DATE(${githubActivities.timestamp})`)
      .orderBy(sql`DATE(${githubActivities.timestamp})`);
    
    return result.map(row => ({
      date: row.date,
      commits: row.commits || 0,
      additions: row.additions || 0,
      deletions: row.deletions || 0,
    }));
  }

  /**
   * 중복 활동 체크 및 생성
   */
  static async createIfNotExists(activityData: NewGitHubActivity): Promise<GitHubActivity | null> {
    // 같은 커밋 SHA가 있는지 확인
    if (activityData.commitSha) {
      const existing = await db
        .select()
        .from(githubActivities)
        .where(
          and(
            eq(githubActivities.userId, activityData.userId),
            eq(githubActivities.commitSha, activityData.commitSha)
          )
        )
        .limit(1);
      
      if (existing.length > 0) {
        return existing[0]!;
      }
    }
    
    return this.create(activityData);
  }
}

/**
 * 저장소 관련 데이터베이스 작업
 */
export class RepositoryOperations {
  /**
   * 저장소 생성 또는 업데이트
   */
  static async upsert(repoData: NewRepository): Promise<Repository> {
    const [repo] = await db
      .insert(repositories)
      .values(repoData)
      .onConflictDoUpdate({
        target: [repositories.userId, repositories.githubId],
        set: {
          name: repoData.name,
          fullName: repoData.fullName,
          description: repoData.description,
          language: repoData.language,
          isPrivate: repoData.isPrivate,
          url: repoData.url,
          lastSyncAt: repoData.lastSyncAt,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    if (!repo) {
      throw new Error("Failed to upsert repository");
    }
    
    return repo;
  }

  /**
   * 사용자의 저장소 목록 조회
   */
  static async findByUserId(userId: string): Promise<Repository[]> {
    return db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId))
      .orderBy(desc(repositories.updatedAt));
  }

  /**
   * 저장소별 커밋 통계 조회
   */
  static async getCommitStats(userId: string): Promise<Array<{
    repositoryName: string;
    commits: number;
    additions: number;
    deletions: number;
    lastActivity: Date | null;
  }>> {
    const result = await db
      .select({
        repositoryName: githubActivities.repositoryName,
        commits: sql<number>`count(*)`,
        additions: sql<number>`sum(${githubActivities.additions})`,
        deletions: sql<number>`sum(${githubActivities.deletions})`,
        lastActivity: sql<Date>`max(${githubActivities.timestamp})`,
      })
      .from(githubActivities)
      .where(
        and(
          eq(githubActivities.userId, userId),
          eq(githubActivities.type, "commit")
        )
      )
      .groupBy(githubActivities.repositoryName)
      .orderBy(sql`max(${githubActivities.timestamp}) DESC`);
    
    return result.map(row => ({
      repositoryName: row.repositoryName,
      commits: row.commits || 0,
      additions: row.additions || 0,
      deletions: row.deletions || 0,
      lastActivity: row.lastActivity,
    }));
  }
}

/**
 * 일별 통계 관련 데이터베이스 작업
 */
export class DailyStatsOperations {
  /**
   * 일별 통계 생성 또는 업데이트
   */
  static async upsert(statsData: NewDailyStats): Promise<DailyStats> {
    const [stats] = await db
      .insert(dailyStats)
      .values(statsData)
      .onConflictDoUpdate({
        target: [dailyStats.userId, dailyStats.date],
        set: {
          commits: statsData.commits,
          additions: statsData.additions,
          deletions: statsData.deletions,
          repositories: statsData.repositories,
        },
      })
      .returning();
    
    if (!stats) {
      throw new Error("Failed to upsert daily stats");
    }
    
    return stats;
  }

  /**
   * 특정 기간의 일별 통계 조회
   */
  static async findByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<DailyStats[]> {
    return db
      .select()
      .from(dailyStats)
      .where(
        and(
          eq(dailyStats.userId, userId),
          gte(dailyStats.date, startDate),
          lte(dailyStats.date, endDate)
        )
      )
      .orderBy(dailyStats.date);
  }

  /**
   * 사용자의 활동 데이터를 기반으로 일별 통계 재계산
   */
  static async recalculateForUser(userId: string, date: Date): Promise<DailyStats> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // 해당 날짜의 활동 통계 계산
    const activities = await GitHubActivityOperations.findByUserId(userId, {
      startDate: startOfDay,
      endDate: endOfDay,
      type: "commit",
    });
    
    const commits = activities.length;
    const additions = activities.reduce((sum, activity) => sum + (activity.additions || 0), 0);
    const deletions = activities.reduce((sum, activity) => sum + (activity.deletions || 0), 0);
    
    // 해당 날짜에 활동한 저장소 수 계산
    const uniqueRepos = new Set(activities.map(activity => activity.repositoryName));
    const repositories = uniqueRepos.size;
    
    return this.upsert({
      userId,
      date: startOfDay,
      commits,
      additions,
      deletions,
      repositories,
    });
  }
}

/**
 * GitHub 연결 관련 데이터베이스 작업
 */
export class GitHubConnectionOperations {
  /**
   * GitHub 연결 생성 또는 업데이트
   */
  static async upsert(connectionData: NewGitHubConnection): Promise<GitHubConnection> {
    const [connection] = await db
      .insert(githubConnections)
      .values(connectionData)
      .onConflictDoUpdate({
        target: [githubConnections.userId],
        set: {
          githubId: connectionData.githubId,
          githubUsername: connectionData.githubUsername,
          accessToken: connectionData.accessToken,
          refreshToken: connectionData.refreshToken,
          scope: connectionData.scope,
          updatedAt: new Date(),
        },
      })
      .returning();
    
    if (!connection) {
      throw new Error("Failed to upsert GitHub connection");
    }
    
    return connection;
  }

  /**
   * 사용자의 GitHub 연결 조회
   */
  static async findByUserId(userId: string): Promise<GitHubConnection | null> {
    const connections = await db
      .select()
      .from(githubConnections)
      .where(eq(githubConnections.userId, userId))
      .limit(1);
    
    return connections[0] || null;
  }

  /**
   * GitHub 연결 삭제
   */
  static async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(githubConnections)
        .where(eq(githubConnections.userId, userId));
      
      return true; // Drizzle doesn't provide rowCount, assume success if no error
    } catch (error) {
      console.error("Failed to delete GitHub connection:", error);
      return false;
    }
  }

  /**
   * 마지막 동기화 시간 업데이트
   */
  static async updateLastSync(userId: string): Promise<GitHubConnection | null> {
    const [connection] = await db
      .update(githubConnections)
      .set({
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(githubConnections.userId, userId))
      .returning();
    
    return connection || null;
  }
}

/**
 * 대시보드 메트릭 계산을 위한 복합 쿼리
 */
export class DashboardMetrics {
  /**
   * 활동 메트릭 계산
   */
  static async getActivityMetrics(userId: string, timeRange: 'week' | 'month' | 'year') {
    const now = new Date();
    const periods = this.getDateRanges(now, timeRange);
    
    // 현재 기간과 이전 기간의 커밋 수 조회
    const [currentCommits, previousCommits] = await Promise.all([
      GitHubActivityOperations.getCommitCount(userId, periods.current.start, periods.current.end),
      GitHubActivityOperations.getCommitCount(userId, periods.previous.start, periods.previous.end),
    ]);
    
    // 오늘 커밋 수
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayCommits = await GitHubActivityOperations.getCommitCount(userId, todayStart, todayEnd);
    
    // 퍼센트 변화 계산
    const percentageChange = previousCommits > 0 
      ? ((currentCommits - previousCommits) / previousCommits) * 100 
      : currentCommits > 0 ? 100 : 0;
    
    const trend = percentageChange > 0 ? 'up' : percentageChange < 0 ? 'down' : 'stable';
    
    return {
      todayCommits,
      weeklyCommits: timeRange === 'week' ? currentCommits : await GitHubActivityOperations.getCommitCount(
        userId, 
        new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), 
        now
      ),
      monthlyCommits: timeRange === 'month' ? currentCommits : await GitHubActivityOperations.getCommitCount(
        userId, 
        new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), 
        now
      ),
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend,
    };
  }

  /**
   * 트렌드 데이터 조회
   */
  static async getTrendData(userId: string, timeRange: 'week' | 'month' | 'year') {
    const now = new Date();
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);
    
    return GitHubActivityOperations.getDailyStats(userId, startDate, endDate);
  }

  /**
   * 캘린더 데이터 조회
   */
  static async getCalendarData(userId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);
    
    const dailyStats = await GitHubActivityOperations.getDailyStats(userId, startDate, endDate);
    
    // 모든 날짜에 대해 데이터 생성 (활동이 없는 날은 0으로)
    const result = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]!;
      const dayStats = dailyStats.find(stat => stat.date === dateStr);
      const commits = dayStats?.commits || 0;
      
      // GitHub 스타일 레벨 계산 (0-4)
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (commits > 0) {
        if (commits >= 10) level = 4;
        else if (commits >= 7) level = 3;
        else if (commits >= 4) level = 2;
        else level = 1;
      }
      
      result.push({
        date: dateStr,
        count: commits,
        level,
      });
    }
    
    return result;
  }

  /**
   * 날짜 범위 계산 헬퍼
   */
  private static getDateRanges(now: Date, timeRange: 'week' | 'month' | 'year') {
    const days = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365;
    
    const currentEnd = new Date(now);
    currentEnd.setHours(23, 59, 59, 999);
    
    const currentStart = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    currentStart.setHours(0, 0, 0, 0);
    
    const previousEnd = new Date(currentStart.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    previousStart.setHours(0, 0, 0, 0);
    
    return {
      current: { start: currentStart, end: currentEnd },
      previous: { start: previousStart, end: previousEnd },
    };
  }
}