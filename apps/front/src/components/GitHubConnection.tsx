import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { trpc } from "../lib/trpc";

interface GitHubConnectionProps {
  isConnected: boolean;
  username?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function GitHubConnection({ 
  isConnected, 
  username, 
  onConnectionChange 
}: GitHubConnectionProps) {
  const [showDetails, setShowDetails] = useState(false);

  const connectGitHub = trpc.auth.connectGitHub.useMutation({
    onSuccess: () => {
      onConnectionChange?.(true);
    },
    onError: (error) => {
      console.error("GitHub 연결 실패:", error);
    },
  });

  const disconnectGitHub = trpc.auth.disconnectGitHub.useMutation({
    onSuccess: () => {
      onConnectionChange?.(false);
    },
    onError: (error) => {
      console.error("GitHub 연결 해제 실패:", error);
    },
  });

  const syncData = trpc.sync.syncNow.useMutation({
    onSuccess: () => {
      console.log("데이터 동기화 완료");
    },
    onError: (error) => {
      console.error("동기화 실패:", error);
    },
  });

  const handleConnect = () => {
    connectGitHub.mutate();
  };

  const handleDisconnect = () => {
    disconnectGitHub.mutate();
  };

  const handleSync = () => {
    syncData.mutate();
  };

  if (!isConnected) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <View className="items-center">
          <View className="bg-gray-700 w-12 h-12 rounded-full items-center justify-center mb-3">
            <Text className="text-gray-400 text-xl">🔗</Text>
          </View>
          
          <Text className="text-github-text font-medium mb-2">
            GitHub 미연결
          </Text>
          <Text className="text-github-muted text-sm text-center mb-4">
            GitHub를 연결하여 실제 커밋 데이터와{"\n"}
            저장소 정보를 확인하세요
          </Text>

          <Pressable
            onPress={handleConnect}
            disabled={connectGitHub.isPending}
            className={`bg-github-accent rounded-lg px-4 py-2 ${
              connectGitHub.isPending ? "opacity-50" : ""
            }`}
          >
            <Text className="text-white font-medium">
              {connectGitHub.isPending ? "연결 중..." : "GitHub 연결"}
            </Text>
          </Pressable>

          {connectGitHub.error && (
            <Text className="text-red-400 text-sm mt-2 text-center">
              연결에 실패했습니다. 다시 시도해주세요.
            </Text>
          )}
        </View>
      </View>
    );
  }

  return (
    <View className="bg-github-border rounded-lg p-4">
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="bg-github-accent w-8 h-8 rounded-full items-center justify-center mr-3">
            <Text className="text-white text-sm font-bold">
              {username?.charAt(0).toUpperCase() || "G"}
            </Text>
          </View>
          
          <View>
            <Text className="text-github-text font-medium">
              GitHub 연결됨
            </Text>
            <Text className="text-github-muted text-sm">
              {username || "사용자"}
            </Text>
          </View>
        </View>

        <View className="w-2 h-2 rounded-full bg-green-500" />
      </View>

      {/* 연결 상태 세부 정보 */}
      {showDetails && (
        <View className="bg-github-bg rounded p-3 mb-3">
          <Text className="text-github-text text-sm font-medium mb-2">
            연결 정보
          </Text>
          <View className="space-y-1">
            <View className="flex-row justify-between">
              <Text className="text-github-muted text-xs">상태</Text>
              <Text className="text-green-400 text-xs">활성</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-github-muted text-xs">권한</Text>
              <Text className="text-github-text text-xs">공개 저장소</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-github-muted text-xs">마지막 동기화</Text>
              <Text className="text-github-text text-xs">방금 전</Text>
            </View>
          </View>
        </View>
      )}

      {/* 액션 버튼들 */}
      <View className="flex-row space-x-2">
        <Pressable
          onPress={() => setShowDetails(!showDetails)}
          className="flex-1 bg-github-bg border border-github-border rounded px-3 py-2"
        >
          <Text className="text-github-text text-sm text-center">
            {showDetails ? "간단히 보기" : "자세히 보기"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSync}
          disabled={syncData.isPending}
          className={`flex-1 bg-github-blue rounded px-3 py-2 ${
            syncData.isPending ? "opacity-50" : ""
          }`}
        >
          <Text className="text-white text-sm text-center">
            {syncData.isPending ? "동기화 중..." : "동기화"}
          </Text>
        </Pressable>
      </View>

      {/* 연결 해제 버튼 */}
      <Pressable
        onPress={handleDisconnect}
        disabled={disconnectGitHub.isPending}
        className={`mt-3 bg-red-900/20 border border-red-500/30 rounded px-3 py-2 ${
          disconnectGitHub.isPending ? "opacity-50" : ""
        }`}
      >
        <Text className="text-red-400 text-sm text-center">
          {disconnectGitHub.isPending ? "연결 해제 중..." : "GitHub 연결 해제"}
        </Text>
      </Pressable>

      {/* 에러 메시지 */}
      {(disconnectGitHub.error || syncData.error) && (
        <Text className="text-red-400 text-sm mt-2 text-center">
          작업에 실패했습니다. 다시 시도해주세요.
        </Text>
      )}

      {/* 성공 메시지 */}
      {syncData.isSuccess && (
        <Text className="text-green-400 text-sm mt-2 text-center">
          데이터 동기화가 완료되었습니다.
        </Text>
      )}
    </View>
  );
}