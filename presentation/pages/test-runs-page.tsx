import { useLoaderData, useSearchParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { TestRunList } from "~/features/test-execution/ui/components/test-run-list";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

type LoaderData = ReadonlyArray<{
  readonly id: string;
  readonly status: "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";
  readonly assigneeUserId: string;
  readonly buildRef?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly progress: {
    readonly total: number;
    readonly executed: number;
    readonly passed: number;
    readonly failed: number;
  };
}>;

/**
 * Loader: テストラン一覧データを取得
 */
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const runGroupId = url.searchParams.get("runGroupId");

    // runGroupIdが指定されていない場合は空配列を返す
    if (!runGroupId) {
      return data([]);
    }

    const apiUrl = `/api/test-runs?runGroupId=${encodeURIComponent(runGroupId)}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Response("Failed to load test runs", { status: response.status });
    }

    const result = await response.json();
    return data(result.data);
  } catch (error) {
    console.error("Failed to load test runs:", error);
    throw new Response("Failed to load test runs", { status: 500 });
  }
}

/**
 * TestRunsPage Component
 *
 * テストラン一覧ページ
 * ラングループごとにテストランを表示
 */
export default function TestRunsPage() {
  const runs = useLoaderData<LoaderData>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentRunGroupId = searchParams.get("runGroupId") || "";

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const runGroupId = formData.get("runGroupId") as string;

    if (runGroupId) {
      setSearchParams({ runGroupId });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">テストラン一覧</h1>
        <p className="text-muted-foreground">
          ラングループごとのテスト実行状況を確認できます
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>ラングループを選択</CardTitle>
          <CardDescription>
            テストランを表示するラングループIDを入力してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="runGroupId" className="sr-only">
                ラングループID
              </Label>
              <Input
                id="runGroupId"
                name="runGroupId"
                placeholder="ラングループID (UUID)"
                defaultValue={currentRunGroupId}
                required
              />
            </div>
            <Button type="submit">検索</Button>
          </form>
        </CardContent>
      </Card>

      {/* Test Runs List */}
      {currentRunGroupId ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              ラングループ: {currentRunGroupId.substring(0, 8)}...
            </h2>
            <p className="text-sm text-muted-foreground">
              {runs.length} 件のテストラン
            </p>
          </div>
          <TestRunList runs={runs} />
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            ラングループIDを入力してテストランを表示してください
          </CardContent>
        </Card>
      )}
    </div>
  );
}
