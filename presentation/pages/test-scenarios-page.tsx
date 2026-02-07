import { Link, useSearchParams } from "react-router";
import { Plus, List } from "lucide-react";
import { Button } from "~/components/ui/button";

/**
 * テストシナリオ一覧ページ
 *
 * プロジェクトに属するテストシナリオを一覧表示し、
 * 新規作成や編集を行う
 */
export default function TestScenariosPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get("projectId") || "sample-project-id";

  return (
    <div className="container mx-auto py-8">
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
