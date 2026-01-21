import type { AppRouter } from "@acme/api";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

export const trpc = createTRPCReact<AppRouter>();

// 인증 토큰 관리 (추후 AsyncStorage로 대체 가능)
let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: "http://localhost:3001/trpc",
      headers() {
        const headers: Record<string, string> = {};
        
        if (authToken) {
          headers.authorization = `Bearer ${authToken}`;
        }
        
        return headers;
      },
    }),
  ],
});