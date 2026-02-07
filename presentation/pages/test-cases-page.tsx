import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Plus, Filter } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { TestCaseList } from "~/features/test-case-management/ui/components/test-case-list";
import { useTestCase } from "~/features/test-case-management/ui/hooks/use-test-case";
import type { RevisionStatus } from "~/features/test-case-management/domain/models/revision-status";

/**
 * テストケース一覧ページ
 *
 * プロジェクトに属するテストケースを一覧表示し、
 * 新規作成や絞り込みを行う
 */
export default function TestCasesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "sample-project-id";
  const statusFilter = searchParams.get("status") as RevisionStatus | null;

  const { testCases, isLoading, error, reload } = useTestCase(projectId);

  // ステータスでフィルタリング
  const filteredTestCases = statusFilter
    ? testCases.filter((item) => item.latestRevision.status === statusFilter)
    : testCases;

  const handleStatusFilterChange = (value: string) => {
    if (value === "all") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", value);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="container mx-auto py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">テストケース</h1>
            <p className="mt-2 text-muted-foreground">
              テストケースの作成・管理を行います
            </p>
          </div>
          <Link to={`/test-cases/new?projectId=${projectId}`}>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>

      {/* フィルター */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">フィルター:</span>
        </div>
        <Select
          value={statusFilter || "all"}
          onValueChange={handleStatusFilterChange}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="ステータスで絞り込み" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="DRAFT">下書き</SelectItem>
            <SelectItem value="IN_REVIEW">承認待ち</SelectItem>
            <SelectItem value="APPROVED">承認済み</SelectItem>
            <SelectItem value="REJECTED">却下</SelectItem>
            <SelectItem value="ARCHIVED">アーカイブ</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleStatusFilterChange("all")}
          >
            クリア
          </Button>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error.message}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={reload}
            className="mt-2"
          >
            再読み込み
          </Button>
        </div>
      )}

      {/* テストケース一覧 */}
      <TestCaseList
        items={filteredTestCases}
        isLoading={isLoading}
        emptyMessage={
          statusFilter
            ? "条件に一致するテストケースがありません"
            : "テストケースがありません。新規作成から始めましょう。"
        }
      />

      {/* 統計情報 */}
      {!isLoading && testCases.length > 0 && (
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">総数</div>
            <div className="mt-1 text-2xl font-bold">{testCases.length}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">承認待ち</div>
            <div className="mt-1 text-2xl font-bold">
              {
                testCases.filter(
                  (item) => item.latestRevision.status === "IN_REVIEW",
                ).length
              }
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">承認済み</div>
            <div className="mt-1 text-2xl font-bold">
              {
                testCases.filter(
                  (item) => item.latestRevision.status === "APPROVED",
                ).length
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
