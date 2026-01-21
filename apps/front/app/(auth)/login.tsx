import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { trpc } from "../../src/lib/trpc";

export default function LoginScreen() {
  const connectGitHub = trpc.auth.connectGitHub.useMutation({
    onSuccess: () => {
      router.replace("/");
    },
    onError: (error) => {
      console.error("GitHub 연결 실패:", error);
    },
  });

  const handleGitHubLogin = () => {
    connectGitHub.mutate();
  };

  return (
    <View className="flex-1 bg-github-bg justify-center items-center p-6">
      <View className="w-full max-w-md">
        {/* 로고 영역 */}
        <View className="items-center mb-8">
          <Text className="text-4xl font-bold text-github-text mb-2">
            GitHub Dashboard
          </Text>
          <Text className="text-github-muted text-center">
            GitHub 계정으로 로그인하여{"\n"}개발 활동을 추적하세요
          </Text>
        </View>

        {/* 로그인 버튼 */}
        <Pressable
          onPress={handleGitHubLogin}
          disabled={connectGitHub.isPending}
          className={`bg-github-accent rounded-lg p-4 items-center ${
            connectGitHub.isPending ? "opacity-50" : ""
          }`}
        >
          <Text className="text-white font-semibold text-lg">
            {connectGitHub.isPending ? "연결 중..." : "GitHub로 로그인"}
          </Text>
        </Pressable>

        {/* 에러 메시지 */}
        {connectGitHub.error && (
          <View className="mt-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <Text className="text-red-400 text-center">
              로그인에 실패했습니다. 다시 시도해주세요.
            </Text>
          </View>
        )}

        {/* 설명 텍스트 */}
        <View className="mt-8">
          <Text className="text-github-muted text-sm text-center leading-5">
            GitHub 계정으로 로그인하면 실제 커밋 데이터와{"\n"}
            저장소 정보를 확인할 수 있습니다.{"\n"}
            연결하지 않아도 데모 데이터로 이용 가능합니다.
          </Text>
        </View>
      </View>
    </View>
  );
}