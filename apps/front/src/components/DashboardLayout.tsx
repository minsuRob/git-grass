import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { trpc } from "../lib/trpc";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, isLoading } = trpc.auth.getSession.useQuery();
  const disconnectGitHub = trpc.auth.disconnectGitHub.useMutation({
    onSuccess: () => {
      router.replace("/(auth)/login");
    },
  });

  // 로딩 중
  if (isLoading) {
    return (
      <View className="flex-1 bg-github-bg justify-center items-center">
        <Text className="text-github-muted">로딩 중...</Text>
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

  return (
    <View className="flex-1 bg-github-bg">
      {/* 헤더 */}
      <View className="bg-github-border border-b border-github-border px-4 py-3">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-xl font-bold text-github-text">
              GitHub Dashboard
            </Text>
            <Text className="text-github-muted text-sm">
              {session.user.username || session.user.email}
            </Text>
          </View>
          
          <View className="flex-row items-center space-x-3">
            {/* GitHub 연결 상태 */}
            <View className="flex-row items-center">
              <View 
                className={`w-2 h-2 rounded-full mr-2 ${
                  session.user.githubId ? "bg-green-500" : "bg-gray-500"
                }`} 
              />
              <Text className="text-github-muted text-sm">
                {session.user.githubId ? "GitHub 연결됨" : "GitHub 미연결"}
              </Text>
            </View>

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
      {children}
    </View>
  );
}