import { ScrollView, Text, View } from "react-native";
import { ActivityMetrics } from "../src/components/ActivityMetrics";
import { CalendarHeatmap } from "../src/components/CalendarHeatmap";
import { ProjectStats } from "../src/components/ProjectStats";
import { TrendChart } from "../src/components/TrendChart";
import { trpc } from "../src/lib/trpc";

export default function Dashboard() {
  const { data: metrics, isLoading: metricsLoading } = trpc.dashboard.getMetrics.useQuery({
    timeRange: "week",
  });

  const { data: trendData, isLoading: trendLoading } = trpc.dashboard.getTrendData.useQuery({
    timeRange: "week",
  });

  const { data: calendarData, isLoading: calendarLoading } = trpc.dashboard.getCalendarData.useQuery({
    year: 2026,
  });

  const { data: repositories, isLoading: reposLoading } = trpc.github.getRepositories.useQuery();

  return (
    <ScrollView className="flex-1 bg-github-bg">
      <View className="p-4">
        {/* 헤더 */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-github-text mb-2">
            GitHub Dashboard
          </Text>
          <Text className="text-github-muted">
            매일의 작업 현황을 추적하고 분석하세요
          </Text>
        </View>

        {/* 활동 메트릭 */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-github-text mb-3">
            일일 활동 기록 수
          </Text>
          <ActivityMetrics metrics={metrics} loading={metricsLoading} />
        </View>

        {/* 트렌드 차트 */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-github-text mb-3">
            활동 기록 간격
          </Text>
          <TrendChart data={trendData || []} loading={trendLoading} />
        </View>

        {/* 캘린더 히트맵 */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-github-text mb-3">
            커밋 달력
          </Text>
          <CalendarHeatmap data={calendarData || []} loading={calendarLoading} />
        </View>

        {/* 프로젝트 통계 */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-github-text mb-3">
            커밋 트렌드
          </Text>
          <ProjectStats projects={repositories || []} loading={reposLoading} />
        </View>
      </View>
    </ScrollView>
  );
}