import { useState } from "react";
import type { MetaFunction } from "react-router";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { RefreshCw, AlertCircle, Plus } from "lucide-react";
import { TestSummaryCard } from "~/features/dashboard/components/test-summary-card";
import { ActiveTestRunsCard } from "~/features/dashboard/components/active-test-runs-card";
import { RecentTestHistoryTable } from "~/features/dashboard/components/recent-test-history-table";
import { ProjectStatsCard } from "~/features/dashboard/components/project-stats-card";
import { EmptyDashboard } from "~/features/dashboard/components/empty-dashboard";
import { useDashboardData } from "~/features/dashboard/hooks/use-dashboard-data";
import { ScenarioCreationDialog } from "~/features/scenario-creation/scenario-creation-dialog";
import { useKeyboardShortcut } from "~/features/scenario-creation/hooks/use-keyboard-shortcut";
import { createPrismaClient } from "repository/libs/db";

export const meta: MetaFunction = () => {
  return [
    { title: "ダッシュボード - medi-test" },
    {
      name: "description",
      content: "テスト実行の概要とリアルタイム進捗を確認",
    },
  ];
};

export async function loader() {
  const prisma = createPrismaClient();
  const user = await prisma.user.count();
  console.log("user", user);
}

export default function DashboardPage() {
  const { data, isLoading, error, refresh } = useDashboardData();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // C キーでシナリオ作成ダイアログを開く
  useKeyboardShortcut("c", () => setCreateDialogOpen(true));

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={refresh} />;
  }

  if (!data || data.testRuns.length === 0) {
    return <EmptyDashboard />;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ダッシュボード
            </h1>
            <p className="text-muted-foreground mt-1">
              テスト実行の概要とリアルタイム進捗を確認
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              シナリオを作成
              <kbd className="ml-1 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                C
              </kbd>
            </Button>
            <Button
              onClick={refresh}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              更新
            </Button>
          </div>
        </div>

        {/* サマリーカード */}
        <TestSummaryCard
          summary={data.summary}
          executionTrends={data.executionTrends}
        />

        {/* メイングリッド */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 実行中のテスト */}
          <div className="lg:col-span-1 space-y-6">
            <ActiveTestRunsCard testRuns={data.testRuns} />
          </div>

          {/* 右カラム: テスト履歴とプロジェクト統計 */}
          <div className="lg:col-span-2 space-y-6">
            <RecentTestHistoryTable testRuns={data.recentRuns} />
            <ProjectStatsCard stats={data.projectStats} />
          </div>
        </div>

        {/* シナリオ作成ダイアログ */}
        <ScenarioCreationDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      </div>
    </div>
  );
}

/**
 * ローディングスケルトン
 */
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6 space-y-6">
        {/* ヘッダースケルトン */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-4 w-80" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>

        {/* サマリーカードスケルトン */}
        <Skeleton className="h-chart-xl w-full" />

        {/* グリッドスケルトン */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Skeleton className="h-chart-lg w-full" />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-chart-lg w-full" />
            <Skeleton className="h-chart-md w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * エラー表示
 */
function DashboardError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="container mx-auto p-6">
        <Alert variant="destructive" className="max-w-2xl mx-auto mt-20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>エラーが発生しました</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>{error.message}</p>
            <Button
              onClick={onRetry}
              variant="outline"
              size="sm"
              className="mt-4"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
