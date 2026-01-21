import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { trpc } from "../../src/lib/trpc";

export default function LoginScreen() {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isConnecting, setIsConnecting] = useState(false);
  
  const connectGitHub = trpc.auth.connectGitHub.useMutation({
    onSuccess: () => {
      router.replace("/");
    },
    onError: (error) => {
      console.error("GitHub 연결 실패:", error);
      setIsConnecting(false);
    },
  });

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const handleGitHubLogin = () => {
    setIsConnecting(true);
    connectGitHub.mutate();
  };

  const handleDemoMode = () => {
    // 데모 모드로 진입 (GitHub 연결 없이)
    router.replace("/");
  };

  const isLargeScreen = screenData.width >= 768;

  return (
    <View className="flex-1 bg-github-bg">
      {/* 배경 패턴 */}
      <View className="absolute inset-0 opacity-5">
        <View className="flex-1 bg-gradient-to-br from-github-accent to-github-blue" />
      </View>

      <View className="flex-1 justify-center items-center p-6">
        <View className={`w-full ${isLargeScreen ? 'max-w-md' : 'max-w-sm'}`}>
          {/* 로고 및 헤더 */}
          <View className="items-center mb-8">
            <View className="bg-github-accent w-16 h-16 rounded-full items-center justify-center mb-4">
              <Text className="text-white text-2xl font-bold">G</Text>
            </View>
            
            <Text className="text-4xl font-bold text-github-text mb-2">
              GitHub Dashboard
            </Text>
            <Text className="text-github-muted text-center text-lg">
              개발 활동을 추적하고 분석하세요
            </Text>
          </View>

          {/* 기능 소개 */}
          <View className="mb-8">
            <View className="bg-github-border rounded-lg p-4 mb-4">
              <Text className="text-github-text font-medium mb-2">
                📊 실시간 활동 추적
              </Text>
              <Text className="text-github-muted text-sm">
                일일, 주간, 월간 커밋 활동을 실시간으로 모니터링
              </Text>
            </View>
            
            <View className="bg-github-border rounded-lg p-4 mb-4">
              <Text className="text-github-text font-medium mb-2">
                📈 트렌드 분석
              </Text>
              <Text className="text-github-muted text-sm">
                시간별 활동 패턴과 생산성 트렌드 분석
              </Text>
            </View>
            
            <View className="bg-github-border rounded-lg p-4">
              <Text className="text-github-text font-medium mb-2">
                🗓️ 활동 캘린더
              </Text>
              <Text className="text-github-muted text-sm">
                GitHub 스타일 히트맵으로 활동 기록 시각화
              </Text>
            </View>
          </View>

          {/* 로그인 옵션 */}
          <View className="space-y-3">
            {/* GitHub 로그인 */}
            <Pressable
              onPress={handleGitHubLogin}
              disabled={isConnecting || connectGitHub.isPending}
              className={`bg-github-accent rounded-lg p-4 items-center flex-row justify-center ${
                (isConnecting || connectGitHub.isPending) ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white text-lg mr-2">🔗</Text>
              <Text className="text-white font-semibold text-lg">
                {isConnecting || connectGitHub.isPending ? "연결 중..." : "GitHub로 로그인"}
              </Text>
            </Pressable>

            {/* 데모 모드 */}
            <Pressable
              onPress={handleDemoMode}
              disabled={isConnecting || connectGitHub.isPending}
              className="bg-github-bg border border-github-border rounded-lg p-4 items-center"
            >
              <Text className="text-github-text font-medium">
                데모 모드로 체험하기
              </Text>
              <Text className="text-github-muted text-sm mt-1">
                샘플 데이터로 기능을 미리 확인해보세요
              </Text>
            </Pressable>
          </View>

          {/* 에러 메시지 */}
          {connectGitHub.error && (
            <View className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
              <Text className="text-red-400 text-center font-medium">
                로그인에 실패했습니다
              </Text>
              <Text className="text-red-300 text-sm text-center mt-1">
                네트워크 연결을 확인하고 다시 시도해주세요
              </Text>
            </View>
          )}

          {/* 개인정보 보호 안내 */}
          <View className="mt-8 pt-6 border-t border-github-border">
            <Text className="text-github-muted text-xs text-center leading-4">
              GitHub 로그인 시 공개 저장소 정보만 수집되며,{"\n"}
              개인 정보는 안전하게 보호됩니다.{"\n"}
              언제든지 연결을 해제할 수 있습니다.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}