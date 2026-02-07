import { Link } from "react-router";
import { FileText, Clock, User } from "lucide-react";
import { TestCaseStatusBadge } from "~/components/ui/status-badge";
import { formatRelativeTime } from "~/lib/utils/date";
import type { TestCase } from "../../domain/models/test-case";
import type { TestCaseRevision } from "../../domain/models/test-case-revision";

/**
 * テストケース一覧のアイテム型
 */
export type TestCaseListItem = {
  testCase: TestCase;
  latestRevision: TestCaseRevision;
};

/**
 * テストケース一覧コンポーネントのProps
 */
type TestCaseListProps = {
  /**
   * テストケースのリスト
   */
  items: readonly TestCaseListItem[];

  /**
   * 読み込み中フラグ
   */
  isLoading?: boolean;

  /**
   * 空の場合のメッセージ
   */
  emptyMessage?: string;
};

/**
 * テストケース一覧コンポーネント
 *
 * プロジェクトに属するテストケースを一覧表示する
 */
export function TestCaseList({
  items,
  isLoading = false,
  emptyMessage = "テストケースがありません",
}: TestCaseListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border rounded-lg border">
      {items.map(({ testCase, latestRevision }) => (
        <Link
          key={testCase.id}
          to={`/test-cases/${testCase.id}`}
          className="block transition-colors hover:bg-accent"
        >
          <div className="p-4">
            {/* ヘッダー: タイトルとステータス */}
            <div className="mb-2 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {latestRevision.title}
                </h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rev {latestRevision.rev}</span>
                </div>
              </div>
              <TestCaseStatusBadge status={latestRevision.status} />
            </div>

            {/* テストケースの詳細情報 */}
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {/* ステップ数 */}
              <div className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span>
                  {latestRevision.content.steps.length} ステップ
                </span>
              </div>

              {/* 作成者 */}
              <div className="flex items-center gap-1.5">
                <User className="h-4 w-4" />
                <span>作成者: {latestRevision.createdBy}</span>
              </div>

              {/* 最終更新日時 */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{formatRelativeTime(latestRevision.createdAt)}</span>
              </div>
            </div>

            {/* タグ表示 */}
            {latestRevision.content.tags &&
              latestRevision.content.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {latestRevision.content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

            {/* 優先度表示 */}
            {latestRevision.content.priority && (
              <div className="mt-2">
                <span
                  className={`text-xs font-medium ${
                    latestRevision.content.priority === "CRITICAL"
                      ? "text-red-600"
                      : latestRevision.content.priority === "HIGH"
                        ? "text-orange-600"
                        : latestRevision.content.priority === "MEDIUM"
                          ? "text-yellow-600"
                          : "text-gray-600"
                  }`}
                >
                  優先度: {latestRevision.content.priority}
                </span>
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
