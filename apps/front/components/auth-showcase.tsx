import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

import { authClient } from "@/lib/auth-client";

function getAppOrigin(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "http://localhost:8081";
}

export function AuthShowcase() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  if (isPending) {
    return (
      <View className="items-center justify-center py-4">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <Pressable
        className="bg-primary items-center justify-center rounded-lg px-6 py-3"
        onPress={async () => {
          const res = await authClient.signIn.social({
            provider: "discord",
            callbackURL: getAppOrigin() + "/",
          });
          if (!res.data?.url) throw new Error("No URL from signIn.social");
          if (Platform.OS === "web") {
            window.location.href = res.data.url;
          } else {
            await Linking.openURL(res.data.url);
          }
        }}
      >
        <Text className="text-primary-foreground font-semibold">
          Sign in with Discord
        </Text>
      </Pressable>
    );
  }

  return (
    <View className="items-center gap-4">
      <Text className="text-foreground text-center text-xl">
        Logged in as {session.user.name}
      </Text>
      <Pressable
        className="bg-muted items-center justify-center rounded-lg px-6 py-3"
        onPress={async () => {
          await authClient.signOut();
          router.replace("/");
        }}
      >
        <Text className="text-foreground font-semibold">Sign out</Text>
      </Pressable>
    </View>
  );
}
