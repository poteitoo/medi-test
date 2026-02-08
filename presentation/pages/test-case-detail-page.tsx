import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import {
  useParams,
  Link,
  useLoaderData,
  useActionData,
  redirect,
  data,
  Form,
} from "react-router";
import { ArrowLeft, GitBranch, Edit, Send } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { TestCaseEditor } from "~/features/test-case-management/ui/components/test-case-editor";
import { RevisionHistory } from "~/features/test-case-management/ui/components/revision-history";
import { DiffViewer } from "~/features/test-case-management/ui/components/diff-viewer";
import {
  executeGetRevisionHistory,
  executeSubmitForReview,
  executeCreateRevision,
} from "~/features/test-case-management/ui/adapters/test-case-adapter";
import { TestCaseStatusBadge } from "~/components/ui/status-badge";
import type { TestCaseRevision } from "~/features/test-case-management/domain/models/test-case-revision";
import { submitForReviewSchema } from "~/lib/schemas/test-case";

/**
 * ローダー関数：テストケースのリビジョン履歴を取得
 */
export async function loader({ params }: LoaderFunctionArgs) {
  const { caseId } = params;

  if (!caseId) {
    throw new Response("テストケースIDが指定されていません", { status: 400 });
  }

  try {
    const revisions = await executeGetRevisionHistory(caseId);

    if (!revisions || revisions.length === 0) {
      throw new Response("テストケースが見つかりません", { status: 404 });
    }

    return { revisions, caseId };
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "テストケースの取得に失敗しました";
    throw new Response(errorMessage, { status: 500 });
  }
}

/**
 * アクション関数：リビジョン操作（レビュー提出、新規リビジョン作成）
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const { caseId } = params;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "submit-for-review") {
    const revisionId = formData.get("revisionId") as string;
    const submittedBy = formData.get("submittedBy") as string;

    const validation = submitForReviewSchema.safeParse({
      revisionId,
      submittedBy,
    });

    if (!validation.success) {
      return data(
        { errors: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    try {
      await executeSubmitForReview(revisionId, submittedBy);
      return redirect(`/test-cases/${caseId}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "レビュー提出に失敗しました";
      return data({ error: errorMessage }, { status: 500 });
    }
  }

  return data({ error: "不明なアクションです" }, { status: 400 });
}

/**
 * テストケース詳細ページ
 *
 * テストケースの詳細情報、リビジョン履歴、差分表示を行う
 */
export default function TestCaseDetailPage() {
  const { revisions, caseId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { caseId: paramsCaseId } = useParams();

  const [selectedRevisionId, setSelectedRevisionId] = useState<
    string | undefined
  >();
  const [compareRevisionId, setCompareRevisionId] = useState<
    string | undefined
  >();

  const latestRevision = revisions[0];
  const selectedRevision =
    revisions.find((r) => r.id === selectedRevisionId) || latestRevision;
  const compareRevision = revisions.find((r) => r.id === compareRevisionId);

  return (
    <div className="container mx-auto py-8">
      {/* エラー表示 */}
      {actionData && "error" in actionData && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">{actionData.error}</p>
        </div>
      )}

      {/* ヘッダー */}
      <div className="mb-8">
        <Link
          to="/test-cases"
          className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          テストケース一覧に戻る
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold">{latestRevision.title}</h1>
              <TestCaseStatusBadge status={latestRevision.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Rev {latestRevision.rev}</span>
              <span>作成者: {latestRevision.createdBy}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latestRevision.status === "DRAFT" && (
              <Form method="post">
                <input type="hidden" name="intent" value="submit-for-review" />
                <input
                  type="hidden"
                  name="revisionId"
                  value={latestRevision.id}
                />
                <input
                  type="hidden"
                  name="submittedBy"
                  value="current-user-id"
                />
                <Button type="submit">
                  <Send className="mr-2 h-4 w-4" />
                  レビューに提出
                </Button>
              </Form>
            )}
            <Link to={`/test-cases/${caseId}/edit`}>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                編集
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* タブ */}
      <Tabs defaultValue="content" className="space-y-6">
        <TabsList>
          <TabsTrigger value="content">内容</TabsTrigger>
          <TabsTrigger value="history">
            <GitBranch className="mr-2 h-4 w-4" />
            履歴 ({revisions.length})
          </TabsTrigger>
          {compareRevision && <TabsTrigger value="diff">差分表示</TabsTrigger>}
        </TabsList>

        {/* 内容タブ */}
        <TabsContent value="content">
          <div className="rounded-lg border bg-card p-6">
            <TestCaseEditor
              initialContent={selectedRevision.content}
              onSave={() => {}}
              disabled
            />
          </div>
        </TabsContent>

        {/* 履歴タブ */}
        <TabsContent value="history">
          <div className="grid gap-6 lg:grid-cols-2">
            <RevisionHistory
              revisions={revisions}
              onSelectRevision={(revision) => setSelectedRevisionId(revision.id)}
            />

            {selectedRevision && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">
                    Rev {selectedRevision.rev} の内容
                  </h3>
                  {selectedRevisionId &&
                    selectedRevisionId !== latestRevision.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCompareRevisionId(selectedRevisionId)}
                      >
                        最新版と比較
                      </Button>
                    )}
                </div>
                <div className="rounded-lg border bg-card p-4">
                  <TestCaseEditor
                    initialContent={selectedRevision.content}
                    onSave={() => {}}
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* 差分タブ */}
        {compareRevision && (
          <TabsContent value="diff">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">リビジョン間の差分</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompareRevisionId(undefined)}
                >
                  比較を終了
                </Button>
              </div>
              <DiffViewer
                oldRevision={compareRevision}
                newRevision={latestRevision}
              />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
