import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import "react-native-reanimated";

import "@/global.css";
import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  makeTRPCClientAndQuery,
  TRPCProvider,
} from "@/lib/trpc";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [trpc] = useState(() => makeTRPCClientAndQuery());

  return (
    <QueryClientProvider client={trpc.queryClient}>
      <TRPCProvider
        queryClient={trpc.queryClient}
        trpcClient={trpc.trpcClient}
      >
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </TRPCProvider>
    </QueryClientProvider>
  );
}
