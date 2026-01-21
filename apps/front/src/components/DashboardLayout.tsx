import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { trpc } from "../lib/trpc";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const disconnectGitHub = trpc.auth.disconnectGitHub.useMutation({
    onSuccess: () => {
      router.replace("/(auth)/login");
    },
  });

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  // 로딩 중
  if (isLoading) {
    return (
      <View className="flex-1 bg-github-bg justify-center items-center">
        <View className="items-center">
          <View className="bg-github-accent w-8 h-8 rounded-full mb-4 animate-pulse" />
          <Text className="text-github-muted">대시보드를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  // 인증되지 않은 경우 로그인 페이지로 리다이렉트
  if (!session?.user) {
    router.replace("/(auth)/login");
    return null;
  }

  const handleDisconnect = () => {
    disconnectGitHub.mutate();
  };

  const isLargeScreen = screenData.width >= 768;

  return (
    <View className="flex-1 bg-github-bg">
      {/* 헤더 */}
      <View className="bg-github-border border-b border-github-border px-4 py-3">
        <View className={`flex-row items-center justify-between ${isLargeScreen ? 'max-w-6xl mx-auto' : ''}`}>
          <View className="flex-1">
            <Text className="text-xl font-bold text-github-text">
              GitHub Dashboard
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-github-muted text-sm">
                {session.user.username || session.user.email}
              </Text>
              {session.user.githubId && (
                <View className="flex-row items-center ml-3">
                  <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                  <Text className="text-green-400 text-xs">GitHub 연결됨</Text>
                </View>
              )}
            </View>
          </View>
          
          <View className="flex-row items-center space-x-3">
            {/* GitHub 연결 상태 (큰 화면에서만) */}
            {isLargeScreen && !session.user.githubId && (
              <Pressable
                onPress={() => {/* GitHub 연결 로직 */}}
                className="bg-github-blue px-3 py-1 rounded"
              >
                <Text className="text-white text-sm">GitHub 연결</Text>
              </Pressable>
            )}

            {/* 로그아웃 버튼 */}
            <Pressable
              onPress={handleDisconnect}
              disabled={disconnectGitHub.isPending}
              className="bg-github-accent px-3 py-1 rounded"
            >
              <Text className="text-white text-sm">
                {disconnectGitHub.isPending ? "처리 중..." : "로그아웃"}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 메인 콘텐츠 */}
      <View className="flex-1">
        {isLargeScreen ? (
          <View className="max-w-6xl mx-auto w-full">
            {children}
          </View>
        ) : (
          children
        )}
      </View>

      {/* GitHub 미연결 알림 (작은 화면에서만) */}
      {!isLargeScreen && !session.user.githubId && (
        <View className="bg-github-blue/20 border-t border-github-blue/30 px-4 py-2">
          <Text className="text-github-blue text-sm text-center">
            GitHub를 연결하여 실제 데이터를 확인하세요
          </Text>
        </View>
      )}
    </View>
  );
}