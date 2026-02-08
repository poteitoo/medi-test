import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  Link,
  useLoaderData,
  useActionData,
  useSearchParams,
  redirect,
  data,
} from "react-router";
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
import { executeListTestCases } from "~/features/test-case-management/ui/adapters/test-case-adapter";
import type { RevisionStatus } from "~/features/test-case-management/domain/models/revision-status";
import type { TestCaseWithLatestRevision } from "~/features/test-case-management/application/usecases/list-test-cases";

/**
 * ローダー関数：テストケース一覧を取得
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || "sample-project-id";

  try {
    const testCases = (await executeListTestCases(projectId, {
      includeLatestRevision: true,
    })) as readonly TestCaseWithLatestRevision[];

    return { testCases, projectId };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "テストケースの取得に失敗しました";
    return { testCases: [], projectId, error: errorMessage };
  }
}

/**
 * テストケース一覧ページ
 *
 * プロジェクトに属するテストケースを一覧表示し、
 * 新規作成や絞り込みを行う
 */
export default function TestCasesPage() {
  const { testCases, projectId, error } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") as RevisionStatus | null;

  // ステータスでフィルタリング
  const filteredTestCases = statusFilter
    ? testCases.filter((item) => item.latestRevision?.status === statusFilter)
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
          <p className="text-sm text-red-800">{error}</p>
          <Link to={`/test-cases?projectId=${projectId}`}>
            <Button variant="outline" size="sm" className="mt-2">
              再読み込み
            </Button>
          </Link>
        </div>
      )}

      {/* テストケース一覧 */}
      <TestCaseList
        testCases={filteredTestCases}
        onSelect={(testCase) => {
          const tc =
            "testCase" in testCase ? testCase.testCase : testCase;
          window.location.href = `/test-cases/${tc.id}`;
        }}
      />

      {/* 統計情報 */}
      {testCases.length > 0 && (
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
                  (item) => item.latestRevision?.status === "IN_REVIEW",
                ).length
              }
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-sm text-muted-foreground">承認済み</div>
            <div className="mt-1 text-2xl font-bold">
              {
                testCases.filter(
                  (item) => item.latestRevision?.status === "APPROVED",
                ).length
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
