import { ArrowRight, Plus, Minus, Equal } from "lucide-react";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * DiffViewerのProps
 */
type DiffViewerProps = {
  /**
   * 比較元のリビジョン
   */
  oldRevision: TestCaseRevision;

  /**
   * 比較先のリビジョン
   */
  newRevision: TestCaseRevision;
};

/**
 * 差分の種類
 */
type DiffType = "added" | "removed" | "changed" | "unchanged";

/**
 * 差分情報
 */
type DiffItem = {
  type: DiffType;
  label: string;
  oldValue?: string | readonly string[];
  newValue?: string | readonly string[];
};

/**
 * 2つのリビジョン間の差分を計算
 */
function calculateDiff(
  oldRevision: TestCaseRevision,
  newRevision: TestCaseRevision,
): DiffItem[] {
  const diffs: DiffItem[] = [];

  // タイトルの比較
  if (oldRevision.title !== newRevision.title) {
    diffs.push({
      type: "changed",
      label: "タイトル",
      oldValue: oldRevision.title,
      newValue: newRevision.title,
    });
  }

  // ステップの比較
  const oldSteps = oldRevision.content.steps;
  const newSteps = newRevision.content.steps;

  if (JSON.stringify(oldSteps) !== JSON.stringify(newSteps)) {
    diffs.push({
      type: "changed",
      label: "テスト手順",
      oldValue: oldSteps,
      newValue: newSteps,
    });
  }

  // 期待結果の比較
  if (
    oldRevision.content.expected_result !== newRevision.content.expected_result
  ) {
    diffs.push({
      type: "changed",
      label: "期待結果",
      oldValue: oldRevision.content.expected_result,
      newValue: newRevision.content.expected_result,
    });
  }

  // 前提条件の比較
  if (
    oldRevision.content.preconditions !== newRevision.content.preconditions
  ) {
    diffs.push({
      type: "changed",
      label: "前提条件",
      oldValue: oldRevision.content.preconditions || "(なし)",
      newValue: newRevision.content.preconditions || "(なし)",
    });
  }

  // 優先度の比較
  if (oldRevision.content.priority !== newRevision.content.priority) {
    diffs.push({
      type: "changed",
      label: "優先度",
      oldValue: oldRevision.content.priority || "(未設定)",
      newValue: newRevision.content.priority || "(未設定)",
    });
  }

  // タグの比較
  const oldTags = oldRevision.content.tags || [];
  const newTags = newRevision.content.tags || [];

  if (JSON.stringify(oldTags) !== JSON.stringify(newTags)) {
    diffs.push({
      type: "changed",
      label: "タグ",
      oldValue: oldTags.join(", ") || "(なし)",
      newValue: newTags.join(", ") || "(なし)",
    });
  }

  return diffs;
}

/**
 * DiffViewerコンポーネント
 *
 * 2つのリビジョン間の差分を視覚的に表示する
 */
export function DiffViewer({ oldRevision, newRevision }: DiffViewerProps) {
  const diffs = calculateDiff(oldRevision, newRevision);

  if (diffs.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-6 text-center">
        <Equal className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-muted-foreground">変更はありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between rounded-lg border bg-muted p-4">
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-semibold">Rev {oldRevision.rev}</span>
            <span className="text-muted-foreground"> から </span>
            <span className="font-semibold">Rev {newRevision.rev}</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-sm text-muted-foreground">
          {diffs.length} 件の変更
        </div>
      </div>

      {/* 差分リスト */}
      <div className="space-y-4">
        {diffs.map((diff, index) => (
          <div
            key={index}
            className="rounded-lg border border-border bg-background"
          >
            <div className="border-b border-border bg-muted px-4 py-2">
              <h4 className="flex items-center gap-2 text-sm font-semibold">
                {diff.type === "added" && (
                  <Plus className="h-4 w-4 text-green-600" />
                )}
                {diff.type === "removed" && (
                  <Minus className="h-4 w-4 text-red-600" />
                )}
                {diff.type === "changed" && (
                  <ArrowRight className="h-4 w-4 text-orange-600" />
                )}
                {diff.label}
              </h4>
            </div>

            <div className="p-4">
              {/* 配列の差分表示 */}
              {Array.isArray(diff.oldValue) && Array.isArray(diff.newValue) ? (
                <div className="space-y-4">
                  {/* 削除された項目 */}
                  {diff.oldValue.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-red-600">
                        削除:
                      </div>
                      <div className="space-y-1 rounded bg-red-50 p-3">
                        {diff.oldValue.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-red-700"
                          >
                            <Minus className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 追加された項目 */}
                  {diff.newValue.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-green-600">
                        追加:
                      </div>
                      <div className="space-y-1 rounded bg-green-50 p-3">
                        {diff.newValue.map((item, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-sm text-green-700"
                          >
                            <Plus className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* 文字列の差分表示 */
                <div className="space-y-3">
                  {/* 変更前 */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-red-600">
                      変更前:
                    </div>
                    <div className="rounded bg-red-50 p-3 text-sm text-red-700">
                      {diff.oldValue || "(空)"}
                    </div>
                  </div>

                  {/* 変更後 */}
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-green-600">
                      変更後:
                    </div>
                    <div className="rounded bg-green-50 p-3 text-sm text-green-700">
                      {diff.newValue || "(空)"}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
