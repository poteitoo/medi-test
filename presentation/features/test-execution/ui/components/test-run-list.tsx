import { Link } from "react-router";
import { RUN_STATUS_LABELS } from "../../domain/models/run-status";
import type { RunStatus } from "../../domain/models/run-status";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type TestRunListProps = {
  readonly runs: ReadonlyArray<{
    readonly id: string;
    readonly status: RunStatus;
    readonly assigneeUserId: string;
    readonly buildRef?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
    readonly progress?: {
      readonly total: number;
      readonly executed: number;
      readonly passed: number;
      readonly failed: number;
    };
  }>;
};

/**
 * TestRunList Component
 *
 * テストラン一覧を表示するコンポーネント
 */
export function TestRunList({ runs }: TestRunListProps) {
  if (runs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          テストランがありません
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => {
        const progress = run.progress
          ? (run.progress.executed / run.progress.total) * 100
          : 0;

        return (
          <Card key={run.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">
                    テストラン {run.id.substring(0, 8)}
                  </CardTitle>
                  <CardDescription>
                    作成日時: {new Date(run.createdAt).toLocaleString("ja-JP")}
                    {run.buildRef && ` • ビルド: ${run.buildRef}`}
                    <br />
                    担当者: {run.assigneeUserId}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      run.status === "COMPLETED"
                        ? "default"
                        : run.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {RUN_STATUS_LABELS[run.status]}
                  </Badge>
                  <Link to={`/test-runs/${run.id}`}>
                    <Button size="sm" variant="outline">
                      詳細
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>

            {run.progress && (
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>進捗</span>
                    <span>
                      {run.progress.executed} / {run.progress.total} 実行済み (
                      {progress.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {run.progress.executed > 0 && (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span className="text-green-600">
                        合格: {run.progress.passed}
                      </span>
                      <span className="text-red-600">
                        不合格: {run.progress.failed}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
