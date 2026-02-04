import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { TestRun } from "~/lib/schemas/test-run";
import { formatRelativeDate } from "../utils/chart-config";

interface ActiveTestRunsCardProps {
  testRuns: TestRun[];
}

export function ActiveTestRunsCard({ testRuns }: ActiveTestRunsCardProps) {
  const activeRuns = testRuns.filter((run) => run.status === "in_progress");

  return (
    <Card className="backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">実行中のテストラン</CardTitle>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-sm text-muted-foreground">
              リアルタイム更新
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeRuns.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            実行中のテストランはありません
          </p>
        ) : (
          activeRuns.map((run) => (
            <div
              key={run.id}
              className="space-y-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            >
              {/* ヘッダー部分 */}
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <p className="font-medium">{run.title}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{run.projectName}</span>
                    <span>•</span>
                    <Badge variant="outline" className="text-xs">
                      {run.environment.name}
                    </Badge>
                  </div>
                </div>

                {/* 担当者アバター */}
                <div className="flex -space-x-2">
                  {run.assignees.map((assignee) => (
                    <Avatar
                      key={assignee.id}
                      className="h-8 w-8 border-2 border-background"
                    >
                      <AvatarFallback className="text-xs bg-primary/10">
                        {assignee.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
              </div>

              {/* プログレスバー */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {run.completedItems} / {run.totalItems} 完了
                  </span>
                  <span className="font-medium">
                    {Math.round((run.completedItems / run.totalItems) * 100)}%
                  </span>
                </div>
                <Progress
                  value={(run.completedItems / run.totalItems) * 100}
                  className="h-2"
                />
              </div>

              {/* フッター情報 */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>開始: {formatRelativeDate(run.startedAt)}</span>
                {run.successRate > 0 && (
                  <span className="text-green-600 font-medium">
                    成功率: {run.successRate}%
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
