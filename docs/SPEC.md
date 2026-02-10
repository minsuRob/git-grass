# Git Grass 프로젝트 스펙

## 개요

- **모노레포**: pnpm workspace + Turborepo
- **Node**: >= 18
- **패키지 매니저**: pnpm 10.26.2

---

## 백엔드 (API)

### 패키지

- **이름**: `@acme/api`
- **경로**: `apps/api`
- **실행 포트**: **3001**

### 런타임 / 언어

- **실행**: Node.js (ESM, `"type": "module"`)
- **개발**: `tsx watch src/index.ts`
- **언어**: TypeScript 5.9.x

### 프레임워크 / 라이브러리

| 구분 | 기술 | 버전 |
|------|------|------|
| 웹 프레임워크 | Hono | ^4.7.1 |
| 서버 구동 | @hono/node-server | (Hono 연동) |
| API 레이어 | tRPC | ^11.7.1 |
| Hono-tRPC 연동 | @hono/trpc-server | ^0.3.2 |
| 인증 | better-auth | ^1.4.16 |
| ORM | Drizzle ORM | ^0.41.0 |
| 검증/스키마 | Zod | ^4.1.12 |
| 직렬화 | superjson | ^2.2.2 |

### API 구조

- **REST**
  - `GET /health` — 헬스 체크
  - `POST /webhook/*` — GitHub 웹훅 (인증 미들웨어 제외)
  - `* /api/auth/*` — better-auth 핸들러
- **tRPC**
  - 엔드포인트: `POST /trpc/*`
  - 라우터: `auth`, `dashboard`, `github`, `sync`

### tRPC 라우터 개요

- **auth**: 세션, GitHub 연결/해제, 프로필, GitHub 연결 상태
- **dashboard**: 메트릭, 트렌드, 캘린더 데이터
- **github**: 저장소 목록 등
- **sync**: 수동 동기화 등

### 백엔드 내부 패키지 (workspace)

- **@acme/db**: Drizzle 스키마, 클라이언트, 마이그레이션 (PostgreSQL, postgres 드라이버)
- **@acme/auth**: better-auth 설정 및 타입
- **@acme/validators**: Zod 스키마/유효성 검사

### 서비스 (apps/api)

- **scheduler**: 주기 작업 (sync-health-check, full-sync, daily-cleanup)
- **sync**: GitHub 데이터 동기화
- **cache**: 캐시 레이어
- **github**: GitHub API 연동

### CORS

- 허용 origin: `http://localhost:3000`, `8081`, `8082`
- credentials: true

---

## 프론트엔드 (Web App)

### 패키지

- **이름**: `@acme/front`
- **경로**: `apps/front`
- **앱 이름**: GitHub Dashboard (Expo slug: github-dashboard)

### 런타임 / 플랫폼

- **프레임워크**: Expo SDK 54
- **플랫폼**: Web (Metro), iOS, Android
- **웹 번들러**: Metro (`web.bundler: "metro"`)

### UI / 라우팅

| 구분 | 기술 | 버전 |
|------|------|------|
| UI | React | 19.1.0 |
| 네이티브 | React Native | 0.81.5 |
| 웹 렌더링 | react-native-web | ~0.21.2 |
| 라우팅 | Expo Router | ~6.0.21 |
| 스타일 | NativeWind (Tailwind) | ^4.1.23 |
| Tailwind CSS | tailwindcss | 3.4.19 |
| CSS 인터op | react-native-css-interop | ^0.2.1 |

### 데이터 / API 연동

| 구분 | 기술 | 버전 |
|------|------|------|
| API 클라이언트 | tRPC Client | ^11.7.1 |
| React 연동 | @trpc/react-query | ^11.7.1 |
| 서버 상태 | TanStack React Query | ^5.90.8 |
| 직렬화 | superjson | ^2.2.2 |

### 프론트 구조

- **라우팅 (파일 기반)**
  - `app/_layout.tsx` — 루트 레이아웃 (trpc Provider, QueryClient, Stack)
  - `app/index.tsx` — 대시보드 (인증 필요)
  - `app/(auth)/login.tsx` — 로그인
  - `app/demo.tsx` — 데모 전용 페이지 (인증 없음)
- **컴포넌트** (`src/components/`)
  - DashboardLayout, DemoLayout, DashboardContent
  - ActivityMetrics, CalendarHeatmap, TrendChart, ProjectStats, GitHubConnection
- **클라이언트 설정**: `src/lib/trpc.ts` (tRPC + React Query, `http://localhost:3001/trpc`)

### 스타일 (Tailwind / NativeWind)

- **설정**: `tailwind.config.js` (NativeWind preset, GitHub 테마 색상)
- **글로벌 CSS**: `global.css` (`@tailwind base/components/utilities`)
- **빌드**: Metro `withNativeWind(config, { input: "./global.css" })`, Babel `nativewind/babel`, `jsxImportSource: "nativewind"`

### 공유 패키지 (workspace)

- **@acme/validators**: Zod 스키마 (프론트에서 타입/검증)

---

## 공통 / 모노레포

### 워크스페이스

- `apps/*`: api, front, rn
- `packages/*`: auth, db, validators, tooling/typescript

### 주요 스크립트 (루트)

- `pnpm dev` — Turbo로 모든 앱 dev 동시 실행
- `pnpm build` — 전체 빌드
- `pnpm db:generate` / `db:push` / `db:studio` — DB 관련

### DB

- **드라이버**: postgres (postgres.js)
- **툴**: Drizzle Kit (generate, migrate, push, studio)
- **스키마**: user, session, account, verification, githubActivities, githubConnections, repositories 등 (better-auth + 앱 테이블)

---

## 요약 표

| 구분 | 백엔드 | 프론트엔드 |
|------|--------|------------|
| **진입점** | `apps/api/src/index.ts` | `apps/front` (Expo Router) |
| **실행** | `pnpm --filter @acme/api dev` | `pnpm --filter @acme/front web` |
| **기본 URL** | http://localhost:3001 | http://localhost:8082 (웹) |
| **API 통신** | — | tRPC (httpBatchLink) → :3001/trpc |
| **인증** | better-auth, Hono 미들웨어 | 세션 기반, DashboardLayout 리다이렉트 |
