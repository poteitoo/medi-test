import type { TestCaseRevision } from "../../domain/models/test-case-revision";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { RevisionStatusLabels } from "../../domain/models/revision-status";
import { TestCasePriorityLabels } from "../../domain/models/test-case-content";
import { Plus, Minus, FileText } from "lucide-react";
import { cn } from "~/lib/utils";

export type DiffViewerProps = {
  readonly oldRevision: TestCaseRevision | null;
  readonly newRevision: TestCaseRevision | null;
};

/**
 * リビジョン差分表示コンポーネント
 *
 * 2つのリビジョンを比較し、変更内容を視覚的に表示します。
 *
 * @example
 * ```tsx
 * <DiffViewer
 *   oldRevision={oldRev}
 *   newRevision={newRev}
 * />
 * ```
 */
export function DiffViewer({ oldRevision, newRevision }: DiffViewerProps) {
  // 新規作成の場合
  if (!oldRevision && newRevision) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="size-5 text-green-600" />
            新規作成
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 text-sm font-medium">タイトル</h4>
              <div className="rounded-md bg-green-50 p-3 text-green-900">
                <Plus className="mr-2 inline size-4" />
                {newRevision.title}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-medium">ステータス</h4>
              <Badge className="bg-green-100 text-green-800">
                {RevisionStatusLabels[newRevision.status]}
              </Badge>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-medium">テスト手順</h4>
              <div className="space-y-2">
                {newRevision.content.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="rounded-md bg-green-50 p-3 text-sm text-green-900"
                  >
                    <Plus className="mr-2 inline size-4" />
                    <strong>ステップ{step.stepNumber}:</strong> {step.action} →{" "}
                    {step.expectedOutcome}
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-medium">期待結果</h4>
              <div className="rounded-md bg-green-50 p-3 text-green-900">
                <Plus className="mr-2 inline size-4" />
                {newRevision.content.expectedResult}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="mb-2 text-sm font-medium">タグ</h4>
              <div className="flex flex-wrap gap-2">
                {newRevision.content.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-green-50 text-green-800"
                  >
                    <Plus className="mr-1 size-3" />
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">優先度</h4>
                <Badge className="bg-green-100 text-green-800">
                  {TestCasePriorityLabels[newRevision.content.priority]}
                </Badge>
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">環境</h4>
                <Badge className="bg-green-100 text-green-800">
                  {newRevision.content.environment}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 比較表示
  if (oldRevision && newRevision) {
    const titleChanged = oldRevision.title !== newRevision.title;
    const statusChanged = oldRevision.status !== newRevision.status;
    const expectedResultChanged =
      oldRevision.content.expectedResult !== newRevision.content.expectedResult;
    const priorityChanged =
      oldRevision.content.priority !== newRevision.content.priority;
    const environmentChanged =
      oldRevision.content.environment !== newRevision.content.environment;

    // タグの差分
    const oldTags = new Set(oldRevision.content.tags);
    const newTags = new Set(newRevision.content.tags);
    const addedTags = [...newTags].filter((tag) => !oldTags.has(tag));
    const removedTags = [...oldTags].filter((tag) => !newTags.has(tag));

    // ステップの差分（簡易版）
    const oldStepsText = oldRevision.content.steps
      .map((s) => `${s.action}|${s.expectedOutcome}`)
      .join("\n");
    const newStepsText = newRevision.content.steps
      .map((s) => `${s.action}|${s.expectedOutcome}`)
      .join("\n");
    const stepsChanged = oldStepsText !== newStepsText;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            リビジョン比較: rev.{oldRevision.rev} → rev.{newRevision.rev}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* タイトル */}
            <div>
              <h4 className="mb-2 text-sm font-medium">タイトル</h4>
              {titleChanged ? (
                <div className="space-y-2">
                  <div className="rounded-md bg-red-50 p-3 text-red-900">
                    <Minus className="mr-2 inline size-4" />
                    {oldRevision.title}
                  </div>
                  <div className="rounded-md bg-green-50 p-3 text-green-900">
                    <Plus className="mr-2 inline size-4" />
                    {newRevision.title}
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3 text-muted-foreground">
                  {newRevision.title}
                </div>
              )}
            </div>

            <Separator />

            {/* ステータス */}
            <div>
              <h4 className="mb-2 text-sm font-medium">ステータス</h4>
              {statusChanged ? (
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-100 text-red-800">
                    <Minus className="mr-1 size-3" />
                    {RevisionStatusLabels[oldRevision.status]}
                  </Badge>
                  <span>→</span>
                  <Badge className="bg-green-100 text-green-800">
                    <Plus className="mr-1 size-3" />
                    {RevisionStatusLabels[newRevision.status]}
                  </Badge>
                </div>
              ) : (
                <Badge variant="outline">
                  {RevisionStatusLabels[newRevision.status]}
                </Badge>
              )}
            </div>

            <Separator />

            {/* テスト手順 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">テスト手順</h4>
              {stepsChanged ? (
                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      変更前 (rev.{oldRevision.rev})
                    </p>
                    <div className="space-y-2">
                      {oldRevision.content.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="rounded-md bg-red-50 p-3 text-sm text-red-900"
                        >
                          <Minus className="mr-2 inline size-4" />
                          <strong>ステップ{step.stepNumber}:</strong>{" "}
                          {step.action} → {step.expectedOutcome}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="mb-2 text-xs text-muted-foreground">
                      変更後 (rev.{newRevision.rev})
                    </p>
                    <div className="space-y-2">
                      {newRevision.content.steps.map((step) => (
                        <div
                          key={step.stepNumber}
                          className="rounded-md bg-green-50 p-3 text-sm text-green-900"
                        >
                          <Plus className="mr-2 inline size-4" />
                          <strong>ステップ{step.stepNumber}:</strong>{" "}
                          {step.action} → {step.expectedOutcome}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {newRevision.content.steps.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-md bg-muted p-3 text-sm"
                    >
                      <strong>ステップ{step.stepNumber}:</strong> {step.action}{" "}
                      → {step.expectedOutcome}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* 期待結果 */}
            <div>
              <h4 className="mb-2 text-sm font-medium">期待結果</h4>
              {expectedResultChanged ? (
                <div className="space-y-2">
                  <div className="rounded-md bg-red-50 p-3 text-red-900">
                    <Minus className="mr-2 inline size-4" />
                    {oldRevision.content.expectedResult}
                  </div>
                  <div className="rounded-md bg-green-50 p-3 text-green-900">
                    <Plus className="mr-2 inline size-4" />
                    {newRevision.content.expectedResult}
                  </div>
                </div>
              ) : (
                <div className="rounded-md bg-muted p-3 text-muted-foreground">
                  {newRevision.content.expectedResult}
                </div>
              )}
            </div>

            <Separator />

            {/* タグ */}
            <div>
              <h4 className="mb-2 text-sm font-medium">タグ</h4>
              {addedTags.length > 0 || removedTags.length > 0 ? (
                <div className="space-y-2">
                  {removedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {removedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-red-50 text-red-800"
                        >
                          <Minus className="mr-1 size-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {addedTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {addedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="bg-green-50 text-green-800"
                        >
                          <Plus className="mr-1 size-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {[...newTags].filter(
                    (tag) =>
                      !addedTags.includes(tag) && !removedTags.includes(tag),
                  ).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {[...newTags]
                        .filter(
                          (tag) =>
                            !addedTags.includes(tag) &&
                            !removedTags.includes(tag),
                        )
                        .map((tag) => (
                          <Badge key={tag} variant="outline">
                            {tag}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {newRevision.content.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* 優先度と環境 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="mb-2 text-sm font-medium">優先度</h4>
                {priorityChanged ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      <Minus className="mr-1 size-3" />
                      {TestCasePriorityLabels[oldRevision.content.priority]}
                    </Badge>
                    <span>→</span>
                    <Badge className="bg-green-100 text-green-800">
                      <Plus className="mr-1 size-3" />
                      {TestCasePriorityLabels[newRevision.content.priority]}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline">
                    {TestCasePriorityLabels[newRevision.content.priority]}
                  </Badge>
                )}
              </div>
              <div>
                <h4 className="mb-2 text-sm font-medium">環境</h4>
                {environmentChanged ? (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-100 text-red-800">
                      <Minus className="mr-1 size-3" />
                      {oldRevision.content.environment}
                    </Badge>
                    <span>→</span>
                    <Badge className="bg-green-100 text-green-800">
                      <Plus className="mr-1 size-3" />
                      {newRevision.content.environment}
                    </Badge>
                  </div>
                ) : (
                  <Badge variant="outline">
                    {newRevision.content.environment}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // どちらもnullの場合
  return (
    <Card>
      <CardHeader>
        <CardTitle>リビジョン比較</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          比較するリビジョンを選択してください
        </p>
      </CardContent>
    </Card>
  );
}
