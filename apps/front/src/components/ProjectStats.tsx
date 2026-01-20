import type { ProjectStats as ProjectStatsType } from "@acme/validators";
import { ScrollView, Text, View } from "react-native";

interface ProjectStatsProps {
  projects: ProjectStatsType[];
  loading: boolean;
}

export function ProjectStats({ projects, loading }: ProjectStatsProps) {
  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted">로딩 중...</Text>
      </View>
    );
  }

  if (!projects.length) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted">프로젝트가 없습니다</Text>
      </View>
    );
  }

  const getLanguageColor = (language: string) => {
    const colors: Record<string, string> = {
      TypeScript: "bg-blue-500",
      JavaScript: "bg-yellow-500",
      Python: "bg-green-500",
      Java: "bg-red-500",
      Go: "bg-cyan-500",
      Rust: "bg-orange-500",
    };
    return colors[language] || "bg-gray-500";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View className="bg-github-border rounded-lg p-4">
      <ScrollView>
        {projects.map((project, index) => (
          <View 
            key={index} 
            className={`py-3 ${index < projects.length - 1 ? 'border-b border-github-border' : ''}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-github-text font-medium flex-1" numberOfLines={1}>
                {project.name}
              </Text>
              <Text className="text-github-muted text-sm">
                {project.commits} 커밋
              </Text>
            </View>
            
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View 
                  className={`w-3 h-3 rounded-full mr-2 ${getLanguageColor(project.language)}`} 
                />
                <Text className="text-github-muted text-sm">
                  {project.language}
                </Text>
              </View>
              
              <Text className="text-github-muted text-sm">
                {formatDate(project.lastActivity)}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      
      <View className="mt-4 pt-3 border-t border-github-border">
        <Text className="text-sm text-github-muted text-center">
          최근 활동한 저장소들
        </Text>
      </View>
    </View>
  );
}