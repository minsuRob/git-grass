import { ScrollView, Text, View } from "react-native";
import { ActivityMetrics } from "../src/components/ActivityMetrics";
import { CalendarHeatmap } from "../src/components/CalendarHeatmap";
import { DashboardLayout } from "../src/components/DashboardLayout";
import { GitHubConnection } from "../src/components/GitHubConnection";
import { ProjectStats } from "../src/components/ProjectStats";
import { TrendChart } from "../src/components/TrendChart";
import { trpc } from "../src/lib/trpc";

export default function Dashboard() {
  const { 
    data: metrics, 
    isLoading: metricsLoading, 
    error: metricsError 
  } = trpc.dashboard.getMetrics.useQuery({
    timeRange: "week",
  });

  const { 
    data: trendData, 
    isLoading: trendLoading, 
    error: trendError 
  } = trpc.dashboard.getTrendData.useQuery({
    timeRange: "week",
  });

  const { 
    data: calendarData, 
    isLoading: calendarLoading, 
    error: calendarError 
  } = trpc.dashboard.getCalendarData.useQuery({
    year: 2026,
  });

  const { 
    data: repositories, 
    isLoading: reposLoading, 
    error: reposError 
  } = trpc.github.getRepositories.useQuery();

  const { data: session } = trpc.auth.getSession.useQuery();

  return (
    <DashboardLayout>
      <ScrollView className="flex-1">
        <View className="p-4">
          {/* 환영 메시지 */}
          <View className="mb-6">
            <Text className="text-github-muted">
              매일의 작업 현황을 추적하고 분석하세요
            </Text>
          </View>

          {/* GitHub 연결 상태 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-github-text mb-3">
              GitHub 연결
            </Text>
            <GitHubConnection
              isConnected={!!session?.user?.githubId}
              username={session?.user?.username}
            />
          </View>

          {/* 활동 메트릭 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-github-text mb-3">
              일일 활동 기록 수
            </Text>
            <ActivityMetrics 
              metrics={metrics} 
              loading={metricsLoading} 
              error={metricsError} 
            />
          </View>

          {/* 트렌드 차트 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-github-text mb-3">
              활동 기록 간격
            </Text>
            <TrendChart 
              data={trendData || []} 
              loading={trendLoading}
              error={trendError}
            />
          </View>

          {/* 캘린더 히트맵 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-github-text mb-3">
              커밋 달력
            </Text>
            <CalendarHeatmap 
              data={calendarData || []} 
              loading={calendarLoading}
              error={calendarError}
            />
          </View>

          {/* 프로젝트 통계 */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-github-text mb-3">
              커밋 트렌드
            </Text>
            <ProjectStats 
              projects={repositories || []} 
              loading={reposLoading}
              error={reposError}
            />
          </View>
        </View>
      </ScrollView>
    </DashboardLayout>
  );
}