import type { GateEvaluationResult } from "../../application/ports/gate-evaluation-service";
import { GATE_CONDITION_TYPE_LABELS } from "../../domain/models/gate-condition";
import { VIOLATION_SEVERITY_LABELS } from "../../domain/models/gate-violation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

type GateEvaluationProps = {
  readonly evaluation: GateEvaluationResult;
  readonly onApprove?: () => void;
  readonly onIssueWaiver?: (violationIndex: number) => void;
  readonly loading?: boolean;
};

/**
 * GateEvaluation Component
 *
 * リリースゲート評価結果を表示するコンポーネント
 */
export function GateEvaluation({
  evaluation,
  onApprove,
  onIssueWaiver,
  loading,
}: GateEvaluationProps) {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "destructive";
      case "WARNING":
        return "default";
      case "INFO":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ゲート評価結果</CardTitle>
              <CardDescription>
                評価日時:{" "}
                {new Date(evaluation.evaluatedAt).toLocaleString("ja-JP")}
              </CardDescription>
            </div>
            <Badge variant={evaluation.passed ? "default" : "destructive"}>
              {evaluation.passed ? "通過" : "不合格"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {evaluation.passed ? (
            <Alert>
              <AlertTitle>全てのゲート条件を満たしています</AlertTitle>
              <AlertDescription>
                このリリースは承認可能な状態です。
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTitle>ゲート条件違反が検出されました</AlertTitle>
              <AlertDescription>
                違反を解決するか、Waiverを発行してください。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gate Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>ゲート条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {evaluation.conditions.map((condition, index) => {
              const hasViolation = evaluation.violations.some(
                (v) => v.conditionType === condition.type,
              );
              return (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{condition.name}</p>
                    {condition.description && (
                      <p className="text-sm text-muted-foreground">
                        {condition.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={hasViolation ? "destructive" : "default"}>
                    {hasViolation ? "違反" : "OK"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Violations */}
      {evaluation.violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>違反詳細</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evaluation.violations.map((violation, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-destructive/20 bg-destructive/5 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityVariant(violation.severity)}>
                          {VIOLATION_SEVERITY_LABELS[violation.severity]}
                        </Badge>
                        <span className="text-sm font-medium">
                          {
                            GATE_CONDITION_TYPE_LABELS[
                              violation.conditionType
                            ]
                          }
                        </span>
                        {violation.hasWaiver && (
                          <Badge variant="outline">Waiver発行済み</Badge>
                        )}
                      </div>
                      <p className="text-sm">{violation.message}</p>
                      {violation.suggestedAction && (
                        <p className="text-sm text-muted-foreground">
                          推奨アクション: {violation.suggestedAction}
                        </p>
                      )}
                      {violation.details && (
                        <div className="text-xs text-muted-foreground">
                          {violation.details.expected !== undefined && (
                            <div>期待値: {violation.details.expected}</div>
                          )}
                          {violation.details.actual !== undefined && (
                            <div>実測値: {violation.details.actual}</div>
                          )}
                        </div>
                      )}
                    </div>
                    {!violation.hasWaiver && onIssueWaiver && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onIssueWaiver(index)}
                        disabled={loading}
                      >
                        Waiver発行
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Approve Button */}
      {evaluation.passed && onApprove && (
        <div className="flex justify-end">
          <Button onClick={onApprove} disabled={loading}>
            {loading ? "承認中..." : "リリースを承認"}
          </Button>
        </div>
      )}
    </div>
  );
}
