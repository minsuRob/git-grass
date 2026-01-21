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

// appRouter는 ./appRouter.ts 로 분리 (순환 참조 방지)
export type { AppRouter } from "./appRouter";