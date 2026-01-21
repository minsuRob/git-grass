import type { ProjectStats as ProjectStatsType } from "@acme/validators";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface ProjectStatsProps {
  projects: ProjectStatsType[];
  loading: boolean;
  error?: Error | null;
}

type SortOption = 'name' | 'commits' | 'activity';
type FilterOption = 'all' | 'active' | 'recent';

export function ProjectStats({ projects, loading, error }: ProjectStatsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('commits');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <ScrollView>
          {Array.from({ length: 3 }, (_, index) => (
            <View 
              key={index} 
              className={`py-3 ${index < 2 ? 'border-b border-github-border' : ''}`}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="bg-gray-700 h-4 w-32 rounded" />
                <View className="bg-gray-700 h-4 w-16 rounded" />
              </View>
              
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-2 bg-gray-700" />
                  <View className="bg-gray-700 h-3 w-20 rounded" />
                </View>
                
                <View className="bg-gray-700 h-3 w-12 rounded" />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-red-400 text-center">
          프로젝트 데이터를 불러오는데 실패했습니다
        </Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          네트워크 연결을 확인해주세요
        </Text>
      </View>
    );
  }

  if (!projects.length) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-github-muted text-center">프로젝트가 없습니다</Text>
        <Text className="text-github-muted text-sm text-center mt-1">
          GitHub를 연결하여 실제 저장소를 확인하세요
        </Text>
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
      Swift: "bg-orange-400",
      Kotlin: "bg-purple-500",
      "C++": "bg-pink-500",
      "C#": "bg-purple-600",
    };
    return colors[language] || "bg-gray-500";
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isRecentActivity = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  // 필터링
  const filteredProjects = projects.filter(project => {
    switch (filterBy) {
      case 'active':
        return project.commits > 0;
      case 'recent':
        return isRecentActivity(project.lastActivity);
      default:
        return true;
    }
  });

  // 정렬
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'commits':
        return b.commits - a.commits;
      case 'activity':
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      default:
        return 0;
    }
  });

  const selectedProjectData = selectedProject 
    ? projects.find(p => p.name === selectedProject) 
    : null;

  return (
    <View className="bg-github-border rounded-lg p-4">
      {/* 필터 및 정렬 옵션 */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-github-text font-medium">
            저장소 ({filteredProjects.length})
          </Text>
          
          <View className="flex-row space-x-2">
            {/* 필터 옵션 */}
            {[
              { key: 'all' as const, label: '전체' },
              { key: 'active' as const, label: '활성' },
              { key: 'recent' as const, label: '최근' },
            ].map((filter) => (
              <Pressable
                key={filter.key}
                onPress={() => setFilterBy(filter.key)}
                className={`px-2 py-1 rounded text-xs ${
                  filterBy === filter.key 
                    ? 'bg-github-accent' 
                    : 'bg-github-bg border border-github-border'
                }`}
              >
                <Text className={`text-xs ${
                  filterBy === filter.key ? 'text-white' : 'text-github-muted'
                }`}>
                  {filter.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 정렬 옵션 */}
        <View className="flex-row space-x-2">
          {[
            { key: 'commits' as const, label: '커밋순' },
            { key: 'activity' as const, label: '최근활동' },
            { key: 'name' as const, label: '이름순' },
          ].map((sort) => (
            <Pressable
              key={sort.key}
              onPress={() => setSortBy(sort.key)}
              className={`px-2 py-1 rounded ${
                sortBy === sort.key 
                  ? 'bg-github-blue' 
                  : 'bg-github-bg border border-github-border'
              }`}
            >
              <Text className={`text-xs ${
                sortBy === sort.key ? 'text-white' : 'text-github-muted'
              }`}>
                {sort.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 선택된 프로젝트 상세 정보 */}
      {selectedProjectData && (
        <View className="bg-github-bg rounded p-3 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-github-text font-medium">
              {selectedProjectData.name}
            </Text>
            <Pressable
              onPress={() => setSelectedProject(null)}
              className="bg-github-border rounded px-2 py-1"
            >
              <Text className="text-github-muted text-xs">닫기</Text>
            </Pressable>
          </View>
          
          <View className="flex-row justify-between">
            <View>
              <Text className="text-github-muted text-xs">총 커밋</Text>
              <Text className="text-github-text font-medium">
                {selectedProjectData.commits}
              </Text>
            </View>
            <View>
              <Text className="text-github-muted text-xs">언어</Text>
              <Text className="text-github-text font-medium">
                {selectedProjectData.language}
              </Text>
            </View>
            <View>
              <Text className="text-github-muted text-xs">마지막 활동</Text>
              <Text className="text-github-text font-medium">
                {formatDate(selectedProjectData.lastActivity)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 프로젝트 목록 */}
      <ScrollView style={{ maxHeight: 300 }}>
        {sortedProjects.map((project, index) => (
          <Pressable
            key={index}
            onPress={() => setSelectedProject(
              selectedProject === project.name ? null : project.name
            )}
            className={`py-3 ${
              index < sortedProjects.length - 1 ? 'border-b border-github-border' : ''
            } ${selectedProject === project.name ? 'bg-github-bg/50 rounded' : ''}`}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1">
                <Text className="text-github-text font-medium flex-1" numberOfLines={1}>
                  {project.name}
                </Text>
                {isRecentActivity(project.lastActivity) && (
                  <View className="bg-green-500 w-2 h-2 rounded-full ml-2" />
                )}
              </View>
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
          </Pressable>
        ))}
      </ScrollView>
      
      {/* 통계 정보 */}
      <View className="mt-4 pt-3 border-t border-github-border">
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-github-muted text-xs">총 저장소</Text>
            <Text className="text-github-text font-medium">{projects.length}</Text>
          </View>
          <View className="items-center">
            <Text className="text-github-muted text-xs">총 커밋</Text>
            <Text className="text-github-text font-medium">
              {projects.reduce((sum, p) => sum + p.commits, 0)}
            </Text>
          </View>
          <View className="items-center">
            <Text className="text-github-muted text-xs">활성 저장소</Text>
            <Text className="text-github-text font-medium">
              {projects.filter(p => p.commits > 0).length}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}