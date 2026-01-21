import {
    DailyStatsOperations,
    GitHubActivityOperations,
    GitHubConnectionOperations,
    RepositoryOperations,
} from "@acme/db";

/**
 * GitHub API 클라이언트
 */
export class GitHubService {
  private baseUrl = "https://api.github.com";

  constructor(private accessToken: string) {}

  /**
   * GitHub API 요청 헬퍼
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "GitHub-Dashboard-App",
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitReset = response.headers.get("X-RateLimit-Reset");
        throw new Error(`GitHub API rate limit exceeded. Reset at: ${rateLimitReset}`);
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * 사용자 정보 조회
   */
  async getUser(): Promise<GitHubUser> {
    return this.request<GitHubUser>("/user");
  }

  /**
   * 사용자 저장소 목록 조회
   */
  async getRepositories(page = 1, perPage = 100): Promise<GitHubRepository[]> {
    return this.request<GitHubRepository[]>(`/user/repos?page=${page}&per_page=${perPage}&sort=updated`);
  }

  /**
   * 저장소의 커밋 목록 조회
   */
  async getCommits(owner: string, repo: string, since?: string): Promise<GitHubCommit[]> {
    const params = new URLSearchParams();
    if (since) params.append("since", since);
    
    const endpoint = `/repos/${owner}/${repo}/commits${params.toString() ? `?${params.toString()}` : ""}`;
    return this.request<GitHubCommit[]>(endpoint);
  }

  /**
   * 사용자의 활동 이벤트 조회
   */
  async getEvents(username: string, page = 1): Promise<GitHubEvent[]> {
    return this.request<GitHubEvent[]>(`/users/${username}/events?page=${page}&per_page=100`);
  }

  /**
   * 사용자의 GitHub 데이터를 데이터베이스에 동기화
   */
  async syncUserData(userId: string): Promise<SyncResult> {
    try {
      // GitHub 연결 정보 조회
      const connection = await GitHubConnectionOperations.findByUserId(userId);

      if (!connection) {
        throw new Error("GitHub connection not found");
      }

      const githubService = new GitHubService(connection.accessToken);

      // 사용자 정보 조회
      const githubUser = await githubService.getUser();

      // 저장소 목록 동기화
      const repos = await githubService.getRepositories();
      let syncedRepos = 0;

      for (const repo of repos) {
        // 저장소 정보 저장/업데이트
        await RepositoryOperations.upsert({
          userId,
          githubId: repo.id,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          language: repo.language,
          isPrivate: repo.private,
          url: repo.html_url,
          lastSyncAt: new Date(),
        });

        syncedRepos++;
      }

      // 활동 이벤트 동기화
      const events = await githubService.getEvents(githubUser.login);
      let syncedActivities = 0;
      const processedDates = new Set<string>();

      for (const event of events) {
        if (event.type === "PushEvent" && event.payload?.commits) {
          for (const commit of event.payload.commits) {
            const activity = await GitHubActivityOperations.createIfNotExists({
              userId,
              type: "commit",
              repositoryName: event.repo.name,
              repositoryUrl: `https://github.com/${event.repo.name}`,
              commitSha: commit.sha,
              message: commit.message,
              timestamp: new Date(event.created_at),
            });

            if (activity) {
              syncedActivities++;
              
              // 해당 날짜의 일별 통계 재계산
              const activityDate = new Date(event.created_at);
              const dateKey = activityDate.toISOString().split('T')[0]!;
              
              if (!processedDates.has(dateKey)) {
                await DailyStatsOperations.recalculateForUser(userId, activityDate);
                processedDates.add(dateKey);
              }
            }
          }
        }
      }

      // 연결 정보 업데이트
      await GitHubConnectionOperations.updateLastSync(userId);

      return {
        success: true,
        syncedRepos,
        syncedActivities,
        syncedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("GitHub sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        syncedRepos: 0,
        syncedActivities: 0,
        syncedAt: new Date().toISOString(),
      };
    }
  }
}

/**
 * 사용자의 GitHub 서비스 인스턴스 생성
 */
export async function createGitHubService(userId: string): Promise<GitHubService | null> {
  const connection = await GitHubConnectionOperations.findByUserId(userId);

  if (!connection) {
    return null;
  }

  return new GitHubService(connection.accessToken);
}

// 타입 정의
export interface GitHubUser {
  id: number;
  login: string;
  avatar_url: string;
  name: string;
  email: string;
  public_repos: number;
  followers: number;
  following: number;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  language: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload?: {
    commits?: Array<{
      sha: string;
      message: string;
      author: {
        name: string;
        email: string;
      };
    }>;
  };
}

export interface SyncResult {
  success: boolean;
  syncedRepos: number;
  syncedActivities: number;
  syncedAt: string;
  error?: string;
}