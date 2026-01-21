import type { CalendarData } from "@acme/validators";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface CalendarHeatmapProps {
  data: CalendarData[];
  loading: boolean;
  error?: Error | null;
}

export function CalendarHeatmap({ data, loading, error }: CalendarHeatmapProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  if (loading) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View>
            {/* 요일 라벨 스켈레톤 */}
            <View className="flex-row mb-2">
              <View className="w-8" />
              {Array.from({ length: 7 }, (_, index) => (
                <View key={index} className="bg-gray-700 w-3 h-3 rounded mr-1" />
              ))}
            </View>

            {/* 캘린더 그리드 스켈레톤 */}
            <View className="flex-row">
              {Array.from({ length: 12 }, (_, weekIndex) => (
                <View key={weekIndex} className="mr-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => (
                    <View key={dayIndex} className="w-3 h-3 mb-1 bg-gray-700 rounded-sm" />
                  ))}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View className="bg-github-border rounded-lg p-4">
        <Text className="text-red-400 text-center">
          캘린더 데이터를 불러오는데 실패했습니다
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

  const getLevelColor = (level: number, isSelected: boolean = false) => {
    if (isSelected) return "bg-github-blue border border-github-blue";
    
    switch (level) {
      case 0:
        return "bg-gray-800";
      case 1:
        return "bg-green-900";
      case 2:
        return "bg-green-700";
      case 3:
        return "bg-green-500";
      case 4:
        return "bg-green-300";
      default:
        return "bg-gray-800";
    }
  };

  // 데이터를 주별로 그룹화
  const weeks: CalendarData[][] = [];
  let currentWeek: CalendarData[] = [];
  
  data.forEach((day, index) => {
    const date = new Date(day.date);
    const dayOfWeek = date.getDay();
    
    if (dayOfWeek === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(day);
    
    if (index === data.length - 1) {
      weeks.push(currentWeek);
    }
  });

  // 최근 12주만 표시
  const recentWeeks = weeks.slice(-12);

  const selectedData = selectedDate ? data.find(d => d.date === selectedDate) : null;

  const getMonthName = (monthIndex: number) => {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    return months[monthIndex];
  };

  const totalCommits = data.reduce((sum, day) => sum + day.count, 0);
  const activeDays = data.filter(day => day.count > 0).length;
  const maxDay = data.reduce((max, day) => day.count > max.count ? day : max, data[0]);

  return (
    <View className="bg-github-border rounded-lg p-4">
      {/* 월 네비게이션 */}
      <View className="flex-row items-center justify-between mb-4">
        <Pressable
          onPress={() => setCurrentMonth(prev => (prev - 1 + 12) % 12)}
          className="bg-github-bg border border-github-border rounded px-2 py-1"
        >
          <Text className="text-github-muted">←</Text>
        </Pressable>
        
        <Text className="text-github-text font-medium">
          {getMonthName(currentMonth)} 활동
        </Text>
        
        <Pressable
          onPress={() => setCurrentMonth(prev => (prev + 1) % 12)}
          className="bg-github-bg border border-github-border rounded px-2 py-1"
        >
          <Text className="text-github-muted">→</Text>
        </Pressable>
      </View>

      {/* 선택된 날짜 정보 */}
      {selectedData && (
        <View className="bg-github-bg rounded p-3 mb-4">
          <Text className="text-github-text font-medium">
            {new Date(selectedData.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            })}
          </Text>
          <Text className="text-github-muted mt-1">
            {selectedData.count}개의 커밋
          </Text>
          {selectedData.count > 0 && (
            <Text className="text-github-accent text-sm mt-1">
              활동 레벨: {selectedData.level}/4
            </Text>
          )}
        </View>
      )}

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* 요일 라벨 */}
          <View className="flex-row mb-2">
            <View className="w-8" />
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <Text key={index} className="text-xs text-github-muted w-3 text-center mr-1">
                {index % 2 === 1 ? day : ''}
              </Text>
            ))}
          </View>

          {/* 캘린더 그리드 */}
          <View className="flex-row">
            {recentWeeks.map((week, weekIndex) => (
              <View key={weekIndex} className="mr-1">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayData = week.find(d => new Date(d.date).getDay() === dayIndex);
                  const isSelected = dayData?.date === selectedDate;
                  
                  return (
                    <Pressable
                      key={dayIndex}
                      onPress={() => {
                        if (dayData) {
                          setSelectedDate(selectedDate === dayData.date ? null : dayData.date);
                        }
                      }}
                      className={`w-3 h-3 mb-1 rounded-sm ${
                        dayData ? getLevelColor(dayData.level, isSelected) : "bg-gray-800"
                      }`}
                    />
                  );
                })}
              </View>
            ))}
          </View>

          {/* 범례 */}
          <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-github-border">
            <Text className="text-xs text-github-muted">적음</Text>
            <View className="flex-row space-x-1">
              {[0, 1, 2, 3, 4].map(level => (
                <View
                  key={level}
                  className={`w-3 h-3 rounded-sm ${getLevelColor(level)}`}
                />
              ))}
            </View>
            <Text className="text-xs text-github-muted">많음</Text>
          </View>

          {/* 통계 정보 */}
          <View className="flex-row justify-between mt-3 pt-3 border-t border-github-border">
            <View className="items-center">
              <Text className="text-github-muted text-xs">총 커밋</Text>
              <Text className="text-github-text font-medium">{totalCommits}</Text>
            </View>
            <View className="items-center">
              <Text className="text-github-muted text-xs">활동 일수</Text>
              <Text className="text-github-text font-medium">{activeDays}일</Text>
            </View>
            <View className="items-center">
              <Text className="text-github-muted text-xs">최고 기록</Text>
              <Text className="text-github-text font-medium">{maxDay?.count || 0}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}