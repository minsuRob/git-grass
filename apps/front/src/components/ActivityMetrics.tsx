import type { ActivityMetrics as ActivityMetricsType } from "@acme/validators";
import { Text, View } from "react-native";

interface ActivityMetricsProps {
  metrics?: ActivityMetricsType;
  loading: boolean;
  error?: Error | null;
}

export function ActivityMetrics({ metrics, loading, error }: ActivityMetricsProps) {
  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-1">
            <View className="bg-gray-700 h-8 w-16 rounded mb-2" />
            <Text className="text-github-muted text-sm">오늘 커밋</Text>
          </View>
          
          <View className="flex-1 items-center">
            <View className="bg-gray-700 h-6 w-12 rounded mb-2" />
            <Text className="text-github-muted text-sm">이번 주</Text>
          </View>
          
          <View className="flex-1 items-end">
            <View className="bg-gray-700 h-6 w-12 rounded mb-2" />
            <Text className="text-github-muted text-sm">이번 달</Text>
          </View>
        </View>
        <View className="pt-2 border-t border-github-border">
          <View className="bg-gray-700 h-4 w-32 rounded mx-auto" />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-red-400 text-center">
          데이터를 불러오는데 실패했습니다
        </Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          네트워크 연결을 확인해주세요
        </Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted text-center">데이터가 없습니다</Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          GitHub를 연결하여 실제 데이터를 확인하세요
        </Text>
      </View>
    );
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "up":
        return "text-green-500";
      case "down":
        return "text-red-500";
      default:
        return "text-github-muted";
    }
  };

  const getTrendSymbol = (trend: string) => {
    switch (trend) {
      case "up":
        return "↗";
      case "down":
        return "↘";
      default:
        return "→";
    }
  };

  return (
    <View className="bg-github-border rounded-lg p-4">
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-1">
          <Text className="text-3xl font-bold text-github-text">
            {metrics.todayCommits}
          </Text>
          <Text className="text-github-muted text-sm">오늘 커밋</Text>
        </View>
        
        <View className="flex-1 items-center">
          <Text className="text-xl font-semibold text-github-text">
            {metrics.weeklyCommits}
          </Text>
          <Text className="text-github-muted text-sm">이번 주</Text>
        </View>
        
        <View className="flex-1 items-end">
          <Text className="text-xl font-semibold text-github-text">
            {metrics.monthlyCommits}
          </Text>
          <Text className="text-github-muted text-sm">이번 달</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-center pt-2 border-t border-github-border">
        <Text className={`text-sm font-medium ${getTrendColor(metrics.trend)}`}>
          {getTrendSymbol(metrics.trend)} {Math.abs(metrics.percentageChange)}% 지난주 대비
        </Text>
      </View>
    </View>
  );
}