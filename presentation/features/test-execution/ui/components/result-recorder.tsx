import { useState } from "react";
import {
  RESULT_STATUS_LABELS,
  RESULT_STATUS_VARIANTS,
} from "../../domain/models/result-status";
import type { ResultStatus } from "../../domain/models/result-status";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type ResultRecorderProps = {
  readonly runId: string;
  readonly itemId: string;
  readonly testCaseTitle: string;
  readonly currentStatus?: ResultStatus;
  readonly onSubmit: (data: {
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
  readonly onCancel?: () => void;
  readonly loading?: boolean;
};

/**
 * ResultRecorder Component
 *
 * テスト結果を記録するフォーム
 */
export function ResultRecorder({
  runId,
  itemId,
  testCaseTitle,
  currentStatus,
  onSubmit,
  onCancel,
  loading,
}: ResultRecorderProps) {
  const [selectedStatus, setSelectedStatus] = useState<ResultStatus | null>(
    currentStatus ?? null,
  );
  const [logs, setLogs] = useState("");
  const [bugUrl, setBugUrl] = useState("");
  const [bugTitle, setBugTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStatus) {
      return;
    }

    onSubmit({
      status: selectedStatus,
      evidence: logs.trim()
        ? {
            logs: logs.trim(),
          }
        : undefined,
      bugLinks:
        bugUrl.trim() && bugTitle.trim()
          ? [
              {
                url: bugUrl.trim(),
                title: bugTitle.trim(),
              },
            ]
          : undefined,
    });
  };

  const statusOptions: ResultStatus[] = ["PASS", "FAIL", "BLOCKED", "SKIPPED"];

  return (
    <Card>
      <CardHeader>
        <CardTitle>テスト結果記録</CardTitle>
        <CardDescription>{testCaseTitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <Label>結果ステータス</Label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={
                    selectedStatus === status
                      ? RESULT_STATUS_VARIANTS[status]
                      : "outline"
                  }
                  onClick={() => setSelectedStatus(status)}
                  className="justify-start"
                >
                  {RESULT_STATUS_LABELS[status]}
                </Button>
              ))}
            </div>
            {currentStatus && (
              <p className="text-sm text-muted-foreground">
                現在のステータス:{" "}
                <Badge variant={RESULT_STATUS_VARIANTS[currentStatus]}>
                  {RESULT_STATUS_LABELS[currentStatus]}
                </Badge>
              </p>
            )}
          </div>

          {/* Evidence Logs */}
          <div className="space-y-2">
            <Label htmlFor="logs">実行ログ（オプション）</Label>
            <Textarea
              id="logs"
              value={logs}
              onChange={(e) => setLogs(e.target.value)}
              placeholder="テスト実行時のログやメモを記録..."
              rows={4}
            />
          </div>

          {/* Bug Link (if FAIL or BLOCKED) */}
          {(selectedStatus === "FAIL" || selectedStatus === "BLOCKED") && (
            <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <Label className="text-destructive">バグリンク</Label>
              <div className="space-y-2">
                <Input
                  placeholder="バグトラッキングURL"
                  value={bugUrl}
                  onChange={(e) => setBugUrl(e.target.value)}
                />
                <Input
                  placeholder="バグタイトル"
                  value={bugTitle}
                  onChange={(e) => setBugTitle(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                キャンセル
              </Button>
            )}
            <Button type="submit" disabled={!selectedStatus || loading}>
              {loading ? "記録中..." : "結果を記録"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
