import {
  createTRPCClient,
  httpBatchLink,
  loggerLink,
} from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { QueryClient } from "@tanstack/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "@acme/api";

import { API_URL } from "./env";

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

const makeTRPCClient = () =>
  createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) =>
          (typeof __DEV__ !== "undefined" && __DEV__) ||
          (op.direction === "down" && op.result instanceof Error),
      }),
      httpBatchLink({
        url: `${API_URL}/api/trpc`,
        transformer: SuperJSON,
        fetch: (input, init) =>
          fetch(input, { ...init, credentials: "include" }),
      }),
    ],
  });

export function makeTRPCClientAndQuery() {
  const queryClient = new QueryClient();
  const trpcClient = makeTRPCClient();
  return { queryClient, trpcClient };
}
