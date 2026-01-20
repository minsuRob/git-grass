import { serve } from "@hono/node-server";
import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { authMiddleware, createAuthHandler } from "./auth";
import { appRouter } from "./trpc";

const app = new Hono();

// CORS 설정
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000", "http://localhost:8081"],
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    maxAge: 600,
    credentials: true,
  })
);

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
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

const port = 3001;
console.log(`🚀 API Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});