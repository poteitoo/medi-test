import { useState } from "react";
import {
  RESULT_STATUS_LABELS,
  RESULT_STATUS_VARIANTS,
} from "../../domain/models/result-status";
import type { ResultStatus } from "../../domain/models/result-status";
import type { TestResult } from "../../domain/models/test-result";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { ResultRecorder } from "./result-recorder";

type TestRunItemCardProps = {
  readonly itemId: string;
  readonly runId: string;
  readonly testCaseTitle: string;
  readonly order: number;
  readonly latestResult?: {
    readonly status: ResultStatus;
    readonly executedAt: Date;
    readonly executedBy: string;
  };
  readonly onResultSubmit: (data: {
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
  }) => void;
  readonly loading?: boolean;
};

/**
 * TestRunItemCard Component
 *
 * テストランアイテムを表示し、結果記録フォームを開くカード
 */
export function TestRunItemCard({
  itemId,
  runId,
  testCaseTitle,
  order,
  latestResult,
  onResultSubmit,
  loading,
}: TestRunItemCardProps) {
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (data: Parameters<typeof onResultSubmit>[0]) => {
    onResultSubmit(data);
    setIsRecording(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">
              #{order + 1} {testCaseTitle}
            </CardTitle>
            {latestResult && (
              <CardDescription className="mt-2">
                最終実行:{" "}
                {new Date(latestResult.executedAt).toLocaleString("ja-JP")} by{" "}
                {latestResult.executedBy}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {latestResult && (
              <Badge variant={RESULT_STATUS_VARIANTS[latestResult.status]}>
                {RESULT_STATUS_LABELS[latestResult.status]}
              </Badge>
            )}
            {!isRecording && (
              <Button
                size="sm"
                variant={latestResult ? "outline" : "default"}
                onClick={() => setIsRecording(true)}
              >
                {latestResult ? "結果を更新" : "結果を記録"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isRecording && (
        <CardContent>
          <ResultRecorder
            runId={runId}
            itemId={itemId}
            testCaseTitle={testCaseTitle}
            currentStatus={latestResult?.status}
            onSubmit={handleSubmit}
            onCancel={() => setIsRecording(false)}
            loading={loading}
          />
        </CardContent>
      )}
    </Card>
  );
}
