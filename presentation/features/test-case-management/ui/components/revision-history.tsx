import { Clock, User, GitBranch } from "lucide-react";
import { TestCaseStatusBadge } from "~/components/ui/status-badge";
import { formatDateTime } from "~/lib/utils/date";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * リビジョン履歴コンポーネントのProps
 */
type RevisionHistoryProps = {
  /**
   * リビジョンのリスト（降順）
   */
  revisions: readonly TestCaseRevision[];

  /**
   * 現在選択されているリビジョンID
   */
  selectedRevisionId?: string;

  /**
   * リビジョン選択時のコールバック
   */
  onRevisionSelect?: (revisionId: string) => void;

  /**
   * 読み込み中フラグ
   */
  isLoading?: boolean;
};

/**
 * リビジョン履歴コンポーネント
 *
 * テストケースのリビジョン履歴をタイムライン形式で表示する
 */
export function RevisionHistory({
  revisions,
  selectedRevisionId,
  onRevisionSelect,
  isLoading = false,
}: RevisionHistoryProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <GitBranch className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">リビジョン履歴がありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">リビジョン履歴</h3>

      <div className="relative space-y-4">
        {/* タイムライン線 */}
        <div className="absolute left-6 top-8 h-[calc(100%-2rem)] w-px bg-border" />

        {revisions.map((revision, index) => {
          const isSelected = revision.id === selectedRevisionId;
          const isLatest = index === 0;

          return (
            <button
              key={revision.id}
              type="button"
              onClick={() => onRevisionSelect?.(revision.id)}
              className={`relative w-full rounded-lg border p-4 text-left transition-colors ${
                isSelected
                  ? "border-primary bg-accent"
                  : "border-border hover:bg-accent"
              }`}
            >
              {/* タイムライン点 */}
              <div
                className={`absolute left-[-1.125rem] top-6 h-3 w-3 rounded-full border-2 ${
                  isLatest
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
              />

              <div className="ml-8 space-y-2">
                {/* ヘッダー: リビジョン番号とステータス */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      Rev {revision.rev}
                    </span>
                    {isLatest && (
                      <span className="rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        最新
                      </span>
                    )}
                  </div>
                  <TestCaseStatusBadge status={revision.status} size="sm" />
                </div>

                {/* タイトル */}
                <h4 className="font-medium text-foreground">
                  {revision.title}
                </h4>

                {/* メタ情報 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {/* 作成者 */}
                  <div className="flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    <span>{revision.createdBy}</span>
                  </div>

                  {/* 作成日時 */}
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDateTime(revision.createdAt)}</span>
                  </div>
                </div>

                {/* 承認情報 */}
                {revision.status === "APPROVED" && (
                  <div className="mt-2 rounded bg-green-50 p-2 text-xs text-green-700">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>承認済み</span>
                    </div>
                  </div>
                )}

                {/* 非推奨情報 */}
                {revision.status === "DEPRECATED" && (
                  <div className="mt-2 rounded bg-yellow-50 p-2 text-xs text-yellow-700">
                    非推奨
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
