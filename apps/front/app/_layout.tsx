import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import "../global.css";
import { trpc, trpcClient } from "../src/lib/trpc";

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen name="index" options={{ title: "GitHub Dashboard" }} />
        </Stack>
      </QueryClientProvider>
    </trpc.Provider>
  );
}