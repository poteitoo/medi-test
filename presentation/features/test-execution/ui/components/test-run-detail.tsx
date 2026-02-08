import { RUN_STATUS_LABELS } from "../../domain/models/run-status";
import type { RunStatus } from "../../domain/models/run-status";
import type { ResultStatus } from "../../domain/models/result-status";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { TestRunItemCard } from "./test-run-item-card";

type TestRunDetailProps = {
  readonly run: {
    readonly id: string;
    readonly status: RunStatus;
    readonly assigneeUserId: string;
    readonly buildRef?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
  readonly items: ReadonlyArray<{
    readonly id: string;
    readonly runId: string;
    readonly caseRevisionId: string;
    readonly order: number;
    readonly testCaseTitle: string;
    readonly latestResult?: {
      readonly status: ResultStatus;
      readonly executedAt: Date;
      readonly executedBy: string;
    };
  }>;
  readonly summary: {
    readonly total: number;
    readonly executed: number;
    readonly passed: number;
    readonly failed: number;
    readonly blocked: number;
    readonly skipped: number;
  };
  readonly onResultSubmit: (
    itemId: string,
    data: {
      status: ResultStatus;
      evidence?: {
        logs?: string;
        screenshots?: string[];
        links?: string[];
      };
      bugLinks?: Array<{
        url: string;
        title: string;
        severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
      }>;
    },
  ) => void;
  readonly onStartRun?: () => void;
  readonly onCompleteRun?: () => void;
  readonly loading?: boolean;
};

/**
 * TestRunDetail Component
 *
 * テストラン詳細を表示するコンポーネント
 * 実行状況、進捗統計、テストアイテム一覧を表示
 */
export function TestRunDetail({
  run,
  items,
  summary,
  onResultSubmit,
  onStartRun,
  onCompleteRun,
  loading,
}: TestRunDetailProps) {
  const progress =
    summary.total > 0 ? (summary.executed / summary.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Run Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>テストラン詳細</CardTitle>
              <CardDescription>
                作成日時: {new Date(run.createdAt).toLocaleString("ja-JP")}
                {run.buildRef && ` • ビルド: ${run.buildRef}`}
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
              {run.status === "ASSIGNED" && onStartRun && (
                <Button onClick={onStartRun} disabled={loading}>
                  実行開始
                </Button>
              )}
              {run.status === "IN_PROGRESS" && onCompleteRun && (
                <Button onClick={onCompleteRun} disabled={loading}>
                  完了
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>進捗</span>
              <span>
                {summary.executed} / {summary.total} 実行済み (
                {progress.toFixed(1)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">合格</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.passed}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">不合格</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.failed}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">ブロック</p>
              <p className="text-2xl font-bold text-yellow-600">
                {summary.blocked}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">スキップ</p>
              <p className="text-2xl font-bold text-gray-600">
                {summary.skipped}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Items List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">テストケース一覧</h3>
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              テストケースがありません
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <TestRunItemCard
              key={item.id}
              itemId={item.id}
              runId={run.id}
              testCaseTitle={item.testCaseTitle}
              order={item.order}
              latestResult={item.latestResult}
              onResultSubmit={(data) => onResultSubmit(item.id, data)}
              loading={loading}
            />
          ))
        )}
      </div>
    </div>
  );
}
