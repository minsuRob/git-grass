import type { ActivityMetrics as ActivityMetricsType } from "@acme/validators";
import { Text, View } from "react-native";

interface ActivityMetricsProps {
  metrics?: ActivityMetricsType;
  loading: boolean;
}

export function ActivityMetrics({ metrics, loading }: ActivityMetricsProps) {
  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted">로딩 중...</Text>
      </View>
    );
  }

  if (!metrics) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted">데이터가 없습니다</Text>
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