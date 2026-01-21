import type { TrendData } from "@acme/validators";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface TrendChartProps {
  data: TrendData[];
  loading: boolean;
  error?: Error | null;
}

export function TrendChart({ data, loading, error }: TrendChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');

  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row items-end space-x-2" style={{ minWidth: 280 }}>
            {Array.from({ length: 7 }, (_, index) => (
              <View key={index} className="items-center">
                <View className="bg-gray-700 rounded-sm w-6 h-12" />
                <View className="bg-gray-700 w-4 h-3 rounded mt-2" />
                <View className="bg-gray-700 w-6 h-3 rounded mt-1" />
                <View className="bg-gray-700 w-3 h-3 rounded mt-1" />
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-red-400 text-center">
          트렌드 데이터를 불러오는데 실패했습니다
        </Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          네트워크 연결을 확인해주세요
        </Text>
      </View>
    );
  }

  if (!data.length) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted text-center">데이터가 없습니다</Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          GitHub를 연결하여 실제 데이터를 확인하세요
        </Text>
      </View>
    );
  }

  const maxCommits = Math.max(...data.map(d => d.commits));
  const getBarHeight = (commits: number) => {
    if (maxCommits === 0) return 4;
    return Math.max(4, (commits / maxCommits) * 60);
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getDayLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return days[date.getDay()];
  };

  const getBarColor = (commits: number, index: number) => {
    if (selectedIndex === index) return "bg-github-blue";
    if (commits === 0) return "bg-gray-800";
    if (commits === maxCommits) return "bg-github-accent";
    return "bg-green-700";
  };

  const selectedData = selectedIndex !== null ? data[selectedIndex] : null;

  return (
    <View className="bg-github-border rounded-lg p-4">
      {/* 시간 범위 선택 */}
      <View className="flex-row justify-center space-x-2 mb-4">
        {[
          { key: 'week' as const, label: '주간' },
          { key: 'month' as const, label: '월간' },
          { key: 'year' as const, label: '연간' },
        ].map((range) => (
          <Pressable
            key={range.key}
            onPress={() => setTimeRange(range.key)}
            className={`px-3 py-1 rounded ${
              timeRange === range.key 
                ? 'bg-github-accent' 
                : 'bg-github-bg border border-github-border'
            }`}
          >
            <Text className={`text-sm ${
              timeRange === range.key ? 'text-white' : 'text-github-muted'
            }`}>
              {range.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* 선택된 데이터 정보 */}
      {selectedData && (
        <View className="bg-github-bg rounded p-3 mb-4">
          <Text className="text-github-text font-medium">
            {getDateLabel(selectedData.date)} ({getDayLabel(selectedData.date)})
          </Text>
          <View className="flex-row justify-between mt-2">
            <View>
              <Text className="text-github-muted text-xs">커밋</Text>
              <Text className="text-github-text font-medium">{selectedData.commits}</Text>
            </View>
            <View>
              <Text className="text-github-muted text-xs">추가</Text>
              <Text className="text-green-400 font-medium">+{selectedData.additions}</Text>
            </View>
            <View>
              <Text className="text-github-muted text-xs">삭제</Text>
              <Text className="text-red-400 font-medium">-{selectedData.deletions}</Text>
            </View>
          </View>
        </View>
      )}

      {/* 차트 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-end space-x-2" style={{ minWidth: data.length * 40 }}>
          {data.map((item, index) => (
            <Pressable
              key={index}
              onPress={() => setSelectedIndex(selectedIndex === index ? null : index)}
              className="items-center"
            >
              <View 
                className={`rounded-sm w-6 ${getBarColor(item.commits, index)}`}
                style={{ height: getBarHeight(item.commits) }}
              />
              <Text className="text-xs text-github-muted mt-2">
                {getDayLabel(item.date)}
              </Text>
              <Text className="text-xs text-github-muted">
                {getDateLabel(item.date)}
              </Text>
              <Text className="text-xs text-github-text font-medium mt-1">
                {item.commits}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      
      {/* 통계 정보 */}
      <View className="mt-4 pt-3 border-t border-github-border">
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-github-muted text-xs">총 커밋</Text>
            <Text className="text-github-text font-medium">
              {data.reduce((sum, item) => sum + item.commits, 0)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-github-muted text-xs">평균</Text>
            <Text className="text-github-text font-medium">
              {Math.round(data.reduce((sum, item) => sum + item.commits, 0) / data.length)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-github-muted text-xs">최고</Text>
            <Text className="text-github-text font-medium">{maxCommits}</Text>
          </View>
        </View>
        <Text className="text-sm text-github-muted text-center mt-2">
          지난 {data.length}일간의 커밋 활동
        </Text>
      </View>
    </View>
  );
}