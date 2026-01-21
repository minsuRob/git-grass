import type { TrendData } from "@acme/validators";
import { ScrollView, Text, View } from "react-native";

interface TrendChartProps {
  data: TrendData[];
  loading: boolean;
  error?: Error | null;
}

export function TrendChart({ data, loading, error }: TrendChartProps) {
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

  return (
    <View className="bg-github-border rounded-lg p-4">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View className="flex-row items-end space-x-2" style={{ minWidth: data.length * 40 }}>
          {data.map((item, index) => (
            <View key={index} className="items-center">
              <View 
                className="bg-github-accent rounded-sm w-6"
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
            </View>
          ))}
        </View>
      </ScrollView>
      
      <View className="mt-4 pt-3 border-t border-github-border">
        <Text className="text-sm text-github-muted text-center">
          지난 7일간의 커밋 활동
        </Text>
      </View>
    </View>
  );
}