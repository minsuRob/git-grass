import { useEffect, useState } from "react";
import { Dimensions, Pressable, Text, View } from "react-native";
import { trpc } from "../../src/lib/trpc";

export default function LoginScreen() {
  const [screenData, setScreenData] = useState(Dimensions.get('window'));
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "http://localhost:3001";
  const { data: signInUrlData } = trpc.auth.getGitHubSignInUrl.useQuery();

  const postUrl = signInUrlData?.postUrl ?? `${API_BASE}/api/auth/sign-in/social`;
  const callbackURL =
    signInUrlData?.callbackURL ??
    (typeof window !== "undefined" ? window.location.origin + "/" : "");

  useEffect(() => {
    const onChange = (result: { window: any }) => {
      setScreenData(result.window);
    };

    const subscription = Dimensions.addEventListener('change', onChange);
    return () => subscription?.remove();
  }, []);

  const handleGitHubLogin = async () => {
    if (typeof window === "undefined") return;
    setError(null);
    setIsConnecting(true);
    try {
      const res = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "github",
          callbackURL: callbackURL || window.location.origin + "/",
        }),
        credentials: "include",
        redirect: "manual", // 302를 따라가면 HTML을 받아 JSON 파싱 실패하므로 수동 처리
      });
      // 302면 Location 헤더로 이동 (better-auth OAuth 플로우)
      const location = res.headers.get("Location");
      if ((res.status === 302 || res.status === 303) && location) {
        window.location.href = location;
        return;
      }
      const raw = await res.text();
      let data: { url?: string; message?: string; error?: string } = {};
      try {
        data = raw ? (JSON.parse(raw) as typeof data) : {};
      } catch {
        setError(res.ok ? "응답 형식 오류" : `서버 오류 (${res.status}): ${raw.slice(0, 200)}`);
        setIsConnecting(false);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setError(
        data?.message || data?.error || `로그인 URL을 받지 못함 (${res.status})`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "네트워크 오류";
      setError(msg);
      console.error("[GitHub 로그인]", e);
    } finally {
      setIsConnecting(false);
    }
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
            {error ? (
              <View className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 mb-3">
                <Text className="text-red-400 text-sm">{error}</Text>
              </View>
            ) : null}
            <Pressable
              onPress={handleGitHubLogin}
              disabled={isConnecting}
              className={`bg-github-accent rounded-lg p-4 items-center flex-row justify-center ${
                isConnecting ? "opacity-50" : ""
              }`}
            >
              <Text className="text-white text-lg mr-2">🔗</Text>
              <Text className="text-white font-semibold text-lg">
                {isConnecting ? "이동 중..." : "GitHub로 로그인"}
              </Text>
            </Pressable>
          </View>


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