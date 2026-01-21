import type { ActivityMetrics as ActivityMetricsType } from "@acme/validators";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface ActivityMetricsProps {
  metrics?: ActivityMetricsType;
  loading: boolean;
  error?: Error | null;
}

export function ActivityMetrics({ metrics, loading, error }: ActivityMetricsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

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

  const getSelectedValue = () => {
    switch (selectedPeriod) {
      case 'today':
        return metrics.todayCommits;
      case 'week':
        return metrics.weeklyCommits;
      case 'month':
        return metrics.monthlyCommits;
      default:
        return metrics.todayCommits;
    }
  };

  const getSelectedLabel = () => {
    switch (selectedPeriod) {
      case 'today':
        return '오늘';
      case 'week':
        return '이번 주';
      case 'month':
        return '이번 달';
      default:
        return '오늘';
    }
  };

  return (
    <View className="bg-github-border rounded-lg p-4">
      {/* 메인 메트릭 표시 */}
      <View className="items-center mb-4">
        <Text className="text-4xl font-bold text-github-text mb-2">
          {getSelectedValue()}
        </Text>
        <Text className="text-github-muted text-lg">
          {getSelectedLabel()} 커밋
        </Text>
      </View>

      {/* 기간 선택 버튼 */}
      <View className="flex-row justify-center space-x-2 mb-4">
        {[
          { key: 'today' as const, label: '오늘', value: metrics.todayCommits },
          { key: 'week' as const, label: '주간', value: metrics.weeklyCommits },
          { key: 'month' as const, label: '월간', value: metrics.monthlyCommits },
        ].map((period) => (
          <Pressable
            key={period.key}
            onPress={() => setSelectedPeriod(period.key)}
            className={`px-3 py-2 rounded ${
              selectedPeriod === period.key 
                ? 'bg-github-accent' 
                : 'bg-github-bg border border-github-border'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedPeriod === period.key ? 'text-white' : 'text-github-muted'
            }`}>
              {period.label}
            </Text>
            <Text className={`text-xs ${
              selectedPeriod === period.key ? 'text-white' : 'text-github-text'
            }`}>
              {period.value}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 트렌드 정보 */}
      <View className="flex-row items-center justify-center pt-2 border-t border-github-border">
        <Text className={`text-sm font-medium ${getTrendColor(metrics.trend)}`}>
          {getTrendSymbol(metrics.trend)} {Math.abs(metrics.percentageChange)}% 지난주 대비
        </Text>
      </View>

      {/* 추가 통계 */}
      <View className="flex-row justify-between mt-3 pt-3 border-t border-github-border">
        <View className="items-center">
          <Text className="text-github-muted text-xs">평균 (일)</Text>
          <Text className="text-github-text text-sm font-medium">
            {Math.round(metrics.weeklyCommits / 7)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-github-muted text-xs">최고 기록</Text>
          <Text className="text-github-text text-sm font-medium">
            {Math.max(metrics.todayCommits, metrics.weeklyCommits, metrics.monthlyCommits)}
          </Text>
        </View>
        <View className="items-center">
          <Text className="text-github-muted text-xs">활동 일수</Text>
          <Text className="text-github-text text-sm font-medium">
            {metrics.weeklyCommits > 0 ? '7일' : '0일'}
          </Text>
        </View>
      </View>
    </View>
  );
}