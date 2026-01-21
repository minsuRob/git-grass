import { createTRPCRouter } from "./trpc";
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
