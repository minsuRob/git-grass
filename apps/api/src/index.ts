import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware, createAuthHandler } from "./auth";
import { webhookRouter } from "./router/webhook";
import { schedulerService } from "./services/scheduler";
import { syncService } from "./services/sync";
import { appRouter } from "./appRouter";

const app = new Hono();

// CORS 설정
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081", "http://localhost:8082"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie", "X-Hub-Signature-256", "X-GitHub-Event"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
    credentials: true,
  })
);

// 웹훅 라우트 (인증 미들웨어 적용 전에 설정)
app.route("/webhook", webhookRouter);

// 인증 미들웨어 적용
app.use("*", authMiddleware);

// better-auth API 라우트
app.use("/api/auth/*", createAuthHandler());

// tRPC 서버 설정
app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => {
      return {
        user: c.get("user"),
        session: c.get("session"),
      };
    },
  })
);

// 헬스 체크 엔드포인트
app.get("/health", (c) => {
  const schedulerStatus = schedulerService.getStatus();
  
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    services: {
      api: "running",
      sync: "active",
      webhooks: "listening",
      scheduler: schedulerStatus.isRunning ? "running" : "stopped",
    },
    scheduler: schedulerStatus,
  });
});

// 스케줄러 서비스 시작
schedulerService.start();

// 서버 종료 시 서비스들 정리
const gracefulShutdown = () => {
  console.log("Shutting down gracefully...");
  schedulerService.stop();
  syncService.shutdown();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

const port = 3001;
console.log(`🚀 API Server running on http://localhost:${port}`);
console.log(`📡 Webhooks available at http://localhost:${port}/webhook`);
console.log(`⏰ Scheduler service started`);

serve({
  fetch: app.fetch,
  port,
});