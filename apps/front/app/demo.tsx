import { DashboardContent } from "../src/components/DashboardContent";
import { DemoLayout } from "../src/components/DemoLayout";

/** 데모 전용 페이지 - 로그인 없이 대시보드 확인 (강제 진입용) */
export default function DemoPage() {
  return (
    <DemoLayout>
      <DashboardContent />
    </DemoLayout>
  );
}
