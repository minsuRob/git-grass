import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";

interface DemoLayoutProps {
  children: React.ReactNode;
}

/** 데모 전용 레이아웃 - 인증 없이 대시보드 진입 (리다이렉트 없음) */
export function DemoLayout({ children }: DemoLayoutProps) {
  const [screenData, setScreenData] = useState(Dimensions.get("window"));

  useEffect(() => {
    const onChange = (result: { window: ReturnType<typeof Dimensions.get> }) => {
      setScreenData(result.window);
    };
    const sub = Dimensions.addEventListener("change", onChange);
    return () => sub?.remove();
  }, []);

  const isLargeScreen = screenData.width >= 768;

  return (
    <View className="flex-1 bg-github-bg">
      <View className="bg-github-border border-b border-github-border px-4 py-3">
        <View
          className={`flex-row items-center justify-between ${isLargeScreen ? "max-w-6xl mx-auto" : ""}`}
        >
          <View className="flex-1">
            <Text className="text-xl font-bold text-github-text">
              GitHub Dashboard
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-github-muted text-sm">데모 모드</Text>
              <View className="flex-row items-center ml-3">
                <View className="w-2 h-2 rounded-full bg-amber-500 mr-1" />
                <Text className="text-amber-400 text-xs">미연결</Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => router.replace("/(auth)/login")}
            className="bg-github-accent px-3 py-1 rounded"
          >
            <Text className="text-white text-sm">로그인</Text>
          </Pressable>
        </View>
      </View>

      <View className="flex-1">
        {isLargeScreen ? (
          <View className="max-w-6xl mx-auto w-full">{children}</View>
        ) : (
          children
        )}
      </View>

      <View className="bg-amber-900/20 border-t border-amber-500/30 px-4 py-2">
        <Text className="text-amber-400 text-sm text-center">
          데모 모드 · GitHub를 연결하면 실제 데이터를 확인할 수 있습니다
        </Text>
      </View>
    </View>
  );
}
