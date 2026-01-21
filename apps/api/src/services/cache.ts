/**
 * 간단한 인메모리 캐시 서비스
 */
export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5분

  private constructor() {
    // 주기적으로 만료된 캐시 정리
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000); // 1분마다 정리
  }

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * 캐시에서 값 조회
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // TTL 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    // 액세스 시간 업데이트
    entry.lastAccessed = Date.now();
    
    return entry.value as T;
  }

  /**
   * 캐시에 값 저장
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const ttl = ttlMs || this.DEFAULT_TTL;
    const now = Date.now();
    
    const entry: CacheEntry = {
      value,
      createdAt: now,
      expiresAt: now + ttl,
      lastAccessed: now,
    };
    
    this.cache.set(key, entry);
  }

  /**
   * 캐시에서 값 삭제
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 패턴으로 캐시 삭제
   */
  deletePattern(pattern: string): number {
    let deletedCount = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }

  /**
   * 사용자별 캐시 삭제
   */
  deleteUserCache(userId: string): number {
    return this.deletePattern(`^user:${userId}:`);
  }

  /**
   * 캐시 존재 여부 확인
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }
    
    // TTL 체크
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * 캐시 크기 조회
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 캐시 전체 삭제
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 만료된 캐시 정리
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * 캐시 통계 조회
   */
  getStats(): CacheStats {
    const now = Date.now();
    let expiredCount = 0;
    let totalSize = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
      
      // 대략적인 크기 계산 (JSON 문자열 길이)
      try {
        totalSize += JSON.stringify(entry.value).length;
      } catch {
        totalSize += 100; // 기본값
      }
    }
    
    return {
      totalEntries: this.cache.size,
      expiredEntries: expiredCount,
      activeEntries: this.cache.size - expiredCount,
      approximateSize: totalSize,
      hitRate: 0, // TODO: 히트율 계산을 위한 카운터 추가 필요
    };
  }

  /**
   * 캐시 키 생성 헬퍼
   */
  static createKey(prefix: string, ...parts: (string | number)[]): string {
    return [prefix, ...parts].join(':');
  }

  /**
   * 사용자별 캐시 키 생성
   */
  static createUserKey(userId: string, ...parts: (string | number)[]): string {
    return this.createKey('user', userId, ...parts);
  }

  /**
   * 대시보드 캐시 키 생성
   */
  static createDashboardKey(userId: string, endpoint: string, ...params: (string | number)[]): string {
    return this.createKey('dashboard', userId, endpoint, ...params);
  }
}

// 타입 정의
interface CacheEntry {
  value: any;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
}

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  activeEntries: number;
  approximateSize: number;
  hitRate: number;
}

// 캐시 키 상수
export const CACHE_KEYS = {
  DASHBOARD_METRICS: 'metrics',
  DASHBOARD_TREND: 'trend',
  DASHBOARD_CALENDAR: 'calendar',
  DASHBOARD_PROJECTS: 'projects',
  DASHBOARD_SUMMARY: 'summary',
  DASHBOARD_PERFORMANCE: 'performance',
  GITHUB_REPOS: 'github:repos',
  GITHUB_COMMITS: 'github:commits',
  GITHUB_CONNECTION: 'github:connection',
} as const;

// 캐시 TTL 상수 (밀리초)
export const CACHE_TTL = {
  SHORT: 2 * 60 * 1000,      // 2분
  MEDIUM: 5 * 60 * 1000,     // 5분
  LONG: 15 * 60 * 1000,      // 15분
  VERY_LONG: 60 * 60 * 1000, // 1시간
} as const;

// 싱글톤 인스턴스 내보내기
export const cacheService = CacheService.getInstance();