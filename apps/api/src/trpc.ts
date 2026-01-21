import type { Session, User } from "@acme/auth";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

// tRPC 컨텍스트 타입 정의
export interface Context {
  user?: User;
  session?: Session;
}

// tRPC 초기화
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// 기본 프로시저
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// 보호된 프로시저 (인증 필요)
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user || !ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Authentication required",
    });
  }
  
  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
      session: ctx.session,
    },
  });
});

// 라우터들
import { authRouter } from "./router/auth";
import { dashboardRouter } from "./router/dashboard";
import { githubRouter } from "./router/github";
import { syncRouter } from "./router/sync";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  dashboard: dashboardRouter,
  github: githubRouter,
  sync: syncRouter,
});

export type AppRouter = typeof appRouter;