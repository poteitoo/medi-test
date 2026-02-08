import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  Link,
  useLoaderData,
  useActionData,
  redirect,
  data,
} from "react-router";
import { Plus, List } from "lucide-react";
import { Button } from "~/components/ui/button";

/**
 * ローダー関数：テストシナリオ一覧を取得
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") || "sample-project-id";

  // TODO: テストシナリオ取得ロジックを実装
  // 現在はプレースホルダーとして空配列を返す
  try {
    const scenarios: readonly never[] = [];
    return { scenarios, projectId };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "テストシナリオの取得に失敗しました";
    return { scenarios: [], projectId, error: errorMessage };
  }
}

/**
 * アクション関数：テストシナリオ作成
 */
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    // TODO: テストシナリオ作成ロジックを実装
    return data({ error: "テストシナリオ作成は未実装です" }, { status: 501 });
  }

  return data({ error: "不明なアクションです" }, { status: 400 });
}

/**
 * テストシナリオ一覧ページ
 *
 * プロジェクトに属するテストシナリオを一覧表示し、
 * 新規作成や編集を行う
 */
export default function TestScenariosPage() {
  const { scenarios, projectId, error } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <div className="container mx-auto py-8">
      {/* エラー表示 */}
      {(error || (actionData && "error" in actionData)) && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            {error || (actionData && "error" in actionData && actionData.error)}
          </p>
        </div>
      )}

      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">テストシナリオ</h1>
            <p className="mt-2 text-muted-foreground">
              複数のテストケースをまとめたシナリオを管理します
            </p>
          </div>
          <Link to={`/test-scenarios/new?projectId=${projectId}`}>
            <Button size="lg">
              <Plus className="mr-2 h-5 w-5" />
              新規作成
            </Button>
          </Link>
        </div>
      </div>

      {/* プレースホルダー */}
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
        <List className="mb-4 h-16 w-16 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">
          テストシナリオがありません
        </h3>
        <p className="mb-6 text-muted-foreground">
          複数のテストケースをまとめて実行するシナリオを作成できます
        </p>
        <Link to={`/test-scenarios/new?projectId=${projectId}`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            最初のシナリオを作成
          </Button>
        </Link>
      </div>

      {/* 説明セクション */}
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 font-semibold">シナリオの作成</h3>
          <p className="text-sm text-muted-foreground">
            関連するテストケースをまとめてシナリオを構成します
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 font-semibold">実行順序の管理</h3>
          <p className="text-sm text-muted-foreground">
            テストケースの実行順序を指定してワークフローを定義します
          </p>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="mb-2 font-semibold">バージョン管理</h3>
          <p className="text-sm text-muted-foreground">
            シナリオもリビジョン管理され、変更履歴を追跡できます
          </p>
        </div>
      </div>
    </div>
  );
}
