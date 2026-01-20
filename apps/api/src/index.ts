import { serve } from "@hono/node-server";
import { cors } from "hono/cors";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { Hono } from "hono";

import { appRouter, createTRPCContext } from "@acme/api";
import { initAuth } from "@acme/auth";

const getBaseUrl = () => {
  if (process.env.API_URL) return process.env.API_URL;
  const port = process.env.PORT ?? 3001;
  return `http://localhost:${port}`;
};

const auth = initAuth({
  baseUrl: getBaseUrl(),
  productionUrl: getBaseUrl(),
  secret: process.env.AUTH_SECRET,
  discordClientId: process.env.AUTH_DISCORD_ID!,
  discordClientSecret: process.env.AUTH_DISCORD_SECRET!,
});

const trpcHandler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req,
    createContext: () =>
      createTRPCContext({
        auth,
        headers: req.headers,
      }),
    onError({ error, path }) {
      console.error(`>>> tRPC Error on '${path}'`, error);
    },
  });

const app = new Hono();

const appOrigin = process.env.APP_ORIGIN ?? "http://localhost:8081";
app.use(
  "*",
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

app.all("/api/trpc/*", (c) => trpcHandler(c.req.raw));
app.all("/api/auth/*", (c) => auth.handler(c.req.raw));

const port = Number(process.env.PORT) || 3001;

serve({
  fetch: app.fetch,
  port,
});

console.log(`[api] Server at http://localhost:${port}`);
